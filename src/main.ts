import Phaser from 'phaser';
import { GameStore } from './model';
import { GameUI } from './ui';
import { CityScene } from './scene';
import './style.css';

const store=new GameStore();
const ui=new GameUI(store);
const scene=new CityScene(store,ui);
const game=new Phaser.Game({type:Phaser.CANVAS,parent:'city-canvas',backgroundColor:'#77b44a',antialias:true,
  scale:{mode:Phaser.Scale.RESIZE,width:480,height:650},scene:[scene],
  input:{activePointers:2},render:{roundPixels:true},audio:{noAudio:true}});
// Exposed for diagnostics and automated gameplay verification; no private data is stored.
Object.assign(window,{stickCity:{store,scene,game}});
window.addEventListener('pagehide',()=>{const s=scene.snapshot();store.moveTo(s.position.x,s.position.y);store.save();});
window.addEventListener('visibilitychange',()=>{if(document.hidden)store.save();});
