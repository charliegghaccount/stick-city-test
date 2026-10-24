import {expect,test,type Page} from '@playwright/test';
import {BUILDINGS,MISSIONS} from '../src/content';
const game=(p:Page)=>p.evaluate(()=>{const a=(window as any).stickCity;return{state:a.store.state,scene:a.scene.snapshot(),modifiers:a.store.modifiers};});
async function launch(p:Page){await p.goto('./');await p.waitForFunction(()=>(window as any).stickCity?.scene.snapshot().npcs===12);const intro=p.getByRole('button',{name:'Dismiss introduction'});if(await intro.count())await intro.click();}
async function close(p:Page){const b=p.getByRole('button',{name:'Exit menu'});if(await b.count())await b.click();}
/** Saved-position fixtures avoid walking the district for every menu case. Movement has a separate test. */
async function enter(p:Page,id:string){await close(p);await p.evaluate(pos=>(window as any).stickCity.scene.teleport(pos.x,pos.y),BUILDINGS.find(b=>b.id===id)!.door);await p.keyboard.press('e');await expect(p.getByRole('dialog')).toBeVisible();}
async function point(p:Page,x:number,y:number){const q=await p.evaluate(({x,y})=>{const c=(window as any).stickCity.scene.cameras.main;return{x:(x-c.scrollX-c.width/2)*c.zoom+c.width/2,y:(y-c.scrollY-c.height/2)*c.zoom+c.height/2};},{x,y});const b=(await p.locator('canvas').boundingBox())!;return{x:b.x+q.x,y:b.y+q.y};}
async function failRobbery(p:Page,infiniteHealth=false){await enter(p,'cafe');await p.evaluate(infinite=>{const a=(window as any).stickCity;a.store.random=()=>.999;if(infinite)a.store.setModifier('infiniteHealth',true);},infiniteHealth);await p.locator('#rob-building').click();await expect(p.locator('#wanted-banner')).toBeVisible();await expect.poll(async()=>(await game(p)).scene.police).toBe(2);}

test('city keeps walking, collision, camera scrolling and traffic',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await launch(page);const first=await game(page);expect(first.scene.cars).toBe(8);
 await page.keyboard.down('w');await page.waitForTimeout(500);await page.keyboard.up('w');expect((await game(page)).scene.position.y).toBeGreaterThanOrEqual(329);
 const target=await point(page,310,365);await page.mouse.click(target.x,target.y);await expect.poll(async()=>(await game(page)).scene.position.x).toBeGreaterThan(285);await expect.poll(async()=>(await game(page)).scene.moving).toBe(false);
 await page.keyboard.down('d');await expect.poll(async()=>(await game(page)).scene.position.x,{timeout:12000}).toBeGreaterThan(510);await page.keyboard.up('d');expect((await game(page)).scene.camera.x).toBeGreaterThan(first.scene.camera.x+100);expect(errors).toEqual([]);await page.locator('#game-shell').screenshot({path:'docs/screenshots/v3-gameplay-desktop.png'});
});

test('work, study, food and recovery finish immediately and permit successive clicks',async({page})=>{
 await launch(page);await enter(page,'diner');await page.locator('[data-activity="diner-shift"]').click();let s=(await game(page)).state;expect(s.cash).toBe(144);expect(s.energy).toBe(82);expect(s.minutes).toBe(600);expect(s.skillXP.efficiency).toBe(6);expect(s.pending).toBeUndefined();
 await expect(page.locator('[data-activity="diner-shift"]')).toBeEnabled();await page.locator('[data-activity="diner-shift"]').click();expect((await game(page)).state.cash).toBe(168);await page.waitForTimeout(300);expect((await game(page)).state.cash).toBe(168);
 await enter(page,'home');await page.locator('[data-activity="sleep"]').click();expect((await game(page)).state.energy).toBe(100);await enter(page,'school');await page.locator('[data-activity="study"]').click();expect((await game(page)).state.skillXP.intelligence).toBe(14);await expect(page.locator('.active-activity')).toHaveCount(0);
 await enter(page,'cafe');const energy=(await game(page)).state.energy;await page.locator('[data-activity="coffee"]').click();expect((await game(page)).state.energy).toBe(Math.min(100,energy+22));
});

test('courses unlock employment and the career screen persists the explicitly selected job',async({page})=>{
 await launch(page);await page.evaluate(()=>{const a=(window as any).stickCity;a.store.state.level=2;a.store.state.skills.intelligence=2;a.store.state.cash=400;});await enter(page,'school');await page.locator('[data-activity="course-office-certificate"]').click();expect((await game(page)).state.qualifications).toContain('office-certificate');expect((await game(page)).state.cash).toBe(220);
 await close(page);await page.getByRole('button',{name:'Character statistics',exact:true}).click();await page.locator('#open-careers').click();await expect(page.locator('.career-position')).toHaveCount(18);await page.locator('[data-apply-job="office-shift"]').click();expect((await game(page)).state.currentJob).toBe('office-shift');expect((await game(page)).state.cash).toBe(220);await page.locator('#modal').screenshot({path:'docs/screenshots/v3-careers.png'});
 await launch(page);expect((await game(page)).state.currentJob).toBe('office-shift');await enter(page,'office');await page.locator('[data-activity="office-shift"]').click();expect((await game(page)).state.cash).toBe(272);
});

test('equipment is useful, cannot stack, and inventory/banking remain functional',async({page})=>{
 await launch(page);await page.evaluate(()=>{(window as any).stickCity.store.state.cash=1000;});await enter(page,'store');await page.locator('[data-activity="buy-shoes"]').click();await expect(page.locator('[data-activity="buy-shoes"]')).toBeDisabled();expect((await game(page)).state.inventory.shoes).toBe(1);
 await page.locator('[data-activity="buy-mealbox"]').click();expect((await game(page)).state.inventory.mealbox).toBe(1);await close(page);await page.locator('[data-main="inventory"]').click();await expect(page.locator('[data-item="shoes"]')).toBeDisabled();await page.locator('[data-item="mealbox"]').click();expect((await game(page)).state.inventory.mealbox).toBe(0);
 await enter(page,'bank');const total=(await game(page)).state.cash;await page.locator('#bank-amount').fill('40');await page.locator('#deposit').click();await page.locator('#bank-amount').fill('15');await page.locator('#withdraw').click();const s=(await game(page)).state;expect(s.bank).toBe(25);expect(s.cash+s.bank).toBe(total);
});

test('new Mayor objectives update through normal work and item purchases',async({page})=>{
 await launch(page);await page.evaluate(()=>{const s=(window as any).stickCity.store.state;s.missions['honest-work']='complete';s.counters.earned=240;s.cash=200;});await enter(page,'townhall');await page.locator('[data-accept="community-supplies"]').click();await enter(page,'diner');await page.locator('[data-activity="diner-shift"]').click();await enter(page,'store');for(let i=0;i<3;i++)await page.locator('[data-activity="buy-apple"]').click();await enter(page,'townhall');await expect(page.locator('[data-claim="community-supplies"]')).toBeEnabled();const cash=(await game(page)).state.cash;await page.locator('[data-claim="community-supplies"]').click();expect((await game(page)).state.cash).toBe(cash+MISSIONS.find(m=>m.id==='community-supplies')!.reward);
});

test('NPC choices count unique contacts and pickpocketing awards Thieving XP instantly',async({page})=>{
 await launch(page);await page.evaluate(()=>{const a=(window as any).stickCity;a.scene.teleport(348,350);a.store.random=()=>0;});await page.waitForTimeout(200);const npc=await page.evaluate(()=>{const n=(window as any).stickCity.scene.npcs[0].person;return{x:n.x,y:n.y};});const q=await point(page,npc.x,npc.y);await page.mouse.click(q.x,q.y);await expect(page.locator('#npc-chat')).toBeVisible();await page.locator('#npc-chat').click();await page.locator('#npc-work').click();expect((await game(page)).state.counters.conversations).toBe(1);await page.locator('#npc-crime').click();expect((await game(page)).state.cash).toBe(128);expect((await game(page)).state.skillXP.thieving).toBe(6);await expect(page.locator('#npc-crime')).toBeDisabled();await close(page);await page.getByRole('button',{name:'Character statistics',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Thieving');
});

test('Thieving training and robbery tiers show real requirements, odds and payouts',async({page})=>{
 await launch(page);await enter(page,'gang');await page.locator('[data-activity="thieving-practice"]').click();expect((await game(page)).state.skillXP.thieving).toBe(8);await enter(page,'bank');await expect(page.locator('#rob-building')).toBeDisabled();await expect(page.getByRole('dialog')).toContainText('Thieving 10');
 await page.keyboard.press('F2');await page.locator('#dev-level').fill('5');await page.locator('[data-dev-action="level-set"]').click();await page.locator('#dev-skill').selectOption('thieving');await page.locator('#dev-skill-level').fill('10');await page.locator('#dev-set-skill').click();await enter(page,'bank');await page.evaluate(()=>{(window as any).stickCity.store.random=()=>0;});await page.locator('#rob-building').click();expect((await game(page)).state.cash).toBe(710);expect((await game(page)).state.skillXP.thieving).toBe(24);expect((await game(page)).state.pursuit).toBeNull();await expect(page.locator('#rob-building')).toBeDisabled();await page.locator('#modal').screenshot({path:'docs/screenshots/v3-thieving.png'});
});

test('failed robbery spawns armed police and wanted status survives reload',async({page})=>{
 await launch(page);await failRobbery(page);await expect(page.getByRole('dialog')).not.toBeVisible();const before=(await game(page)).state.pursuit.remaining;await launch(page);const s=(await game(page)).state;expect(s.pursuit.remaining).toBeLessThanOrEqual(before);expect(s.pursuit.remaining).toBeGreaterThan(0);await expect.poll(async()=>(await game(page)).scene.police).toBe(2);await page.keyboard.press('e');await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('police actually damage and take down a stationary player, then revive at the clinic',async({page})=>{
 await launch(page);await failRobbery(page);await page.waitForFunction(()=>(window as any).stickCity.store.state.counters['police-defeats']===1,undefined,{timeout:25000});const s=await game(page);expect(s.state.health).toBe(60);expect(s.state.cash).toBeLessThan(120);expect(s.state.pursuit).toBeNull();expect(Math.hypot(s.scene.position.x-BUILDINGS.find(b=>b.id==='clinic')!.door.x,s.scene.position.y-BUILDINGS.find(b=>b.id==='clinic')!.door.y)).toBeLessThan(5);
});

test('pursuit lasts 30 real active seconds; police fire and then disappear on escape',async({page})=>{
 test.setTimeout(65000);await launch(page);await failRobbery(page,true);const start=Date.now();await page.waitForFunction(()=>(window as any).stickCity.store.state.counters['police-hits']>0,undefined,{timeout:12000});await page.locator('#game-shell').screenshot({path:'docs/screenshots/v3-police-pursuit.png'});await page.waitForFunction(()=>(window as any).stickCity.store.state.pursuit===null,undefined,{timeout:40000});const elapsed=Date.now()-start;expect(elapsed).toBeGreaterThan(28000);expect(elapsed).toBeLessThan(40000);expect((await game(page)).state.health).toBe(100);expect((await game(page)).state.counters.escapes).toBe(1);await expect.poll(async()=>(await game(page)).scene.police).toBe(0);
});

test('Developer Menu supports clean modifier reset, clock/day, all careers and mission/skill reset',async({page})=>{
 await launch(page);await page.getByRole('button',{name:'Settings',exact:true}).click();await page.locator('#open-developer').click();await page.locator('[data-dev-action="careers"]').click();expect((await game(page)).state.qualifications).toHaveLength(10);expect((await game(page)).state.skills.intelligence).toBeGreaterThanOrEqual(6);
 await page.locator('#dev-day').fill('3');await page.locator('#dev-clock').fill('13:40');await page.locator('#dev-set-clock').click();expect((await game(page)).state.minutes).toBe(3700);await page.locator('[data-dev-action="skills-reset"]').click();expect((await game(page)).state.skills.thieving).toBe(1);
 await page.evaluate(()=>{(window as any).stickCity.store.state.missions={welcome:'complete','honest-work':'active'};});await page.locator('[data-dev-action="missions-clear"]').click();expect((await game(page)).state.missions.welcome).toBe('complete');expect((await game(page)).state.missions['honest-work']).toBeUndefined();await page.locator('[data-dev-action="missions-reset"]').click();expect((await game(page)).state.missions).toEqual({});
 await page.locator('[data-dev-toggle="infiniteEnergy"]').click();await page.locator('#dev-speed').selectOption('5');await page.locator('#dev-normal').click();expect((await game(page)).modifiers).toEqual({infiniteEnergy:false,infiniteHealth:false,speed:1,noclip:false,paused:false});await page.locator('#modal').screenshot({path:'docs/screenshots/v3-developer.png'});
});

test('JSON tools reject bad data, export V3 and retain reset confirmation',async({page})=>{
 await launch(page);await page.keyboard.press('F2');const download=page.waitForEvent('download');await page.locator('#dev-export').click();await download;const saved=await page.locator('#dev-json').inputValue();expect(JSON.parse(saved).version).toBe(3);await page.locator('#dev-json').fill('{"version":3,"cash":"bad"}');await page.locator('#dev-import').click();expect((await game(page)).state.cash).toBe(120);await expect(page.locator('#toast')).toContainText('Invalid');const data=JSON.parse(saved);data.cash=777;await page.locator('#dev-json').fill(JSON.stringify(data));await page.locator('#dev-import').click();expect((await game(page)).state.cash).toBe(777);page.once('dialog',d=>d.dismiss());await page.locator('#dev-reset').click();expect((await game(page)).state.cash).toBe(777);page.once('dialog',d=>d.accept());await page.locator('#dev-reset').click();expect((await game(page)).state.cash).toBe(120);
});

test('V2 paid pending work migrates once with no extra charge or countdown',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('stick-city-v1'))localStorage.setItem('stick-city-v1',JSON.stringify({version:2,position:{x:202.5,y:336},cash:120,bank:0,energy:82,health:100,level:1,xp:0,skills:{efficiency:1,charm:1,intelligence:1,strength:1},skillXP:{efficiency:0,charm:0,intelligence:0,strength:0},qualifications:[],developerModified:false,playSeconds:5,pending:{kind:'activity',id:'diner-shift',remainingSeconds:49,totalSeconds:54},inventory:{},missions:{},counters:{},visited:[],minutes:480}));});await launch(page);let s=(await game(page)).state;expect(s.version).toBe(3);expect(s.cash).toBe(144);expect(s.energy).toBe(82);expect(s.minutes).toBe(600);expect(s.pending).toBeUndefined();await launch(page);s=(await game(page)).state;expect(s.cash).toBe(144);expect(await page.evaluate(()=>!!localStorage.getItem('stick-city-v1.backup-pre-v3'))).toBe(true);
});

test('timing rewards and slot results are instant with no post-animation lock',async({page})=>{
 await launch(page);await enter(page,'casino');await page.evaluate(()=>{(window as any).stickCity.store.random=()=>.999;});await page.locator('#open-slots').click();await page.locator('#spin-slots').click();expect((await game(page)).state.cash).toBe(215);await expect(page.locator('#spin-slots')).toBeEnabled();await page.locator('#spin-slots').click();expect((await game(page)).state.cash).toBe(310);expect((await game(page)).state.counters['slot-spins']).toBe(2);
 await enter(page,'post');await page.locator('#open-work').click();const before=(await game(page)).state.cash;await page.locator('#timing-stop').click();expect((await game(page)).state.cash).toBeGreaterThan(before);await expect(page.locator('#retry-timing')).toBeEnabled();expect((await game(page)).state.pending).toBeUndefined();
});

test('touch movement, crime/career UI and developer controls fit 320px and 390px portrait screens',async({browser})=>{
 for(const width of [320,390]){const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2}),p=await context.newPage();await launch(p);const q=await point(p,300,365);await p.touchscreen.tap(q.x,q.y);await expect.poll(async()=>(await game(p)).scene.position.x).toBeGreaterThan(270);if(width===390)await p.screenshot({path:'docs/screenshots/v3-gameplay-phone.png',fullPage:true});await p.getByRole('button',{name:'Settings',exact:true}).click();await p.locator('#open-developer').click();await p.locator('#dev-set-clock').scrollIntoViewIfNeeded();const dims=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,panel:document.querySelector('.panel-body')!.scrollWidth,client:document.querySelector('.panel-body')!.clientWidth}));expect(dims.scroll).toBeLessThanOrEqual(dims.width);expect(dims.panel).toBeLessThanOrEqual(dims.client+1);await context.close();}
});

test('repeated work keeps the same menu row in view instead of jumping to the top',async({page})=>{
 await launch(page);await page.evaluate(()=>(window as any).stickCity.store.developer('careers'));await enter(page,'diner');const button=page.locator('[data-activity="hospitality-manager"]');await button.scrollIntoViewIfNeeded();const y=(await button.boundingBox())!.y;await button.click();expect((await game(page)).state.cash).toBe(255);expect(Math.abs((await button.boundingBox())!.y-y)).toBeLessThan(8);await button.click();expect((await game(page)).state.cash).toBe(390);
});
