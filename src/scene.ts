import Phaser from 'phaser';
import { BUILDINGS } from './content';
import { GameStore } from './model';
import type { GameUI } from './ui';
import { paintCity, makePerson, makeCar } from './art';
import { blocked, findPath, WORLD } from './navigation';
import type { Position, CityBridge } from './types';

type NPC = { name:string; person:Phaser.GameObjects.Container; origin:Position; phase:number };
export class CityScene extends Phaser.Scene implements CityBridge {
  private store:GameStore; private ui:GameUI;
  private player!:Phaser.GameObjects.Container;
  private path:Position[]=[]; private arrival?:()=>void;
  private keys!:Record<string,Phaser.Input.Keyboard.Key>;
  private npcs:NPC[]=[];
  private cars:{sprite:Phaser.GameObjects.Container;offset:number;speed:number;reverse:boolean}[]=[];
  private marker!:Phaser.GameObjects.Graphics;
  private lastSave=0; private lastLocation=''; private wasOpen=false;
  constructor(store:GameStore,ui:GameUI){super('City');this.store=store;this.ui=ui;}
  create(){
    paintCity(this,BUILDINGS);
    this.marker=this.add.graphics().setDepth(3);
    this.player=makePerson(this,0x559ce0,true).setScale(1.12).setPosition(this.store.state.position.x,this.store.state.position.y);
    if(blocked(this.player.x,this.player.y,BUILDINGS))this.resetPosition();
    this.cameras.main.setBounds(0,0,WORLD.width,WORLD.height).setZoom(.82).startFollow(this.player,true,.12,.12);
    this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,E,ESC') as typeof this.keys;
    this.input.keyboard!.removeCapture(['SPACE','UP','DOWN','LEFT','RIGHT']);
    this.input.keyboard!.on('keydown-E',()=>this.enterNearby());
    this.input.keyboard!.on('keydown-SPACE',()=>{if(!this.ui.isOpen)this.stop();});
    this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{
      if(this.ui.isOpen)return;
      const pos=this.cameras.main.getWorldPoint(p.x,p.y);
      const b=BUILDINGS.find(b=>(pos.x>b.x&&pos.x<b.x+b.w&&pos.y>b.y&&pos.y<b.y+b.h)||Math.hypot(pos.x-b.door.x,pos.y-b.door.y)<27);
      if(b){this.goToBuilding(b.id);return;}
      const npc=this.npcs.find(n=>Phaser.Math.Distance.Between(n.person.x,n.person.y,pos.x,pos.y)<25);
      if(npc){this.walk({x:npc.person.x,y:npc.person.y},()=>this.ui.openNPC(npc.name));return;}
      this.walk(pos);
    });
    const names=['Alex · Courier','Mia · Student','Sam · Local','Jo · Gardener','Chris · Commuter','Rae · Artist','Lee · Neighbour','Ash · Shopper','Taylor · Runner','Morgan · Visitor','Drew · Baker','Kit · Musician'];
    const colors=[0x20e5ed,0x20e5ed,0x6755ed,0x20e5ed,0xee68ab,0x20e5ed];
    names.forEach((name,i)=>{
      const origin={x:348+(i%3)*400,y:350+Math.floor(i/3)*400};
      this.npcs.push({name,origin,phase:i*1.7,person:makePerson(this,colors[i%colors.length]).setScale(1.12).setPosition(origin.x,origin.y)});
    });
    [0xe7c14b,0xcc5e59,0x5d9fc1,0xa8b9aa,0x9b73b1,0x63a987,0xe8d4a6,0xe18049].forEach((c,i)=>this.cars.push({sprite:makeCar(this,c).setScale(1.65),offset:i*620,speed:45+i%3*9,reverse:i%2===1}));
    this.ui.bridge=this;
    this.game.events.emit('city-ready');
    this.scale.on('resize',(s:Phaser.Structs.Size)=>this.cameras.main.setSize(s.width,s.height));
  }
  stop(){this.path=[];this.arrival=undefined;this.marker?.clear();}
  resetPosition(){const p=BUILDINGS.find(b=>b.id==='home')!.door;this.stop();this.player?.setPosition(p.x,p.y);this.store.moveTo(p.x,p.y);}
  private enterNearby(){
    if(this.ui.isOpen)return;
    const b=BUILDINGS.find(b=>Math.hypot(b.door.x-this.player.x,b.door.y-this.player.y)<65);
    if(b){this.stop();this.store.visit(b.id);this.ui.openBuilding(b.id);}else this.ui.toast('Walk to an entrance, or tap a building to enter.');
  }
  goToBuilding(id:string){const b=BUILDINGS.find(b=>b.id===id);if(!b)return;this.walk(b.door,()=>{this.store.visit(id);this.ui.openBuilding(id);});}
  private walk(p:Position,arrival?:()=>void){
    if(Phaser.Math.Distance.Between(this.player.x,this.player.y,p.x,p.y)<24){this.stop();arrival?.();return;}
    const path=findPath(this.player,p,BUILDINGS);
    if(!path.length){this.ui.toast('Choose a pavement or tap a building entrance.');return;}
    this.path=path;this.arrival=arrival;
    this.marker.clear().lineStyle(2,0xffe69b,.85).strokeCircle(p.x,p.y,12).lineStyle(1,0xffe69b,.6).strokeCircle(p.x,p.y,18);
  }
  update(time:number,delta:number){
    if(!this.player)return;
    const dt=Math.min(delta,100)/1000;
    const k=this.keys;
    if(this.ui.isOpen){if(!this.wasOpen)this.stop();this.wasOpen=true;}
    else{
      this.wasOpen=false;
      if(Phaser.Input.Keyboard.JustDown(k.SPACE)||Phaser.Input.Keyboard.JustDown(k.ESC))this.stop();
      let dx=Number(k.D.isDown||k.RIGHT.isDown)-Number(k.A.isDown||k.LEFT.isDown),dy=Number(k.S.isDown||k.DOWN.isDown)-Number(k.W.isDown||k.UP.isDown);
      const keyboard=dx!==0||dy!==0;
      let distanceToTarget=Infinity;
      if(keyboard)this.stop();
      else if(this.path.length){const target=this.path[0],dist=Math.hypot(target.x-this.player.x,target.y-this.player.y);distanceToTarget=dist;if(dist<4){this.path.shift();if(!this.path.length){this.marker.clear();const fn=this.arrival;this.arrival=undefined;fn?.();}}else{dx=(target.x-this.player.x)/dist;dy=(target.y-this.player.y)/dist;}}
      const len=Math.hypot(dx,dy);
      if(len){const step=Math.min(120*dt,distanceToTarget);dx=dx/len*step;dy=dy/len*step;
        if(!blocked(this.player.x+dx,this.player.y,BUILDINGS))this.player.x+=dx;
        if(!blocked(this.player.x,this.player.y+dy,BUILDINGS))this.player.y+=dy;
        this.player.rotation=Math.sin(time*.017)*.07;
      }else this.player.rotation=0;
    }
    if(time-this.lastSave>1500){this.store.moveTo(this.player.x,this.player.y);this.lastSave=time;}
    const nearest=BUILDINGS.reduce((best,b)=>Math.hypot(b.door.x-this.player.x,b.door.y-this.player.y)<Math.hypot(best.door.x-this.player.x,best.door.y-this.player.y)?b:best);
    const location=Math.hypot(nearest.door.x-this.player.x,nearest.door.y-this.player.y)<90?nearest.name:'Stick City · Downtown';
    if(location!==this.lastLocation){window.dispatchEvent(new CustomEvent('city-location',{detail:location}));this.lastLocation=location;}
    for(const npc of this.npcs){const t=time*.00025+npc.phase;npc.person.x=npc.origin.x+Math.sin(t)*12;npc.person.y=npc.origin.y+Math.sin(t*.7)*52;npc.person.rotation=Math.sin(time*.008+npc.phase)*.09;}
    for(const car of this.cars){
      const w=800,h=800,perimeter=2*(w+h);let d=(time*.001*car.speed+car.offset)%perimeter;if(car.reverse)d=perimeter-d;
      let x:number,y:number,rotation:number;
      if(d<w){x=410+d;y=car.reverse?412:449;rotation=Math.PI/2;}
      else if(d<w+h){x=car.reverse?1192:1229;y=430+d-w;rotation=Math.PI;}
      else if(d<2*w+h){x=1210-(d-w-h);y=car.reverse?1249:1212;rotation=-Math.PI/2;}
      else{x=car.reverse?429:392;y=1230-(d-2*w-h);rotation=0;}
      if(car.reverse)rotation+=Math.PI;
      car.sprite.setPosition(x,y).setRotation(rotation);
    }
  }
  /** Read-only snapshot for browser smoke tests and future accessibility tools. */
  snapshot(){return {position:{x:this.player?.x??this.store.state.position.x,y:this.player?.y??this.store.state.position.y},camera:{x:this.cameras?.main?.scrollX??0,y:this.cameras?.main?.scrollY??0},moving:this.path.length>0,npcs:this.npcs.length,cars:this.cars.length};}
}
