import { CRIME } from './crime';
import { blocked,findPath,WORLD } from './navigation';
import type { Building,Position } from './types';
export interface PoliceOfficer extends Position { path:Position[]; rethink:number; fire:number; }
export interface PoliceBullet extends Position { vx:number; vy:number; life:number; }
export function lineOfSight(a:Position,b:Position,buildings:Building[]):boolean{
 const steps=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/8));
 for(let i=0;i<=steps;i++){const t=i/steps;if(blocked(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,buildings))return false;}return true;
}
function safeSpawn(target:Position,buildings:Building[]):Position{
 let best=Infinity,result={x:202.5,y:336};
 for(let y=30;y<WORLD.height-20;y+=20)for(let x=30;x<WORLD.width-20;x+=20){const d=(x-target.x)**2+(y-target.y)**2;if(d<best&&!blocked(x,y,buildings)){best=d;result={x,y};}}
 return result;
}
/** Small targeted chase simulation, independent from the economic game clock. */
export class PursuitSimulation {
 officers:PoliceOfficer[];
 bullets:PoliceBullet[]=[];
 shots=0;
 constructor(player:Position,private buildings:Building[]){
  this.officers=[Math.PI/4,Math.PI*1.25].map((angle,i)=>({...safeSpawn({x:player.x+Math.cos(angle)*115,y:player.y+Math.sin(angle)*115},buildings),path:[],rethink:0,fire:.5+i*.25}));
 }
 step(seconds:number,player:Position):number{
  if(!Number.isFinite(seconds)||seconds<=0)return 0;
  let remaining=Math.min(seconds,1),hits=0;
  while(remaining>1e-8){const dt=Math.min(remaining,1/30);hits+=this.substep(dt,player);remaining-=dt;}
  return hits;
 }
 private substep(dt:number,player:Position):number{
  for(const officer of this.officers){
   const distance=Math.hypot(player.x-officer.x,player.y-officer.y);officer.rethink-=dt;officer.fire=Math.max(0,officer.fire-dt);
   if(officer.rethink<=0){officer.rethink=.55;officer.path=distance>65?findPath(officer,player,this.buildings):[];}
   let travel=CRIME.policeSpeed*dt;
   while(officer.path.length&&travel>0){
    const next=officer.path[0],d=Math.hypot(next.x-officer.x,next.y-officer.y);
    if(d<.1){officer.path.shift();continue;}
    const step=Math.min(travel,d),x=officer.x+(next.x-officer.x)/d*step,y=officer.y+(next.y-officer.y)/d*step;
    if(blocked(x,y,this.buildings)){officer.path=[];break;}
    officer.x=x;officer.y=y;travel-=step;if(step===d)officer.path.shift();
   }
   if(officer.fire===0&&distance<170&&distance>0&&lineOfSight(officer,player,this.buildings)){
    const d=Math.hypot(player.x-officer.x,player.y-officer.y)||1;
    this.bullets.push({x:officer.x,y:officer.y,vx:(player.x-officer.x)/d*CRIME.bulletSpeed,vy:(player.y-officer.y)/d*CRIME.bulletSpeed,life:.9});officer.fire=CRIME.shotInterval;this.shots++;
   }
  }
  let hits=0;
  this.bullets=this.bullets.filter(b=>{
   const x=b.x+b.vx*dt,y=b.y+b.vy*dt;b.life-=dt;
   if(b.life<=0||!lineOfSight(b,{x,y},this.buildings))return false;
   const dx=x-b.x,dy=y-b.y,t=Math.max(0,Math.min(1,((player.x-b.x)*dx+(player.y-b.y)*dy)/(dx*dx+dy*dy||1)));
   if(Math.hypot(b.x+dx*t-player.x,b.y+dy*t-player.y)<11){hits++;return false;}
   b.x=x;b.y=y;return true;
  });return hits;
 }
}
