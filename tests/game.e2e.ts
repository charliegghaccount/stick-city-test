import { expect,test,type Page } from '@playwright/test';
import { BUILDINGS, MISSIONS } from '../src/content';
const game=(p:Page)=>p.evaluate(()=>{const a=(window as any).stickCity;return{state:a.store.state,scene:a.scene.snapshot(),modifiers:a.store.modifiers};});
async function launch(p:Page){await p.goto('./');await p.waitForFunction(()=>(window as any).stickCity?.scene.snapshot().npcs===12);const tip=p.getByRole('button',{name:'Dismiss introduction'});if(await tip.count())await tip.click();}
async function close(p:Page){const b=p.getByRole('button',{name:'Exit menu'});if(await b.count())await b.click();}
/** Place a legitimate saved fixture at an existing door; then use the real interaction key. */
async function enter(p:Page,id:string){await close(p);await p.evaluate(pos=>{(window as any).stickCity.scene.teleport(pos.x,pos.y);},BUILDINGS.find(b=>b.id===id)!.door);await p.keyboard.press('e');await expect(p.getByRole('dialog')).toBeVisible();}
/** Controlled activity clock avoids waiting minutes per case; the timer test also checks real elapsed time. */
async function finish(p:Page){await p.evaluate(()=>{const a=(window as any).stickCity,p=a.store.state.pending;if(p)a.store.advanceRealTime(p.remainingSeconds+.001);});}
async function point(p:Page,x:number,y:number){const q=await p.evaluate(({x,y})=>{const c=(window as any).stickCity.scene.cameras.main;return{x:(x-c.scrollX-c.width/2)*c.zoom+c.width/2,y:(y-c.scrollY-c.height/2)*c.zoom+c.height/2};},{x,y});const b=(await p.locator('canvas').boundingBox())!;return{x:b.x+q.x,y:b.y+q.y};}

test('V2 city renders, walking collides, tap reaches its destination, stop and scrolling work',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await launch(page);const start=await game(page);
 expect(start.scene.cars).toBe(8);await page.keyboard.down('w');await page.waitForTimeout(500);await page.keyboard.up('w');expect((await game(page)).scene.position.y).toBeGreaterThanOrEqual(329);
 const target=await point(page,310,365);await page.mouse.click(target.x,target.y);await expect.poll(async()=>(await game(page)).scene.position.x).toBeGreaterThan(285);await expect.poll(async()=>(await game(page)).scene.moving).toBe(false);
 await page.keyboard.down('d');await expect.poll(async()=>(await game(page)).scene.position.x,{timeout:12000}).toBeGreaterThan(510);await page.keyboard.up('d');
 expect((await game(page)).scene.camera.x).toBeGreaterThan(start.scene.camera.x+100);expect(errors).toEqual([]);
 await page.locator('#game-shell').screenshot({path:'docs/screenshots/v2-gameplay-desktop.png'});
});

test('jobs reserve costs, advance a real timer, block repeat clicks and restore pending progress after reload',async({page})=>{
 await launch(page);await enter(page,'diner');await page.locator('[data-activity="diner-shift"]').click();
 const pending=await game(page);expect(pending.state.energy).toBe(82);expect(pending.state.cash).toBe(120);expect(pending.state.xp).toBe(0);
 await expect(page.locator('[data-activity="diner-shift"]')).toBeDisabled();await page.waitForTimeout(700);expect((await game(page)).state.pending.remainingSeconds).toBeLessThan(pending.state.pending.remainingSeconds);
 await launch(page);expect((await game(page)).state.pending).not.toBeNull();expect((await game(page)).state.cash).toBe(120);
 await finish(page);const done=await game(page);expect(done.state.cash).toBe(144);expect(done.state.skills.efficiency).toBe(1);expect(done.state.skillXP.efficiency).toBe(6);expect(done.state.xp).toBe(18);expect(done.state.developerModified).toBe(false);
 await page.getByRole('button',{name:'Character statistics',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('6/60 XP');
});

test('shopping, food, banking and Mayor mission rewards retain their working flows',async({page})=>{
 await launch(page);await enter(page,'diner');await page.locator('[data-activity="diner-shift"]').click();await finish(page);
 await enter(page,'store');await page.locator('[data-activity="buy-sandwich"]').click();await finish(page);await close(page);await page.locator('[data-main="inventory"]').click();await page.locator('[data-item="sandwich"]').click();expect((await game(page)).state.energy).toBe(100);
 await enter(page,'bank');const sum=(await game(page)).state.cash;await page.locator('#bank-amount').fill('40');await page.locator('#deposit').click();await page.locator('#bank-amount').fill('15');await page.locator('#withdraw').click();let s=(await game(page)).state;expect(s.bank).toBe(25);expect(s.bank+s.cash).toBe(sum);
 await enter(page,'townhall');await page.locator('[data-accept="welcome"]').click();await enter(page,'home');await enter(page,'townhall');const cash=(await game(page)).state.cash;
 await page.locator('[data-claim="welcome"]').click();s=(await game(page)).state;expect(s.missions.welcome).toBe('complete');expect(s.cash).toBe(cash+MISSIONS[0].reward);
});

test('qualifications explain and unlock corporate work and survive reload',async({page})=>{
 await launch(page);await enter(page,'office');await expect(page.locator('[data-activity="office-shift"]')).toBeDisabled();await expect(page.getByRole('dialog')).toContainText('Office certificate');
 await page.evaluate(()=>{const a=(window as any).stickCity;a.store.state.level=2;a.store.state.skills.intelligence=2;a.store.state.cash=400;a.store.save();});
 await enter(page,'school');await page.locator('[data-activity="course-office-certificate"]').click();expect((await game(page)).state.cash).toBe(220);await finish(page);
 expect((await game(page)).state.qualifications).toContain('office-certificate');await launch(page);expect((await game(page)).state.qualifications).toContain('office-certificate');
 await enter(page,'office');await expect(page.locator('[data-activity="office-shift"]')).toBeEnabled();await page.locator('[data-activity="office-shift"]').click();await finish(page);expect((await game(page)).state.cash).toBe(272);
 await page.locator('#modal').screenshot({path:'docs/screenshots/v2-careers.png'});
});

test('Developer Menu changes progression and temporary controls, teleports safely and resets modifiers on reload',async({page})=>{
 await launch(page);await page.getByRole('button',{name:'Settings',exact:true}).click();await page.locator('#open-developer').click();await expect(page.getByRole('heading',{name:'Developer Menu',exact:true})).toBeVisible();
 await page.locator('[data-dev-money="1000"]').click();expect((await game(page)).state.cash).toBe(1120);await expect(page.locator('#save-status')).toContainText('DEV-ALTERED');
 await page.locator('#dev-level').fill('4');await page.locator('[data-dev-action="level-set"]').click();expect((await game(page)).state.level).toBe(4);
 await page.locator('#dev-skill').selectOption('intelligence');await page.locator('#dev-skill-level').fill('3');await page.locator('#dev-set-skill').click();expect((await game(page)).state.skills.intelligence).toBe(3);
 await page.locator('[data-dev-action="qualifications"]').click();expect((await game(page)).state.qualifications).toHaveLength(6);
 await page.locator('[data-dev-toggle="infiniteEnergy"]').click();await expect(page.locator('[data-dev-toggle="infiniteEnergy"]')).toHaveAttribute('aria-pressed','true');await page.locator('#dev-speed').selectOption('5');
 await page.locator('[data-dev-toggle="noclip"]').click();await page.locator('#dev-x').fill('150');await page.locator('#dev-y').fill('150');await page.locator('#dev-teleport-coordinates').click();expect((await game(page)).scene.position.x).toBe(150);
 await page.locator('[data-dev-toggle="noclip"]').click();await expect.poll(async()=>(await game(page)).scene.position.y).toBeLessThanOrEqual(90);
 await page.locator('#dev-building').selectOption('bank');await page.locator('#dev-teleport-building').click();expect((await game(page)).scene.position.x).toBe(BUILDINGS.find(b=>b.id==='bank')!.door.x);
 await page.locator('#modal').screenshot({path:'docs/screenshots/v2-developer.png'});
 await launch(page);const a=await game(page);expect(a.modifiers).toEqual({infiniteEnergy:false,infiniteHealth:false,speed:1,noclip:false,paused:false});expect(a.state.level).toBe(4);expect(a.state.developerModified).toBe(true);
});

test('developer JSON import/export validates safely, advances time and explicitly finishes activities',async({page})=>{
 await launch(page);await enter(page,'diner');await page.locator('[data-activity="diner-shift"]').click();await page.keyboard.press('F2');await page.locator('#dev-finish').click();expect((await game(page)).state.cash).toBe(144);
 const minutes=(await game(page)).state.minutes;await page.locator('[data-dev-action="hour"]').click();expect((await game(page)).state.minutes).toBe(minutes+60);
 const download=page.waitForEvent('download');await page.locator('#dev-export').click();await download;const exported=await page.locator('#dev-json').inputValue();expect(JSON.parse(exported).version).toBe(2);
 await page.locator('#dev-json').fill('{"version":2,"cash":"bad"}');await page.locator('#dev-import').click();expect((await game(page)).state.cash).toBe(144);await expect(page.locator('#toast')).toContainText('Invalid');
 const imported=JSON.parse(exported);imported.cash=777;await page.locator('#dev-json').fill(JSON.stringify(imported));await page.locator('#dev-import').click();expect((await game(page)).state.cash).toBe(777);
 page.once('dialog',d=>d.dismiss());await page.locator('#dev-reset').click();expect((await game(page)).state.cash).toBe(777);
 page.once('dialog',d=>d.accept());await page.locator('#dev-reset').click();expect((await game(page)).state.cash).toBe(120);expect((await game(page)).state.developerModified).toBe(false);
});

test('V1 save automatically migrates with a backup and retains earned progression and possessions',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('stick-city-v1'))localStorage.setItem('stick-city-v1',JSON.stringify({version:1,position:{x:202.5,y:336},cash:987,bank:321,energy:66,health:77,level:3,xp:75,skills:{efficiency:4,charm:3,intelligence:5,strength:2},inventory:{apple:2},missions:{welcome:'complete'},counters:{shifts:7},visited:['home'],minutes:1700}));});
 await launch(page);const s=(await game(page)).state;expect(s.version).toBe(2);expect(s.cash).toBe(987);expect(s.bank).toBe(321);expect(s.level).toBe(3);expect(s.xp).toBe(190);expect(s.skills.intelligence).toBe(5);expect(s.inventory.apple).toBe(2);expect(s.missions.welcome).toBe('complete');expect(await page.evaluate(()=>!!localStorage.getItem('stick-city-v1.backup-pre-v2'))).toBe(true);
});

test('slots and timing retain interactive controls with no instantaneous repeatable XP',async({page})=>{
 await launch(page);await enter(page,'casino');await page.locator('#open-slots').click();await page.locator('#spin-slots').click();await expect(page.locator('#spin-slots')).toBeEnabled({timeout:5000});expect((await game(page)).state.counters['slot-spins']).toBe(1);
 await enter(page,'post');await page.locator('#open-work').click();await page.waitForTimeout(300);const cash=(await game(page)).state.cash;await page.locator('#timing-stop').click();expect((await game(page)).state.cash).toBe(cash);expect((await game(page)).state.pending.kind).toBe('work');await finish(page);expect((await game(page)).state.cash).toBeGreaterThan(cash);expect((await game(page)).state.skillXP.efficiency).toBe(2);
});

test('traffic and NPC pause/resume immediately without a position jump',async({page})=>{
 await launch(page);await page.keyboard.press('F2');await page.locator('[data-dev-toggle="paused"]').click();
 const positions=()=>page.evaluate(()=>{const a=(window as any).stickCity.scene;return{car:a.traffic.cars.map((c:any)=>({x:c.x,y:c.y})),npc:a.npcs.map((n:any)=>({x:n.person.x,y:n.person.y}))};});
 const before=await positions();await page.waitForTimeout(400);expect(await positions()).toEqual(before);await page.locator('[data-dev-toggle="paused"]').click();await page.waitForTimeout(300);const after=await positions();expect(after.car).not.toEqual(before.car);expect(Math.hypot(after.car[0].x-before.car[0].x,after.car[0].y-before.car[0].y)).toBeLessThan(50);
});

test('phone touch layout and Developer Menu fit both 320px and 390px portrait screens',async({browser})=>{
 for(const width of [320,390]){
  const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2}),page=await context.newPage();await launch(page);
  const t=await point(page,300,365);await page.touchscreen.tap(t.x,t.y);await expect.poll(async()=>(await game(page)).scene.position.x).toBeGreaterThan(270);
  if(width===390)await page.screenshot({path:'docs/screenshots/v2-gameplay-phone.png',fullPage:true});
  await page.getByRole('button',{name:'Settings',exact:true}).click();await page.locator('#open-developer').click();await page.locator('#dev-reset').scrollIntoViewIfNeeded();
  const dims=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,bottom:document.querySelector('#game-shell')!.getBoundingClientRect().bottom,height:innerHeight}));expect(dims.scroll).toBeLessThanOrEqual(dims.width);expect(dims.bottom).toBeLessThanOrEqual(dims.height+1);await context.close();
 }
});


test('developer speed changes actual movement immediately and F2 remains usable',async({page})=>{
 await launch(page);
 const walk=async(speed:string)=>{
  await page.keyboard.press('F2');await page.locator('#dev-speed').selectOption(speed);
  await page.locator('#dev-x').fill('202');await page.locator('#dev-y').fill('365');await page.locator('#dev-teleport-coordinates').click();await close(page);
  await page.keyboard.down('d');await page.waitForTimeout(500);await page.keyboard.up('d');return (await game(page)).scene.position.x-202;
 };
 const normal=await walk('1'),fast=await walk('5');expect(normal).toBeGreaterThan(15);expect(fast).toBeGreaterThan(normal*3);expect(fast).toBeLessThan(normal*7);
});
