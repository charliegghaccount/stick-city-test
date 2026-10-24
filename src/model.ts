import { ACTIVITIES, BUILDINGS, ITEMS, MISSIONS } from './content';
import { BALANCE, levelXP, skillXP } from './balance';
import { COURSES, JOBS, qualificationName } from './careers';
import { CRIME, ROBBERIES, robberyChance, pickpocketChance } from './crime';
import { SKILLS, type Activity, type DeveloperModifiers, type PlayerState, type Result, type Skill } from './types';

// Keep the original key so existing players continue automatically.
export const SAVE_KEY = 'stick-city-v1';
export const V2_BACKUP_KEY = `${SAVE_KEY}.backup-pre-v3`;
const LEGACY_SKILLS = SKILLS.filter(k=>k!=='thieving');
export const V1_BACKUP_KEY = `${SAVE_KEY}.backup-pre-v2`;
type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const defaultModifiers = (): DeveloperModifiers => ({ infiniteEnergy:false, infiniteHealth:false, speed:1, noclip:false, paused:false });
export const freshState = (): PlayerState => ({
  version:3, position:{x:202.5,y:336}, cash:120, bank:0, energy:100, health:100,
  level:1, xp:0, minutes:480, skills:{efficiency:1,charm:1,intelligence:1,strength:1,thieving:1},
  skillXP:{efficiency:0,charm:0,intelligence:0,strength:0,thieving:0}, qualifications:[],
  developerModified:false, playSeconds:0, currentJob:null, pursuit:null, crimeReadyAt:{}, contacts:[], inventory:{}, missions:{}, counters:{}, visited:[],
});
const finite = (v:unknown,fallback:number,min=0,max=1e9):number => typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback;
const record = (v:unknown):v is Record<string,unknown> => !!v&&typeof v==='object'&&!Array.isArray(v);
const safeKey = (k:string) => /^[a-z][a-z0-9-]*$/i.test(k)&&!['constructor','prototype','__proto__'].includes(k);
const integer = (v:unknown,min=0,max=1e9):v is number => typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;

/** Repair ordinary local saves and migrate V1 without erasing earned levels or assets. */
export function validateSave(value:unknown):PlayerState {
  const s=freshState();
  if(!record(value)||(value.version!==1&&value.version!==2&&value.version!==3))return s;
  if(record(value.position))s.position={x:finite(value.position.x,s.position.x,20,1660),y:finite(value.position.y,s.position.y,20,1740)};
  for(const k of ['cash','bank','minutes','playSeconds'] as const)s[k]=Math.floor(finite(value[k],s[k]));
  s.energy=finite(value.energy,100,0,100);s.health=finite(value.health,100,1,100);
  s.level=Math.floor(finite(value.level,1,1,BALANCE.character.maxLevel));s.xp=Math.floor(finite(value.xp,0));
  if(value.version===1){
    while(s.xp>=s.level*50&&s.level<BALANCE.character.maxLevel){s.xp-=s.level*50;s.level++;}
    s.xp=Math.floor(s.xp/(s.level*50)*levelXP(s.level));
  }
  while(s.xp>=levelXP(s.level)&&s.level<BALANCE.character.maxLevel){s.xp-=levelXP(s.level);s.level++;}
  if(record(value.skills))for(const k of SKILLS)s.skills[k]=Math.floor(finite(value.skills[k],1,1,value.version===1?9999:BALANCE.skill.maxLevel));
  // Preserve exceptionally high legacy skill levels rather than silently downgrading them.
  if(Number(value.version)>=2&&record(value.skills))for(const k of SKILLS)s.skills[k]=Math.floor(finite(value.skills[k],1,1,9999));
  if(Number(value.version)>=2&&record(value.skillXP))for(const k of SKILLS){
    s.skillXP[k]=Math.floor(finite(value.skillXP[k],0));
    while(s.skills[k]<BALANCE.skill.maxLevel&&s.skillXP[k]>=skillXP(s.skills[k])){s.skillXP[k]-=skillXP(s.skills[k]);s.skills[k]++;}
    s.skillXP[k]=Math.min(s.skillXP[k],skillXP(s.skills[k])-1);
  }
  if(record(value.inventory))for(const [id,n]of Object.entries(value.inventory))if(Object.hasOwn(ITEMS,id))s.inventory[id]=Math.floor(finite(n,0,0,9999));
  if(record(value.missions))for(const m of MISSIONS){const status=value.missions[m.id];if(status==='active'||status==='complete')s.missions[m.id]=status;}
  if(record(value.counters))for(const [k,n]of Object.entries(value.counters))if(safeKey(k))s.counters[k]=Math.floor(finite(n,0));
  if(Array.isArray(value.visited))s.visited=[...new Set(value.visited.filter((id):id is string=>typeof id==='string'&&BUILDINGS.some(b=>b.id===id)))];
  if(Array.isArray(value.qualifications))s.qualifications=[...new Set(value.qualifications.filter((id):id is string=>typeof id==='string'&&COURSES.some(c=>c.id===id)))];
  s.developerModified=value.developerModified===true;
  if(typeof value.currentJob==='string'&&JOBS.some(j=>j.id===value.currentJob))s.currentJob=value.currentJob;
  if(record(value.crimeReadyAt))for(const[k,n]of Object.entries(value.crimeReadyAt))if(safeKey(k))s.crimeReadyAt[k]=finite(n,0);
  if(Array.isArray(value.contacts))s.contacts=[...new Set(value.contacts.filter((id):id is string=>typeof id==='string'&&safeKey(id)&&id.length<=80))];
  if(record(value.pursuit)&&typeof value.pursuit.remaining==='number'&&Number.isFinite(value.pursuit.remaining)&&value.pursuit.remaining>0&&integer(value.pursuit.serial,1))s.pursuit={remaining:Math.min(CRIME.pursuitSeconds,value.pursuit.remaining),serial:value.pursuit.serial};
  return s;
}

/** Imports are stricter than local repair: reject invalid data before touching the save. */
export function validImport(v:unknown):boolean {
  if(!record(v)||(v.version!==1&&v.version!==2&&v.version!==3)||!record(v.position)||!record(v.skills)||!record(v.inventory)||!record(v.missions)||!record(v.counters)||!Array.isArray(v.visited))return false;
  if(!integer(v.cash)||!integer(v.bank)||!integer(v.level,1,10000)||!integer(v.xp)||!integer(v.minutes))return false;
  if(typeof v.energy!=='number'||!Number.isFinite(v.energy)||v.energy<0||v.energy>100||typeof v.health!=='number'||!Number.isFinite(v.health)||v.health<1||v.health>100)return false;
  if(typeof v.position.x!=='number'||!Number.isFinite(v.position.x)||v.position.x<0||v.position.x>1680||typeof v.position.y!=='number'||!Number.isFinite(v.position.y)||v.position.y<0||v.position.y>1760)return false;
  if(!(v.version===3?SKILLS:LEGACY_SKILLS).every(k=>integer((v.skills as Record<string,unknown>)[k],1,9999)))return false;
  if(!Object.entries(v.inventory).every(([k,n])=>Object.hasOwn(ITEMS,k)&&integer(n,0,9999)))return false;
  if(!Object.entries(v.counters).every(([k,n])=>safeKey(k)&&integer(n)))return false;
  if(!Object.entries(v.missions).every(([k,n])=>MISSIONS.some(m=>m.id===k)&&(n==='active'||n==='complete')))return false;
  if(!v.visited.every(id=>typeof id==='string'&&BUILDINGS.some(b=>b.id===id)))return false;
  if(v.version===2||v.version===3){
    if(!record(v.skillXP)||!(v.version===3?SKILLS:LEGACY_SKILLS).every(k=>integer((v.skillXP as Record<string,unknown>)[k]))||!Array.isArray(v.qualifications)||!v.qualifications.every(id=>COURSES.some(c=>c.id===id))||typeof v.developerModified!=='boolean'||typeof v.playSeconds!=='number'||!Number.isFinite(v.playSeconds)||v.playSeconds<0)return false;
    if(v.version===2&&v.pending!==null){
      if(!record(v.pending))return false;
      const p=v.pending;
      if(!['activity','work','pickpocket'].includes(String(p.kind))||typeof p.id!=='string'||(p.kind==='activity'&&!ACTIVITIES.some(a=>a.id===p.id))||typeof p.remainingSeconds!=='number'||!Number.isFinite(p.remainingSeconds)||typeof p.totalSeconds!=='number'||!Number.isFinite(p.totalSeconds)||p.totalSeconds<=0||p.totalSeconds>1e6||p.remainingSeconds<0||p.remainingSeconds>p.totalSeconds)return false;
      if(p.kind!=='activity'&&(p.id!==p.kind||typeof p.accuracy!=='number'||!Number.isFinite(p.accuracy)||p.accuracy<0||p.accuracy>1))return false;
    }
  }
  if(v.version===3){
    if(v.currentJob!==null&&(typeof v.currentJob!=='string'||!JOBS.some(j=>j.id===v.currentJob)))return false;
    if(!record(v.crimeReadyAt)||!Object.entries(v.crimeReadyAt).every(([k,n])=>safeKey(k)&&typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1e9))return false;
    if(!Array.isArray(v.contacts)||!v.contacts.every(id=>typeof id==='string'&&safeKey(id)&&id.length<=80))return false;
    if(v.pursuit!==null&&(!record(v.pursuit)||typeof v.pursuit.remaining!=='number'||!Number.isFinite(v.pursuit.remaining)||v.pursuit.remaining<=0||v.pursuit.remaining>CRIME.pursuitSeconds||!integer(v.pursuit.serial,1)))return false;
  }
  return true;
}

export class GameStore {
  state:PlayerState;
  modifiers=defaultModifiers();
  storageAvailable=true;
  completionVersion=0;
  lastMessage='';
  private listeners=new Set<(state:PlayerState)=>void>();
  private storage?:SaveStorage;
  private notifyElapsed=0;
  private saveElapsed=0;
  constructor(storage?:SaveStorage,private random:()=>number=Math.random){
    this.state=freshState();
    try{
      this.storage=storage??globalThis.localStorage;
      const raw=this.storage?.getItem(SAVE_KEY);
      if(raw){
        const parsed:unknown=JSON.parse(raw);
        this.state=validateSave(parsed);
        if(record(parsed)&&parsed.version!==3){
          try{
            if(parsed.version===1&&!this.storage?.getItem(V1_BACKUP_KEY))this.storage?.setItem(V1_BACKUP_KEY,raw);
            if(!this.storage?.getItem(V2_BACKUP_KEY))this.storage?.setItem(V2_BACKUP_KEY,raw);
          }catch{this.storageAvailable=false;}
          this.settleLegacy(parsed);
          this.save();
        }
      }
    }catch{this.storageAvailable=false;}
  }
  subscribe(fn:(s:PlayerState)=>void):()=>void{this.listeners.add(fn);fn(this.state);return()=>this.listeners.delete(fn);}
  save():void{try{this.storage?.setItem(SAVE_KEY,JSON.stringify(this.state));this.storageAvailable=!!this.storage;}catch{this.storageAvailable=false;}}
  private changed(persist=true):void{if(this.modifiers.infiniteEnergy)this.state.energy=100;if(this.modifiers.infiniteHealth)this.state.health=100;if(persist)this.save();for(const fn of this.listeners)fn(this.state);}
  reset():void{this.state=freshState();this.modifiers=defaultModifiers();this.completionVersion++;this.lastMessage='New game started.';this.changed();}
  moveTo(x:number,y:number):void{this.state.position={x:finite(x,this.state.position.x,20,1660),y:finite(y,this.state.position.y,20,1740)};this.changed();}
  visit(id:string):void{if(!BUILDINGS.some(b=>b.id===id)||this.state.visited.includes(id))return;this.state.visited.push(id);this.changed();}
  xpNeeded():number{return levelXP(this.state.level);}
  addXP(amount:number):void{this.grantXP(amount);this.changed();}
  private grantXP(amount:number):void{
    this.state.xp+=Math.floor(finite(amount,0));
    while(this.state.level<BALANCE.character.maxLevel&&this.state.xp>=this.xpNeeded()){this.state.xp-=this.xpNeeded();this.state.level++;}
    this.state.xp=Math.min(this.state.xp,this.xpNeeded()-1);
  }
  private gainSkill(skill:Skill,amount:number):void{
    this.state.skillXP[skill]+=Math.floor(amount);
    while(this.state.skills[skill]<BALANCE.skill.maxLevel&&this.state.skillXP[skill]>=skillXP(this.state.skills[skill])){this.state.skillXP[skill]-=skillXP(this.state.skills[skill]);this.state.skills[skill]++;}
    this.state.skillXP[skill]=Math.min(this.state.skillXP[skill],skillXP(this.state.skills[skill])-1);
  }
  private count(key:string,amount=1):void{this.state.counters[key]=(this.state.counters[key]??0)+amount;}
  quoteActivity(activity:Activity):Activity{
    const scale=activity.training&&activity.skill?1+(this.state.skills[activity.skill]-1)*BALANCE.trainingIncreasePerLevel:1;
    const minutes=Math.ceil(activity.minutes*scale);
    return {...activity,minutes,cash:activity.cash&&activity.cash<0?-Math.ceil(-activity.cash*scale):activity.cash,
      xp:Math.floor((activity.xp??0)*BALANCE.multipliers.characterXP),skillXP:activity.skill?this.skillReward(activity.skill,activity.skillXP??0):0};
  }
  requirements(a:Activity):{text:string;met:boolean}[]{
    const r:{text:string;met:boolean}[]=[];
    if(a.requireLevel)r.push({text:`Level ${a.requireLevel}`,met:this.state.level>=a.requireLevel});
    for(const k of SKILLS){const needed=a.requireSkills?.[k]??(a.requireSkill?.[0]===k?a.requireSkill[1]:0);if(needed)r.push({text:`${k[0].toUpperCase()+k.slice(1)} ${needed}`,met:this.state.skills[k]>=needed});}
    for(const q of a.requireQualifications??[])r.push({text:qualificationName(q),met:this.state.qualifications.includes(q)});
    return r;
  }
  perform(id:string):Result{
    const source=ACTIVITIES.find(a=>a.id===id);if(!source)return{ok:false,message:'That activity is unavailable.'};
    if(this.state.pursuit)return{ok:false,message:'Lose the police before entering buildings or doing activities.'};
    if(source.item&&ITEMS[source.item]?.equipment&&(this.state.inventory[source.item]??0)>0)return{ok:false,message:'You already own this equipment; its bonus does not stack.'};
    if(source.qualification&&this.state.qualifications.includes(source.qualification))return{ok:false,message:'You already hold this qualification.'};
    const missing=this.requirements(source).filter(r=>!r.met);if(missing.length)return{ok:false,message:`Requires: ${missing.map(r=>r.text).join(', ')}.`};
    const a=this.quoteActivity(source),s=this.state;
    if(s.cash+(a.cash??0)>1e9)return{ok:false,message:'Cash limit reached. Deposit some earnings first.'};
    if(s.cash+(a.cash??0)<0)return{ok:false,message:'You do not have enough cash.'};
    if(!this.modifiers.infiniteEnergy&&s.energy+(a.energy??0)<0)return{ok:false,message:'Not enough energy. Eat, rest in the park, or sleep at home.'};
    if((a.cash??0)<0)s.cash+=a.cash!;
    if((a.energy??0)<0&&!this.modifiers.infiniteEnergy)s.energy+=a.energy!;
    this.applyActivity(a);
    this.changed();return{ok:true,message:this.lastMessage};
  }
  private skillReward(skill:Skill,base:number):number{return Math.floor(base*BALANCE.multipliers.skillXP*(skill==='intelligence'?1+this.equipmentBonus('intelligenceBonus'):1));}
  equipmentBonus(effect:'robberyBonus'|'speedBonus'|'damageReduction'|'intelligenceBonus'):number{
    return Object.entries(ITEMS).reduce((total,[id,item])=>total+((this.state.inventory[id]??0)>0?(item[effect]??0):0),0);
  }
  private applyActivity(a:Activity):void{
    const s=this.state;
    if((a.cash??0)>0){s.cash+=a.cash!;this.count('earned',a.cash!);}
    if((a.energy??0)>0)s.energy=Math.min(100,s.energy+a.energy!);
    if((a.health??0)>0)s.health=Math.min(100,s.health+a.health!);
    s.minutes+=a.minutes;
    if(a.skill)this.gainSkill(a.skill,a.skillXP??0);
    if(a.item)s.inventory[a.item]=(s.inventory[a.item]??0)+1;
    if(a.counter)this.count(a.counter);
    if(a.career)s.currentJob=a.id;
    if(a.qualification&&!s.qualifications.includes(a.qualification))s.qualifications.push(a.qualification);
    this.grantXP(a.xp??0);
    this.lastMessage=`${a.label} complete.${(a.cash??0)>0?` Earned $${a.cash}.`:''}${a.xp?` +${a.xp} XP.`:''}${a.skill?` +${a.skillXP??0} ${a.skill} XP.`:''}${a.qualification?' Qualification earned!':''}${a.item?' Added to your bag.':''}`;
    this.completionVersion++;
  }
  private settleLegacy(value:Record<string,unknown>):void{
    if(value.version!==2||!record(value.pending)||!validImport(value))return;
    const p=value.pending;
    if(p.kind==='activity'&&typeof p.id==='string'){
      const a=ACTIVITIES.find(a=>a.id===p.id);if(a)this.applyActivity(this.quoteActivity(a));
    }else if((p.kind==='work'||p.kind==='pickpocket')&&typeof p.accuracy==='number')this.completeTiming(p.kind,Math.max(0,Math.min(1,p.accuracy)),true);
  }
  /** Real time is used only by movement/simulation and the interactive police pursuit. */
  tickSimulation(seconds:number):void{
    if(!Number.isFinite(seconds)||seconds<=0)return;
    this.state.playSeconds+=Math.min(seconds,1e6);this.notifyElapsed+=seconds;this.saveElapsed+=seconds;
    if(this.state.pursuit&&!this.modifiers.paused){
      this.state.pursuit.remaining=Math.max(0,this.state.pursuit.remaining-seconds);
      if(this.state.pursuit.remaining<=1e-6){this.state.pursuit=null;this.count('escapes');this.lastMessage='You lost the police. Stay out of trouble!';this.completionVersion++;this.changed();return;}
    }
    if(this.notifyElapsed>=.25){this.notifyElapsed=0;const persist=this.saveElapsed>=1;if(persist)this.saveElapsed=0;this.changed(persist);}
  }
  applyForJob(id:string):Result{
    const job=JOBS.find(j=>j.id===id);if(!job||this.state.pursuit)return{ok:false,message:'Job application unavailable while wanted.'};
    const missing=this.requirements(job).filter(r=>!r.met);if(missing.length)return{ok:false,message:`Requires: ${missing.map(r=>r.text).join(', ')}.`};
    this.state.currentJob=id;this.changed();return{ok:true,message:`Current job: ${job.label}. Visit ${BUILDINGS.find(b=>b.id===job.building)?.name} to work.`};
  }
  deposit(amount:number):Result{return this.transfer(amount,'deposit');}
  withdraw(amount:number):Result{return this.transfer(amount,'withdraw');}
  private transfer(amount:number,direction:'deposit'|'withdraw'):Result{
    if(!integer(amount,1))return{ok:false,message:'Enter a positive whole dollar amount.'};
    if(this.state.pursuit)return{ok:false,message:'Lose the police before banking.'};
    const from=direction==='deposit'?'cash':'bank',to=direction==='deposit'?'bank':'cash';
    if(this.state[from]<amount)return{ok:false,message:`Not enough ${from==='cash'?'cash':'money in the bank'}.`};
    if(this.state[to]+amount>1e9)return{ok:false,message:'That balance would exceed the account limit.'};
    this.state[from]-=amount;this.state[to]+=amount;this.changed();return{ok:true,message:`${direction==='deposit'?'Deposited':'Withdrew'} $${amount}.`};
  }
  useItem(id:string):Result{
    if(!Object.hasOwn(ITEMS,id)||!(this.state.inventory[id]>0))return{ok:false,message:'That item is not in your bag.'};
    const item=ITEMS[id];if(item.equipment)return{ok:false,message:'Equipment is already active while owned; it is not consumed.'};this.state.inventory[id]--;this.state.energy=Math.min(100,this.state.energy+(item.energy??0));this.state.health=Math.min(100,this.state.health+(item.health??0));this.changed();
    return{ok:true,message:`Used ${item.name.toLowerCase()}. +${item.energy??0} energy, +${item.health??0} health.`};
  }
  acceptMission(id:string):Result{
    if(this.state.pursuit)return{ok:false,message:'Lose the police before speaking to a contact.'};
    const m=MISSIONS.find(m=>m.id===id);if(!m)return{ok:false,message:'Mission unavailable.'};if(this.state.missions[id])return{ok:false,message:'You already accepted this mission.'};
    if(m.prerequisite&&this.state.missions[m.prerequisite]!=='complete')return{ok:false,message:'Finish the previous mission first.'};
    this.state.missions[id]='active';this.changed();return{ok:true,message:`Mission accepted: ${m.title}.`};
  }
  missionObjectives(id:string):{label:string;current:number;target:number}[]{
    const m=MISSIONS.find(m=>m.id===id);if(!m)return[];
    if(m.objectives)return m.objectives.map(o=>({label:o.label,current:Math.min(o.target,o.kind==='skill'?(this.state.skills[o.key as Skill]??0):(this.state.counters[o.key]??0)),target:o.target}));
    return[{label:m.objective,current:Math.min(m.target,m.counter?(this.state.counters[m.counter]??0):this.state.visited.length),target:m.target}];
  }
  missionProgress(id:string):number{return this.missionObjectives(id).reduce((n,o)=>n+o.current,0);}
  claimMission(id:string):Result{
    if(this.state.pursuit)return{ok:false,message:'Lose the police before collecting rewards.'};
    const m=MISSIONS.find(m=>m.id===id);if(!m||this.state.missions[id]!=='active')return{ok:false,message:'Accept this mission first.'};
    if(this.missionProgress(id)<m.target)return{ok:false,message:'Your objective is not finished yet.'};
    if(this.state.cash+m.reward>1e9)return{ok:false,message:'Cash limit reached. Bank some money before claiming.'};
    this.state.missions[id]='complete';this.state.cash+=m.reward;this.grantXP(m.xp);this.changed();return{ok:true,message:`Mission complete! +$${m.reward} and ${m.xp} XP.`};
  }
  finishTiming(mode:'work'|'pickpocket',accuracy:number):Result{
    if(!Number.isFinite(accuracy)||this.state.pursuit)return{ok:false,message:'Activity unavailable while wanted or invalid timing.'};
    const c=BALANCE.timing;if(this.state.cash+(mode==='work'?c.maxPay:CRIME.pickpocket.maxPay)>1e9)return{ok:false,message:'Cash limit reached. Bank some money first.'};if(!this.modifiers.infiniteEnergy&&this.state.energy<c.energy)return{ok:false,message:`You need ${c.energy} energy.`};
    if(!this.modifiers.infiniteEnergy)this.state.energy-=c.energy;
    this.completeTiming(mode,Math.max(0,Math.min(1,accuracy)));this.changed();return{ok:true,message:this.lastMessage};
  }
  private completeTiming(mode:'work'|'pickpocket',score:number,legacy=false):void{
    const c=BALANCE.timing,s=this.state;s.minutes+=c.minutes;
    if(mode==='work'){
      const pay=Math.round(c.minPay+score*(c.maxPay-c.minPay));s.cash+=pay;this.count('earned',pay);this.count('sorting-rounds');this.count('shifts');this.grantXP(c.xp);this.gainSkill('efficiency',this.skillReward('efficiency',c.skillXP));
      this.lastMessage=`${Math.round(score*100)}% accuracy. Sorting paid $${pay}, +${c.xp} XP and +${c.skillXP} efficiency XP.`;
    }else{
      const chance=score<.55?0:legacy?Math.min(.92,.3+score*.45+s.skills.charm*.01):pickpocketChance(s,this.equipmentBonus('robberyBonus'));
      this.resolvePickpocket(chance);
    }
    this.completionVersion++;
  }
  spinSlots(bet:number):{ok:boolean;message:string;reels:string[];payout:number}{
    const fail=(message:string)=>({ok:false,message,reels:['?','?','?'],payout:0});
    if(this.state.pursuit)return fail('Lose the police before gambling.');
    const c=BALANCE.slots;if(!integer(bet,c.minBet,c.maxBet))return fail(`Choose a whole-dollar bet from $${c.minBet} to $${c.maxBet}.`);
    if(this.state.cash+bet*(c.sevens-1)>1e9)return fail('Cash limit reached. Bank some money first.');
    if(this.state.cash<bet)return fail('Not enough cash for that bet.');
    const symbols=['🍒','🍋','🔔','⭐','7'],reels=Array.from({length:3},()=>symbols[Math.min(4,Math.max(0,Math.floor(this.random()*5)))]),unique=new Set(reels).size;
    const multiplier=unique===1?(reels[0]==='7'?c.sevens:c.triple):unique===2?c.pair:0,payout=bet*multiplier;
    this.state.cash+=payout-bet;this.state.minutes+=c.minutes;this.count('slot-spins');this.changed();
    return{ok:true,reels,payout,message:multiplier>1?`${multiplier}× payout: $${payout}.`:multiplier===1?`Pair! Your $${bet} bet is returned.`:`No match. Lost $${bet}.`};
  }
  talkTo(id:string,choice:'greet'|'work'|'rumour'='greet'):Result{
    if(this.state.pursuit)return{ok:false,message:'Nobody wants to talk while the police are chasing you.'};
    const key=`npc-${id.toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,64)}`;
    if(!this.state.contacts.includes(key)){this.state.contacts.push(key);this.count('conversations');}
    this.state.minutes+=5;this.changed();
    const message=choice==='work'?(this.state.currentJob?'Your current job is saved. College qualifications open better positions.':'Try kitchen work, retail or the clinic. No qualification is needed to start.'):
      choice==='rumour'?(this.state.skills.thieving>=2?'Higher Thieving unlocks better targets. Failed robberies bring armed police; use buildings as cover.':'The Gang Leader can teach Thieving. Start small; robbery can bring a 30-second police chase.'):
      this.state.missions.welcome==='complete'?'The Mayor has more tasks when you are ready. Good to see a familiar face!':'Welcome! Visit Town Hall for the Mayor’s first task.';
    return{ok:true,message};
  }
  pickpocketQuote(id:string){
    const key=`npc-${id.toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,64)}`;
    return{key,chance:pickpocketChance(this.state,this.equipmentBonus('robberyBonus')),readyAt:this.state.crimeReadyAt[key]??0};
  }
  pickpocket(id:string):Result{
    if(this.state.pursuit)return{ok:false,message:'Lose the police first.'};
    const q=this.pickpocketQuote(id),c=CRIME.pickpocket;
    if(this.state.cash+c.maxPay>1e9)return{ok:false,message:'Cash limit reached. Bank some money first.'};
    if(q.readyAt>this.state.minutes)return{ok:false,message:'This person is alert. Return after another in-game hour or find someone else.'};
    if(!this.modifiers.infiniteEnergy&&this.state.energy<c.energy)return{ok:false,message:`You need ${c.energy} energy.`};
    if(!this.modifiers.infiniteEnergy)this.state.energy-=c.energy;
    this.state.minutes+=c.minutes;this.state.crimeReadyAt[q.key]=this.state.minutes+c.resetMinutes;
    this.resolvePickpocket(q.chance);this.completionVersion++;this.changed();return{ok:true,message:this.lastMessage};
  }
  private resolvePickpocket(chance:number):void{
    const s=this.state,c=CRIME.pickpocket;
    if(this.random()<chance){const pay=c.minPay+Math.floor(this.random()*(c.maxPay-c.minPay+1));s.cash+=pay;this.count('pickpockets');this.grantXP(c.xp);this.gainSkill('thieving',this.skillReward('thieving',c.skillSuccess));this.lastMessage=`Lifted $${pay}. +${c.xp} XP and +${c.skillSuccess} Thieving XP.`;}
    else{const fine=Math.min(s.cash,c.fine);s.cash-=fine;if(!this.modifiers.infiniteHealth)s.health=Math.max(1,s.health-c.injury);this.count('caught');this.gainSkill('thieving',this.skillReward('thieving',c.skillFailure));this.lastMessage=`Caught! Paid $${fine}, lost ${this.modifiers.infiniteHealth?0:c.injury} health. +${c.skillFailure} Thieving XP.`;}
  }
  robberyQuote(building:string){
    const tier=ROBBERIES.find(t=>t.building===building);if(!tier)return null;
    return{...tier,chance:robberyChance(this.state,tier,this.equipmentBonus('robberyBonus')),readyAt:this.state.crimeReadyAt[`building-${building}`]??0,eligible:this.state.skills.thieving>=tier.skill&&this.state.level>=tier.level};
  }
  robBuilding(building:string):Result{
    const q=this.robberyQuote(building),s=this.state;
    if(!q)return{ok:false,message:'This building is not a robbery target.'};
    if(s.pursuit)return{ok:false,message:'You are already wanted. Escape first.'};
    if(s.cash+q.max>1e9)return{ok:false,message:'Cash limit reached. Bank some money first.'};
    if(!q.eligible)return{ok:false,message:`Requires Thieving ${q.skill} and character level ${q.level}.`};
    if(q.readyAt>s.minutes)return{ok:false,message:`Security is alert for another ${Math.ceil(q.readyAt-s.minutes)} in-game minutes. No real-time wait is required.`};
    if(!this.modifiers.infiniteEnergy&&s.energy<q.energy)return{ok:false,message:`You need ${q.energy} energy.`};
    if(!this.modifiers.infiniteEnergy)s.energy-=q.energy;s.minutes+=q.minutes;s.crimeReadyAt[`building-${building}`]=s.minutes+q.resetMinutes;
    if(this.random()<q.chance){
      const pay=q.min+Math.floor(this.random()*(q.max-q.min+1));s.cash+=pay;this.count('robberies');this.count('stolen',pay);this.grantXP(q.xp);this.gainSkill('thieving',this.skillReward('thieving',q.skillXP));this.lastMessage=`Robbery succeeded! $${pay}, +${q.xp} XP and +${q.skillXP} Thieving XP.`;
    }else{
      this.gainSkill('thieving',this.skillReward('thieving',2));this.count('failed-robberies');this.count('pursuits');s.pursuit={remaining:CRIME.pursuitSeconds,serial:s.counters.pursuits};this.lastMessage='Robbery failed! Armed police will pursue you for 30 seconds. Run, dodge and use buildings as cover!';
    }
    this.completionVersion++;this.changed();return{ok:true,message:this.lastMessage};
  }
  takePoliceDamage(amount:number):boolean{
    if(!this.state.pursuit||!Number.isFinite(amount)||amount<=0)return false;
    this.count('police-hits');if(!this.modifiers.infiniteHealth)this.state.health=Math.max(0,this.state.health-Math.max(1,Math.round(amount*(1-this.equipmentBonus('damageReduction')))));
    let defeated=false;
    if(this.state.health===0){
      defeated=true;const bill=Math.min(this.state.cash,CRIME.maxHospitalBill,25+Math.floor(this.state.cash*.1));this.state.cash-=bill;this.state.health=CRIME.hospitalHealth;this.state.energy=CRIME.hospitalEnergy;this.state.minutes+=CRIME.hospitalMinutes;
      this.state.position={...BUILDINGS.find(b=>b.id==='clinic')!.door};this.state.pursuit=null;this.count('police-defeats');this.lastMessage=`Police took you down. Revived at the clinic; hospital bill $${bill}. Bank savings are safe.`;this.completionVersion++;
    }
    this.changed();return defeated;
  }
  disableDeveloperModifiers():Result{this.modifiers=defaultModifiers();this.changed();return{ok:true,message:'All temporary cheats disabled. Existing progression edits remain marked.'};}
  markDeveloper():void{this.state.developerModified=true;this.changed();}
  setModifier(name:keyof DeveloperModifiers,value:boolean|number):Result{
    if(name==='speed'){if(![1,2,3,5].includes(Number(value)))return{ok:false,message:'Choose 1×, 2×, 3× or 5×.'};this.modifiers.speed=value as 1|2|3|5;}
    else{if(typeof value!=='boolean')return{ok:false,message:'Use an on/off value.'};this.modifiers[name]=value;}
    if(value!==false&&value!==1)this.state.developerModified=true;
    if(this.modifiers.infiniteEnergy)this.state.energy=100;if(this.modifiers.infiniteHealth)this.state.health=100;
    this.changed();return{ok:true,message:'Temporary developer modifier updated. It resets on reload.'};
  }
  developer(action:string,value:unknown=0,skill?:Skill):Result{
    const s=this.state;
    if(action==='cash-add'&&integer(value,0,1e6))s.cash=Math.min(1e9,s.cash+value);
    else if(action==='cash-set'&&integer(value))s.cash=value;
    else if(action==='xp-add'&&integer(value,0,1e7))this.grantXP(value);
    else if(action==='level-set'&&integer(value,1,BALANCE.character.maxLevel)){s.level=value;s.xp=0;}
    else if(action==='skill-set'&&skill&&SKILLS.includes(skill)&&integer(value,1,BALANCE.skill.maxLevel)){s.skills[skill]=value;s.skillXP[skill]=0;}
    else if(action==='qualifications')s.qualifications=COURSES.map(c=>c.id);
    else if(action==='hour')s.minutes+=60;
    else if(action==='day')s.minutes=(Math.floor(s.minutes/1440)+1)*1440+480;
    else if(action==='restore'){s.energy=100;s.health=100;}
    else if(action==='skills-reset'){for(const k of SKILLS){s.skills[k]=1;s.skillXP[k]=0;}}
    else if(action==='missions-clear'){for(const[id,status]of Object.entries(s.missions))if(status==='active')delete s.missions[id];}
    else if(action==='missions-reset'){s.missions={};for(const m of MISSIONS){if(m.counter)s.counters[m.counter]=0;for(const o of m.objectives??[])if(o.kind==='counter')s.counters[o.key]=0;}s.contacts=[];s.visited=[];}
    else if(action==='careers'){s.qualifications=COURSES.map(c=>c.id);for(const job of JOBS){s.level=Math.max(s.level,job.requireLevel??1);for(const k of SKILLS)s.skills[k]=Math.max(s.skills[k],job.requireSkills?.[k]??1);}}
    else if(action==='clock-set'&&integer(value,0,1e9))s.minutes=value;
    else if(action==='pursuit-clear')s.pursuit=null;
    else return{ok:false,message:'Invalid developer value or no active activity. Use finite whole numbers in range.'};
    s.developerModified=true;this.changed();return{ok:true,message:'Developer change applied. This save is marked DEV-ALTERED.'};
  }
  exportSaveData():string{this.save();return JSON.stringify(this.state,null,2);}
  importSaveData(json:string):Result{
    try{
      if(json.length>250000)throw Error('too large');const value:unknown=JSON.parse(json);
      if(!validImport(value))return{ok:false,message:'Invalid save schema. Your current save was not changed.'};
      try{this.storage?.setItem(`${SAVE_KEY}.backup-before-import`,JSON.stringify(this.state));}catch{/* Import validation has already passed; storage warning remains visible. */}
      this.state=validateSave(value);if(record(value))this.settleLegacy(value);this.state.developerModified=true;this.completionVersion++;this.lastMessage='Imported save.';this.changed();return{ok:true,message:'Save imported safely and marked DEV-ALTERED. Temporary modifiers are unchanged.'};
    }catch{return{ok:false,message:'Invalid JSON save. Your current save was not changed.'};}
  }
}
