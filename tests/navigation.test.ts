import { describe, expect, it } from 'vitest';
import { BUILDINGS } from '../src/content';
import { blocked, findPath } from '../src/navigation';
describe('walkable city routes',()=>{
  it('can reach all 16 entrances without entering a solid building',()=>{
    const start=BUILDINGS[0].door;
    for(const building of BUILDINGS){
      const path=findPath(start,building.door,BUILDINGS);
      expect(path.length,building.id).toBeGreaterThan(0);
      expect(path.at(-1)).toEqual(building.door);
      for(const point of path)expect(blocked(point.x,point.y,BUILDINGS),`${building.id}: ${JSON.stringify(point)}`).toBe(false);
      // Sample every segment, catching diagonal corner cuts between grid cells.
      for(let n=1;n<path.length;n++)for(let t=0;t<=1;t+=.2){
        const a=path[n-1],b=path[n];
        expect(blocked(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,BUILDINGS)).toBe(false);
      }
    }
  });
  it('refuses a destination inside a building and outside the map',()=>{
    expect(findPath(BUILDINGS[0].door,{x:150,y:150},BUILDINGS)).toEqual([]);
    expect(blocked(-1,400,BUILDINGS)).toBe(true);
  });
  it('lets players walk through the park, while offices remain solid',()=>{
    const park=BUILDINGS.find(b=>b.id==='park')!,office=BUILDINGS.find(b=>b.id==='office')!;
    expect(blocked(park.x+100,park.y+100,BUILDINGS)).toBe(false);
    expect(blocked(office.x+100,office.y+100,BUILDINGS)).toBe(true);
  });
});
