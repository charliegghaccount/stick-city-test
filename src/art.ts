import Phaser from 'phaser';
import type { Building } from './types';
import { WORLD } from './navigation';
import { drawBuilding, drawTree, drawBench, drawPlanter, cityLabel } from './art-assets';

export function paintCity(scene: Phaser.Scene, buildings: Building[]) {
  const g = scene.add.graphics().setDepth(0);
  const rect = (x:number,y:number,w:number,h:number,color:number,line?:number) => { g.fillStyle(color).fillRect(x,y,w,h); if (line !== undefined) g.lineStyle(2,line).strokeRect(x,y,w,h); };
  const tree=(x:number,y:number,r=19)=>drawTree(g,x,y,r);
  const bench=(x:number,y:number)=>drawBench(g,x,y);
  rect(0,0,WORLD.width,WORLD.height,0x7dca48);
  // Fine lawn pattern, deterministic and hand-drawn rather than a repeated raster.
  for(let y=15;y<WORLD.height;y+=23) for(let x=12;x<WORLD.width;x+=27) {const n=(x*7+y*11)%19;rect(x+n,y,3,2,0x6abb40);}
  for(let i=0;i<4;i++){
    const vx=350+i*400, hy=370+i*400;
    rect(vx,0,120,WORLD.height,0x626870);rect(0,hy,WORLD.width,120,0x626870);
  }
  for(let i=0;i<4;i++) {
    const vx=350+i*400,hy=370+i*400;
    for(let y=15;y<WORLD.height;y+=50) if(![370,770,1170,1570].some(r=>y>r-20&&y<r+130))rect(vx+59,y,3,25,0xf5f5f5);
    for(let x=15;x<WORLD.width;x+=50) if(![350,750,1150,1550].some(r=>x>r-20&&x<r+130))rect(x,hy+59,25,3,0xf5f5f5);
  }
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    const x=50+col*400,y=70+row*400;
    rect(x-3,y-3,306,306,0x373b37);rect(x,y,300,300,0xd6d8cc);
    // Square pavement slabs around every block, with dark outer curb.
    g.lineStyle(1,0xa6b1a8);
    for(let k=0;k<=300;k+=32){g.lineBetween(x+k,y,x+k,y+300);g.lineBetween(x,y+k,x+300,y+k);}
    rect(x+38,y+38,224,224,0x8bd258);
    // Curb lips and a pair of roadside lamps.
    rect(x+1,y+297,298,3,0xe6e2d4);rect(x+297,y+1,3,298,0x999d95);
    for(const [lx,ly] of [[x+16,y+284],[x+284,y+18]]){g.fillStyle(0x333a3a).fillCircle(lx,ly,4);rect(lx-2,ly-15,4,17,0x52565b);g.fillStyle(0xffeab1).fillCircle(lx,ly-16,5);}
    tree(x+45,y+275,15);tree(x+258,y+275,16);
    if((row+col)%2===0)bench(x+86,y+283);
    rect(x+269,y+272,11,16,0x4b9b72,0x2b6545);
    if((row+col)%3===0)drawPlanter(g,x+195,y+283);
  }
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    const x=350+col*400,y=370+row*400;
    // White zebra crossings on four approaches to each junction.
    for(let k=0;k<9;k++){rect(x+5+k*12,y-26,7,19,0xf1eee1);rect(x+5+k*12,y+127,7,19,0xf1eee1);rect(x-26,y+5+k*12,19,7,0xf1eee1);rect(x+127,y+5+k*12,19,7,0xf1eee1);}
    rect(x-10,y-10,6,15,0x30383b);rect(x-9,y-8,4,4,0xde6553);rect(x+125,y+116,6,15,0x30383b);rect(x+126,y+124,4,4,0x85cb61);
  }
  for(const b of buildings)drawBuilding(scene,g,b);
  // Street names are part of the map, not screen overlays.
  for(const [x,y,t] of [[660,430,'BIZAL AVENUE'],[1060,830,'MARKET STREET'],[660,1230,'PARK AVENUE']] as const)label(scene,x,y,t,0xbfc1b6,11);
  // The district is static: draw its thousands of slab/roof details once.
  // Reusing a single texture keeps walking smooth on mobile and software WebGL.
  g.generateTexture('city-art',WORLD.width,WORLD.height);
  scene.add.image(0,0,'city-art').setOrigin(0).setDepth(0);
  g.destroy();
}
const label=cityLabel;

export function makePerson(scene:Phaser.Scene,color:number,player=false){
  const c=scene.add.container(0,0).setDepth(10),g=scene.add.graphics();
  const shadow=scene.add.graphics().fillStyle(0x245431,.16).fillEllipse(2,7,23,12);c.add(shadow);
  const feet=[scene.add.graphics(),scene.add.graphics()];
  for(const f of feet)f.lineStyle(3,0x182c2c).lineBetween(0,-4,0,3);
  c.add(feet);c.setData('feet',feet);
  g.lineStyle(3,0x182c2c).lineBetween(-7,-1,-13,2).lineBetween(7,-1,13,2);
  g.fillStyle(player?0x5652ed:color).fillCircle(0,-3,10);g.lineStyle(2,0x172e31).strokeCircle(0,-3,10);
  g.fillStyle(0xffffff,.55).fillEllipse(-3,-7,5,3);g.fillStyle(0x163139).fillCircle(-3,-3,1.1).fillCircle(3,-3,1.1);
  c.add(g);
  if(player)c.add(scene.add.triangle(0,-28,0,0,10,0,5,8,0xffdf5c).setStrokeStyle(2,0x77643b));
  animatePerson(c,0,false);return c;
}
export function animatePerson(person:Phaser.GameObjects.Container,time:number,moving:boolean){
  const feet=person.getData('feet') as Phaser.GameObjects.Graphics[]|undefined;if(!feet)return;
  const step=moving?Math.sin(time*.016)*3:0;
  feet[0].setPosition(-5,8+step);feet[1].setPosition(5,8-step);person.rotation=moving?Math.sin(time*.016)*.035:0;
}
export function makeCar(scene:Phaser.Scene,color:number){
  const c=scene.add.container(0,0).setDepth(6),g=scene.add.graphics();
  g.fillStyle(0x243d35,.17).fillRoundedRect(-12,-28,29,61,5);
  g.fillStyle(0x19282c);for(const y of [-18,14]){g.fillRoundedRect(-17,y,5,12,1);g.fillRoundedRect(12,y,5,12,1);}
  g.fillStyle(color).fillRoundedRect(-13,-30,26,60,5);g.lineStyle(2,0x20353b).strokeRoundedRect(-13,-30,26,60,5);
  g.fillStyle(0x253d48).fillRoundedRect(-10,-19,20,13,2);g.fillStyle(0x72d8ed).fillRect(-8,-17,16,7);
  g.fillStyle(0xd5f9ff).fillRect(-7,-17,3,6);g.fillStyle(0x294451).fillRect(-10,15,20,8);g.fillStyle(0x7cbed2).fillRect(-8,17,16,4);
  g.fillStyle(Phaser.Display.Color.ValueToColor(color).lighten(18).color).fillRoundedRect(-9,-2,18,16,2);g.lineStyle(1,Phaser.Display.Color.ValueToColor(color).darken(20).color).strokeRoundedRect(-9,-2,18,16,2);
  g.lineStyle(1,0x20353b).lineBetween(-12,-4,-12,13).lineBetween(12,-4,12,13);
  g.fillStyle(0xf5f8d1).fillRect(-10,-29,6,4).fillRect(4,-29,6,4);g.fillStyle(0xe94346).fillRect(-10,25,6,3).fillRect(4,25,6,3);
  g.fillStyle(0xe7e8dc).fillRect(-7,-32,14,2).fillRect(-7,30,14,2);g.fillStyle(0x263b40).fillRect(-17,-6,4,4).fillRect(13,-6,4,4);
  c.add(g);return c;
}

export function makeOfficer(scene:Phaser.Scene){
 const person=makePerson(scene,0x4f87cf),g=scene.add.graphics();
 g.fillStyle(0x234c91).fillRect(-9,-14,18,6);g.lineStyle(1,0x172e48).strokeRect(-9,-14,18,6);g.fillStyle(0xffd85b).fillCircle(0,-11,2);
 person.add(g);person.setDepth(13);return person;
}
