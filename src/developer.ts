import { BUILDINGS } from './content';
import { SKILLS, type CityBridge, type DeveloperModifiers, type Skill } from './types';
import type { GameStore } from './model';

export function developerMarkup(store:GameStore):string {
  const s=store.state,m=store.modifiers;
  const toggle=(key:keyof DeveloperModifiers,label:string)=>`<button data-dev-toggle="${key}" aria-pressed="${m[key]===true}">${label}: ${m[key]?'ON':'OFF'}</button>`;
  return `<button class="wide" id="dev-normal">DISABLE ALL TEMPORARY CHEATS</button><p class="dev-warning">TESTING ONLY · Temporary modifiers reset on reload. Progression cheats and imports mark this save DEV-ALTERED. ${s.developerModified?'This save is already marked.':'This save is currently clean.'}</p>
  <section class="dev-section"><h2>Player & movement</h2><div class="dev-toggles">${toggle('infiniteEnergy','Infinite energy')}${toggle('infiniteHealth','Infinite health')}${toggle('noclip','Noclip')}</div>
  <label class="dev-row">Movement speed <select id="dev-speed">${[1,2,3,5].map(n=>`<option value="${n}" ${m.speed===n?'selected':''}>${n}×</option>`).join('')}</select></label>
  <div class="dev-row"><select id="dev-building" aria-label="Teleport destination">${BUILDINGS.map(b=>`<option value="${b.id}">${b.name}</option>`).join('')}</select><button id="dev-teleport-building">TELEPORT</button></div>
  <div class="dev-row"><label>X <input id="dev-x" type="number" min="20" max="1660" value="${Math.round(s.position.x)}"></label><label>Y <input id="dev-y" type="number" min="20" max="1740" value="${Math.round(s.position.y)}"></label><button id="dev-teleport-coordinates">GO</button></div>
  <p class="dev-debug" id="dev-coordinates">Coordinates: ${s.position.x.toFixed(1)}, ${s.position.y.toFixed(1)}</p></section>
  <section class="dev-section"><h2>Money & progression</h2><div class="dev-toggles">${[100,1000,10000].map(n=>`<button data-dev-money="${n}">ADD $${n.toLocaleString('en-US')}</button>`).join('')}</div>
  <label class="dev-row">Cash <input id="dev-cash" type="number" min="0" max="1000000000" value="${s.cash}"><button data-dev-action="cash-set" data-input="dev-cash">SET</button></label>
  <label class="dev-row">Add XP <input id="dev-xp" type="number" min="0" max="10000000" value="100"><button data-dev-action="xp-add" data-input="dev-xp">ADD</button></label>
  <label class="dev-row">Character level <input id="dev-level" type="number" min="1" max="10000" value="${s.level}"><button data-dev-action="level-set" data-input="dev-level">SET</button></label>
  <div class="dev-row"><select id="dev-skill" aria-label="Individual skill">${SKILLS.map(k=>`<option value="${k}">${k}</option>`).join('')}</select><input id="dev-skill-level" aria-label="Skill level" type="number" min="1" max="50" value="${s.skills.efficiency}"><button id="dev-set-skill">SET</button></div>
  <button class="wide" data-dev-action="qualifications">UNLOCK ALL QUALIFICATIONS</button><button class="wide" data-dev-action="careers">UNLOCK ALL CAREERS</button><button class="wide" data-dev-action="skills-reset">RESET PLAYER SKILLS</button><button class="wide" data-dev-action="missions-clear">CLEAR ACTIVE MISSIONS</button><button class="wide" data-dev-action="missions-reset">RESET MISSION PROGRESS</button></section>
  <section class="dev-section"><h2>Time & simulation</h2><div class="dev-toggles"><button data-dev-action="hour">ADVANCE 1 HOUR</button><button data-dev-action="day">NEXT DAY · 08:00</button>${toggle('paused','Pause NPCs, traffic & police')}<button data-dev-action="restore">RESTORE ENERGY & HEALTH</button></div>
  <p>All ordinary actions are instant. Police pursuits are interactive.</p><button data-dev-action="pursuit-clear">CLEAR POLICE PURSUIT (CHEAT)</button>
  <label class="dev-row">Day <input id="dev-day" type="number" min="1" max="694444" value="${Math.floor(s.minutes/1440)+1}"><input id="dev-clock" aria-label="Set clock" type="time" value="${String(Math.floor(s.minutes%1440/60)).padStart(2,'0')}:${String(Math.floor(s.minutes%60)).padStart(2,'0')}"><button id="dev-set-clock">SET</button></label></section>
  <section class="dev-section"><h2>Save tools</h2><div class="dev-toggles"><button id="dev-save">SAVE GAME NOW</button><button id="dev-export">EXPORT JSON</button></div>
  <label class="dev-json-label">Save JSON<textarea id="dev-json" rows="6" spellcheck="false" placeholder="Paste a V1, V2 or V3 save here. Import is validated before replacing progress."></textarea></label>
  <button id="dev-import">IMPORT JSON (MARKS SAVE)</button><button class="danger wide" id="dev-reset">RESET CURRENT SAVE…</button></section>
  <section class="dev-section"><h2>Diagnostics</h2><p class="dev-debug" id="dev-fps">FPS: waiting for scene</p><p>Save schema: ${s.version} · Active play: ${Math.floor(s.playSeconds/60)} min · Storage: ${store.storageAvailable?'available':'unavailable'}</p><p>F2 opens this menu on desktop. All normal career, qualification and in-game cost restrictions remain active unless you explicitly use a testing control.</p></section>`;
}

export function bindDeveloper(panel:HTMLElement,store:GameStore,bridge:CityBridge|undefined,refresh:()=>void,feedback:(message:string)=>void):void {
  const number=(id:string)=>Number((panel.querySelector(`#${id}`) as HTMLInputElement).value);
  const result=(r:{ok:boolean;message:string})=>{feedback(r.message);if(r.ok)refresh();};
  panel.querySelectorAll<HTMLButtonElement>('[data-dev-toggle]').forEach(b=>b.onclick=()=>{const k=b.dataset.devToggle as keyof DeveloperModifiers;result(store.setModifier(k,!store.modifiers[k]));});
  panel.querySelector<HTMLSelectElement>('#dev-speed')!.onchange=e=>result(store.setModifier('speed',Number((e.target as HTMLSelectElement).value)));
  panel.querySelectorAll<HTMLButtonElement>('[data-dev-money]').forEach(b=>b.onclick=()=>result(store.developer('cash-add',Number(b.dataset.devMoney))));
  panel.querySelectorAll<HTMLButtonElement>('[data-dev-action]').forEach(b=>b.onclick=()=>result(store.developer(b.dataset.devAction!,b.dataset.input?number(b.dataset.input):0)));
  panel.querySelector<HTMLSelectElement>('#dev-skill')!.onchange=e=>{(panel.querySelector('#dev-skill-level') as HTMLInputElement).value=String(store.state.skills[(e.target as HTMLSelectElement).value as Skill]);};
  panel.querySelector<HTMLButtonElement>('#dev-set-skill')!.onclick=()=>result(store.developer('skill-set',number('dev-skill-level'),(panel.querySelector('#dev-skill') as HTMLSelectElement).value as Skill));
  const teleport=(x:number,y:number)=>{if(!bridge)return;const r=bridge.teleport(x,y);if(r.ok)store.markDeveloper();result(r);};
  panel.querySelector<HTMLButtonElement>('#dev-teleport-building')!.onclick=()=>{const b=BUILDINGS.find(b=>b.id===(panel.querySelector('#dev-building') as HTMLSelectElement).value)!;teleport(b.door.x,b.door.y);};
  panel.querySelector<HTMLButtonElement>('#dev-teleport-coordinates')!.onclick=()=>teleport(number('dev-x'),number('dev-y'));
  panel.querySelector<HTMLButtonElement>('#dev-normal')!.onclick=()=>result(store.disableDeveloperModifiers());
  panel.querySelector<HTMLButtonElement>('#dev-set-clock')!.onclick=()=>{const clock=(panel.querySelector('#dev-clock')as HTMLInputElement).value;if(!/^\d{2}:\d{2}$/.test(clock)){feedback('Enter a valid clock time.');return;}const[h,m]=clock.split(':').map(Number);result(store.developer('clock-set',(number('dev-day')-1)*1440+h*60+m));};
  const savePosition=()=>{const p=bridge?.snapshot().position;if(p)store.moveTo(p.x,p.y);store.save();};
  panel.querySelector<HTMLButtonElement>('#dev-save')!.onclick=()=>{savePosition();feedback(store.storageAvailable?'Game saved.':'Browser storage is unavailable.');};
  panel.querySelector<HTMLButtonElement>('#dev-export')!.onclick=()=>{
    savePosition();const json=store.exportSaveData();(panel.querySelector('#dev-json') as HTMLTextAreaElement).value=json;
    const url=URL.createObjectURL(new Blob([json],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='stick-city-save-v3.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);feedback('Exported JSON. It is also shown below for copying.');
  };
  panel.querySelector<HTMLButtonElement>('#dev-import')!.onclick=()=>{const r=store.importSaveData((panel.querySelector('#dev-json') as HTMLTextAreaElement).value);if(r.ok)bridge?.teleport(store.state.position.x,store.state.position.y);result(r);};
  panel.querySelector<HTMLButtonElement>('#dev-reset')!.onclick=()=>{if(window.confirm('Erase current progress and start a fresh save? Export first to keep a copy.')){store.reset();bridge?.resetPosition();feedback('Current save reset. Temporary modifiers cleared.');refresh();}};
}
