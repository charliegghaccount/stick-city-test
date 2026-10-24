import {describe,it,expect,vi} from 'vitest';
import {GameStore,SAVE_KEY,V1_BACKUP_KEY,V2_BACKUP_KEY,freshState,validImport,validateSave} from '../src/model';
import {ACTIVITIES,BUILDINGS,MISSIONS} from '../src/content';
import {JOBS,COURSES} from '../src/careers';
import {levelXP,skillXP,totalLevelXP,BALANCE} from '../src/balance';
import {ROBBERIES,CRIME} from '../src/crime';
import {SKILLS} from '../src/types';
const disk=()=>{const data=new Map<string,string>();return{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);},removeItem:(k:string)=>{data.delete(k);}};};
const act=(g:GameStore,id:string)=>{const r=g.perform(id);expect(r.ok,r.message).toBe(true);};
const legacy=()=>({version:1,position:{x:543,y:702},cash:1234,bank:500,energy:61,health:87,level:3,xp:75,minutes:2160,skills:{efficiency:4,charm:3,intelligence:5,strength:2},inventory:{apple:2},missions:{welcome:'complete'},counters:{shifts:9},visited:['home','cafe']});
function v2(){const s:any={...freshState(),version:2,pending:null};for(const k of ['currentJob','pursuit','crimeReadyAt','contacts'])delete s[k];delete s.skills.thieving;delete s.skillXP.thieving;return s;}
function qualified(){const g=new GameStore(disk());g.state.level=7;g.state.cash=10000;for(const k of SKILLS)g.state.skills[k]=10;g.state.qualifications=COURSES.map(c=>c.id);return g;}

describe('instant standard transactions',()=>{
 it('pays a job, charges energy, advances game time and saves before returning',()=>{
  const d=disk(),g=new GameStore(d);expect(g.perform('diner-shift').ok).toBe(true);
  expect(g.state).toMatchObject({cash:144,energy:82,minutes:600,xp:18,skillXP:{efficiency:6},currentJob:'diner-shift',counters:{shifts:1,earned:24}});
  expect('pending'in g.state).toBe(false);expect(new GameStore(d).state.cash).toBe(144);
 });
 it('allows intentional consecutive actions without double-processing one call',()=>{
  const g=new GameStore(disk());act(g,'diner-shift');expect(g.state.cash).toBe(144);g.tickSimulation(100);expect(g.state.cash).toBe(144);
  act(g,'diner-shift');expect(g.state.cash).toBe(168);expect(g.state.energy).toBe(64);expect(g.state.counters.shifts).toBe(2);
 });
 it('uses no scheduled timers for ordinary actions or rewards',()=>{
  vi.useFakeTimers();try{const g=new GameStore(disk());act(g,'buy-apple');expect(g.state.inventory.apple).toBe(1);expect(g.state.cash).toBe(114);expect(vi.getTimerCount()).toBe(0);vi.runAllTimers();expect(g.state.inventory.apple).toBe(1);}finally{vi.useRealTimers();}
 });
 it('completes sleep, food, clinic treatment and training immediately',()=>{
  const g=new GameStore(disk());g.state.energy=0;g.state.health=20;act(g,'sleep');expect(g.state.energy).toBe(100);expect(g.state.health).toBe(40);expect(g.state.minutes).toBe(960);expect(g.state.xp).toBe(0);
  g.state.energy=20;act(g,'coffee');expect(g.state.energy).toBe(42);g.state.cash=200;act(g,'clinic-heal');expect(g.state.health).toBe(100);act(g,'study');expect(g.state.skillXP.intelligence).toBe(14);
 });
 it('blocks invalid or unaffordable actions without partial deductions',()=>{
  const g=new GameStore(disk());g.state.cash=0;const before=JSON.stringify(g.state);expect(g.perform('study').ok).toBe(false);expect(g.perform('fake').ok).toBe(false);expect(JSON.stringify(g.state)).toBe(before);
  g.state.energy=0;expect(g.perform('diner-shift').ok).toBe(false);expect(g.state.cash).toBe(0);
 });
 it('keeps character and incremental skill curves unchanged',()=>{
  expect([1,2,3,4].map(levelXP)).toEqual([120,220,380,600]);expect(totalLevelXP(5)).toBe(1320);expect([1,2,3].map(skillXP)).toEqual([60,110,180]);
  const g=new GameStore(disk());g.addXP(totalLevelXP(5)+17);expect(g.state.level).toBe(5);expect(g.state.xp).toBe(17);
  for(let n=0;n<10;n++){act(g,'diner-shift');act(g,'sleep');}expect(g.state.skills.efficiency).toBe(2);expect(g.state.skillXP.efficiency).toBe(0);
 });
 it('retains earned in-game effort without a wall-clock progression target',()=>{
  const g=new GameStore(disk());let shifts=0;while(g.state.level<5){if(g.state.energy<18)act(g,'sleep');act(g,'diner-shift');shifts++;}
  expect(shifts).toBe(74);expect(g.state.playSeconds).toBe(0);expect(g.state.developerModified).toBe(false);
 });
 it('does not farm XP from free recovery and still scales advanced training costs',()=>{
  const g=new GameStore(disk());for(let i=0;i<10;i++)act(g,'sleep');expect(g.state.xp).toBe(0);
  const a=ACTIVITIES.find(a=>a.id==='study')!,low=g.quoteActivity(a);g.state.skills.intelligence=4;const high=g.quoteActivity(a);expect(high.minutes).toBeGreaterThan(low.minutes);expect(high.cash!).toBeLessThan(low.cash!);
 });
});

describe('careers, education and purchases',()=>{
 it('has 18 paid roles, all working with every prerequisite enforced',()=>{
  expect(JOBS).toHaveLength(18);for(const j of JOBS){const g=qualified();act(g,j.id);expect(g.state.cash,j.id).toBe(10000+(j.cash??0));expect(g.state.energy).toBe(100+(j.energy??0));expect(g.state.currentJob).toBe(j.id);
   if(j.requireLevel){const low=qualified();low.state.level=j.requireLevel-1;expect(low.perform(j.id).ok,`${j.id} level`).toBe(false);}
   for(const[k,n]of Object.entries(j.requireSkills??{})){const low=qualified();low.state.skills[k as keyof typeof low.state.skills]=n-1;expect(low.perform(j.id).ok,`${j.id} ${k}`).toBe(false);}
   for(const q of j.requireQualifications??[]){const low=qualified();low.state.qualifications=low.state.qualifications.filter(id=>id!==q);expect(low.perform(j.id).ok,`${j.id} ${q}`).toBe(false);}
  }
 });
 it('selects a current job explicitly and never promotes on its own',()=>{
  const g=new GameStore(disk());expect(g.applyForJob('office-shift').ok).toBe(false);expect(g.applyForJob('diner-shift').ok).toBe(true);expect(g.state.cash).toBe(120);
  g.state.xp=119;act(g,'diner-shift');expect(g.state.level).toBe(2);expect(g.state.currentJob).toBe('diner-shift');
 });
 it('completes qualifications instantly, persists them and denies duplicate courses',()=>{
  expect(COURSES).toHaveLength(10);const d=disk(),g=new GameStore(d);g.state.skills.intelligence=2;g.state.cash=300;
  act(g,'course-office-certificate');expect(g.state.qualifications).toContain('office-certificate');expect(g.state.cash).toBe(120);expect(g.state.minutes).toBe(660);expect(new GameStore(d).state.qualifications).toContain('office-certificate');expect(g.perform('course-office-certificate').ok).toBe(false);
 });
 it('requires intermediate qualifications for the medical degree',()=>{
  const g=qualified();g.state.qualifications=[];expect(g.perform('course-medical-degree').ok).toBe(false);g.state.qualifications=['nursing-diploma','medical-technology'];act(g,'course-medical-degree');expect(g.state.qualifications).toContain('medical-degree');expect(g.state.cash).toBe(8200);expect(g.perform('health-doctor').ok).toBe(true);
 });
 it('preserves item quantities and bank totals',()=>{
  const g=new GameStore(disk());g.state.energy=10;act(g,'buy-sandwich');expect(g.state.inventory.sandwich).toBe(1);g.useItem('sandwich');expect(g.state.energy).toBe(45);expect(g.useItem('sandwich').ok).toBe(false);
  g.deposit(50);g.withdraw(15);expect(g.state.cash+g.state.bank).toBe(106);for(const n of [-1,0,.5,NaN,Infinity,99999])expect(g.deposit(n).ok).toBe(false);
 });
 it('makes new consumables functional',()=>{
  const g=qualified();g.state.energy=0;g.state.health=1;act(g,'buy-mealbox');g.useItem('mealbox');expect(g.state.energy).toBe(65);expect(g.state.health).toBe(9);act(g,'buy-traumakit');g.useItem('traumakit');expect(g.state.health).toBe(94);
 });
 it('makes equipment passive, non-stacking and effective',()=>{
  const g=qualified();act(g,'buy-lockpicks');expect(g.equipmentBonus('robberyBonus')).toBe(.06);expect(g.perform('buy-lockpicks').ok).toBe(false);expect(g.useItem('lockpicks').ok).toBe(false);expect(g.state.inventory.lockpicks).toBe(1);
  act(g,'buy-shoes');expect(g.equipmentBonus('speedBonus')).toBe(.1);act(g,'buy-studyguide');const before=g.state.skillXP.intelligence;act(g,'study');expect(g.state.skillXP.intelligence-before).toBe(16);
 });
});

describe('Thieving, robberies and police consequences',()=>{
 it('adds a trainable Thieving stat without a whole-level gain per action',()=>{
  const g=new GameStore(disk());act(g,'thieving-practice');expect(g.state.skills.thieving).toBe(1);expect(g.state.skillXP.thieving).toBe(8);expect(g.state.cash).toBe(110);
 });
 it('scales success odds with skill and equipment, bounds chance and gates higher payouts',()=>{
  const g=new GameStore(disk()),low=g.robberyQuote('cafe')!;expect(g.robBuilding('bank').ok).toBe(false);g.state.skills.thieving=20;const high=g.robberyQuote('cafe')!;expect(high.chance).toBeGreaterThan(low.chance);expect(high.chance).toBeLessThanOrEqual(.92);
  const noGear=g.robberyQuote('bank')!.chance;g.state.inventory.lockpicks=1;expect(g.robberyQuote('bank')!.chance).toBeGreaterThanOrEqual(noGear);
  expect(ROBBERIES.find(t=>t.building==='bank')!.min).toBeGreaterThan(ROBBERIES.find(t=>t.building==='cafe')!.max);
 });
 it('resolves a successful robbery immediately with bounded payout and one reward',()=>{
  const g=new GameStore(disk(),()=>0);expect(g.robBuilding('cafe').ok).toBe(true);expect(g.state.cash).toBe(145);expect(g.state.energy).toBe(86);expect(g.state.minutes).toBe(510);expect(g.state.skillXP.thieving).toBe(8);expect(g.state.counters.robberies).toBe(1);expect(g.state.pursuit).toBeNull();
  expect(g.robBuilding('cafe').ok).toBe(false);expect(g.state.cash).toBe(145);act(g,'sleep');expect(g.robBuilding('cafe').ok).toBe(true);
 });
 it('failed robbery starts exactly 30 seconds of pursuit with no payout',()=>{
  const g=new GameStore(disk(),()=>.999);g.robBuilding('cafe');expect(g.state.pursuit?.remaining).toBe(30);expect(g.state.cash).toBe(120);expect(g.state.skillXP.thieving).toBe(2);expect(g.perform('sleep').ok).toBe(false);expect(g.deposit(10).ok).toBe(false);expect(g.robBuilding('store').ok).toBe(false);
 });
 it('persists pursuit across reload and clears it only after 30 active seconds',()=>{
  const d=disk(),g=new GameStore(d,()=>.999);g.robBuilding('cafe');g.tickSimulation(12.7);g.save();const r=new GameStore(d);expect(r.state.pursuit!.remaining).toBeCloseTo(17.3);r.tickSimulation(17.2);expect(r.state.pursuit).not.toBeNull();r.tickSimulation(.1);expect(r.state.pursuit).toBeNull();expect(r.state.counters.escapes).toBe(1);r.tickSimulation(100);expect(r.state.counters.escapes).toBe(1);
 });
 it('does not clear pursuits by advancing the economic clock',()=>{
  const g=new GameStore(disk(),()=>.999);g.robBuilding('cafe');g.developer('day');expect(g.state.pursuit?.remaining).toBe(30);
 });
 it('police damage and defeat have actual health, cash, clock and location consequences',()=>{
  const g=new GameStore(disk(),()=>.999);g.state.bank=50;g.robBuilding('cafe');expect(g.takePoliceDamage(12)).toBe(false);expect(g.state.health).toBe(88);
  expect(g.takePoliceDamage(1000)).toBe(true);expect(g.state.pursuit).toBeNull();expect(g.state.health).toBe(60);expect(g.state.cash).toBe(83);expect(g.state.bank).toBe(50);expect(g.state.position).toEqual(BUILDINGS.find(b=>b.id==='clinic')!.door);expect(g.state.counters['police-defeats']).toBe(1);
 });
 it('vests reduce damage and infinite health is an explicit marked bypass',()=>{
  const g=new GameStore(disk(),()=>.999);g.state.inventory.vest=1;g.robBuilding('cafe');g.takePoliceDamage(12);expect(g.state.health).toBe(91);g.setModifier('infiniteHealth',true);g.takePoliceDamage(12);expect(g.state.health).toBe(100);expect(g.state.developerModified).toBe(true);
 });
 it('pickpocketing resolves instantly, builds Thieving and enforces per-person alertness',()=>{
  const win=new GameStore(disk(),()=>0);expect(win.pickpocket('Alex').ok).toBe(true);expect(win.state.cash).toBe(128);expect(win.state.skillXP.thieving).toBe(6);expect(win.pickpocket('Alex').ok).toBe(false);
  const lose=new GameStore(disk(),()=>.999);lose.pickpocket('Alex');expect(lose.state.cash).toBe(95);expect(lose.state.health).toBe(90);expect(lose.state.skillXP.thieving).toBe(2);
 });
});

describe('missions, dialogue and interactive games',()=>{
 it('counts unique conversations and uses context-sensitive replies',()=>{
  const g=new GameStore(disk());expect(g.talkTo('Alex','work').message).toContain('No qualification');g.talkTo('Alex','rumour');expect(g.state.counters.conversations).toBe(1);g.talkTo('Mia');g.talkTo('Sam');expect(g.state.counters.conversations).toBe(3);
 });
 it('tracks multi-objective missions from normal work and purchases without duplicate rewards',()=>{
  const g=new GameStore(disk());g.state.missions['honest-work']='complete';g.acceptMission('community-supplies');
  for(let i=0;i<11;i++){if(g.state.energy<18)act(g,'sleep');act(g,'diner-shift');}for(let i=0;i<3;i++)act(g,'buy-apple');
  expect(g.missionProgress('community-supplies')).toBe(253);const cash=g.state.cash;expect(g.claimMission('community-supplies').ok).toBe(true);expect(g.state.cash).toBe(cash+MISSIONS.find(m=>m.id==='community-supplies')!.reward);expect(g.claimMission('community-supplies').ok).toBe(false);
 });
 it('preserves Mayor/Gang prerequisites and Thieving-based objectives',()=>{
  const g=new GameStore(disk());expect(g.acceptMission('honest-work').ok).toBe(false);g.acceptMission('welcome');for(const id of ['home','cafe','store','townhall'])g.visit(id);expect(g.claimMission('welcome').ok).toBe(true);
  g.state.missions['light-fingers']='complete';g.acceptMission('case-district');g.state.skills.thieving=2;for(const id of ['Alex','Mia','Sam'])g.talkTo(id);expect(g.claimMission('case-district').ok).toBe(true);
 });
 it('pays timing work at the stop without a post-minigame wait',()=>{
  const g=new GameStore(disk());expect(g.finishTiming('work',1).ok).toBe(true);expect(g.state.cash).toBe(128);expect(g.state.energy).toBe(92);expect(g.state.minutes).toBe(510);expect(g.state.skillXP.efficiency).toBe(2);
 });
 it('charges one slot bet per intentional spin and resolves instantly',()=>{
  const g=new GameStore(disk(),()=>.99);expect(g.spinSlots(10).payout).toBe(200);expect(g.state.cash).toBe(310);g.spinSlots(10);expect(g.state.counters['slot-spins']).toBe(2);expect(g.state.cash).toBe(500);expect(g.spinSlots(1000).ok).toBe(false);
 });
});

describe('save compatibility and developer safety',()=>{
 it('backs up and migrates V1, retaining assets, levels, skills and partial character progress',()=>{
  const d=disk(),old=legacy();d.setItem(SAVE_KEY,JSON.stringify(old));const g=new GameStore(d);expect(d.getItem(V1_BACKUP_KEY)).toBe(JSON.stringify(old));expect(d.getItem(V2_BACKUP_KEY)).toBe(JSON.stringify(old));expect(g.state).toMatchObject({version:3,cash:1234,bank:500,level:3,xp:190,skills:old.skills,inventory:old.inventory,missions:old.missions});expect(g.state.skills.thieving).toBe(1);
 });
 it('preserves ordinary V2 progress and initializes only the new fields',()=>{
  const d=disk(),old=v2();old.cash=456;old.qualifications=['office-certificate'];old.skills.efficiency=5;old.skillXP.efficiency=20;d.setItem(SAVE_KEY,JSON.stringify(old));const g=new GameStore(d);expect(g.state.cash).toBe(456);expect(g.state.skills.efficiency).toBe(5);expect(g.state.skillXP.efficiency).toBe(20);expect(g.state.qualifications).toEqual(['office-certificate']);expect(g.state.currentJob).toBeNull();
 });
 it('settles an already-charged V2 job once without charging costs again',()=>{
  const d=disk(),old=v2();old.energy=82;old.pending={kind:'activity',id:'diner-shift',remainingSeconds:20,totalSeconds:54};d.setItem(SAVE_KEY,JSON.stringify(old));const g=new GameStore(d);expect(g.state.cash).toBe(144);expect(g.state.energy).toBe(82);expect(g.state.minutes).toBe(600);expect(g.state.skillXP.efficiency).toBe(6);expect(new GameStore(d).state.cash).toBe(144);expect('pending'in g.state).toBe(false);
 });
 it('settles V2 pending purchases and courses without duplicate costs or rewards',()=>{
  const d=disk(),old=v2();old.cash=120;old.energy=82;old.skills.intelligence=2;old.pending={kind:'activity',id:'course-office-certificate',remainingSeconds:50,totalSeconds:81};d.setItem(SAVE_KEY,JSON.stringify(old));const g=new GameStore(d);expect(g.state.qualifications).toContain('office-certificate');expect(g.state.cash).toBe(120);expect(g.state.energy).toBe(82);expect(new GameStore(d).state.qualifications).toEqual(g.state.qualifications);
 });
 it('never discards readable legacy progress when a backup write hits quota',()=>{
  const raw=JSON.stringify(legacy()),g=new GameStore({getItem(k){return k===SAVE_KEY?raw:null;},setItem(){throw Error('quota');},removeItem(){}});expect(g.state.cash).toBe(1234);expect(g.state.version).toBe(3);expect(g.storageAvailable).toBe(false);
 });
 it('validates V1, V2 and V3 imports and rejects invalid JSON/schema without mutation',()=>{
  const g=new GameStore(disk()),before=JSON.stringify(g.state);for(const raw of ['{bad','({version:3})',JSON.stringify({...freshState(),cash:'bad'}),JSON.stringify({...freshState(),version:'3'}),JSON.stringify({...freshState(),pursuit:{remaining:500,serial:1}})])expect(g.importSaveData(raw).ok).toBe(false);
  expect(JSON.stringify(g.state)).toBe(before);expect(g.importSaveData(JSON.stringify(legacy())).ok).toBe(true);expect(g.state.cash).toBe(1234);expect(g.importSaveData(JSON.stringify(v2())).ok).toBe(true);expect(validImport(JSON.parse(g.exportSaveData()))).toBe(true);expect(g.state.developerModified).toBe(true);
 });
 it('keeps temporary cheats out of saves and disables them together',()=>{
  const d=disk(),g=new GameStore(d);g.setModifier('infiniteEnergy',true);g.setModifier('speed',5);g.setModifier('noclip',true);g.setModifier('paused',true);g.disableDeveloperModifiers();expect(g.modifiers).toEqual({infiniteEnergy:false,infiniteHealth:false,speed:1,noclip:false,paused:false});g.setModifier('speed',3);g.save();expect(new GameStore(d).modifiers.speed).toBe(1);expect(new GameStore(d).state.developerModified).toBe(true);
 });
 it('supports progression, clock, skills, careers and mission testing tools',()=>{
  const g=new GameStore(disk());g.developer('cash-add',1000);g.developer('cash-set',432);expect(g.state.cash).toBe(432);g.developer('xp-add',120);expect(g.state.level).toBe(2);g.developer('skill-set',3,'thieving');expect(g.state.skills.thieving).toBe(3);
  g.developer('clock-set',2000);expect(g.state.minutes).toBe(2000);g.developer('careers');expect(g.state.qualifications).toHaveLength(10);expect(JOBS.every(j=>g.requirements(j).every(r=>r.met))).toBe(true);g.developer('skills-reset');expect(SKILLS.every(k=>g.state.skills[k]===1&&g.state.skillXP[k]===0)).toBe(true);
  g.state.missions={welcome:'complete','honest-work':'active'};g.developer('missions-clear');expect(g.state.missions.welcome).toBe('complete');expect(g.state.missions['honest-work']).toBeUndefined();g.developer('missions-reset');expect(g.state.missions).toEqual({});
 });
 it('rejects invalid developer values and repairs malformed local saves safely',()=>{
  const g=new GameStore(disk()),before=JSON.stringify(g.state);for(const n of [NaN,Infinity,-1,.5])expect(g.developer('cash-set',n).ok).toBe(false);expect(g.setModifier('speed',9).ok).toBe(false);expect(JSON.stringify(g.state)).toBe(before);expect(validateSave({version:3,cash:-10}).cash).toBe(0);g.reset();expect(g.state).toEqual(freshState());
 });
});
