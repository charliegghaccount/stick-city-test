import Phaser from 'phaser';
import { BUILDINGS } from './content';
import { GameStore } from './model';
import type { GameUI } from './ui';
import { paintCity, makePerson, makeCar, animatePerson } from './art';
import { TrafficSimulation } from './traffic';
import { blocked, findPath, WORLD } from './navigation';
import type { Position, CityBridge, Result } from './types';

type NPC = { name:string; person:Phaser.GameObjects.Container; origin:Position; phase:number };
export class CityScene extends Phaser.Scene implements CityBridge {
  private store:GameStore; private ui:GameUI;
  private player!:Phaser.GameObjects.Container;
  private path:Position[]=[]; private arrival?:()=>void;
  private keys!:Record<string,Phaser.Input.Keyboard.Key>;
  private npcs:NPC[]=[];
  private cars:Phaser.GameObjects.Container[]=[];
  private traffic=new TrafficSimulation();
  private simulationTime=0;
  private previousNoclip=false;
  private marker!:Phaser.GameObjects.Graphics;
  private lastSave=0; private lastLocation=''; private wasOpen=false;
  constructor(store:GameStore,ui:GameUI){super('City');this.store=store;this.ui=ui;}
  create(){
    paintCity(this,BUILDINGS);
    this.marker=this.add.graphics().setDepth(3);
    this.player=makePerson(this,0x559ce0,true).setScale(1.12).setPosition(this.store.state.position.x,this.store.state.position.y);
    if(blocked(this.player.x,this.player.y,BUILDINGS))this.teleport(this.player.x,this.player.y);
    this.cameras.main.setBounds(0,0,WORLD.width,WORLD.height).setZoom(.82).startFollow(this.player,true,.12,.12);
    this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,E,ESC') as typeof this.keys;
    this.input.keyboard!.removeCapture(['SPACE','UP','DOWN','LEFT','RIGHT']);
    this.input.keyboard!.on('keydown-E',()=>this.enterNearby());
    this.input.keyboard!.on('keydown-SPACE',()=>{if(!this.ui.isOpen)this.stop();});
    this.input.keyboard!.on('keydown',(e:KeyboardEvent)=>{if(!this.ui.isOpen&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();});
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
    [0xf6c535,0xf14c4e,0x3aafe2,0x71ceb1,0xaa71de,0x62b876,0xeee6cc,0xf5963e].forEach(c=>this.cars.push(makeCar(this,c)));
    this.ui.bridge=this;
    this.game.events.emit('city-ready');
    this.scale.on('resize',(s:Phaser.Structs.Size)=>this.cameras.main.setSize(s.width,s.height));
  }
  stop(){this.path=[];this.arrival=undefined;this.marker?.clear();}
  resetPosition(){const p=BUILDINGS.find(b=>b.id==='home')!.door;this.stop();this.player?.setPosition(p.x,p.y);this.store.moveTo(p.x,p.y);}
  teleport(x:number,y:number):Result {
    if(!Number.isFinite(x)||!Number.isFinite(y)||x<20||x>WORLD.width-20||y<20||y>WORLD.height-20)return{ok:false,message:'Use finite coordinates inside the city bounds.'};
    let target={x,y},adjusted=false;
    if(!this.store.modifiers.noclip&&blocked(x,y,BUILDINGS)){
      let nearest:Position|undefined,best=Infinity;
      for(let gy=30;gy<WORLD.height-20;gy+=20)for(let gx=30;gx<WORLD.width-20;gx+=20){const d=(gx-x)**2+(gy-y)**2;if(d<best&&!blocked(gx,gy,BUILDINGS)){nearest={x:gx,y:gy};best=d;}}
      if(!nearest)return{ok:false,message:'No safe landing point found.'};target=nearest;adjusted=true;
    }
    this.stop();this.player?.setPosition(target.x,target.y);this.store.moveTo(target.x,target.y);
    return{ok:true,message:adjusted?'Moved to the nearest safe pavement.':'Teleported safely.'};
  }
  private enterNearby(){
    if(this.ui.isOpen)return;
    const b=BUILDINGS.find(b=>Math.hypot(b.door.x-this.player.x,b.door.y-this.player.y)<65);
    if(b){this.stop();this.store.visit(b.id);this.ui.openBuilding(b.id);}else this.ui.toast('Walk to an entrance, or tap a building to enter.');
  }
  goToBuilding(id:string){const b=BUILDINGS.find(b=>b.id===id);if(!b)return;this.walk(b.door,()=>{this.store.visit(id);this.ui.openBuilding(id);});}
  private walk(p:Position,arrival?:()=>void){
    if(Phaser.Math.Distance.Between(this.player.x,this.player.y,p.x,p.y)<24){this.stop();arrival?.();return;}
    const bounded={x:Phaser.Math.Clamp(p.x,20,WORLD.width-20),y:Phaser.Math.Clamp(p.y,20,WORLD.height-20)};
    const path=this.store.modifiers.noclip?[bounded]:findPath(this.player,bounded,BUILDINGS);
    if(!path.length){this.ui.toast('Choose a pavement or tap a building entrance.');return;}
    this.path=path;this.arrival=arrival;
    this.marker.clear().lineStyle(2,0xffe69b,.85).strokeCircle(p.x,p.y,12).lineStyle(1,0xffe69b,.6).strokeCircle(p.x,p.y,18);
  }
  update(time:number,delta:number){
    if(!this.player)return;
    const dt=Math.min(delta,100)/1000;
    if(!document.hidden)this.store.advanceRealTime(Math.min(delta,1000)/1000);
    if(this.previousNoclip&&!this.store.modifiers.noclip){
      this.stop();
      if(blocked(this.player.x,this.player.y,BUILDINGS))this.teleport(this.player.x,this.player.y);
    }
    this.previousNoclip=this.store.modifiers.noclip;
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
      if(len){const step=Math.min(120*this.store.modifiers.speed*dt,distanceToTarget);dx=dx/len*step;dy=dy/len*step;
        if((this.store.modifiers.noclip||!blocked(this.player.x+dx,this.player.y,BUILDINGS))&&this.player.x+dx>=20&&this.player.x+dx<=WORLD.width-20)this.player.x+=dx;
        if((this.store.modifiers.noclip||!blocked(this.player.x,this.player.y+dy,BUILDINGS))&&this.player.y+dy>=20&&this.player.y+dy<=WORLD.height-20)this.player.y+=dy;
        animatePerson(this.player,time,true);
      }else animatePerson(this.player,time,false);
    }
    if(time-this.lastSave>1500){this.store.moveTo(this.player.x,this.player.y);this.lastSave=time;}
    const nearest=BUILDINGS.reduce((best,b)=>Math.hypot(b.door.x-this.player.x,b.door.y-this.player.y)<Math.hypot(best.door.x-this.player.x,best.door.y-this.player.y)?b:best);
    const location=Math.hypot(nearest.door.x-this.player.x,nearest.door.y-this.player.y)<90?nearest.name:'Stick City · Downtown';
    if(location!==this.lastLocation){window.dispatchEvent(new CustomEvent('city-location',{detail:location}));this.lastLocation=location;}
    if(!this.store.modifiers.paused){
      this.simulationTime+=Math.min(delta,100);
      for(const npc of this.npcs){const t=this.simulationTime*.00025+npc.phase;npc.person.x=npc.origin.x+Math.sin(t)*12;npc.person.y=npc.origin.y+Math.sin(t*.7)*52;animatePerson(npc.person,this.simulationTime+npc.phase*1000,true);}
      this.traffic.step(dt);
    }
    this.traffic.cars.forEach((car,i)=>this.cars[i].setPosition(car.x,car.y).setRotation(car.rotation));
  }

  /** Read-only snapshot for browser smoke tests and future accessibility tools. */
  snapshot(){return {position:{x:this.player?.x??this.store.state.position.x,y:this.player?.y??this.store.state.position.y},camera:{x:this.cameras?.main?.scrollX??0,y:this.cameras?.main?.scrollY??0},moving:this.path.length>0,npcs:this.npcs.length,cars:this.cars.length,fps:this.game?.loop?.actualFps??0};}
}
