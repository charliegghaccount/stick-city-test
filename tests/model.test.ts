import { describe, expect, it } from 'vitest';
import { ACTIVITIES, BUILDINGS } from '../src/content';
import { GameStore, SAVE_KEY, validateSave } from '../src/model';

const storage = () => {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
};

describe('city economy and progression', () => {
  it('washes dishes, advances clock, spends energy and pays cash and XP', () => {
    const game = new GameStore(storage());
    expect(game.perform('diner-shift').ok).toBe(true);
    expect(game.state).toMatchObject({ cash: 165, energy: 78, xp: 20, minutes: 600, skills: { efficiency: 2 }, counters: { shifts: 1 } });
  });
  it('enforces level and education gates, then unlocks office work', () => {
    const game = new GameStore(storage());
    expect(game.perform('office-shift').ok).toBe(false);
    game.addXP(50);
    expect(game.perform('office-shift').ok).toBe(false);
    game.perform('study');
    expect(game.perform('office-shift').ok).toBe(true);
    expect(game.state.cash).toBe(215);
  });
  it('retains XP across several levels', () => {
    const game = new GameStore(storage());
    game.addXP(325);
    expect(game.state.level).toBe(4);
    expect(game.state.xp).toBe(25);
    expect(game.xpNeeded()).toBe(200);
  });
  it('makes efficiency unlock delivery work and strength unlock workshop work', () => {
    const game = new GameStore(storage());
    game.addXP(50);
    expect(game.perform('post-shift').ok).toBe(false);
    game.perform('diner-shift');
    expect(game.perform('post-shift').ok).toBe(true);
    expect(game.perform('garage-shift').ok).toBe(false);
    game.perform('park-jog');
    expect(game.perform('garage-shift').ok).toBe(true);
  });
  it('blocks unaffordable and exhausted activities without changing state', () => {
    const game = new GameStore(storage());
    game.state.cash = 0;
    const before = JSON.stringify(game.state);
    expect(game.perform('study').ok).toBe(false);
    expect(JSON.stringify(game.state)).toBe(before);
    game.state.energy = 0;
    expect(game.perform('diner-shift').ok).toBe(false);
    expect(game.perform('sleep').ok).toBe(true);
    expect(game.state.energy).toBe(100);
    expect(game.state.minutes).toBe(960);
  });
  it('tracks and consumes purchased items exactly once', () => {
    const game = new GameStore(storage());
    game.state.energy = 10;
    game.perform('buy-sandwich');
    expect(game.state.cash).toBe(108);
    expect(game.state.inventory.sandwich).toBe(1);
    expect(game.useItem('sandwich').ok).toBe(true);
    expect(game.state.energy).toBe(45);
    expect(game.useItem('sandwich').ok).toBe(false);
    expect(game.state.energy).toBe(45);
  });
  it('transfers funds without minting or losing money and rejects invalid amounts', () => {
    const game = new GameStore(storage());
    expect(game.deposit(100).ok).toBe(true);
    expect(game.state).toMatchObject({ cash: 20, bank: 100 });
    expect(game.withdraw(30).ok).toBe(true);
    expect(game.state).toMatchObject({ cash: 50, bank: 70 });
    for (const amount of [-1, 0, .5, Infinity, NaN, 1000]) expect(game.deposit(amount).ok).toBe(false);
    expect(game.state.cash + game.state.bank).toBe(120);
  });
});

describe('missions and minigames', () => {
  it('requires acceptance and objectives, then rewards a mission only once', () => {
    const game = new GameStore(storage());
    expect(game.acceptMission('honest-work').ok).toBe(false);
    expect(game.claimMission('welcome').ok).toBe(false);
    game.acceptMission('welcome');
    expect(game.claimMission('welcome').ok).toBe(false);
    for (const id of ['home', 'cafe', 'store', 'townhall', 'home']) game.visit(id);
    expect(game.missionProgress('welcome')).toBe(4);
    expect(game.claimMission('welcome').ok).toBe(true);
    expect(game.state.cash).toBe(180);
    expect(game.claimMission('welcome').ok).toBe(false);
    expect(game.acceptMission('honest-work').ok).toBe(true);
    game.perform('diner-shift'); game.perform('diner-shift');
    expect(game.claimMission('honest-work').ok).toBe(true);
    expect(game.state.missions['honest-work']).toBe('complete');
  });
  it('pays the timing job according to actual accuracy', () => {
    const low = new GameStore(storage()); const high = new GameStore(storage());
    low.finishTiming('work', 0); high.finishTiming('work', 1);
    expect(high.state.cash).toBeGreaterThan(low.state.cash);
    expect(high.state.energy).toBe(92);
    expect(high.state.skills.efficiency).toBe(2);
    expect(high.state.counters.shifts).toBe(1);
  });
  it('applies crime rewards, mission progress, and real failure costs', () => {
    const win = new GameStore(storage(), () => 0);
    win.acceptMission('light-fingers');
    expect(win.finishTiming('pickpocket', 1).ok).toBe(true);
    expect(win.state.cash).toBe(138);
    expect(win.missionProgress('light-fingers')).toBe(1);
    expect(win.claimMission('light-fingers').ok).toBe(true);
    const lose = new GameStore(storage(), () => .99);
    expect(lose.finishTiming('pickpocket', 1).ok).toBe(false);
    expect(lose.state).toMatchObject({ cash: 95, energy: 92, health: 90 });
    expect(lose.state.counters.pickpockets).toBeUndefined();
  });
  it('charges one bet per spin, computes reels and verifies payouts', () => {
    const game = new GameStore(storage(), () => .99);
    const win = game.spinSlots(10);
    expect(win.reels).toEqual(['7', '7', '7']);
    expect(win.payout).toBe(200);
    expect(game.state.cash).toBe(310);
    let n = 0; const lose = new GameStore(storage(), () => [0, .21, .41][n++]);
    expect(lose.spinSlots(10).payout).toBe(0);
    expect(lose.state.cash).toBe(110);
    expect(lose.spinSlots(1000).ok).toBe(false);
    expect(lose.state.cash).toBe(110);
  });
});

describe('saved progress and district content', () => {
  it('restores every important system from local storage', () => {
    const disk = storage(); const game = new GameStore(disk);
    game.moveTo(543, 702); game.perform('diner-shift'); game.perform('buy-apple');
    game.deposit(50); game.acceptMission('welcome'); game.visit('home');
    const restored = new GameStore(disk);
    expect(restored.state).toEqual(game.state);
    restored.reset();
    expect(new GameStore(disk).state.cash).toBe(120);
    expect(new GameStore(disk).state.visited).toEqual([]);
  });
  it('recovers from corrupt storage and sanitizes hostile or malformed values', () => {
    const disk = storage(); disk.setItem(SAVE_KEY, '{broken');
    expect(new GameStore(disk).state.cash).toBe(120);
    const clean = validateSave({ version: 1, cash: -50, bank: Infinity, energy: 999, health: -10, level: NaN,
      position: { x: -99, y: 'bad' }, skills: { strength: 'oops', intelligence: 2 },
      inventory: { apple: 2, imaginary: 100 }, missions: { welcome: 'complete', fake: 'complete' },
      visited: ['home', 'home', 'fake'], counters: { shifts: -1 } });
    expect(clean).toMatchObject({ cash: 0, bank: 0, energy: 100, health: 1, level: 1, position: { x: 18, y: 336 }, visited: ['home'] });
    expect(clean.inventory).toEqual({ apple: 2 });
    expect(clean.missions).toEqual({ welcome: 'complete' });
    expect(clean.skills.strength).toBe(1);
    expect(clean.counters.shifts).toBe(0);
  });
  it('continues in memory if browser storage is unavailable', () => {
    const disk = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() {} };
    const game = new GameStore(disk);
    expect(game.perform('diner-shift').ok).toBe(true);
    expect(game.state.cash).toBe(165);
    expect(game.storageAvailable).toBe(false);
  });
  it('contains exactly 16 unique, usable locations and >=3 job types', () => {
    expect(new Set(BUILDINGS.map(b => b.id)).size).toBe(16);
    for (const building of BUILDINGS) {
      expect(building.door.y).toBeGreaterThan(building.y + building.h);
      expect(ACTIVITIES.some(a => a.building === building.id) || ['bank', 'casino', 'townhall', 'gang'].includes(building.id)).toBe(true);
    }
    expect(ACTIVITIES.filter(a => a.counter === 'shifts').length).toBeGreaterThanOrEqual(3);
  });
});
