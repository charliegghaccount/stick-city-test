import {describe,it,expect} from 'vitest';
import {PursuitSimulation,lineOfSight} from '../src/pursuit';
import {BUILDINGS} from '../src/content';
import {blocked} from '../src/navigation';

describe('police chase simulation',()=>{
 it('spawns on walkable terrain, pursues and can hit a stationary player',()=>{
  const player={x:602.5,y:336},sim=new PursuitSimulation(player,BUILDINGS);let hits=0;
  for(let i=0;i<300;i++){hits+=sim.step(1/30,player);for(const cop of sim.officers)expect(blocked(cop.x,cop.y,BUILDINGS)).toBe(false);}
  expect(sim.shots).toBeGreaterThan(0);expect(hits).toBeGreaterThan(0);
 });
 it('does not shoot through buildings',()=>{
  expect(lineOfSight({x:60,y:200},{x:350,y:200},BUILDINGS)).toBe(false);expect(lineOfSight({x:380,y:430},{x:700,y:430},BUILDINGS)).toBe(true);
 });
 it('lets movement and cover change the pursuit rather than dealing automatic timer damage',()=>{
  const sim=new PursuitSimulation({x:410,y:430},BUILDINGS);let hits=0;
  for(let i=0;i<180;i++)hits+=sim.step(1/30,{x:410+Math.min(500,i*4),y:430});
  expect(sim.shots).toBeGreaterThan(0);expect(hits).toBeLessThan(10);
 });
 it('does not advance while not stepped and ignores invalid durations',()=>{
  const sim=new PursuitSimulation({x:410,y:430},BUILDINGS),before=structuredClone(sim.officers);sim.step(NaN,{x:410,y:430});sim.step(-1,{x:410,y:430});expect(sim.officers).toEqual(before);expect(sim.bullets).toEqual([]);
 });
});
