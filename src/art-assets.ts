import Phaser from 'phaser';
import type { Building } from './types';
type G=Phaser.GameObjects.Graphics;
export function rect(g:G,x:number,y:number,w:number,h:number,color:number,line?:number){g.fillStyle(color).fillRect(x,y,w,h);if(line!==undefined)g.lineStyle(2,line).strokeRect(x,y,w,h);}
const shade=(color:number,amount:number)=>amount>0?Phaser.Display.Color.ValueToColor(color).lighten(amount).color:Phaser.Display.Color.ValueToColor(color).darken(-amount).color;
export function drawTree(g:G,x:number,y:number,r=19){
  g.fillStyle(0x244c25,.16).fillEllipse(x+4,y+6,r*2,r*1.7);
  g.fillStyle(0x754e2d).fillRect(x-3,y,6,r+4);
  g.fillStyle(0x368d2b).fillCircle(x,y,r);g.lineStyle(2,0x285a27).strokeCircle(x,y,r);
  for(const [dx,dy,scale]of [[-7,0,.55],[6,-4,.58],[0,-9,.6]]){g.fillStyle(0x65c13c).fillCircle(x+dx*r/20,y+dy*r/20,r*scale);}
  g.fillStyle(0x94df52).fillCircle(x-r*.3,y-r*.4,r*.3);
}
export function drawBench(g:G,x:number,y:number){
  rect(g,x-18,y-6,36,4,0x3f4442);rect(g,x-18,y+6,36,4,0x3f4442);
  rect(g,x-20,y-4,40,10,0xd09a51,0x594631);for(let i=0;i<3;i++)rect(g,x-18,y-3+i*4,36,1,0xf5cb80);
}
export function drawPlanter(g:G,x:number,y:number){
  rect(g,x-12,y-5,24,14,0xb77b51,0x5f503a);rect(g,x-10,y-7,20,7,0x326c35);
  for(const [dx,color]of [[-7,0xf9c851],[0,0xf27686],[7,0xffedb2]]){g.fillStyle(color).fillCircle(x+dx,y-7,3);}
}
export function cityLabel(scene:Phaser.Scene,x:number,y:number,text:string,color=0x26373a,size=15){
  return scene.add.text(x,y,text,{fontFamily:'Arial, sans-serif',fontSize:`${size}px`,fontStyle:'bold',color:`#${color.toString(16).padStart(6,'0')}`,letterSpacing:1}).setOrigin(.5).setDepth(1);
}
interface BuildingStyle { roof:'tiles'|'glass'|'flat'|'metal'; accent:number; awning?:boolean; emblem?:'cross'|'weights'; }
/** Reusable archetypes are selected by building kind, independent of map coordinates. */
export const BUILDING_STYLES:Record<string,BuildingStyle>={
  home:{roof:'tiles',accent:0xc2634d},food:{roof:'tiles',accent:0xe97d58,awning:true},shop:{roof:'flat',accent:0x32a49b,awning:true},
  work:{roof:'metal',accent:0xd95754,awning:true},school:{roof:'flat',accent:0xc1a64b},bank:{roof:'glass',accent:0x4a7eab},
  civic:{roof:'flat',accent:0xb78a4e},office:{roof:'glass',accent:0x558cae},gym:{roof:'metal',accent:0x568c9c,emblem:'weights'},
  clinic:{roof:'flat',accent:0x39a28b,emblem:'cross'},casino:{roof:'flat',accent:0x9d538a},gang:{roof:'metal',accent:0x52685f},
  post:{roof:'metal',accent:0xd59940},library:{roof:'tiles',accent:0xb98a58},garage:{roof:'metal',accent:0x498ba8},
};
export function drawBuilding(scene:Phaser.Scene,g:G,b:Building){
  const{x,y,w,h}=b;
  if(b.kind==='park'){
    rect(g,x+95,y,48,h+18,0xe1d4a8);rect(g,x,y+85,w,42,0xe1d4a8);
    g.fillStyle(0x7f9a99).fillCircle(x+w/2,y+104,45);g.lineStyle(4,0xf2ead1).strokeCircle(x+w/2,y+104,43);
    g.fillStyle(0x42b9de).fillCircle(x+w/2,y+104,35);g.lineStyle(2,0xc8f6ff).strokeCircle(x+w/2,y+104,26);g.fillStyle(0xe9e8d6).fillCircle(x+w/2,y+104,8);
    for(const[tx,ty]of [[30,30],[210,27],[30,180],[210,177]])drawTree(g,x+tx,y+ty,25);
    drawBench(g,x+36,y+135);drawBench(g,x+205,y+135);drawPlanter(g,x+48,y+73);drawPlanter(g,x+197,y+73);
    cityLabel(scene,x+w/2,y+h-16,b.short,0x346233,16);return;
  }
  const style=BUILDING_STYLES[b.kind]??BUILDING_STYLES.civic;
  // A low façade below a bird's-eye roof, with cyan glass and distinct door trim.
  rect(g,x+5,y+7,w,h,0x56705c);rect(g,x,y,w,h,b.color,0x364745);
  rect(g,x+3,y+h-45,w-6,43,shade(b.color,8));rect(g,x,y+h-44,w,5,style.accent);
  rect(g,x,y+h-4,w,4,shade(b.color,-20));
  for(let wx=x+14;wx<x+w-25;wx+=44){
    if(Math.abs(wx+14-b.door.x)<30)continue;
    rect(g,wx-2,y+h-31,32,23,0x425a5c);rect(g,wx,y+h-29,28,18,0x55e4ef);
    rect(g,wx+2,y+h-27,4,14,0xddffff);rect(g,wx,y+h-20,28,1,0xa4ffff);rect(g,wx-3,y+h-9,34,3,0xf2e8ce);
  }
  // Reusable façade piers and tile joints make small buildings readable at phone scale.
  for(let px=8;px<w-4;px+=44){rect(g,x+px,y+h-38,3,32,0xf4eed8);rect(g,x+px+3,y+h-38,1,32,shade(b.color,-12));}
  const roofH=h-48;
  rect(g,x-3,y-3,w+6,roofH+6,0x40514f);rect(g,x,y,w,roofH,b.roof,0x566561);
  rect(g,x+7,y+7,w-14,roofH-14,shade(b.roof,10),shade(b.roof,-14));
  if(style.roof==='tiles'){
    // Tile seams are a shared roof treatment, not one-off building drawings.
    for(let ry=14;ry<roofH-8;ry+=16){rect(g,x+9,y+ry,w-18,1,shade(b.roof,-13));for(let rx=16+(ry%32?0:10);rx<w-12;rx+=22)rect(g,x+rx,y+ry,1,15,shade(b.roof,-8));}
    rect(g,x+w/2-3,y+9,6,roofH-18,shade(b.roof,-20));rect(g,x+w/2-1,y+9,2,roofH-18,shade(b.roof,25));
  }else if(style.roof==='metal'){
    for(let rx=20;rx<w-10;rx+=22){rect(g,x+rx,y+10,2,roofH-20,shade(b.roof,-16));rect(g,x+rx+2,y+10,1,roofH-20,shade(b.roof,25));}
  }else{
    rect(g,x+15,y+15,w-30,roofH-30,shade(b.roof,5),shade(b.roof,-5));
    for(let rx=50;rx<w-10;rx+=55)rect(g,x+rx,y+15,1,roofH-30,shade(b.roof,-8));
  }
  if(style.roof==='glass'){
    rect(g,x+27,y+30,w-105,70,0x416878,0x304b57);
    for(let row=0;row<2;row++)for(let col=0;col<3;col++){rect(g,x+31+col*(w-113)/3,y+34+row*32,(w-125)/3,27,0x72d5e9);rect(g,x+34+col*(w-113)/3,y+36+row*32,4,22,0xc7f8ff);}
  }else{
    rect(g,x+25,y+27,62,35,0x425f68);rect(g,x+29,y+31,54,27,0x87dce6);rect(g,x+53,y+31,3,27,0xd8f7ed);
    rect(g,x+31,y+33,5,23,0xc8ffff);
  }
  // Roof service unit, grille and duct, shared across all building archetypes.
  rect(g,x+w-63,y+24,39,31,0x6e827f,0x485b59);rect(g,x+w-60,y+21,32,29,0xdae0d5,0x7e918a);
  for(let v=0;v<4;v++)rect(g,x+w-56,y+26+v*5,24,2,0x95aaa2);
  rect(g,x+w-46,y+52,8,16,0xaab8ad,0x657e76);
  if(style.emblem==='cross'){rect(g,x+w/2-5,y+85,10,42,0xf9fff2);rect(g,x+w/2-21,y+101,42,10,0xf9fff2);}
  if(style.emblem==='weights'){rect(g,x+71,y+99,82,8,0x32464c);rect(g,x+66,y+88,10,30,0x516b73);rect(g,x+148,y+88,10,30,0x516b73);}
  const sw=Math.min(w-20,b.short.length*10+26);
  rect(g,x+(w-sw)/2-2,y+roofH-24,sw+4,28,0x415451);rect(g,x+(w-sw)/2,y+roofH-23,sw,25,0xfff2c7,style.accent);
  cityLabel(scene,x+w/2,y+roofH-10,b.short,0x293b40,15);
  if(style.awning)for(let i=0;i<Math.floor(w/14);i++){rect(g,x+4+i*14,y+h-43,14,9,i%2?0xfff2d1:style.accent);g.fillStyle(i%2?0xfff2d1:style.accent).fillCircle(x+11+i*14,y+h-34,7);}
  rect(g,b.door.x-17,y+h-34,34,34,0x314a4f);rect(g,b.door.x-13,y+h-31,26,29,0x6bd8e5);
  rect(g,b.door.x-10,y+h-29,4,25,0xd6ffff);rect(g,b.door.x-1,y+h-30,2,28,0x466f78);rect(g,b.door.x+7,y+h-16,3,3,0xffe487);
  rect(g,b.door.x-20,y+h+1,40,14,0xe4dfcc,0x8f9c8d);rect(g,b.door.x-18,y+h+15,36,15,0xdad2b6);
  if(style.awning||b.kind==='civic'){drawPlanter(g,x+34,y+h+16);drawPlanter(g,x+w-34,y+h+16);}
  const marker=scene.add.text(b.door.x,y+h+38,'▼',{fontFamily:'Arial',fontSize:'13px',color:'#ffe57b',stroke:'#4b683c',strokeThickness:2}).setOrigin(.5).setDepth(1);
  scene.tweens.add({targets:marker,alpha:.5,duration:1000,yoyo:true,repeat:-1});
}
