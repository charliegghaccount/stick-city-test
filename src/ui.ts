import { BUILDINGS, ACTIVITIES, MISSIONS, ITEMS } from './content';
import { GameStore } from './model';
import { CRIME } from './crime';
import { BALANCE, skillXP } from './balance';
import { COURSES, JOBS, qualificationName } from './careers';
import { developerMarkup, bindDeveloper } from './developer';
import type { CityBridge, Mission } from './types';

const esc = (v: unknown) => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const money = (n: number) => `$${Math.floor(n).toLocaleString('en-US')}`;
const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const icon = (name: string) => {
 const paths: Record<string, string> = {
  star: '<path fill="#ffda38" d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
  clock: '<circle fill="#64c7ed" cx="12" cy="12" r="10"/><path fill="none" d="M12 5v7l5 3"/>',
  cash: '<path fill="#70b15c" d="M2 5h20v14H2z"/><circle fill="#abda83" cx="12" cy="12" r="5"/><path d="M11 8h3m-4 4h4m-3 4h3m-2-9v10"/>',
  bolt: '<path fill="#ffdc35" d="M14 1 4 14h7l-1 9 10-14h-7z"/>',
  heart: '<path fill="#e95a62" d="M12 21 3 12C-2 4 9-1 12 6c4-7 14-2 9 6z"/>',
  mail: '<path fill="#ecbd69" d="M2 5h20v15H2z"/><path fill="none" d="m2 5 10 9L22 5"/>',
  stats: '<path fill="#74b5d4" d="M3 14h5v7H3zm7-5h5v12h-5zm7-7h5v19h-5z"/>',
  map: '<path fill="#a9cc7f" d="m2 4 7-2 7 3 6-2v17l-6 2-7-3-7 2z"/><path fill="none" d="M9 2v17m7-14v17M3 14l6-5 7 5 5-5"/>',
  gear: '<path fill="#b7bec4" d="m9 2 6 0 1 4 4 1 2 5-3 3-1 5-5 2-3-3-5-1-2-5 3-3V5z"/><circle fill="#545d63" cx="12" cy="12" r="4"/>',
  thief: '<path fill="#efc553" d="M2 8q10-8 20 0v8q-10 7-20 0z"/><ellipse fill="#374948" cx="7" cy="12" rx="3" ry="2"/><ellipse fill="#374948" cx="17" cy="12" rx="3" ry="2"/>',
  bag: '<path fill="#bb9063" d="M5 7h14l2 15H3z"/><path fill="none" d="M8 9V5a4 4 0 0 1 8 0v4"/>',
  person: '<path d="M7 9 2 6m15 3 5-3M9 17l-4 5m10-5 4 5"/><circle fill="#1ee3f3" cx="12" cy="12" r="7"/><circle fill="#111" stroke="none" cx="10" cy="11" r=".8"/><circle fill="#111" stroke="none" cx="14" cy="11" r=".8"/>',
  stop: '<path fill="#df6664" d="M5 5h14v14H5z"/>',
 };
 return `<svg class="icon icon-${name}" viewBox="0 0 24 24" aria-hidden="true" stroke="#30343a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.star}</svg>`;
};

export class GameUI {
 public bridge?: CityBridge;
 private store: GameStore;
 private shell: HTMLElement;
 private panel: HTMLElement;
 private shade: HTMLElement;
 private feedback = '';
 private currentBuilding = '';
 private frame = 0;
 private seenCompletion = 0;
 private wasWanted = false;
 private busy = false;
 private toastTimer?: ReturnType<typeof setTimeout>;
 private panelVersion = 0;
 private timingKey?: (e: KeyboardEvent) => void;
 get isOpen() { return !this.shade.hidden; }

 constructor(store: GameStore) {
  this.store = store;
  document.querySelector('#app')!.innerHTML = `<main id="game-shell" aria-label="Stick City game">
   <header id="hud"><div class="masthead"><span><b>STICK CITY</b><small>RPG · VERSION 3</small></span><span id="save-status">● AUTOSAVED</span></div>
    <div class="hud-top"><button class="portrait icon-btn" data-main="stats" aria-label="Character statistics">${icon('person')}</button><div class="level-group"><div class="level-label">${icon('star')}<b id="level"></b><span id="xp-label"></span></div><div class="bar xp"><i id="xp-bar"></i></div></div><button class="icon-btn" data-main="missions" aria-label="Messages and missions">${icon('mail')}</button><button class="icon-btn" data-main="map" aria-label="City map">${icon('map')}</button><button class="icon-btn" data-main="settings" aria-label="Settings">${icon('gear')}</button></div>
    <div class="hud-vitals"><span class="clock-stat">${icon('clock')}<b id="clock"></b><small id="day"></small></span><span class="cash-stat">${icon('cash')}<b id="cash"></b></span><span class="vital">${icon('bolt')}<span class="bar energy"><i id="energy-bar"></i><b id="energy-label"></b></span></span><span class="vital">${icon('heart')}<span class="bar health"><i id="health-bar"></i><b id="health-label"></b></span></span></div>
   </header>
   <section id="world-view" aria-label="City. Tap to walk; tap a nearby door to enter."><div id="city-canvas"></div><div id="wanted-banner" role="status" hidden></div><div id="intro-tip"><b>A new life in Stick City</b><span>Tap to walk. Tap a door to enter.<br>Visit Town Hall for your first mission.</span><button aria-label="Dismiss introduction">×</button></div><div id="toast" role="status" hidden></div><div id="modal-shade" hidden><section id="modal" role="dialog" aria-modal="true" tabindex="-1"></section></div></section>
   <footer id="game-footer"><div class="location-strip"><span>● <b id="location-label">HOME · WEST DISTRICT</b></span><button id="stop-walking" aria-label="Stop walking">${icon('stop')} STOP</button></div><nav aria-label="Game menus"><button data-main="inventory" aria-label="Inventory">${icon('bag')}<span>ITEMS</span></button><button data-main="missions">${icon('mail')}<span>MISSIONS</span></button><button data-main="stats">${icon('stats')}<span>STATS</span></button><button data-main="map">${icon('map')}<span>MAP</span></button></nav></footer>
  </main><p class="desktop-help">TAP TO WALK <span>·</span> WASD / ARROW KEYS <span>·</span> E TO ENTER <span>·</span> SPACE TO STOP</p>`;
  this.shell = document.getElementById('game-shell')!;
  this.panel = document.getElementById('modal')!;
  this.shade = document.getElementById('modal-shade')!;
  this.shell.querySelectorAll<HTMLButtonElement>('[data-main]').forEach(b => b.onclick = () => this.openMain(b.dataset.main!));
  document.querySelector<HTMLButtonElement>('#intro-tip button')!.onclick = () => document.getElementById('intro-tip')!.remove();
  document.querySelector<HTMLButtonElement>('#stop-walking')!.onclick = () => { this.bridge?.stop(); this.toast('Walking stopped.'); };
  window.addEventListener('city-location', (e: Event) => { document.getElementById('location-label')!.textContent = (e as CustomEvent<string>).detail; });
  window.addEventListener('keydown', e => { if (e.code === 'Escape' && this.isOpen && !this.busy) this.close(); });
  window.addEventListener('keydown', e => { if(e.code === 'F2'){e.preventDefault();if(!this.busy)this.openDeveloper();} });
  store.subscribe(() => this.renderHUD());
 }

 private renderHUD() {
  const s = this.store.state;
  const clock = Math.floor(s.minutes % 1440);
  const hour = Math.floor(clock / 60);
  document.getElementById('level')!.textContent = `LEVEL ${s.level}`;
  document.getElementById('xp-label')!.textContent = `${s.xp}/${this.store.xpNeeded()} XP`;
  document.getElementById('xp-bar')!.style.width = `${Math.min(100, s.xp / this.store.xpNeeded() * 100)}%`;
  document.getElementById('clock')!.textContent = `${String(hour).padStart(2, '0')}:${String(clock % 60).padStart(2, '0')}`;
  document.getElementById('day')!.textContent = `DAY ${Math.floor(s.minutes / 1440) + 1}`;
  document.getElementById('cash')!.textContent = money(s.cash);
  const saving = document.getElementById('save-status')!;
  saving.textContent = !this.store.storageAvailable ? '⚠ SAVE UNAVAILABLE' : s.developerModified ? 'DEV-ALTERED SAVE' : '● AUTOSAVED';
  saving.style.color = !this.store.storageAvailable ? '#ffb09a' : s.developerModified ? '#ffe18a' : '#a9efb3';
  for (const v of ['energy', 'health'] as const) {
   document.getElementById(`${v}-bar`)!.style.width = `${s[v]}%`;
   document.getElementById(`${v}-label`)!.textContent = `${Math.round(s[v])}`;
  }
  const wanted=s.pursuit,banner=document.getElementById('wanted-banner')!;
  banner.hidden=!wanted;banner.textContent=wanted?`★ WANTED · ${Math.ceil(wanted.remaining)}s · RUN / USE COVER`:'';
  if(wanted){document.getElementById('intro-tip')?.remove();if(!this.wasWanted&&this.isOpen&&this.panel.dataset.view!=='developer')this.close();}
  this.wasWanted=!!wanted;
  const debug=document.getElementById('dev-coordinates'),snapshot=this.bridge?.snapshot();
  if(debug&&snapshot)debug.textContent=`Coordinates: ${snapshot.position.x.toFixed(1)}, ${snapshot.position.y.toFixed(1)}`;
  const fps=document.getElementById('dev-fps');if(fps&&snapshot)fps.textContent=`FPS: ${Math.round(snapshot.fps)} · NPCs: ${snapshot.npcs} · Cars: ${snapshot.cars}`;
  if(this.seenCompletion!==this.store.completionVersion){
    this.seenCompletion=this.store.completionVersion;this.toast(this.store.lastMessage);
    if(this.isOpen&&this.panel.dataset.view==='stats')this.openStats();
  }
 }

 toast(message: string) {
  const toast = document.getElementById('toast')!;
  toast.textContent = message; toast.hidden = false;
  clearTimeout(this.toastTimer);
  this.toastTimer = setTimeout(() => toast.hidden = true, 3800);
 }

 private show(name: string, subtitle: string, body: string, badge = 'CITY LIFE') {
  const sameScreen=this.isOpen&&this.panel.querySelector('h1')?.textContent===name;
  const previousScroll=this.panel.querySelector('.panel-body')?.scrollTop??0;
  const feedbackExtent=(el:Element|null)=>el?(el as HTMLElement).offsetHeight+(parseFloat(getComputedStyle(el).marginBottom)||0):0;
  const previousFeedback=feedbackExtent(this.panel.querySelector('.feedback'));
  this.bridge?.stop();
  cancelAnimationFrame(this.frame);
  if (this.timingKey) window.removeEventListener('keydown', this.timingKey);
  this.timingKey = undefined;
  this.panelVersion++;
  this.busy = false;
  this.shade.hidden = false;
  this.panel.dataset.view='';
  this.panel.innerHTML = `<div class="panel-heading"><div><small>${esc(badge)}</small><h1>${esc(name)}</h1></div><button class="close-panel" aria-label="Exit menu">×</button></div><div class="panel-subtitle">${esc(subtitle)}</div><div class="panel-body">${this.feedback ? `<div class="feedback" role="status">${esc(this.feedback)}</div>` : ''}${body}</div><div class="panel-footer"><span>${icon('cash')} ${money(this.store.state.cash)}</span><button class="back-button">BACK TO CITY ↩</button></div>`;
  this.panel.querySelector<HTMLButtonElement>('.close-panel')!.onclick = () => this.close();
  this.panel.querySelector<HTMLButtonElement>('.back-button')!.onclick = () => this.close();
  if(sameScreen){const scroller=this.panel.querySelector('.panel-body')!;scroller.scrollTop=previousScroll+feedbackExtent(this.panel.querySelector('.feedback'))-previousFeedback;}
  this.panel.focus({ preventScroll: true });
 }

 private close() {
  if (this.busy) { this.toast('Finish this activity first.'); return; }
  cancelAnimationFrame(this.frame);
  if (this.timingKey) window.removeEventListener('keydown', this.timingKey);
  this.timingKey = undefined;
  this.panelVersion++;
  this.shade.hidden = true;
  this.feedback = '';
  this.currentBuilding = '';
 }

 private openMain(name: string) {
  if (this.busy) return;
  this.feedback = '';
  this.currentBuilding = '';
  if (name === 'inventory') this.openInventory();
  if (name === 'missions') this.openMissions();
  if (name === 'stats') this.openStats();
  if (name === 'map') this.openMap();
  if (name === 'settings') this.openSettings();
 }

 openBuilding(id: string) {
  if (this.busy) return;
  if(this.store.state.pursuit){this.toast('Lose the police before entering buildings.');return;}
  const building = BUILDINGS.find(b => b.id === id);
  if (!building) return;
  this.currentBuilding = id;
  this.store.visit(id);
  const activities = ACTIVITIES.filter(a => a.building === id).map(a => this.store.quoteActivity(a));
  let body = `<div class="building-flavour"><span class="building-mark" style="--building-color:#${building.color.toString(16).padStart(6, '0')}">${esc(building.short.slice(0, 2))}</span><p>${esc(building.description)}</p></div>`;
  if(activities.some(a=>a.career))body+=`<p class="career-heading">CAREER LADDER · Positions unlock through skills, levels and qualifications.</p><p class="fine-print">Current job: ${esc(JOBS.find(j=>j.id===this.store.state.currentJob)?.label||'None')}<br>Your qualifications: ${esc(this.store.state.qualifications.map(qualificationName).join(', ')||'None yet. Study at City College.')}</p>`;
  body += activities.map(a => {
   const requirements=this.store.requirements(a), missing=requirements.some(r=>!r.met);
   const qualified=!!a.qualification&&this.store.state.qualifications.includes(a.qualification);
   const changes=[a.cash?`${a.cash<0?'−':'+'}${money(Math.abs(a.cash))}`:'',a.energy?`${a.energy<0?'−':'+'}${Math.abs(a.energy)} energy`:'',a.health?`+${a.health} health`:'',`${a.minutes} game min`,a.xp?`+${a.xp} XP`:'',a.skill?`+${a.skillXP||0} ${a.skill} XP`:''].filter(Boolean);
   const owned=!!a.item&&!!ITEMS[a.item]?.equipment&&(this.store.state.inventory[a.item]??0)>0;
   const disabled=missing||qualified||owned;
   return `<div class="activity ${a.career?'career-role':''}"><div><h2>${esc(a.label)}${qualified?' ✓':''}</h2><p>${esc(a.description)}${a.item?` · Owned: ${this.store.state.inventory[a.item]??0}`:''}</p><small class="activity-cost">${esc(changes.join(' · '))}</small>${requirements.length?`<small class="requirements">${requirements.map(r=>`<span class="${r.met?'met':'locked'}">${r.met?'✓':'✗'} ${esc(r.text)}</span>`).join(' · ')}</small>`:''}</div><button aria-label="${esc(a.label)}" data-activity="${esc(a.id)}" ${disabled?'disabled':''}>${qualified?'EARNED':owned?'OWNED':missing?'LOCKED':a.item?'BUY':a.career?'WORK':a.qualification?'ENROL':'GO'}</button></div>`;
  }).join('');
  if (id === 'bank') body += `<div class="bank-balances"><span>CASH <b>${money(this.store.state.cash)}</b></span><span>IN BANK <b>${money(this.store.state.bank)}</b></span></div><label class="amount-label">Amount <input id="bank-amount" type="number" inputmode="numeric" min="1" step="1" value="50"></label><div class="button-pair"><button id="deposit">DEPOSIT →</button><button id="withdraw">← WITHDRAW</button></div><p class="fine-print">Your bank balance is saved automatically. No fees.</p>`;
  if (id === 'casino') body += `<div class="casino-preview"><b>★ LUCKY THREE ★</b><div class="preview-reels">7 <span>◆</span> 7</div><p>Three spinning reels. Pick your stake and test your luck.</p><button id="open-slots">PLAY THE SLOTS</button></div>`;
  if (id === 'diner' || id === 'post') body += `<div class="activity"><div><h2>Precision shift</h2><p>Stop the moving marker in the green zone. Better timing earns a better wage.</p><small class="activity-cost">${BALANCE.timing.energy} energy · ${BALANCE.timing.minutes} min · Up to $${BALANCE.timing.maxPay} + ${BALANCE.timing.xp} XP</small></div><button id="open-work">PLAY</button></div>`;
  if (id === 'townhall' || id === 'gang') body += this.missionCards(MISSIONS.filter(m => m.giver === id));
  const robbery=this.store.robberyQuote(id);
  if(robbery){const alert=robbery.readyAt>this.store.state.minutes;
    body+=`<section class="robbery-panel"><h2>THIEVING · Rob this building</h2><p>Requires Thieving ${robbery.skill} · character level ${robbery.level}</p><p><b>${(robbery.chance*100).toFixed(1)}% success · $${robbery.min}–$${robbery.max}</b></p><p>${robbery.energy} energy · ${robbery.minutes} game minutes · +${robbery.skillXP} Thieving XP on success.</p><p class="crime-risk">Failure brings an armed 30-second police pursuit. Keep moving; walls stop bullets. Being taken down costs money and sends you to the clinic.</p>${alert?`<p>Security alert: ${Math.ceil(robbery.readyAt-this.store.state.minutes)} more game minutes. Work or rest to advance the clock instantly.</p>`:''}<button id="rob-building" ${!robbery.eligible||alert?'disabled':''}>ATTEMPT ROBBERY · ${(robbery.chance*100).toFixed(1)}%</button></section>`;
  }
  this.show(building.name, building.kind.toUpperCase(), body, 'INSTANT RESULTS · GAME TIME ONLY');
  this.panel.querySelector<HTMLButtonElement>('#rob-building')?.addEventListener('click',()=>{const r=this.store.robBuilding(id);if(this.store.state.pursuit){this.close();this.toast(r.message);}else{this.feedback=r.message;this.openBuilding(id);}});
  this.panel.querySelectorAll<HTMLButtonElement>('[data-activity]').forEach(b => b.onclick = () => { const r = this.store.perform(b.dataset.activity!); this.feedback = r.message; this.openBuilding(id); });
  this.bindMissionButtons(() => this.openBuilding(id));
  this.panel.querySelector<HTMLButtonElement>('#deposit')?.addEventListener('click', () => { this.feedback = this.store.deposit(Number((this.panel.querySelector('#bank-amount') as HTMLInputElement).value)).message; this.openBuilding(id); });
  this.panel.querySelector<HTMLButtonElement>('#withdraw')?.addEventListener('click', () => { this.feedback = this.store.withdraw(Number((this.panel.querySelector('#bank-amount') as HTMLInputElement).value)).message; this.openBuilding(id); });
  this.panel.querySelector<HTMLButtonElement>('#open-slots')?.addEventListener('click', () => { this.feedback = ''; this.openSlots(); });
  this.panel.querySelector<HTMLButtonElement>('#open-work')?.addEventListener('click', () => { this.feedback = ''; this.openTiming('work'); });
 }

 private openDeveloper() {
  if(this.busy)return;
  this.currentBuilding='';
  this.show('Developer Menu','TESTING ONLY · F2',developerMarkup(this.store),'DEVELOPER TOOLS');
  this.panel.dataset.view='developer';
  bindDeveloper(this.panel,this.store,this.bridge,()=>this.openDeveloper(),message=>{this.feedback=message;this.toast(message);});
 }

 private openInventory() {
  const entries = Object.entries(this.store.state.inventory).filter(([, n]) => n > 0);
  const body = entries.length ? entries.map(([id, n]) => {
   const item = ITEMS[id];
   return `<div class="activity"><div><h2>${esc(item?.name || id)} <span class="item-count">×${n}</span></h2><p>${esc(item?.description || 'An item from the city.')}</p></div><button data-item="${esc(id)}" ${item.equipment?'disabled':''}>${item.equipment?'EQUIPPED':'USE'}</button></div>`;
  }).join('') : `<div class="empty-state">${icon('bag')}<h2>Your bag is empty</h2><p>Pick up food and supplies at the café or general store. Use them here whenever you need a boost.</p></div>`;
  this.show('Inventory', 'FOOD, SUPPLIES & THE LITTLE THINGS', body, 'YOUR BAG');
  this.panel.querySelectorAll<HTMLButtonElement>('[data-item]').forEach(b => b.onclick = () => { this.feedback = this.store.useItem(b.dataset.item!).message; this.openInventory(); });
 }

 private missionCards(missions: Mission[], remote = false) {
  return missions.map(m => {
   const status = this.store.state.missions[m.id];
   const progress = Math.min(m.target, this.store.missionProgress(m.id));
   const blocked = !!m.prerequisite && this.store.state.missions[m.prerequisite] !== 'complete';
   const giver = BUILDINGS.find(b => b.id === m.giver)?.name || m.giver;
   return `<article class="mission"><div class="mission-top"><small>${esc(giver)}</small><span class="mission-status ${status || ''}">${status === 'complete' ? '✓ COMPLETE' : status === 'active' ? 'IN PROGRESS' : 'NEW MISSION'}</span></div><h2>${esc(m.title)}</h2><p>${esc(m.description)}</p><div class="objective">${esc(m.objective)}${status ? `<b>${progress}/${m.target}</b>` : ''}</div>${m.objectives?`<ul class="mission-objectives">${this.store.missionObjectives(m.id).map(o=>`<li>${esc(o.label)}: ${o.current}/${o.target}</li>`).join('')}</ul>`:''}<small class="mission-reward">REWARD: ${money(m.reward)} · ${m.xp} XP</small>${status === 'complete' ? '' : remote ? `<button data-mission-destination="${esc(m.giver)}">VISIT ${esc(BUILDINGS.find(b => b.id === m.giver)?.short || m.giver)}</button>` : blocked ? '<small class="requirements locked">Complete the previous mission first.</small>' : status === 'active' ? `<button data-claim="${esc(m.id)}" ${progress < m.target ? 'disabled' : ''}>${progress >= m.target ? 'COLLECT REWARD' : 'OBJECTIVE IN PROGRESS'}</button>` : `<button data-accept="${esc(m.id)}">ACCEPT MISSION</button>`}</article>`;
  }).join('');
 }

 private bindMissionButtons(rerender: () => void) {
  this.panel.querySelectorAll<HTMLButtonElement>('[data-accept]').forEach(b => b.onclick = () => { this.feedback = this.store.acceptMission(b.dataset.accept!).message; rerender(); });
  this.panel.querySelectorAll<HTMLButtonElement>('[data-claim]').forEach(b => b.onclick = () => { this.feedback = this.store.claimMission(b.dataset.claim!).message; rerender(); });
 }

 private openMissions() {
  this.show('Messages & missions', 'A SMALL CITY. PLENTY OF OPPORTUNITY.', this.missionCards(MISSIONS, true), 'YOUR CONTACTS');
  this.bindMissionButtons(() => this.openMissions());
  this.panel.querySelectorAll<HTMLButtonElement>('[data-mission-destination]').forEach(b => b.onclick = () => { const id = b.dataset.missionDestination!; this.close(); this.bridge?.goToBuilding(id); this.toast('Head to the contact to accept missions and collect rewards.'); });
 }

 private openStats() {
  const s = this.store.state;
  this.show('Character statistics', 'MAKE A LITTLE PROGRESS EVERY DAY', `<div class="character-summary">${icon('person')}<div><h2>New kid in the city</h2><p>LEVEL ${s.level} · ${s.xp}/${this.store.xpNeeded()} XP</p></div></div><div class="stats-grid"><span>CASH<b>${money(s.cash)}</b></span><span>BANK BALANCE<b>${money(s.bank)}</b></span><span>ENERGY<b>${s.energy}/100</b></span><span>HEALTH<b>${s.health}/100</b></span><span>LOCATIONS VISITED<b>${s.visited.length}/${BUILDINGS.length}</b></span><span>MISSIONS COMPLETE<b>${Object.values(s.missions).filter(v => v === 'complete').length}/${MISSIONS.length}</b></span></div><h2 class="section-label">SKILLS</h2>${Object.entries(s.skills).map(([k, v]) => `<div class="skill-row">${icon(k==='thieving'?'thief':k==='strength'?'bolt':k==='charm'?'heart':k==='intelligence'?'star':'stats')}<b>${esc(title(k))}</b><div class="skill-track"><i style="width:${Math.min(s.skillXP[k as keyof typeof s.skillXP] / skillXP(v) * 100, 100)}%"></i></div><strong>${v}</strong><small>${s.skillXP[k as keyof typeof s.skillXP]}/${skillXP(v)} XP</small></div>`).join('')}<button class="wide" id="open-careers">CAREERS & EDUCATION</button><h2 class="section-label">QUALIFICATIONS</h2><p>${esc(s.qualifications.map(qualificationName).join(', ')||'None yet. Visit City College for courses.')}</p><h2 class="section-label">CAREERS</h2>${[...new Set(JOBS.map(j=>j.career))].map(c=>`<p><b>${esc(c)}</b>: ${JOBS.filter(j=>j.career===c).map(j=>`${esc(j.label)} ${this.store.requirements(j).every(r=>r.met)?'✓':'(locked)'}`).join(' → ')}</p>`).join('')}<p class="fine-print">Skill bars show earned XP towards the next level. Train higher skills over longer sessions. Qualifications are permanent.</p>`, 'PLAYER PROFILE');
  this.panel.dataset.view='stats';
  this.panel.querySelector<HTMLButtonElement>('#open-careers')!.onclick=()=>this.openCareers();
 }

 private openCareers(){
  const current=JOBS.find(j=>j.id===this.store.state.currentJob);
  let body=`<p class="career-summary"><b>Current job: ${esc(current?.label||'None')}</b>${current?` · $${current.cash} per ${current.minutes}-minute shift`:''}</p><p>Choose a qualified role explicitly. Promotions are never automatic. Visit the workplace to work a shift.</p><p>Qualifications: ${esc(this.store.state.qualifications.map(qualificationName).join(', ')||'None yet.')}</p><button id="career-college" class="wide">VISIT COLLEGE · COURSES</button>`;
  for(const path of [...new Set(JOBS.map(j=>j.career))]){
   body+=`<h2 class="section-label">${esc(path)}</h2>`;
   for(const job of JOBS.filter(j=>j.career===path)){
    const req=this.store.requirements(job),eligible=req.every(r=>r.met),selected=job.id===this.store.state.currentJob;
    body+=`<article class="career-position"><h2>${esc(job.label)} ${selected?'★ CURRENT':''}</h2><p>$${job.cash} · ${job.minutes} game min · ${Math.abs(job.energy??0)} energy · ${job.xp} XP · ${job.skillXP} ${job.skill} XP</p><p>${req.length?req.map(r=>`${r.met?'✓':'✗'} ${esc(r.text)}`).join(' · '):'Entry role · no prerequisites'}</p><div class="button-pair"><button data-apply-job="${job.id}" ${!eligible||selected?'disabled':''}>${selected?'CURRENT':eligible?'TAKE JOB':'LOCKED'}</button><button data-job-location="${job.building}">VISIT WORKPLACE</button></div></article>`;
   }
  }
  this.currentBuilding='';this.show('Careers & education',`${JOBS.length} ROLES · EXPLICIT QUALIFICATIONS`,body,'CAREER LADDER');
  this.panel.querySelectorAll<HTMLButtonElement>('[data-apply-job]').forEach(b=>b.onclick=()=>{this.feedback=this.store.applyForJob(b.dataset.applyJob!).message;this.openCareers();});
  this.panel.querySelectorAll<HTMLButtonElement>('[data-job-location]').forEach(b=>b.onclick=()=>{this.close();this.bridge?.goToBuilding(b.dataset.jobLocation!);});
  this.panel.querySelector<HTMLButtonElement>('#career-college')!.onclick=()=>{this.close();this.bridge?.goToBuilding('school');};
 }

 private openMap() {
  this.show('District map', 'CHOOSE A LOCATION TO WALK THERE', `<div class="district-map">${BUILDINGS.map((b, i) => `<button data-destination="${esc(b.id)}" style="--map-color:#${b.color.toString(16).padStart(6, '0')};grid-column:${i % 4 + 1};grid-row:${Math.floor(i / 4) + 1}"><span>${esc(b.short)}</span><small>${this.store.state.visited.includes(b.id) ? '✓ VISITED' : 'EXPLORE'}</small></button>`).join('')}</div><p class="fine-print">You will walk to the entrance. Tap a new destination, press STOP, or use the arrow keys to change course.</p>`, 'WEST DISTRICT');
  this.panel.querySelectorAll<HTMLButtonElement>('[data-destination]').forEach(b => b.onclick = () => { const id = b.dataset.destination!; this.close(); this.bridge?.goToBuilding(id); this.toast(`Walking to ${BUILDINGS.find(v => v.id === id)?.name}.`); });
 }

 private openSettings(confirmReset = false) {
  const body = `<div class="settings-copy"><h2>Your city is saved on this device.</h2><p>Position, money, inventory, skills, and missions save automatically. Keep using this browser to continue your game.</p></div><button class="wide" id="continue-game">CONTINUE GAME</button><button class="wide" id="save-game">SAVE NOW</button><button id="open-developer" class="dev-entry">DEV · TESTING TOOLS</button><h2 class="section-label">HOW TO PLAY</h2><ul class="instructions"><li>Tap a pavement or street to walk there.</li><li>Tap a nearby door, or press E, to enter.</li><li>Use WASD or arrow keys on a computer.</li><li>Press Space or STOP to cancel your walk.</li><li>Work for cash, study to unlock jobs, and sleep at home to recover.</li></ul><div class="reset-area">${confirmReset ? '<p><b>Start over?</b> This erases your saved progress on this device.</p><button class="danger wide" id="confirm-reset">YES, START A NEW GAME</button><button class="wide" id="cancel-reset">KEEP MY PROGRESS</button>' : '<button class="danger wide" id="new-game">NEW GAME / RESET</button>'}</div><p class="fine-print">Stick City Remake · Version 3<br>Original artwork made for this browser recreation.</p>`;
  this.show('Settings', 'SAVING & GAME CONTROLS', body, 'STICK CITY');
  this.panel.querySelector<HTMLButtonElement>('#open-developer')!.onclick = () => this.openDeveloper();
  this.panel.querySelector<HTMLButtonElement>('#continue-game')!.onclick = () => this.close();
  this.panel.querySelector<HTMLButtonElement>('#save-game')!.onclick = () => { const p=this.bridge?.snapshot().position;if(p)this.store.moveTo(p.x,p.y);this.store.save(); this.feedback = this.store.storageAvailable ? 'Progress saved on this device.' : 'Browser storage is unavailable. Progress cannot be saved in this browsing mode.'; this.openSettings(); };
  this.panel.querySelector<HTMLButtonElement>('#new-game')?.addEventListener('click', () => this.openSettings(true));
  this.panel.querySelector<HTMLButtonElement>('#cancel-reset')?.addEventListener('click', () => this.openSettings());
  this.panel.querySelector<HTMLButtonElement>('#confirm-reset')?.addEventListener('click', () => { this.store.reset(); this.bridge?.resetPosition(); this.close(); this.toast('A new day. A new start. Welcome to Stick City!'); });
 }

 openNPC(name:string){
  if(this.busy)return;if(this.store.state.pursuit){this.toast('Keep running. Talk after you lose the police.');return;}
  const quote=this.store.pickpocketQuote(name),alert=quote.readyAt>this.store.state.minutes;
  const line=this.store.state.currentJob?'“Working your way up? College courses open the next career steps.”':'“New in town? The diner, store and clinic have entry jobs.”';
  this.show(name,'A FACE IN THE NEIGHBOURHOOD',`<div class="npc-portrait">${icon('person')}</div><p class="dialogue">${esc(line)}</p><div class="button-pair"><button id="npc-chat">SAY HELLO</button><button id="npc-work">ASK ABOUT WORK</button></div><button id="npc-rumour" class="wide">ASK ABOUT LOCAL RUMOURS</button><section class="crime-warning"><h2>Thieving · Pickpocket</h2><p>${(quote.chance*100).toFixed(1)}% success · $${CRIME.pickpocket.minPay}–$${CRIME.pickpocket.maxPay} · ${CRIME.pickpocket.energy} energy · ${CRIME.pickpocket.minutes} game min.</p><p>Success earns Thieving XP. Failure costs up to $${CRIME.pickpocket.fine} and ${CRIME.pickpocket.injury} health. ${alert?'This person is alert; try someone else or advance the game clock.':''}</p><button id="npc-crime" ${alert?'disabled':''}>PICKPOCKET NOW</button></section>`,'STREET CONVERSATION');
  for(const[id,choice]of [['npc-chat','greet'],['npc-work','work'],['npc-rumour','rumour']]as const)this.panel.querySelector<HTMLButtonElement>(`#${id}`)!.onclick=()=>{const r=this.store.talkTo(name,choice);this.feedback=r.message;this.toast(r.message);this.openNPC(name);};
  this.panel.querySelector<HTMLButtonElement>('#npc-crime')!.onclick=()=>{const r=this.store.pickpocket(name);this.feedback=r.message;this.openNPC(name);};
 }

 private openTiming(mode: 'work' | 'pickpocket') {
  this.feedback = '';
  const crime = mode === 'pickpocket';
  this.show(crime ? 'Light fingers' : 'Precision shift', crime ? 'HIGH RISK · KEEP YOUR NERVE' : 'GOOD TIMING. BETTER PAY.', `<div class="timing-illustration">${icon(crime ? 'bag' : 'bolt')}</div><p class="game-explainer">${crime ? 'Watch the moving marker. A stop in the green zone improves your chance of lifting the wallet. Even a perfect attempt carries risk.' : 'Keep the orders moving. Stop the marker in the green zone for a perfect shift.'}</p><div class="timing-meter" aria-label="Moving timing marker"><div class="timing-zone"></div><div id="timing-needle"></div></div><div class="meter-labels"><span>TOO EARLY</span><b>PERFECT</b><span>TOO LATE</span></div><button class="wide timing-stop" id="timing-stop">STOP!</button><p class="fine-print">Tap STOP or press Space. ${crime ? 'Costs 8 energy and 30 minutes. A miss risks a fine and injury.' : 'Costs 8 energy and 30 minutes. A precise shift pays the displayed maximum. Rewards apply immediately when you stop the marker.'}</p>`, 'SKILL CHALLENGE');
  const needle = document.getElementById('timing-needle')!;
  const start = performance.now();
  let pos = 0;
  let running = true;
  const version = this.panelVersion;
  const animate = () => { if (!running || version !== this.panelVersion) return; pos = (Math.sin((performance.now() - start) / (crime ? 230 : 320) - Math.PI / 2) + 1) / 2; needle.style.left = `${pos * 100}%`; this.frame = requestAnimationFrame(animate); };
  const stop = () => {
   if (!running || version !== this.panelVersion) return;
   running = false; cancelAnimationFrame(this.frame);
   window.removeEventListener('keydown', key);
   const result = this.store.finishTiming(mode, Math.max(0, 1 - Math.abs(pos - .5) * 2));
   this.feedback = result.message;
   this.show(crime ? 'The moment of truth' : 'Precision shift', result.ok ? 'TIMING RECORDED' : 'TRY AGAIN', `<div class="challenge-result ${result.ok ? 'success' : 'failure'}">${result.ok ? '✓' : '!'}</div><button id="retry-timing" class="wide">TRY AGAIN</button>`, 'SKILL CHALLENGE');
   this.panel.querySelector<HTMLButtonElement>('#retry-timing')!.onclick = () => this.openTiming(mode);
  };
  const key = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); stop(); } };
  this.timingKey = key;
  window.addEventListener('keydown', key);
  document.getElementById('timing-stop')!.onclick = stop;
  animate();
 }

 private openSlots() {
  this.feedback = '';
  this.show('Lucky Three', 'A LITTLE LUCK CAN GO A LONG WAY', `<div class="slot-machine"><div class="slot-marquee">★ LUCKY THREE ★</div><div class="slot-reels"><span>7</span><span>◆</span><span>7</span></div><div class="slot-caption" id="slot-result">Choose your stake. Good luck!</div><div class="slot-controls"><label>BET <select id="slot-bet"><option value="5">$5</option><option value="10">$10</option><option value="25">$25</option></select></label><button id="spin-slots">SPIN!</button></div></div><div class="paytable"><h2>PAY TABLE</h2><p>777 <b>20× BET</b></p><p>THREE MATCHING <b>8× BET</b></p><p>ANY PAIR <b>1× BET</b></p><small>Winnings include the stake. Each spin costs 5 minutes.</small></div>`, 'CASINO · SLOTS');
  const button = document.getElementById('spin-slots') as HTMLButtonElement;
  button.onclick = () => {
   const bet = Number((document.getElementById('slot-bet') as HTMLSelectElement).value);
   const result = this.store.spinSlots(bet);
   if (!result.ok) { document.getElementById('slot-result')!.textContent = result.message; return; }
   cancelAnimationFrame(this.frame);
   const reels=Array.from(this.panel.querySelectorAll<HTMLElement>('.slot-reels span'));
   reels.forEach((r,i)=>r.textContent=result.reels[i]);
   document.getElementById('slot-result')!.textContent=result.message;
   this.panel.querySelector('.panel-footer span')!.innerHTML=`${icon('cash')} ${money(this.store.state.cash)}`;
   const machine=this.panel.querySelector('.slot-machine')!;machine.classList.remove('slot-flash');void (machine as HTMLElement).offsetWidth;machine.classList.add('slot-flash');
  };
 }
}
