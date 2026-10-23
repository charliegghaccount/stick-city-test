import { describe, expect, it } from 'vitest';
import { GameStore, SAVE_KEY, V1_BACKUP_KEY, freshState, validImport, validateSave } from '../src/model';
import { ACTIVITIES, BUILDINGS, MISSIONS } from '../src/content';
import { JOBS, COURSES } from '../src/careers';
import { BALANCE, levelXP, skillXP, totalLevelXP } from '../src/balance';

const disk=()=>{const values=new Map<string,string>();return{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);},removeItem:(k:string)=>{values.delete(k);}};};
const finish=(g:GameStore)=>{expect(g.state.pending).not.toBeNull();g.advanceRealTime(g.state.pending!.remainingSeconds+.001);};
const doActivity=(g:GameStore,id:string)=>{const r=g.perform(id);expect(r.ok,r.message).toBe(true);finish(g);};
const legacy=()=>({version:1,position:{x:543,y:702},cash:1234,bank:500,energy:61,health:87,level:3,xp:75,minutes:2160,
 skills:{efficiency:4,charm:3,intelligence:5,strength:2},inventory:{apple:2},missions:{welcome:'complete'},counters:{shifts:9},visited:['home','cafe']});

describe('V2 progression and pacing',()=>{
 it('increases character XP thresholds and preserves rollover exactly',()=>{
  expect([1,2,3,4].map(levelXP)).toEqual([120,220,380,600]);expect(totalLevelXP(5)).toBe(1320);
  const g=new GameStore(disk());g.addXP(totalLevelXP(5)+17);expect(g.state.level).toBe(5);expect(g.state.xp).toBe(17);
  for(let l=1;l<20;l++)expect(levelXP(l+1)).toBeGreaterThan(levelXP(l));
 });
 it('requires incremental skill XP, with increasing thresholds and rollover',()=>{
  expect([1,2,3].map(skillXP)).toEqual([60,110,180]);
  const g=new GameStore(disk());for(let n=0;n<9;n++){doActivity(g,'diner-shift');doActivity(g,'sleep');}
  expect(g.state.skills.efficiency).toBe(1);expect(g.state.skillXP.efficiency).toBe(54);
  doActivity(g,'diner-shift');expect(g.state.skills.efficiency).toBe(2);expect(g.state.skillXP.efficiency).toBe(0);
 });
 it('reserves costs, requires real activity time, pays once and blocks action spam',()=>{
  const g=new GameStore(disk());expect(g.perform('diner-shift').ok).toBe(true);
  expect(g.state.cash).toBe(120);expect(g.state.energy).toBe(82);expect(g.state.xp).toBe(0);
  const before=JSON.stringify(g.state);for(let n=0;n<100;n++)expect(g.perform('diner-shift').ok).toBe(false);
  expect(JSON.stringify(g.state)).toBe(before);
  g.advanceRealTime(53);expect(g.state.cash).toBe(120);g.advanceRealTime(1);expect(g.state.cash).toBe(144);
  expect(g.state.minutes).toBe(600);expect(g.state.xp).toBe(18);g.advanceRealTime(100);expect(g.state.cash).toBe(144);
 });
 it('models a fresh worker reaching level 5 within 45–90 active minutes',()=>{
  const g=new GameStore(disk());let shifts=0;
  while(g.state.level<5&&shifts<150){if(g.state.energy<18)doActivity(g,'sleep');doActivity(g,'diner-shift');shifts++;}
  expect(g.state.level).toBe(5);expect(shifts).toBe(74);
  expect(g.state.playSeconds/60).toBeGreaterThanOrEqual(45);expect(g.state.playSeconds/60).toBeLessThanOrEqual(90);
  expect(g.state.developerModified).toBe(false);
 });
 it('bounds all pre-level-5 repeatable XP rates and removes the free sleep exploit',()=>{
  const g=new GameStore(disk());
  for(const a of ACTIVITIES.filter(a=>(a.requireLevel??1)<5)){
    const q=g.quoteActivity(a);expect((q.xp??0)/q.seconds,a.id).toBeLessThanOrEqual(.4);
  }
  expect(BALANCE.timing.xp/(BALANCE.timing.minutes*BALANCE.secondsPerGameMinute)).toBeLessThan(.4);
  expect(BALANCE.timing.maxPay/BALANCE.timing.minutes).toBeLessThan(BALANCE.jobs['office-shift'].pay/BALANCE.jobs['office-shift'].minutes);
  for(let n=0;n<10;n++)doActivity(g,'sleep');expect(g.state.xp).toBe(0);expect(g.state.level).toBe(1);
  const oneOff=MISSIONS.reduce((n,m)=>n+m.xp,0);expect((totalLevelXP(5)-oneOff)/.4/60).toBeGreaterThan(45);
 });
 it('makes higher skill training take longer and cost more',()=>{
  const g=new GameStore(disk()),a=ACTIVITIES.find(a=>a.id==='study')!;
  const low=g.quoteActivity(a);g.state.skills.intelligence=4;const high=g.quoteActivity(a);
  expect(high.seconds).toBeGreaterThan(low.seconds);expect(high.cash!).toBeLessThan(low.cash!);
 });
});

describe('careers, education and economy',()=>{
 it('provides 12 real jobs and checks every career prerequisite',()=>{
  expect(JOBS).toHaveLength(12);const g=new GameStore(disk());
  expect(g.requirements(JOBS.find(j=>j.id==='diner-shift')!).every(r=>r.met)).toBe(true);
  expect(g.perform('office-shift').ok).toBe(false);g.state.level=2;g.state.skills.intelligence=2;
  expect(g.perform('office-shift').ok).toBe(false);g.state.qualifications.push('office-certificate');
  expect(g.perform('office-shift').ok).toBe(true);finish(g);expect(g.state.cash).toBe(172);
 });
 it('executes all twelve roles and rejects each missing level, skill or qualification',()=>{
  for(const job of JOBS){
    const qualified=()=>{const g=new GameStore(disk());g.state.level=7;g.state.cash=10000;g.state.skills={efficiency:10,charm:10,intelligence:10,strength:10};g.state.qualifications=COURSES.map(c=>c.id);return g;};
    const g=qualified();doActivity(g,job.id);expect(g.state.cash,job.id).toBe(10000+(job.cash??0));expect(g.state.energy).toBe(100+(job.energy??0));
    if(job.requireLevel){const low=qualified();low.state.level=job.requireLevel-1;expect(low.perform(job.id).ok,`${job.id} level gate`).toBe(false);}
    for(const [skill,needed]of Object.entries(job.requireSkills??{})){const low=qualified();low.state.skills[skill as keyof typeof low.state.skills]=needed-1;expect(low.perform(job.id).ok,`${job.id} ${skill} gate`).toBe(false);}
    for(const q of job.requireQualifications??[]){const low=qualified();low.state.qualifications=low.state.qualifications.filter(id=>id!==q);expect(low.perform(job.id).ok,`${job.id} ${q} gate`).toBe(false);}
  }
 });
 it('charges course costs, grants qualifications only on completion, persists them and prevents duplicate purchases',()=>{
  const d=disk(),g=new GameStore(d);g.state.cash=300;g.state.skills.intelligence=2;
  expect(g.perform('course-office-certificate').ok).toBe(true);expect(g.state.cash).toBe(120);expect(g.state.qualifications).toEqual([]);
  finish(g);expect(g.state.qualifications).toEqual(['office-certificate']);expect(new GameStore(d).state.qualifications).toEqual(g.state.qualifications);
  expect(g.perform('course-office-certificate').ok).toBe(false);expect(g.state.cash).toBe(120);
 });
 it('requires prerequisite courses and relevant skills for specialist education',()=>{
  const g=new GameStore(disk());g.state.cash=1000;g.state.skills.intelligence=4;
  expect(g.perform('course-nursing-diploma').ok).toBe(false);g.state.qualifications.push('first-aid');
  doActivity(g,'course-nursing-diploma');expect(g.state.qualifications).toContain('nursing-diploma');
  g.state.level=4;g.state.skills.strength=2;expect(g.perform('health-nurse').ok).toBe(true);
 });
 it('rejects unaffordable or exhausted activities without modifying state',()=>{
  const g=new GameStore(disk());g.state.cash=0;let before=JSON.stringify(g.state);expect(g.perform('study').ok).toBe(false);expect(JSON.stringify(g.state)).toBe(before);
  g.state.energy=0;before=JSON.stringify(g.state);expect(g.perform('diner-shift').ok).toBe(false);expect(JSON.stringify(g.state)).toBe(before);doActivity(g,'sleep');expect(g.state.energy).toBe(100);
 });
 it('purchases, consumes and transfers funds without duplicating items or money',()=>{
  const g=new GameStore(disk());g.state.energy=20;doActivity(g,'buy-sandwich');expect(g.state.cash).toBe(106);
  expect(g.useItem('sandwich').ok).toBe(true);expect(g.state.energy).toBe(55);expect(g.useItem('sandwich').ok).toBe(false);
  expect(g.deposit(50).ok).toBe(true);expect(g.withdraw(15).ok).toBe(true);expect(g.state.cash+g.state.bank).toBe(106);
  for(const n of [-1,0,.5,NaN,Infinity,999999])expect(g.deposit(n).ok).toBe(false);
 });
 it('keeps all 16 locations functional without redesigning the city',()=>{
  expect(BUILDINGS).toHaveLength(16);for(const b of BUILDINGS)expect(ACTIVITIES.some(a=>a.building===b.id)||['bank','casino','townhall','gang'].includes(b.id)).toBe(true);
 });
});

describe('missions and minigames',()=>{
 it('rewards each mission only once and preserves sequential prerequisites',()=>{
  const g=new GameStore(disk());expect(g.acceptMission('honest-work').ok).toBe(false);g.acceptMission('welcome');expect(g.claimMission('welcome').ok).toBe(false);
  for(const id of ['home','cafe','store','townhall'])g.visit(id);expect(g.claimMission('welcome').ok).toBe(true);expect(g.state.cash).toBe(165);expect(g.claimMission('welcome').ok).toBe(false);
  g.acceptMission('honest-work');doActivity(g,'diner-shift');doActivity(g,'diner-shift');expect(g.claimMission('honest-work').ok).toBe(true);
 });
 it('times the skill challenge, scales pay with accuracy and awards only skill XP',()=>{
  const low=new GameStore(disk()),high=new GameStore(disk());low.finishTiming('work',0);high.finishTiming('work',1);
  expect(high.state.cash).toBe(120);finish(low);finish(high);expect(high.state.cash).toBe(128);expect(low.state.cash).toBe(123);
  expect(high.state.skills.efficiency).toBe(1);expect(high.state.skillXP.efficiency).toBe(2);expect(high.state.energy).toBe(92);
 });
 it('resolves criminal risk and mission progress exactly once',()=>{
  const win=new GameStore(disk(),()=>0),lose=new GameStore(disk(),()=>.999);win.acceptMission('light-fingers');
  win.finishTiming('pickpocket',1);finish(win);expect(win.state.counters.pickpockets).toBe(1);expect(win.claimMission('light-fingers').ok).toBe(true);
  lose.finishTiming('pickpocket',1);finish(lose);expect(lose.state.cash).toBe(95);expect(lose.state.health).toBe(90);expect(lose.state.energy).toBe(92);
 });
 it('charges slot bets, computes payouts and blocks spins while an activity is pending',()=>{
  const g=new GameStore(disk(),()=>.99);expect(g.spinSlots(10).payout).toBe(200);expect(g.state.cash).toBe(310);
  g.perform('sleep');expect(g.spinSlots(10).ok).toBe(false);finish(g);expect(g.spinSlots(1000).ok).toBe(false);
 });
});

describe('migration, import and developer isolation',()=>{
 it('backs up V1 and preserves assets, levels, skills, mission state and fractional level progress',()=>{
  const d=disk(),old=legacy();d.setItem(SAVE_KEY,JSON.stringify(old));const g=new GameStore(d);
  expect(d.getItem(V1_BACKUP_KEY)).toBe(JSON.stringify(old));expect(g.state.version).toBe(2);
  expect(g.state).toMatchObject({cash:1234,bank:500,level:3,xp:190,energy:61,health:87,minutes:2160,skills:old.skills,inventory:old.inventory,missions:old.missions,position:old.position});
  expect(g.state.skillXP.intelligence).toBe(0);g.save();expect(new GameStore(d).state).toEqual(g.state);
 });
 it('still loads V1 progress if browser quota prevents writing its backup',()=>{
  const raw=JSON.stringify(legacy());const g=new GameStore({getItem(k){return k===SAVE_KEY?raw:null;},setItem(){throw Error('quota');},removeItem(){}});
  expect(g.state.cash).toBe(1234);expect(g.state.level).toBe(3);expect(g.state.version).toBe(2);expect(g.storageAvailable).toBe(false);
 });
 it('retains pending progress across reload without granting offline rewards',()=>{
  const d=disk(),g=new GameStore(d);g.perform('diner-shift');g.advanceRealTime(20);g.save();const restored=new GameStore(d);
  expect(restored.state.pending!.remainingSeconds).toBe(34);expect(restored.state.cash).toBe(120);finish(restored);expect(restored.state.cash).toBe(144);
 });
 it('does not finish activities by changing the in-game clock',()=>{
  const g=new GameStore(disk());g.perform('diner-shift');const remaining=g.state.pending!.remainingSeconds;g.developer('day');expect(g.state.pending!.remainingSeconds).toBe(remaining);expect(g.state.cash).toBe(120);
 });
 it('applies every progression developer tool to the intended state and marks the save',()=>{
  const g=new GameStore(disk());g.developer('cash-add',1000);expect(g.state.cash).toBe(1120);g.developer('cash-set',432);expect(g.state.cash).toBe(432);
  g.developer('xp-add',120);expect(g.state.level).toBe(2);g.developer('level-set',4);expect(g.state.level).toBe(4);expect(g.state.xp).toBe(0);
  g.developer('skill-set',3,'charm');expect(g.state.skills.charm).toBe(3);expect(g.state.skills.strength).toBe(1);
  g.developer('qualifications');expect(g.state.qualifications).toHaveLength(COURSES.length);g.state.energy=1;g.state.health=1;g.developer('restore');expect(g.state.energy).toBe(100);expect(g.state.health).toBe(100);expect(g.state.developerModified).toBe(true);
 });
 it('keeps temporary modifiers out of saves and bypasses resource costs only when explicitly enabled',()=>{
  const d=disk(),g=new GameStore(d);g.state.energy=0;expect(g.perform('diner-shift').ok).toBe(false);
  g.setModifier('infiniteEnergy',true);g.setModifier('speed',5);g.setModifier('noclip',true);doActivity(g,'diner-shift');expect(g.state.energy).toBe(100);
  const restored=new GameStore(d);expect(restored.modifiers).toEqual({infiniteEnergy:false,infiniteHealth:false,speed:1,noclip:false,paused:false});expect(restored.state.developerModified).toBe(true);
 });
 it('makes infinite health prevent crime injury only while enabled',()=>{
  const g=new GameStore(disk(),()=>.999);g.setModifier('infiniteHealth',true);g.finishTiming('pickpocket',1);finish(g);expect(g.state.health).toBe(100);expect(g.state.cash).toBe(95);
  g.setModifier('infiniteHealth',false);g.finishTiming('pickpocket',1);finish(g);expect(g.state.health).toBe(90);expect(g.state.cash).toBe(70);
 });
 it('rejects bad developer values without changing progress',()=>{
  const g=new GameStore(disk()),before=JSON.stringify(g.state);for(const n of [NaN,Infinity,-1,.5])expect(g.developer('cash-set',n).ok).toBe(false);
  expect(g.developer('level-set',0).ok).toBe(false);expect(g.setModifier('speed',9).ok).toBe(false);expect(JSON.stringify(g.state)).toBe(before);
 });
 it('validates imports before replacing state and never evaluates code',()=>{
  const g=new GameStore(disk()),before=JSON.stringify(g.state);
  for(const raw of ['{bad','({version:2})','{"version":99}',JSON.stringify({...freshState(),cash:'999'}),JSON.stringify({...freshState(),qualifications:['fake']})])expect(g.importSaveData(raw).ok).toBe(false);
  expect(JSON.stringify(g.state)).toBe(before);expect(g.importSaveData(JSON.stringify(legacy())).ok).toBe(true);expect(g.state.cash).toBe(1234);expect(g.state.developerModified).toBe(true);
  expect(validImport(JSON.parse(g.exportSaveData()))).toBe(true);
 });
 it('rejects malformed pending imports and safely repairs ordinary corrupt local data',()=>{
  const s=freshState();expect(validImport({...s,pending:{kind:'activity',id:'fake',remainingSeconds:5,totalSeconds:5}})).toBe(false);
  const d=disk();d.setItem(SAVE_KEY,'{broken');expect(new GameStore(d).state.cash).toBe(120);
  expect(validateSave({version:2,cash:-10,skills:{intelligence:2}}).cash).toBe(0);
 });
 it('continues in memory with a storage warning and resets deliberately',()=>{
  const g=new GameStore({getItem(){throw Error();},setItem(){throw Error();},removeItem(){}});doActivity(g,'diner-shift');expect(g.storageAvailable).toBe(false);g.reset();expect(g.state).toEqual(freshState());
 });
});
