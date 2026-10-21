import { expect, test, type Page } from '@playwright/test';
import { BUILDINGS } from '../src/content';

const game = (page: Page) => page.evaluate(() => {
  const app = (window as any).stickCity;
  return { state: app.store.state, scene: app.scene.snapshot() };
});

async function launch(page: Page) {
  await page.goto('./');
  await page.waitForFunction(() => (window as any).stickCity?.scene?.snapshot().npcs > 0);
  await expect(page.locator('canvas')).toBeVisible();
  const introduction = page.getByRole('button', { name: 'Dismiss introduction' });
  if (await introduction.count()) await introduction.click();
}

/** Test fixture only: load a legitimate save at a door, then use the real interaction key. */
async function enter(page: Page, id: string) {
  const building = BUILDINGS.find(b => b.id === id)!;
  await page.evaluate(position => {
    const app = (window as any).stickCity;
    app.scene.player.setPosition(position.x, position.y);
    app.store.state.position = position;
    app.store.save();
  }, building.door);
  await launch(page);
  await page.keyboard.down('e');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.up('e');
}

async function canvasPoint(page: Page, x: number, y: number) {
  const point = await page.evaluate(({ x, y }) => {
    const camera = (window as any).stickCity.scene.cameras.main;
    return { x: (x - camera.scrollX - camera.width / 2) * camera.zoom + camera.width / 2,
      y: (y - camera.scrollY - camera.height / 2) * camera.zoom + camera.height / 2 };
  }, { x, y });
  const canvas = (await page.locator('canvas').boundingBox())!;
  return { x: canvas.x + point.x, y: canvas.y + point.y };
}

test('city launches, keyboard collides, tap walks, destination can stop, and camera scrolls', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await launch(page);
  const initial = await game(page);
  expect(initial.scene.npcs).toBe(12);
  expect(initial.scene.cars).toBe(8);
  await page.keyboard.down('w');
  await page.waitForTimeout(650);
  await page.keyboard.up('w');
  const collision = await game(page);
  expect(collision.scene.position.y).toBeGreaterThanOrEqual(329);
  expect(collision.scene.position.y).toBeLessThan(336);

  const target = await canvasPoint(page, 310, 365);
  await page.mouse.click(target.x, target.y);
  await expect.poll(async () => (await game(page)).scene.position.x).toBeGreaterThan(280);
  await expect.poll(async () => (await game(page)).scene.moving).toBe(false);
  const reached = await game(page);
  expect(Math.hypot(reached.scene.position.x - 310, reached.scene.position.y - 365)).toBeLessThan(8);
  const far = await canvasPoint(page, 490, 370);
  await page.mouse.click(far.x, far.y);
  await expect.poll(async () => (await game(page)).scene.moving).toBe(true);
  await page.keyboard.press('Space');
  await expect.poll(async () => (await game(page)).scene.moving).toBe(false);

  await page.keyboard.down('d');
  await expect.poll(async () => (await game(page)).scene.position.x, { timeout: 15_000 }).toBeGreaterThan(500);
  await page.keyboard.up('d');
  const scrolled = await game(page);
  expect(scrolled.scene.position.x).toBeGreaterThan(500);
  expect(scrolled.scene.camera.x).toBeGreaterThan(initial.scene.camera.x + 100);
  expect(errors).toEqual([]);
  await page.locator('#game-shell').screenshot({ path: 'docs/screenshots/gameplay-desktop.png' });
});

test('building job changes money, time, energy and skill, and survives reload', async ({ page }) => {
  await launch(page);
  await enter(page, 'diner');
  const before = await game(page);
  await page.locator('[data-activity="diner-shift"]').click();
  const after = await game(page);
  expect(after.state.cash).toBe(before.state.cash + 45);
  expect(after.state.energy).toBe(before.state.energy - 22);
  expect(after.state.minutes).toBe(before.state.minutes + 120);
  expect(after.state.skills.efficiency).toBe(before.state.skills.efficiency + 1);
  await launch(page);
  expect((await game(page)).state.cash).toBe(after.state.cash);
  expect((await game(page)).state.energy).toBe(after.state.energy);
});

test('shop inventory can restore energy and bank transactions conserve money', async ({ page }) => {
  await launch(page);
  await enter(page, 'diner');
  await page.locator('[data-activity="diner-shift"]').click();
  await enter(page, 'store');
  await page.locator('[data-activity="buy-sandwich"]').click();
  expect((await game(page)).state.inventory.sandwich).toBe(1);
  await page.locator('#modal .close-panel').click();
  await page.locator('[data-main="inventory"]').click();
  await page.getByRole('button', { name: /Use|Eat/i }).first().click();
  expect((await game(page)).state.inventory.sandwich).toBe(0);
  expect((await game(page)).state.energy).toBe(100);

  await enter(page, 'bank');
  const before = (await game(page)).state;
  const amount = page.getByRole('spinbutton');
  await amount.fill('40');
  await page.getByRole('button', { name: /Deposit/i }).click();
  expect((await game(page)).state.bank).toBe(40);
  expect((await game(page)).state.cash).toBe(before.cash - 40);
  await amount.fill('15');
  await page.getByRole('button', { name: /Withdraw/i }).click();
  const after = (await game(page)).state;
  expect(after.bank).toBe(25);
  expect(after.cash + after.bank).toBe(before.cash + before.bank);
});

test('Mayor mission accepts, tracks visits and rewards completion once', async ({ page }) => {
  await launch(page);
  await enter(page, 'townhall');
  await page.getByRole('button', { name: /Accept/i }).first().click();
  expect((await game(page)).state.missions.welcome).toBe('active');
  for (const id of ['home', 'cafe', 'store']) await enter(page, id);
  await enter(page, 'townhall');
  const before = (await game(page)).state.cash;
  await page.getByRole('button', { name: /Claim|Collect|Complete/i }).first().click();
  expect((await game(page)).state.missions.welcome).toBe('complete');
  expect((await game(page)).state.cash).toBe(before + 60);
});

test('casino reels play and timing activity requires a player stop', async ({ page }) => {
  await launch(page);
  await enter(page, 'casino');
  const before = (await game(page)).state;
  await page.locator('#open-slots').click();
  await page.locator('#spin-slots').click();
  await expect.poll(async () => (await game(page)).state.counters['slot-spins']).toBe(1);
  expect((await game(page)).state.minutes).toBe(before.minutes + 5);
  await expect(page.getByRole('button', { name: /Spin/i })).toBeEnabled();
  await enter(page, 'post');
  const beforeTiming = (await game(page)).state;
  await page.locator('#open-work').click();
  await page.waitForTimeout(350);
  expect((await game(page)).state.cash).toBe(beforeTiming.cash);
  await page.locator('#timing-stop').click();
  const afterTiming = (await game(page)).state;
  expect(afterTiming.counters['sorting-rounds']).toBe(1);
  expect(afterTiming.energy).toBe(beforeTiming.energy - 8);
  expect(afterTiming.cash).toBeGreaterThan(beforeTiming.cash);
});

test('street NPC dialogue and pickpocket challenge apply real crime risk', async ({ page }) => {
  await launch(page);
  await enter(page, 'gang');
  await page.locator('[data-accept="light-fingers"]').click();
  expect((await game(page)).state.missions['light-fingers']).toBe('active');
  await page.evaluate(() => {
    const app = (window as any).stickCity;
    app.scene.player.setPosition(348, 350);
    app.store.moveTo(348, 350);
  });
  await launch(page);
  const npc = await page.evaluate(() => {
    const person = (window as any).stickCity.scene.npcs[0].person;
    return { x: person.x, y: person.y };
  });
  const point = await canvasPoint(page, npc.x, npc.y);
  await page.mouse.click(point.x, point.y);
  await expect(page.locator('#npc-chat')).toBeVisible();
  await page.locator('#npc-chat').click();
  await expect(page.locator('#toast')).toContainText('Good luck');
  // Make the random risk deterministic; the UI still supplies the player's timing score.
  await page.evaluate(() => { (window as any).stickCity.store.random = () => .999; });
  const before = (await game(page)).state;
  await page.locator('#npc-crime').click();
  await page.locator('#timing-stop').click();
  const after = (await game(page)).state;
  expect(after.counters.caught).toBe(1);
  expect(after.cash).toBe(before.cash - 25);
  expect(after.health).toBe(before.health - 10);
  expect(after.energy).toBe(before.energy - 8);
  expect(after.missions['light-fingers']).toBe('active');
});

test('phone portrait layout supports touch input and fits the viewport', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await launch(page);
  const bounds = (await page.locator('canvas').boundingBox())!;
  expect(bounds.width).toBeLessThanOrEqual(390);
  expect(bounds.height).toBeGreaterThan(400);
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth, height: innerHeight, shell: document.querySelector('#game-shell')!.getBoundingClientRect().bottom }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  expect(dimensions.shell).toBeLessThanOrEqual(dimensions.height + 1);
  const point = await canvasPoint(page, 290, 370);
  await page.touchscreen.tap(point.x, point.y);
  await expect.poll(async () => (await game(page)).scene.position.x).toBeGreaterThan(260);
  await page.screenshot({ path: 'docs/screenshots/gameplay-phone.png', fullPage: true });
  await context.close();
});
