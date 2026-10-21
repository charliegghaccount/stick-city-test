import { BUILDINGS, ACTIVITIES, MISSIONS, ITEMS } from './content';
import { GameStore } from './model';
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
 private busy = false;
 private toastTimer?: ReturnType<typeof setTimeout>;
 private panelVersion = 0;
 private timingKey?: (e: KeyboardEvent) => void;
 get isOpen() { return !this.shade.hidden; }

 constructor(store: GameStore) {
  this.store = store;
  document.querySelector('#app')!.innerHTML = `<main id="game-shell" aria-label="Stick City game">
   <header id="hud"><div class="masthead"><span><b>STICK CITY</b><small>RPG · DISTRICT 01</small></span><span id="save-status">● AUTOSAVED</span></div>
    <div class="hud-top"><button class="portrait icon-btn" data-main="stats" aria-label="Character statistics">${icon('person')}</button><div class="level-group"><div class="level-label">${icon('star')}<b id="level"></b><span id="xp-label"></span></div><div class="bar xp"><i id="xp-bar"></i></div></div><button class="icon-btn" data-main="missions" aria-label="Messages and missions">${icon('mail')}</button><button class="icon-btn" data-main="map" aria-label="City map">${icon('map')}</button><button class="icon-btn" data-main="settings" aria-label="Settings">${icon('gear')}</button></div>
    <div class="hud-vitals"><span class="clock-stat">${icon('clock')}<b id="clock"></b><small id="day"></small></span><span class="cash-stat">${icon('cash')}<b id="cash"></b></span><span class="vital">${icon('bolt')}<span class="bar energy"><i id="energy-bar"></i><b id="energy-label"></b></span></span><span class="vital">${icon('heart')}<span class="bar health"><i id="health-bar"></i><b id="health-label"></b></span></span></div>
   </header>
   <section id="world-view" aria-label="City. Tap to walk; tap a nearby door to enter."><div id="city-canvas"></div><div id="intro-tip"><b>A new life in Stick City</b><span>Tap to walk. Tap a door to enter.<br>Visit Town Hall for your first mission.</span><button aria-label="Dismiss introduction">×</button></div><div id="toast" role="status" hidden></div><div id="modal-shade" hidden><section id="modal" role="dialog" aria-modal="true" tabindex="-1"></section></div></section>
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
  saving.textContent = this.store.storageAvailable ? '● AUTOSAVED' : '⚠ SAVE UNAVAILABLE';
  saving.style.color = this.store.storageAvailable ? '#a9efb3' : '#ffb09a';
  for (const v of ['energy', 'health'] as const) {
   document.getElementById(`${v}-bar`)!.style.width = `${s[v]}%`;
   document.getElementById(`${v}-label`)!.textContent = `${Math.round(s[v])}`;
  }
 }

 toast(message: string) {
  const toast = document.getElementById('toast')!;
  toast.textContent = message; toast.hidden = false;
  clearTimeout(this.toastTimer);
  this.toastTimer = setTimeout(() => toast.hidden = true, 3800);
 }

 private show(name: string, subtitle: string, body: string, badge = 'CITY LIFE') {
  this.bridge?.stop();
  cancelAnimationFrame(this.frame);
  if (this.timingKey) window.removeEventListener('keydown', this.timingKey);
  this.timingKey = undefined;
  this.panelVersion++;
  this.busy = false;
  this.shade.hidden = false;
  this.panel.innerHTML = `<div class="panel-heading"><div><small>${esc(badge)}</small><h1>${esc(name)}</h1></div><button class="close-panel" aria-label="Exit menu">×</button></div><div class="panel-subtitle">${esc(subtitle)}</div><div class="panel-body">${this.feedback ? `<div class="feedback" role="status">${esc(this.feedback)}</div>` : ''}${body}</div><div class="panel-footer"><span>${icon('cash')} ${money(this.store.state.cash)}</span><button class="back-button">BACK TO CITY ↩</button></div>`;
  this.panel.querySelector<HTMLButtonElement>('.close-panel')!.onclick = () => this.close();
  this.panel.querySelector<HTMLButtonElement>('.back-button')!.onclick = () => this.close();
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
  const building = BUILDINGS.find(b => b.id === id);
  if (!building) return;
  this.currentBuilding = id;
  this.store.visit(id);
  const activities = ACTIVITIES.filter(a => a.building === id);
  let body = `<div class="building-flavour"><span class="building-mark" style="--building-color:#${building.color.toString(16).padStart(6, '0')}">${esc(building.short.slice(0, 2))}</span><p>${esc(building.description)}</p></div>`;
  body += activities.map(a => {
   const requirements = [a.requireLevel ? `Level ${a.requireLevel}` : '', a.requireSkill ? `${title(a.requireSkill[0])} ${a.requireSkill[1]}` : ''].filter(Boolean);
   const changes = [a.cash ? `${a.cash < 0 ? '−' : '+'}${money(Math.abs(a.cash))}` : '', a.energy ? `${a.energy < 0 ? '−' : '+'}${Math.abs(a.energy)} energy` : '', a.health ? `${a.health < 0 ? '−' : '+'}${Math.abs(a.health)} health` : '', a.minutes ? `${a.minutes} min` : '', a.xp ? `+${a.xp} XP` : ''].filter(Boolean);
   const locked = (a.requireLevel || 0) > this.store.state.level || !!(a.requireSkill && this.store.state.skills[a.requireSkill[0]] < a.requireSkill[1]);
   return `<div class="activity"><div><h2>${esc(a.label)}</h2><p>${esc(a.description)}</p><small class="activity-cost">${esc(changes.join(' · '))}</small>${requirements.length ? `<small class="requirements ${locked ? 'locked' : ''}">${locked ? '🔒 ' : '✓ '}${esc(requirements.join(' · '))}</small>` : ''}</div><button aria-label="${esc(a.label)}" data-activity="${esc(a.id)}" ${locked ? 'disabled' : ''}>${locked ? 'LOCKED' : a.item ? 'BUY' : 'GO'}</button></div>`;
  }).join('');
  if (id === 'bank') body += `<div class="bank-balances"><span>CASH <b>${money(this.store.state.cash)}</b></span><span>IN BANK <b>${money(this.store.state.bank)}</b></span></div><label class="amount-label">Amount <input id="bank-amount" type="number" inputmode="numeric" min="1" step="1" value="50"></label><div class="button-pair"><button id="deposit">DEPOSIT →</button><button id="withdraw">← WITHDRAW</button></div><p class="fine-print">Your bank balance is saved automatically. No fees.</p>`;
  if (id === 'casino') body += `<div class="casino-preview"><b>★ LUCKY THREE ★</b><div class="preview-reels">7 <span>◆</span> 7</div><p>Three spinning reels. Pick your stake and test your luck.</p><button id="open-slots">PLAY THE SLOTS</button></div>`;
  if (id === 'diner' || id === 'post') body += `<div class="activity"><div><h2>Precision shift</h2><p>Stop the moving marker in the green zone. Better timing earns a better wage.</p><small class="activity-cost">8 energy · 30 min · Up to $40</small></div><button id="open-work">PLAY</button></div>`;
  if (id === 'townhall' || id === 'gang') body += this.missionCards(MISSIONS.filter(m => m.giver === id));
  this.show(building.name, building.kind.toUpperCase(), body, 'STICK CITY · OPEN');
  this.panel.querySelectorAll<HTMLButtonElement>('[data-activity]').forEach(b => b.onclick = () => { const r = this.store.perform(b.dataset.activity!); this.feedback = r.message; this.openBuilding(id); });
  this.bindMissionButtons(() => this.openBuilding(id));
  this.panel.querySelector<HTMLButtonElement>('#deposit')?.addEventListener('click', () => { this.feedback = this.store.deposit(Number((this.panel.querySelector('#bank-amount') as HTMLInputElement).value)).message; this.openBuilding(id); });
  this.panel.querySelector<HTMLButtonElement>('#withdraw')?.addEventListener('click', () => { this.feedback = this.store.withdraw(Number((this.panel.querySelector('#bank-amount') as HTMLInputElement).value)).message; this.openBuilding(id); });
  this.panel.querySelector<HTMLButtonElement>('#open-slots')?.addEventListener('click', () => { this.feedback = ''; this.openSlots(); });
  this.panel.querySelector<HTMLButtonElement>('#open-work')?.addEventListener('click', () => { this.feedback = ''; this.openTiming('work'); });
 }

 private openInventory() {
  const entries = Object.entries(this.store.state.inventory).filter(([, n]) => n > 0);
  const body = entries.length ? entries.map(([id, n]) => {
   const item = ITEMS[id];
   return `<div class="activity"><div><h2>${esc(item?.name || id)} <span class="item-count">×${n}</span></h2><p>${esc(item?.description || 'An item from the city.')}</p></div><button data-item="${esc(id)}">USE</button></div>`;
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
   return `<article class="mission"><div class="mission-top"><small>${esc(giver)}</small><span class="mission-status ${status || ''}">${status === 'complete' ? '✓ COMPLETE' : status === 'active' ? 'IN PROGRESS' : 'NEW MISSION'}</span></div><h2>${esc(m.title)}</h2><p>${esc(m.description)}</p><div class="objective">${esc(m.objective)}${status ? `<b>${progress}/${m.target}</b>` : ''}</div><small class="mission-reward">REWARD: ${money(m.reward)} · ${m.xp} XP</small>${status === 'complete' ? '' : remote ? `<button data-mission-destination="${esc(m.giver)}">VISIT ${esc(BUILDINGS.find(b => b.id === m.giver)?.short || m.giver)}</button>` : blocked ? '<small class="requirements locked">Complete the previous mission first.</small>' : status === 'active' ? `<button data-claim="${esc(m.id)}" ${progress < m.target ? 'disabled' : ''}>${progress >= m.target ? 'COLLECT REWARD' : 'OBJECTIVE IN PROGRESS'}</button>` : `<button data-accept="${esc(m.id)}">ACCEPT MISSION</button>`}</article>`;
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
  this.show('Character statistics', 'MAKE A LITTLE PROGRESS EVERY DAY', `<div class="character-summary">${icon('person')}<div><h2>New kid in the city</h2><p>LEVEL ${s.level} · ${s.xp}/${this.store.xpNeeded()} XP</p></div></div><div class="stats-grid"><span>CASH<b>${money(s.cash)}</b></span><span>BANK BALANCE<b>${money(s.bank)}</b></span><span>ENERGY<b>${s.energy}/100</b></span><span>HEALTH<b>${s.health}/100</b></span><span>LOCATIONS VISITED<b>${s.visited.length}/${BUILDINGS.length}</b></span><span>MISSIONS COMPLETE<b>${Object.values(s.missions).filter(v => v === 'complete').length}/${MISSIONS.length}</b></span></div><h2 class="section-label">SKILLS</h2>${Object.entries(s.skills).map(([k, v]) => `<div class="skill-row"><b>${esc(title(k))}</b><div class="skill-track"><i style="width:${Math.min(v / 10 * 100, 100)}%"></i></div><strong>${v}</strong></div>`).join('')}<p class="fine-print">Study, train, and work to raise your skills. Better jobs unlock as your level and intelligence grow.</p>`, 'PLAYER PROFILE');
 }

 private openMap() {
  this.show('District map', 'CHOOSE A LOCATION TO WALK THERE', `<div class="district-map">${BUILDINGS.map((b, i) => `<button data-destination="${esc(b.id)}" style="--map-color:#${b.color.toString(16).padStart(6, '0')};grid-column:${i % 4 + 1};grid-row:${Math.floor(i / 4) + 1}"><span>${esc(b.short)}</span><small>${this.store.state.visited.includes(b.id) ? '✓ VISITED' : 'EXPLORE'}</small></button>`).join('')}</div><p class="fine-print">You will walk to the entrance. Tap a new destination, press STOP, or use the arrow keys to change course.</p>`, 'WEST DISTRICT');
  this.panel.querySelectorAll<HTMLButtonElement>('[data-destination]').forEach(b => b.onclick = () => { const id = b.dataset.destination!; this.close(); this.bridge?.goToBuilding(id); this.toast(`Walking to ${BUILDINGS.find(v => v.id === id)?.name}.`); });
 }

 private openSettings(confirmReset = false) {
  const body = `<div class="settings-copy"><h2>Your city is saved on this device.</h2><p>Position, money, inventory, skills, and missions save automatically. Keep using this browser to continue your game.</p></div><button class="wide" id="continue-game">CONTINUE GAME</button><button class="wide" id="save-game">SAVE NOW</button><h2 class="section-label">HOW TO PLAY</h2><ul class="instructions"><li>Tap a pavement or street to walk there.</li><li>Tap a nearby door, or press E, to enter.</li><li>Use WASD or arrow keys on a computer.</li><li>Press Space or STOP to cancel your walk.</li><li>Work for cash, study to unlock jobs, and sleep at home to recover.</li></ul><div class="reset-area">${confirmReset ? '<p><b>Start over?</b> This erases your saved progress on this device.</p><button class="danger wide" id="confirm-reset">YES, START A NEW GAME</button><button class="wide" id="cancel-reset">KEEP MY PROGRESS</button>' : '<button class="danger wide" id="new-game">NEW GAME / RESET</button>'}</div><p class="fine-print">Stick City Remake · Version 1<br>Original artwork made for this browser recreation.</p>`;
  this.show('Settings', 'SAVING & GAME CONTROLS', body, 'STICK CITY');
  this.panel.querySelector<HTMLButtonElement>('#continue-game')!.onclick = () => this.close();
  this.panel.querySelector<HTMLButtonElement>('#save-game')!.onclick = () => { this.store.save(); this.feedback = this.store.storageAvailable ? 'Progress saved on this device.' : 'Browser storage is unavailable. Progress cannot be saved in this browsing mode.'; this.openSettings(); };
  this.panel.querySelector<HTMLButtonElement>('#new-game')?.addEventListener('click', () => this.openSettings(true));
  this.panel.querySelector<HTMLButtonElement>('#cancel-reset')?.addEventListener('click', () => this.openSettings());
  this.panel.querySelector<HTMLButtonElement>('#confirm-reset')?.addEventListener('click', () => { this.store.reset(); this.bridge?.resetPosition(); this.close(); this.toast('A new day. A new start. Welcome to Stick City!'); });
 }

 openNPC(name: string) {
  if (this.busy) return;
  this.feedback = '';
  this.show(name, 'A FACE IN THE NEIGHBOURHOOD', `<div class="npc-portrait">${icon('person')}</div><p class="dialogue">“New around here? The Mayor at Town Hall is always looking for a helping hand. And don't work yourself to exhaustion — the café sells a decent coffee.”</p><button class="wide" id="npc-chat">SAY HELLO</button><div class="crime-warning"><h2>Light fingers?</h2><p>Try to lift a wallet. Stop the marker in the green zone. A failed attempt can cost health and a fine.</p><small>8 energy · 30 min · Real risk, real reward</small><button class="wide" id="npc-crime">ATTEMPT PICKPOCKET</button></div>`, 'STREET CONVERSATION');
  this.panel.querySelector<HTMLButtonElement>('#npc-chat')!.onclick = () => this.toast(`${name}: “Good luck out there. See you around!”`);
  this.panel.querySelector<HTMLButtonElement>('#npc-crime')!.onclick = () => this.openTiming('pickpocket');
 }

 private openTiming(mode: 'work' | 'pickpocket') {
  this.feedback = '';
  const crime = mode === 'pickpocket';
  this.show(crime ? 'Light fingers' : 'Precision shift', crime ? 'HIGH RISK · KEEP YOUR NERVE' : 'GOOD TIMING. BETTER PAY.', `<div class="timing-illustration">${icon(crime ? 'bag' : 'bolt')}</div><p class="game-explainer">${crime ? 'Watch the moving marker. A stop in the green zone improves your chance of lifting the wallet. Even a perfect attempt carries risk.' : 'Keep the orders moving. Stop the marker in the green zone for a perfect shift.'}</p><div class="timing-meter" aria-label="Moving timing marker"><div class="timing-zone"></div><div id="timing-needle"></div></div><div class="meter-labels"><span>TOO EARLY</span><b>PERFECT</b><span>TOO LATE</span></div><button class="wide timing-stop" id="timing-stop">STOP!</button><p class="fine-print">Tap STOP or press Space. ${crime ? 'Costs 8 energy and 30 minutes. A miss risks a fine and injury.' : 'Costs 8 energy and 30 minutes. A precise shift pays up to $40.'}</p>`, 'SKILL CHALLENGE');
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
   this.show(crime ? 'The moment of truth' : 'Shift complete', result.ok ? 'NICE WORK' : 'BETTER LUCK NEXT TIME', `<div class="challenge-result ${result.ok ? 'success' : 'failure'}">${result.ok ? '✓' : '!'}</div><button id="retry-timing" class="wide">TRY AGAIN</button>`, 'SKILL CHALLENGE');
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
   this.busy = true;
   button.disabled = true;
   (document.getElementById('slot-bet') as HTMLSelectElement).disabled = true;
   document.getElementById('slot-result')!.textContent = 'The reels are spinning…';
   const reels = Array.from(this.panel.querySelectorAll<HTMLElement>('.slot-reels span'));
   const symbols = ['🍒', '🍋', '🔔', '⭐', '7'];
   const start = performance.now();
   const animate = () => {
    const elapsed = performance.now() - start;
    reels.forEach((r, i) => {
     if (elapsed > 650 + i * 400) { r.textContent = result.reels[i]; r.classList.remove('spinning'); }
     else { r.textContent = symbols[Math.floor(elapsed / 65 + i) % symbols.length]; r.classList.add('spinning'); }
    });
    if (elapsed < 1500) { this.frame = requestAnimationFrame(animate); return; }
    this.busy = false; button.disabled = false;
    (document.getElementById('slot-bet') as HTMLSelectElement).disabled = false;
    document.getElementById('slot-result')!.textContent = result.message;
    this.panel.querySelector('.panel-footer span')!.innerHTML = `${icon('cash')} ${money(this.store.state.cash)}`;
   };
   animate();
  };
 }
}
