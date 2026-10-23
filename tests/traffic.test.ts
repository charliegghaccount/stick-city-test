import { describe,expect,it } from 'vitest';
import { TrafficSimulation, LANES, lanePosition, trafficOverlap, TRAFFIC, trafficBounds } from '../src/traffic';
import { BUILDINGS } from '../src/content';

describe('traffic spacing and road constraints',()=>{
 it('runs several complete loops without sprite overlap or building collisions',()=>{
  const sim=new TrafficSimulation();const distances=sim.cars.map(()=>0);
  for(let frame=0;frame<6000;frame++){
    const before=sim.cars.map(c=>c.distance);sim.step(.1);
    sim.cars.forEach((c,i)=>{const total=LANES[c.lane].total;distances[i]+=(c.distance-before[i]+total)%total;});
    for(let i=0;i<sim.cars.length;i++){
      const a=sim.cars[i],bounds=trafficBounds(a);
      for(let j=i+1;j<sim.cars.length;j++)if(trafficOverlap(a,sim.cars[j]))throw Error(`Traffic overlap at frame ${frame}: ${i}/${j}`);
      for(const b of BUILDINGS.filter(b=>b.kind!=='park'))if(Math.abs(a.x-(b.x+b.w/2))<bounds.hw+b.w/2&&Math.abs(a.y-(b.y+b.h/2))<bounds.hh+b.h/2)throw Error(`Car ${a.id} intersects ${b.id} at frame ${frame}`);
    }
  }
  for(const car of sim.cars)expect(distances[car.id]).toBeGreaterThan(LANES[car.lane].total*3);
 });
 it('slows a faster follower, preserves its gap and resumes after a stopped leader moves',()=>{
  const sim=new TrafficSimulation(4),leader=sim.cars[0],follower=sim.cars[2];
  leader.distance=500;leader.speed=0;leader.cruise=0;Object.assign(leader,lanePosition(0,leader.distance));
  follower.distance=350;follower.speed=54;follower.cruise=54;Object.assign(follower,lanePosition(0,follower.distance));
  for(let i=0;i<150;i++)sim.step(.1);
  expect(follower.speed).toBeLessThan(1);expect((leader.distance-follower.distance+LANES[0].total)%LANES[0].total).toBeGreaterThanOrEqual(TRAFFIC.gap-.01);
  leader.cruise=42;for(let i=0;i<100;i++)sim.step(.1);expect(follower.speed).toBeGreaterThan(10);expect(trafficOverlap(leader,follower)).toBe(false);
 });
 it('pauses naturally when not stepped and handles long frames with bounded substeps',()=>{
  const sim=new TrafficSimulation(),before=structuredClone(sim.cars);expect(sim.cars).toEqual(before);
  sim.step(NaN);sim.step(-1);expect(sim.cars).toEqual(before);sim.step(10);
  expect(Math.hypot(sim.cars[0].x-before[0].x,sim.cars[0].y-before[0].y)).toBeLessThan(60);
 });
});
