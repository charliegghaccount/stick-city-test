/** Deterministic lane following, independent of Phaser so spacing can be tested. */
export interface RoadPoint { x:number; y:number }
export interface TrafficCar extends RoadPoint { id:number; lane:number; distance:number; speed:number; cruise:number; rotation:number }
interface Lane { points:RoadPoint[]; lengths:number[]; total:number }
export const TRAFFIC = { length:64, width:34, gap:98, acceleration:18, braking:55, padding:5 } as const;
function lane(x1:number,y1:number,x2:number,y2:number,reverse=false,r=32):Lane {
  const points:RoadPoint[]=[];
  for(const [cx,cy,start]of [[x2-r,y1+r,-Math.PI/2],[x2-r,y2-r,0],[x1+r,y2-r,Math.PI/2],[x1+r,y1+r,Math.PI]]){
    for(let i=0;i<=12;i++){const angle=start+i*Math.PI/24;points.push({x:cx+Math.cos(angle)*r,y:cy+Math.sin(angle)*r});}
  }
  if(reverse)points.reverse();
  const lengths=points.map((p,i)=>Math.hypot(points[(i+1)%points.length].x-p.x,points[(i+1)%points.length].y-p.y));
  return{points,lengths,total:lengths.reduce((a,b)=>a+b,0)};
}
// Existing V1 boulevards; separated lanes and rounded corners need no map rebuild.
export const LANES=[lane(440,460,1180,1200,false,14),lane(380,400,1240,1260,true)];
export function lanePosition(index:number,distance:number):RoadPoint&{rotation:number}{
  const l=LANES[index];let d=((distance%l.total)+l.total)%l.total;
  for(let i=0;i<l.points.length;i++){
    if(d<=l.lengths[i]){const a=l.points[i],b=l.points[(i+1)%l.points.length],t=l.lengths[i]?d/l.lengths[i]:0;return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,rotation:Math.atan2(b.y-a.y,b.x-a.x)+Math.PI/2};}
    d-=l.lengths[i];
  }
  return{...l.points[0],rotation:0};
}
export function trafficBounds(car:Pick<TrafficCar,'x'|'y'|'rotation'>,padding=0){
  const a=car.rotation,c=Math.abs(Math.cos(a)),s=Math.abs(Math.sin(a));
  return{x:car.x,y:car.y,hw:(TRAFFIC.width*c+TRAFFIC.length*s)/2+padding,hh:(TRAFFIC.length*c+TRAFFIC.width*s)/2+padding};
}
export function trafficOverlap(a:Pick<TrafficCar,'x'|'y'|'rotation'>,b:Pick<TrafficCar,'x'|'y'|'rotation'>,padding=0):boolean{
  // Oriented-box separating axes avoid false corner conflicts and traffic deadlocks.
  const axes=(r:number)=>[{x:Math.cos(r),y:Math.sin(r)},{x:-Math.sin(r),y:Math.cos(r)}];
  const aa=axes(a.rotation),bb=axes(b.rotation),dx=b.x-a.x,dy=b.y-a.y;
  const dot=(u:{x:number;y:number},v:{x:number;y:number})=>u.x*v.x+u.y*v.y;
  for(const axis of [...aa,...bb]){
    const ar=TRAFFIC.width/2*Math.abs(dot(axis,aa[0]))+TRAFFIC.length/2*Math.abs(dot(axis,aa[1]))+padding;
    const br=TRAFFIC.width/2*Math.abs(dot(axis,bb[0]))+TRAFFIC.length/2*Math.abs(dot(axis,bb[1]))+padding;
    if(Math.abs(dx*axis.x+dy*axis.y)>=ar+br)return false;
  }
  return true;
}

export class TrafficSimulation {
  cars:TrafficCar[];
  constructor(count=8){
    this.cars=Array.from({length:count},(_,i)=>{
      const lane=i%2,n=Math.ceil(count/2),distance=Math.floor(i/2)*LANES[lane].total/n+(lane?140:0);
      return{id:i,lane,distance,speed:35,cruise:42+(i%3)*6,...lanePosition(lane,distance)};
    });
  }
  step(seconds:number):void{
    if(!Number.isFinite(seconds)||seconds<=0)return;
    let remaining=Math.min(seconds,1);
    while(remaining>1e-8){const dt=Math.min(remaining,1/30);this.substep(dt);remaining-=dt;}
  }
  private substep(dt:number):void{
    for(const car of this.cars){
      const l=LANES[car.lane];let gap=l.total;
      for(const other of this.cars)if(other.id!==car.id&&other.lane===car.lane){const ahead=(other.distance-car.distance+l.total)%l.total;if(ahead<gap)gap=ahead;}
      const clearance=Math.max(0,gap-TRAFFIC.gap);
      let target=Math.min(car.cruise,Math.sqrt(2*TRAFFIC.braking*clearance));
      const look={...car,...lanePosition(car.lane,car.distance+Math.max(20,car.speed*.8))};
      if(this.cars.some(other=>other.id!==car.id&&trafficOverlap(look,other,TRAFFIC.padding)))target=0;
      const speed=car.speed<target?Math.min(target,car.speed+TRAFFIC.acceleration*dt):Math.max(target,car.speed-TRAFFIC.braking*dt);
      const travel=Math.min(speed*dt,clearance),distance=(car.distance+travel)%l.total;
      const candidate={...car,distance,...lanePosition(car.lane,distance)};
      if(!this.cars.some(other=>other.id!==car.id&&trafficOverlap(candidate,other,TRAFFIC.padding))){Object.assign(car,candidate);car.speed=speed;}
      else car.speed=Math.max(0,car.speed-TRAFFIC.braking*dt);
    }
  }
}
