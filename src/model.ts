import { ACTIVITIES, BUILDINGS, ITEMS, MISSIONS } from './content';
import { BALANCE, levelXP, skillXP } from './balance';
import { COURSES, qualificationName } from './careers';
import { SKILLS, type Activity, type DeveloperModifiers, type PlayerState, type Result, type Skill } from './types';

// Keep the original key so existing players continue automatically.
export const SAVE_KEY = 'stick-city-v1';
export const V1_BACKUP_KEY = `${SAVE_KEY}.backup-pre-v2`;
type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const defaultModifiers = (): DeveloperModifiers => ({ infiniteEnergy:false, infiniteHealth:false, speed:1, noclip:false, paused:false });
export const freshState = (): PlayerState => ({
  version:2, position:{x:202.5,y:336}, cash:120, bank:0, energy:100, health:100,
  level:1, xp:0, minutes:480, skills:{efficiency:1,charm:1,intelligence:1,strength:1},
  skillXP:{efficiency:0,charm:0,intelligence:0,strength:0}, qualifications:[],
  developerModified:false, playSeconds:0, pending:null, inventory:{}, missions:{}, counters:{}, visited:[],
});
const finite = (v:unknown,fallback:number,min=0,max=1e9):number => typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback;
const record = (v:unknown):v is Record<string,unknown> => !!v&&typeof v==='object'&&!Array.isArray(v);
const safeKey = (k:string) => /^[a-z][a-z0-9-]*$/i.test(k)&&!['constructor','prototype','__proto__'].includes(k);
const integer = (v:unknown,min=0,max=1e9):v is number => typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;

/** Repair ordinary local saves and migrate V1 without erasing earned levels or assets. */
export function validateSave(value:unknown):PlayerState {
  const s=freshState();
  if(!record(value)||(value.version!==1&&value.version!==2))return s;
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
  if(value.version===2&&record(value.skills))for(const k of SKILLS)s.skills[k]=Math.floor(finite(value.skills[k],1,1,9999));
  if(value.version===2&&record(value.skillXP))for(const k of SKILLS){
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
  if(record(value.pending)){
    const p=value.pending, validKind=p.kind==='activity'||p.kind==='work'||p.kind==='pickpocket';
    if(validKind&&typeof p.id==='string'&&(p.kind!=='activity'||ACTIVITIES.some(a=>a.id===p.id))&&typeof p.remainingSeconds==='number'&&Number.isFinite(p.remainingSeconds)&&p.remainingSeconds>=0&&typeof p.totalSeconds==='number'&&Number.isFinite(p.totalSeconds)&&p.totalSeconds>0&&p.remainingSeconds<=p.totalSeconds&&p.totalSeconds<=1e6){
      s.pending={kind:p.kind as 'activity'|'work'|'pickpocket',id:p.id,remainingSeconds:p.remainingSeconds,totalSeconds:p.totalSeconds,accuracy:finite(p.accuracy,0,0,1)};
    }
  }
  return s;
}

/** Imports are stricter than local repair: reject invalid data before touching the save. */
export function validImport(v:unknown):boolean {
  if(!record(v)||(v.version!==1&&v.version!==2)||!record(v.position)||!record(v.skills)||!record(v.inventory)||!record(v.missions)||!record(v.counters)||!Array.isArray(v.visited))return false;
  if(!integer(v.cash)||!integer(v.bank)||!integer(v.level,1,10000)||!integer(v.xp)||!integer(v.minutes))return false;
  if(typeof v.energy!=='number'||!Number.isFinite(v.energy)||v.energy<0||v.energy>100||typeof v.health!=='number'||!Number.isFinite(v.health)||v.health<1||v.health>100)return false;
  if(typeof v.position.x!=='number'||!Number.isFinite(v.position.x)||v.position.x<0||v.position.x>1680||typeof v.position.y!=='number'||!Number.isFinite(v.position.y)||v.position.y<0||v.position.y>1760)return false;
  if(!SKILLS.every(k=>integer((v.skills as Record<string,unknown>)[k],1,9999)))return false;
  if(!Object.entries(v.inventory).every(([k,n])=>Object.hasOwn(ITEMS,k)&&integer(n,0,9999)))return false;
  if(!Object.entries(v.counters).every(([k,n])=>safeKey(k)&&integer(n)))return false;
  if(!Object.entries(v.missions).every(([k,n])=>MISSIONS.some(m=>m.id===k)&&(n==='active'||n==='complete')))return false;
  if(!v.visited.every(id=>typeof id==='string'&&BUILDINGS.some(b=>b.id===id)))return false;
  if(v.version===2){
    if(!record(v.skillXP)||!SKILLS.every(k=>integer((v.skillXP as Record<string,unknown>)[k]))||!Array.isArray(v.qualifications)||!v.qualifications.every(id=>COURSES.some(c=>c.id===id))||typeof v.developerModified!=='boolean'||typeof v.playSeconds!=='number'||!Number.isFinite(v.playSeconds)||v.playSeconds<0)return false;
    if(v.pending!==null){
      if(!record(v.pending))return false;
      const p=v.pending;
      if(!['activity','work','pickpocket'].includes(String(p.kind))||typeof p.id!=='string'||(p.kind==='activity'&&!ACTIVITIES.some(a=>a.id===p.id))||typeof p.remainingSeconds!=='number'||!Number.isFinite(p.remainingSeconds)||typeof p.totalSeconds!=='number'||!Number.isFinite(p.totalSeconds)||p.totalSeconds<=0||p.totalSeconds>1e6||p.remainingSeconds<0||p.remainingSeconds>p.totalSeconds)return false;
      if(p.kind!=='activity'&&(p.id!==p.kind||typeof p.accuracy!=='number'||!Number.isFinite(p.accuracy)||p.accuracy<0||p.accuracy>1))return false;
    }
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
        if(record(parsed)&&parsed.version===1){
          try{if(!this.storage?.getItem(V1_BACKUP_KEY))this.storage?.setItem(V1_BACKUP_KEY,raw);}
          catch{this.storageAvailable=false;} // A full backup quota must never discard a readable V1 save.
        }
      }
    }catch{this.storageAvailable=false;}
  }
  subscribe(fn:(s:PlayerState)=>void):()=>void{this.listeners.add(fn);fn(this.state);return()=>this.listeners.delete(fn);}
  save():void{try{this.storage?.setItem(SAVE_KEY,JSON.stringify(this.state));this.storageAvailable=!!this.storage;}catch{this.storageAvailable=false;}}
  private changed(persist=true):void{if(persist)this.save();for(const fn of this.listeners)fn(this.state);}
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
    this.state.skillXP[skill]+=Math.floor(amount*BALANCE.multipliers.skillXP);
    while(this.state.skills[skill]<BALANCE.skill.maxLevel&&this.state.skillXP[skill]>=skillXP(this.state.skills[skill])){this.state.skillXP[skill]-=skillXP(this.state.skills[skill]);this.state.skills[skill]++;}
    this.state.skillXP[skill]=Math.min(this.state.skillXP[skill],skillXP(this.state.skills[skill])-1);
  }
  private count(key:string):void{this.state.counters[key]=(this.state.counters[key]??0)+1;}
  quoteActivity(activity:Activity):Activity & {seconds:number}{
    const scale=activity.training&&activity.skill?1+(this.state.skills[activity.skill]-1)*BALANCE.trainingIncreasePerLevel:1;
    const minutes=Math.ceil(activity.minutes*scale);
    return {...activity,minutes,cash:activity.cash&&activity.cash<0?-Math.ceil(-activity.cash*scale):activity.cash,
      xp:Math.floor((activity.xp??0)*BALANCE.multipliers.characterXP),seconds:activity.seconds??Math.max(1.5,minutes*BALANCE.secondsPerGameMinute)};
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
    if(this.state.pending)return{ok:false,message:'Finish your current activity first. Its timer is shown below.'};
    if(source.qualification&&this.state.qualifications.includes(source.qualification))return{ok:false,message:'You already hold this qualification.'};
    const missing=this.requirements(source).filter(r=>!r.met);if(missing.length)return{ok:false,message:`Requires: ${missing.map(r=>r.text).join(', ')}.`};
    const a=this.quoteActivity(source),s=this.state;
    if(s.cash+(a.cash??0)<0)return{ok:false,message:'You do not have enough cash.'};
    if(!this.modifiers.infiniteEnergy&&s.energy+(a.energy??0)<0)return{ok:false,message:'Not enough energy. Eat, rest in the park, or sleep at home.'};
    if((a.cash??0)<0)s.cash+=a.cash!;
    if((a.energy??0)<0&&!this.modifiers.infiniteEnergy)s.energy+=a.energy!;
    s.pending={kind:'activity',id,remainingSeconds:a.seconds,totalSeconds:a.seconds};
    this.changed();return{ok:true,message:`Started ${a.label.toLowerCase()}. ${Math.ceil(a.seconds)} seconds of active play; costs reserved now, rewards on completion.`};
  }
  /** Only the active scene calls this. No wall-clock/offline completion or clock-setting shortcut. */
  advanceRealTime(seconds:number):void{
    if(!Number.isFinite(seconds)||seconds<=0)return;
    this.state.playSeconds+=Math.min(seconds,1e6);
    this.notifyElapsed+=seconds;this.saveElapsed+=seconds;
    if(this.state.pending){
      this.state.pending.remainingSeconds=Math.max(0,this.state.pending.remainingSeconds-seconds);
      if(this.state.pending.remainingSeconds===0){this.completeActivity();this.changed();return;}
    }
    if(this.notifyElapsed>=.25){this.notifyElapsed=0;const persist=this.saveElapsed>=1;if(persist)this.saveElapsed=0;this.changed(persist);}
  }
  private completeActivity():void{
    const p=this.state.pending;if(!p)return;this.state.pending=null;
    if(p.kind==='activity'){
      const source=ACTIVITIES.find(a=>a.id===p.id);if(!source)return;
      const a=this.quoteActivity(source),s=this.state;
      if((a.cash??0)>0)s.cash+=a.cash!;
      if((a.energy??0)>0)s.energy=Math.min(100,s.energy+a.energy!);
      if((a.health??0)>0)s.health=Math.min(100,s.health+a.health!);
      s.minutes+=a.minutes;
      if(a.skill)this.gainSkill(a.skill,a.skillXP??0);
      if(a.item)s.inventory[a.item]=(s.inventory[a.item]??0)+1;
      if(a.counter)this.count(a.counter);
      if(a.qualification&&!s.qualifications.includes(a.qualification))s.qualifications.push(a.qualification);
      this.grantXP(a.xp??0);
      this.lastMessage=`${a.label} complete.${(a.cash??0)>0?` Earned $${a.cash}.`:''}${a.xp?` +${a.xp} XP.`:''}${a.skill?` +${a.skillXP??0} ${a.skill} XP.`:''}${a.qualification?' Qualification earned!':''}${a.item?' Added to your bag.':''}`;
    }else this.completeTiming(p.kind,p.accuracy??0);
    if(this.modifiers.infiniteEnergy)this.state.energy=100;
    if(this.modifiers.infiniteHealth)this.state.health=100;
    this.completionVersion++;
  }
  deposit(amount:number):Result{return this.transfer(amount,'deposit');}
  withdraw(amount:number):Result{return this.transfer(amount,'withdraw');}
  private transfer(amount:number,direction:'deposit'|'withdraw'):Result{
    if(!integer(amount,1))return{ok:false,message:'Enter a positive whole dollar amount.'};
    const from=direction==='deposit'?'cash':'bank',to=direction==='deposit'?'bank':'cash';
    if(this.state[from]<amount)return{ok:false,message:`Not enough ${from==='cash'?'cash':'money in the bank'}.`};
    this.state[from]-=amount;this.state[to]+=amount;this.changed();return{ok:true,message:`${direction==='deposit'?'Deposited':'Withdrew'} $${amount}.`};
  }
  useItem(id:string):Result{
    if(!Object.hasOwn(ITEMS,id)||!(this.state.inventory[id]>0))return{ok:false,message:'That item is not in your bag.'};
    const item=ITEMS[id];this.state.inventory[id]--;this.state.energy=Math.min(100,this.state.energy+(item.energy??0));this.state.health=Math.min(100,this.state.health+(item.health??0));this.changed();
    return{ok:true,message:`Used ${item.name.toLowerCase()}. +${item.energy??0} energy, +${item.health??0} health.`};
  }
  acceptMission(id:string):Result{
    const m=MISSIONS.find(m=>m.id===id);if(!m)return{ok:false,message:'Mission unavailable.'};if(this.state.missions[id])return{ok:false,message:'You already accepted this mission.'};
    if(m.prerequisite&&this.state.missions[m.prerequisite]!=='complete')return{ok:false,message:'Finish the previous mission first.'};
    this.state.missions[id]='active';this.changed();return{ok:true,message:`Mission accepted: ${m.title}.`};
  }
  missionProgress(id:string):number{const m=MISSIONS.find(m=>m.id===id);return m?Math.min(m.target,m.counter?(this.state.counters[m.counter]??0):this.state.visited.length):0;}
  claimMission(id:string):Result{
    const m=MISSIONS.find(m=>m.id===id);if(!m||this.state.missions[id]!=='active')return{ok:false,message:'Accept this mission first.'};
    if(this.missionProgress(id)<m.target)return{ok:false,message:'Your objective is not finished yet.'};
    this.state.missions[id]='complete';this.state.cash+=m.reward;this.grantXP(m.xp);this.changed();return{ok:true,message:`Mission complete! +$${m.reward} and ${m.xp} XP.`};
  }
  finishTiming(mode:'work'|'pickpocket',accuracy:number):Result{
    if(!Number.isFinite(accuracy)||this.state.pending)return{ok:false,message:'Finish your current activity before another challenge.'};
    const c=BALANCE.timing;if(!this.modifiers.infiniteEnergy&&this.state.energy<c.energy)return{ok:false,message:`You need ${c.energy} energy.`};
    if(!this.modifiers.infiniteEnergy)this.state.energy-=c.energy;
    const seconds=c.minutes*BALANCE.secondsPerGameMinute;
    this.state.pending={kind:mode,id:mode,accuracy:Math.max(0,Math.min(1,accuracy)),remainingSeconds:seconds,totalSeconds:seconds};this.changed();
    return{ok:true,message:`Timing recorded. ${Math.ceil(seconds)} seconds to finish; rewards and risks resolve once.`};
  }
  private completeTiming(mode:'work'|'pickpocket',score:number):void{
    const c=BALANCE.timing,s=this.state;s.minutes+=c.minutes;
    if(mode==='work'){
      const pay=Math.round(c.minPay+score*(c.maxPay-c.minPay));s.cash+=pay;this.count('sorting-rounds');this.count('shifts');this.grantXP(c.xp);this.gainSkill('efficiency',c.skillXP);
      this.lastMessage=`${Math.round(score*100)}% accuracy. Sorting paid $${pay}, +${c.xp} XP and +${c.skillXP} efficiency XP.`;return;
    }
    const chance=score<.55?0:Math.min(.92,.3+score*.45+s.skills.charm*.01);
    if(this.random()<chance){const pay=c.crimeMin+Math.floor(this.random()*c.crimeRange);s.cash+=pay;this.count('pickpockets');this.grantXP(c.crimeXP);this.lastMessage=`Lifted $${pay}. +${c.crimeXP} XP.`;}
    else{const fine=Math.min(s.cash,c.fine);s.cash-=fine;if(!this.modifiers.infiniteHealth)s.health=Math.max(1,s.health-c.injury);this.count('caught');this.lastMessage=`Caught! Paid $${fine} and ${this.modifiers.infiniteHealth?0:c.injury} health lost.`;}
  }
  spinSlots(bet:number):{ok:boolean;message:string;reels:string[];payout:number}{
    const fail=(message:string)=>({ok:false,message,reels:['?','?','?'],payout:0});
    if(this.state.pending)return fail('Finish your current activity first.');
    const c=BALANCE.slots;if(!integer(bet,c.minBet,c.maxBet))return fail(`Choose a whole-dollar bet from $${c.minBet} to $${c.maxBet}.`);
    if(this.state.cash<bet)return fail('Not enough cash for that bet.');
    const symbols=['🍒','🍋','🔔','⭐','7'],reels=Array.from({length:3},()=>symbols[Math.min(4,Math.max(0,Math.floor(this.random()*5)))]),unique=new Set(reels).size;
    const multiplier=unique===1?(reels[0]==='7'?c.sevens:c.triple):unique===2?c.pair:0,payout=bet*multiplier;
    this.state.cash+=payout-bet;this.state.minutes+=c.minutes;this.count('slot-spins');this.changed();
    return{ok:true,reels,payout,message:multiplier>1?`${multiplier}× payout: $${payout}.`:multiplier===1?`Pair! Your $${bet} bet is returned.`:`No match. Lost $${bet}.`};
  }
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
    else if(action==='finish'&&s.pending){s.developerModified=true;this.advanceRealTime(s.pending.remainingSeconds+0.001);}
    else return{ok:false,message:'Invalid developer value or no active activity. Use finite whole numbers in range.'};
    s.developerModified=true;this.changed();return{ok:true,message:'Developer change applied. This save is marked DEV-ALTERED.'};
  }
  exportSaveData():string{this.save();return JSON.stringify(this.state,null,2);}
  importSaveData(json:string):Result{
    try{
      if(json.length>250000)throw Error('too large');const value:unknown=JSON.parse(json);
      if(!validImport(value))return{ok:false,message:'Invalid save schema. Your current save was not changed.'};
      try{this.storage?.setItem(`${SAVE_KEY}.backup-before-import`,JSON.stringify(this.state));}catch{/* Import validation has already passed; storage warning remains visible. */}
      this.state=validateSave(value);this.state.developerModified=true;this.completionVersion++;this.lastMessage='Imported save.';this.changed();return{ok:true,message:'Save imported safely and marked DEV-ALTERED. Temporary modifiers are unchanged.'};
    }catch{return{ok:false,message:'Invalid JSON save. Your current save was not changed.'};}
  }
}
