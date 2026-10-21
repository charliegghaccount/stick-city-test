import Phaser from 'phaser';
import type { Building } from './types';
import { WORLD } from './navigation';

export function paintCity(scene: Phaser.Scene, buildings: Building[]) {
  const g = scene.add.graphics().setDepth(0);
  const rect = (x:number,y:number,w:number,h:number,color:number,line?:number) => { g.fillStyle(color).fillRect(x,y,w,h); if (line !== undefined) g.lineStyle(2,line).strokeRect(x,y,w,h); };
  const tree = (x:number,y:number,r=19) => { g.fillStyle(0x264321,.18).fillEllipse(x+7,y+7,r*2,r*2); g.fillStyle(0x4b7929).fillCircle(x,y,r); g.lineStyle(2,0x315c24).strokeCircle(x,y,r); g.fillStyle(0x70b638).fillCircle(x-5,y-5,r-5); g.fillStyle(0x91c949).fillCircle(x-8,y-8,6); };
  const bench = (x:number,y:number) => {rect(x-18,y-6,36,4,0x493f33);rect(x-18,y+6,36,4,0x493f33);rect(x-20,y-4,40,10,0xb88648,0x594631);for(let i=0;i<3;i++)rect(x-18,y-3+i*4,36,1,0xe0ad68);};
  rect(0,0,WORLD.width,WORLD.height,0x77b44a);
  // Fine lawn pattern, deterministic and hand-drawn rather than a repeated raster.
  for(let y=15;y<WORLD.height;y+=23) for(let x=12;x<WORLD.width;x+=27) {const n=(x*7+y*11)%19;rect(x+n,y,3,2,0x6ba63f);}
  for(let i=0;i<4;i++){
    const vx=350+i*400, hy=370+i*400;
    rect(vx,0,120,WORLD.height,0x55595d);rect(0,hy,WORLD.width,120,0x55595d);
  }
  for(let i=0;i<4;i++) {
    const vx=350+i*400,hy=370+i*400;
    for(let y=15;y<WORLD.height;y+=50) if(![370,770,1170,1570].some(r=>y>r-20&&y<r+130))rect(vx+59,y,3,25,0xf5f5f5);
    for(let x=15;x<WORLD.width;x+=50) if(![350,750,1150,1550].some(r=>x>r-20&&x<r+130))rect(x,hy+59,25,3,0xf5f5f5);
  }
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    const x=50+col*400,y=70+row*400;
    rect(x-3,y-3,306,306,0x373b37);rect(x,y,300,300,0xc6c7bf);
    // Square pavement slabs around every block, with dark outer curb.
    g.lineStyle(1,0x999e97);
    for(let k=0;k<=300;k+=32){g.lineBetween(x+k,y,x+k,y+300);g.lineBetween(x,y+k,x+300,y+k);}
    rect(x+38,y+38,224,224,0x80b849);
    // Curb lips and a pair of roadside lamps.
    rect(x+1,y+297,298,3,0xe6e2d4);rect(x+297,y+1,3,298,0x999d95);
    for(const [lx,ly] of [[x+16,y+284],[x+284,y+18]]){g.fillStyle(0x333a3a).fillCircle(lx,ly,4);rect(lx-2,ly-15,4,17,0x52565b);g.fillStyle(0xffeab1).fillCircle(lx,ly-16,5);}
    tree(x+45,y+275,15);tree(x+258,y+275,16);
    if((row+col)%2===0)bench(x+86,y+283);
    rect(x+269,y+272,11,16,0x39765c,0x2b4e40);
  }
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    const x=350+col*400,y=370+row*400;
    // White zebra crossings on four approaches to each junction.
    for(let k=0;k<9;k++){rect(x+5+k*12,y-26,7,19,0xf1eee1);rect(x+5+k*12,y+127,7,19,0xf1eee1);rect(x-26,y+5+k*12,19,7,0xf1eee1);rect(x+127,y+5+k*12,19,7,0xf1eee1);}
    rect(x-10,y-10,6,15,0x30383b);rect(x-9,y-8,4,4,0xde6553);rect(x+125,y+116,6,15,0x30383b);rect(x+126,y+124,4,4,0x85cb61);
  }
  for(const b of buildings){
    const {x,y,w,h}=b;
    if(b.id==='park'){
      rect(x+95,y,48,h+18,0xd3c5a0);rect(x,y+85,w,42,0xd3c5a0);
      g.fillStyle(0x576b6c).fillCircle(x+119,y+104,45);g.lineStyle(4,0xe0d8bf).strokeCircle(x+119,y+104,43);g.fillStyle(0x6ac4df).fillCircle(x+119,y+104,35);g.fillStyle(0xade9f2).fillCircle(x+119,y+100,24);g.fillStyle(0xe9e1c7).fillCircle(x+119,y+104,8);
      for(const [tx,ty] of [[30,30],[210,27],[30,180],[210,177]])tree(x+tx,y+ty,25);
      bench(x+36,y+135);bench(x+205,y+135);
      label(scene,x+w/2,y+h-16,'CITY PARK',0x42572f,16);continue;
    }
    // Low shaded wall below roof, cyan storefront windows and a distinct entrance.
    rect(x+7,y+10,w,h,0x35443b);rect(x,y,w,h,b.color,0x373b3d);
    rect(x+5,y+h-34,w-10,30,Phaser.Display.Color.ValueToColor(b.color).darken(15).color);
    for(let wx=x+16;wx<x+w-20;wx+=45){if(Math.abs(wx-(b.door.x-12))<32)continue;rect(wx,y+h-27,30,17,0x383e40);rect(wx+3,y+h-25,24,12,0x58efed);rect(wx+5,y+h-23,3,9,0xdbf5ec);}
    rect(x-4,y-4,w+8,h-38,0x3e4243);rect(x,y,w,h-42,b.roof,0x3e4243);
    rect(x+8,y+8,w-16,h-58,Phaser.Display.Color.ValueToColor(b.roof).lighten(5).color,Phaser.Display.Color.ValueToColor(b.roof).darken(15).color);
    // Roof seams, vents and skylights supply the original's simple geometric detail.
    const dark=Phaser.Display.Color.ValueToColor(b.roof).darken(12).color;
    for(let k=30;k<w-10;k+=30)rect(x+k,y+10,1,h-62,dark);
    rect(x+w-64,y+24,38,30,0x7b8180,0x444c4a);rect(x+w-60,y+20,30,28,0xb7bcb4,0x5a6360);for(let v=0;v<4;v++)rect(x+w-56,y+25+v*5,22,2,0x7e8885);
    if(b.kind==='office'||b.id==='school'||b.id==='library'){rect(x+24,y+24,60,36,0x414c53);rect(x+28,y+28,52,28,0x64e2eb);rect(x+51,y+28,3,28,0x495d65);}
    const signW=Math.min(w-18,b.short.length*10+28);
    rect(x+(w-signW)/2,y+h-65,signW,27,b.id==='casino'?0x704f71:b.id==='gang'?0x494b4c:0xf3e7be,0x393f40);
    label(scene,x+w/2,y+h-51,b.short,b.id==='casino'||b.id==='gang'?0xffe1a1:0x343c3e,15);
    rect(b.door.x-16,y+h-30,32,31,0x333d3f,0x222b2c);rect(b.door.x-12,y+h-27,24,24,0x6aafbe);rect(b.door.x-1,y+h-26,2,24,0x384b4c);rect(b.door.x+7,y+h-14,3,3,0xf3db79);
    rect(b.door.x-20,y+h+1,40,14,0xcecbbd,0x7f847b);rect(b.door.x-18,y+h+15,36,16,0xccc4a5);
    const doorMark=scene.add.text(b.door.x,y+h+38,'▼',{fontFamily:'Arial',fontSize:'14px',color:'#fff1a3',stroke:'#4a593d',strokeThickness:3}).setOrigin(.5).setDepth(1);
    scene.tweens.add({targets:doorMark,alpha:.45,duration:1100,yoyo:true,repeat:-1});
    // Individual façades, stripes, grounds and signs.
    if(['cafe','store','diner'].includes(b.id)) for(let i=0;i<Math.floor(w/18);i++)rect(x+i*18,y+h-37,18,8,i%2?0xf7ead4:b.id==='store'?0x4c9d81:0xc96e52);
    if(b.id==='clinic'){rect(x+w/2-6,y+48,12,48,0xf0eddf);rect(x+w/2-24,y+66,48,12,0xf0eddf);}
    if(b.id==='gym'){rect(x+65,y+63,80,12,0x535e62);rect(x+57,y+49,10,39,0x3d494e);rect(x+143,y+49,10,39,0x3d494e);}
    if(b.id==='garage'){for(let i=0;i<2;i++){rect(x+24+i*91,y+h-30,69,30,0x5a686b,0x303c3e);for(let k=0;k<4;k++)rect(x+26+i*91,y+h-26+k*7,65,1,0x9ca49c);}}
    if(b.id==='home'){rect(x+31,y+27,60,44,0x57605c,0x414b47);rect(x+36,y+32,50,34,0x8ba5a0);rect(x+60,y+32,3,34,0xd8d8bf);rect(x+36,y+47,50,3,0xd8d8bf);}
  }
  // Street names are part of the map, not screen overlays.
  for(const [x,y,t] of [[660,430,'BIZAL AVENUE'],[1060,830,'MARKET STREET'],[660,1230,'PARK AVENUE']] as const)label(scene,x,y,t,0xbfc1b6,11);
  // The district is static: draw its thousands of slab/roof details once.
  // Reusing a single texture keeps walking smooth on mobile and software WebGL.
  g.generateTexture('city-art',WORLD.width,WORLD.height);
  scene.add.image(0,0,'city-art').setOrigin(0).setDepth(0);
  g.destroy();
}
function label(scene:Phaser.Scene,x:number,y:number,text:string,color:number,size:number){scene.add.text(x,y,text,{fontFamily:'Arial, sans-serif',fontSize:`${size}px`,fontStyle:'bold',color:`#${color.toString(16).padStart(6,'0')}`,letterSpacing:1}).setOrigin(.5).setDepth(1);}

export function makePerson(scene:Phaser.Scene,color:number,player=false){
  const c=scene.add.container(0,0).setDepth(10),g=scene.add.graphics();
  g.fillStyle(0x243628,.22).fillEllipse(2,7,23,12);
  g.lineStyle(4,0x202b2d);g.lineBetween(-5,3,-8,11);g.lineBetween(5,3,8,11);
  g.lineBetween(-8,-3,-13,0);g.lineBetween(8,-3,13,0);
  g.fillStyle(color).fillEllipse(0,0,19,15);g.lineStyle(2,0x202b2d).strokeEllipse(0,0,19,15);
  g.fillStyle(player?0x4635d9:color).fillCircle(0,-3,10);g.lineStyle(2,0x111818).strokeCircle(0,-3,10);
  g.lineStyle(1,0x182329).lineBetween(-4,-6,-1,-3).lineBetween(-1,-6,-4,-3).lineBetween(2,-6,5,-3).lineBetween(5,-6,2,-3);
  c.add(g);
  if(player){const mark=scene.add.triangle(0,-29,0,0,10,0,5,8,0xffe276).setStrokeStyle(2,0x685b30);c.add(mark);}
  return c;
}
export function makeCar(scene:Phaser.Scene,color:number){
 const c=scene.add.container(0,0).setDepth(6),g=scene.add.graphics();
 g.fillStyle(0x27322e,.25).fillRoundedRect(-11,-20,26,47,4);
 g.fillStyle(0x252a2e);for(const y of [-14,11]){g.fillRect(-14,y,5,11);g.fillRect(9,y,5,11);}
 g.fillStyle(color).fillRoundedRect(-11,-23,22,46,5);g.lineStyle(2,0x30373a).strokeRoundedRect(-11,-23,22,46,5);
 g.fillStyle(0xb9e3eb).fillRect(-8,-13,16,8);g.fillStyle(0x344c56).fillRect(-8,10,16,6);
 g.fillStyle(Phaser.Display.Color.ValueToColor(color).lighten(18).color).fillRect(-7,-3,14,12);
 g.fillStyle(0xffeb9c).fillRect(-8,-22,5,3).fillRect(3,-22,5,3);g.fillStyle(0xca564a).fillRect(-8,20,5,2).fillRect(3,20,5,2);c.add(g);return c;
}
