import { ACTIVITIES, BUILDINGS, ITEMS, MISSIONS } from './content';
import { SKILLS, type PlayerState, type Result } from './types';

export const SAVE_KEY = 'stick-city-v1';
type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export const freshState = (): PlayerState => ({
  version: 1, position: { x: 202.5, y: 336 }, cash: 120, bank: 0, energy: 100, health: 100,
  level: 1, xp: 0, minutes: 8 * 60,
  skills: { efficiency: 1, charm: 1, intelligence: 1, strength: 1 },
  inventory: {}, missions: {}, counters: {}, visited: [],
});

const finite = (value: unknown, fallback: number, min = 0, max = 1e9): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const safeKey = (key: string) => /^[a-z][a-z0-9-]*$/i.test(key) && !['constructor', 'prototype', '__proto__'].includes(key);

/** Older/incomplete local saves are repaired; unfamiliar versions start a clean game. */
export function validateSave(value: unknown): PlayerState {
  const state = freshState();
  if (!record(value) || value.version !== 1) return state;
  if (record(value.position)) state.position = {
    x: finite(value.position.x, state.position.x, 18, 1662),
    y: finite(value.position.y, state.position.y, 18, 1742),
  };
  state.cash = Math.floor(finite(value.cash, state.cash));
  state.bank = Math.floor(finite(value.bank, state.bank));
  state.energy = finite(value.energy, 100, 0, 100);
  state.health = finite(value.health, 100, 1, 100);
  state.level = Math.floor(finite(value.level, 1, 1, 10000));
  state.xp = Math.floor(finite(value.xp, 0));
  state.minutes = Math.floor(finite(value.minutes, 480));
  if (record(value.skills)) for (const skill of SKILLS) state.skills[skill] = Math.floor(finite(value.skills[skill], 1, 1, 9999));
  if (record(value.inventory)) for (const [key, amount] of Object.entries(value.inventory)) {
    if (Object.hasOwn(ITEMS, key)) state.inventory[key] = Math.floor(finite(amount, 0, 0, 9999));
  }
  if (record(value.missions)) for (const mission of MISSIONS) {
    const status = value.missions[mission.id];
    if (status === 'active' || status === 'complete') state.missions[mission.id] = status;
  }
  if (record(value.counters)) for (const [key, count] of Object.entries(value.counters)) {
    if (safeKey(key)) state.counters[key] = Math.floor(finite(count, 0));
  }
  if (Array.isArray(value.visited)) state.visited = [...new Set(value.visited.filter((id): id is string => typeof id === 'string' && BUILDINGS.some(b => b.id === id)))];
  // Normalize XP on old saves too, retaining every earned point.
  while (state.xp >= state.level * 50 && state.level < 10000) { state.xp -= state.level * 50; state.level++; }
  return state;
}

export class GameStore {
  state: PlayerState;
  private listeners = new Set<(state: PlayerState) => void>();
  private storage?: SaveStorage;
  storageAvailable = true;

  constructor(storage?: SaveStorage, private random: () => number = Math.random) {
    this.state = freshState();
    try {
      this.storage = storage ?? globalThis.localStorage;
      const raw = this.storage?.getItem(SAVE_KEY);
      if (raw) this.state = validateSave(JSON.parse(raw));
    } catch { this.storageAvailable = false; }
  }

  subscribe(fn: (state: PlayerState) => void): () => void {
    this.listeners.add(fn); fn(this.state);
    return () => this.listeners.delete(fn);
  }
  save(): void {
    try { this.storage?.setItem(SAVE_KEY, JSON.stringify(this.state)); this.storageAvailable = !!this.storage; }
    catch { this.storageAvailable = false; }
  }
  private changed(): void { this.save(); for (const fn of this.listeners) fn(this.state); }
  reset(): void { this.state = freshState(); this.changed(); }
  moveTo(x: number, y: number): void {
    this.state.position = { x: finite(x, this.state.position.x, 18, 1662), y: finite(y, this.state.position.y, 18, 1742) };
    this.changed();
  }
  visit(id: string): void {
    if (!BUILDINGS.some(b => b.id === id) || this.state.visited.includes(id)) return;
    this.state.visited.push(id); this.changed();
  }
  xpNeeded(): number { return this.state.level * 50; }
  addXP(amount: number): void {
    this.grantXP(amount); this.changed();
  }
  private grantXP(amount: number): void {
    this.state.xp += Math.floor(finite(amount, 0));
    while (this.state.xp >= this.xpNeeded()) {
      this.state.xp -= this.xpNeeded(); this.state.level++;
    }
  }
  private count(key: string, amount = 1): void { this.state.counters[key] = (this.state.counters[key] ?? 0) + amount; }
  perform(activityId: string): Result {
    const activity = ACTIVITIES.find(a => a.id === activityId);
    if (!activity) return { ok: false, message: 'That activity is unavailable.' };
    const s = this.state;
    if (activity.requireLevel && s.level < activity.requireLevel) return { ok: false, message: `Reach level ${activity.requireLevel} first.` };
    if (activity.requireSkill && s.skills[activity.requireSkill[0]] < activity.requireSkill[1]) return { ok: false, message: `Requires ${activity.requireSkill[1]} ${activity.requireSkill[0]}. Train first.` };
    if (s.cash + (activity.cash ?? 0) < 0) return { ok: false, message: 'You do not have enough cash.' };
    if (s.energy + (activity.energy ?? 0) < 0) return { ok: false, message: 'Not enough energy. Eat, rest in the park, or sleep at home.' };
    s.cash += activity.cash ?? 0;
    s.energy = Math.min(100, s.energy + (activity.energy ?? 0));
    s.health = Math.min(100, s.health + (activity.health ?? 0));
    s.minutes += activity.minutes;
    if (activity.skill) s.skills[activity.skill] += activity.skillGain ?? 1;
    if (activity.item) s.inventory[activity.item] = (s.inventory[activity.item] ?? 0) + 1;
    if (activity.counter) this.count(activity.counter);
    this.grantXP(activity.xp ?? 0);
    this.changed();
    const reward = activity.cash && activity.cash > 0 ? ` Earned $${activity.cash}.` : '';
    return { ok: true, message: `${activity.label.split(' · ')[0]} complete.${reward}${activity.item ? ' Added to your bag.' : ''}` };
  }
  deposit(amount: number): Result { return this.transfer(amount, 'deposit'); }
  withdraw(amount: number): Result { return this.transfer(amount, 'withdraw'); }
  private transfer(amount: number, direction: 'deposit' | 'withdraw'): Result {
    if (!Number.isSafeInteger(amount) || amount <= 0) return { ok: false, message: 'Enter a positive whole dollar amount.' };
    const from = direction === 'deposit' ? 'cash' : 'bank';
    const to = direction === 'deposit' ? 'bank' : 'cash';
    if (this.state[from] < amount) return { ok: false, message: `Not enough ${from === 'cash' ? 'cash' : 'money in the bank'}.` };
    this.state[from] -= amount; this.state[to] += amount; this.changed();
    return { ok: true, message: `${direction === 'deposit' ? 'Deposited' : 'Withdrew'} $${amount}.` };
  }
  useItem(id: string): Result {
    if (!Object.hasOwn(ITEMS, id) || !(this.state.inventory[id] > 0)) return { ok: false, message: 'That item is not in your bag.' };
    const item = ITEMS[id];
    this.state.inventory[id]--;
    this.state.energy = Math.min(100, this.state.energy + (item.energy ?? 0));
    this.state.health = Math.min(100, this.state.health + (item.health ?? 0));
    this.changed();
    return { ok: true, message: `Used ${item.name.toLowerCase()}.${item.energy ? ` +${item.energy} energy.` : ''}${item.health ? ` +${item.health} health.` : ''}` };
  }
  acceptMission(id: string): Result {
    const mission = MISSIONS.find(m => m.id === id);
    if (!mission) return { ok: false, message: 'Mission unavailable.' };
    if (this.state.missions[id]) return { ok: false, message: 'You already accepted this mission.' };
    if (mission.prerequisite && this.state.missions[mission.prerequisite] !== 'complete') return { ok: false, message: 'Finish the previous mission first.' };
    this.state.missions[id] = 'active'; this.changed();
    return { ok: true, message: `Mission accepted: ${mission.title}.` };
  }
  missionProgress(id: string): number {
    const mission = MISSIONS.find(m => m.id === id);
    if (!mission) return 0;
    return Math.min(mission.target, mission.counter ? (this.state.counters[mission.counter] ?? 0) : this.state.visited.length);
  }
  claimMission(id: string): Result {
    const mission = MISSIONS.find(m => m.id === id);
    if (!mission || this.state.missions[id] !== 'active') return { ok: false, message: 'Accept this mission first.' };
    if (this.missionProgress(id) < mission.target) return { ok: false, message: 'Your objective is not finished yet.' };
    this.state.missions[id] = 'complete'; this.state.cash += mission.reward; this.grantXP(mission.xp); this.changed();
    return { ok: true, message: `Mission complete! +$${mission.reward} and ${mission.xp} XP.` };
  }
  finishTiming(mode: 'work' | 'pickpocket', accuracy: number): Result {
    if (!Number.isFinite(accuracy)) return { ok: false, message: 'Try the timing challenge again.' };
    if (this.state.energy < 8) return { ok: false, message: 'You need 8 energy to attempt this activity.' };
    const score = Math.max(0, Math.min(1, accuracy));
    this.state.energy -= 8; this.state.minutes += 30;
    if (mode === 'work') {
      const pay = Math.round(8 + score * 32);
      this.state.cash += pay; this.count('sorting-rounds'); this.count('shifts');
      this.grantXP(Math.round(5 + score * 10));
      if (score >= 0.75) this.state.skills.efficiency++;
      this.changed();
      return { ok: true, message: `${Math.round(score * 100)}% accuracy. Sorting shift paid $${pay}.${score >= .75 ? ' +1 efficiency!' : ''}` };
    }
    // A well-timed attempt improves the odds, but crime always carries risk.
    const chance = score < .55 ? 0 : Math.min(.94, .35 + score * .5 + this.state.skills.charm * .01);
    if (this.random() < chance) {
      const amount = 18 + Math.floor(this.random() * 28);
      this.state.cash += amount; this.count('pickpockets'); this.grantXP(15); this.changed();
      return { ok: true, message: `You lifted $${amount}. +15 XP. Keep moving!` };
    }
    const fine = Math.min(this.state.cash, 25);
    this.state.cash -= fine; this.state.health = Math.max(1, this.state.health - 10); this.count('caught'); this.changed();
    return { ok: false, message: `Caught! You paid a $${fine} fine and lost 10 health.` };
  }
  spinSlots(bet: number): { ok: boolean; message: string; reels: string[]; payout: number } {
    if (!Number.isSafeInteger(bet) || bet < 5 || bet > 100) return { ok: false, message: 'Choose a whole-dollar bet from $5 to $100.', reels: ['?', '?', '?'], payout: 0 };
    if (this.state.cash < bet) return { ok: false, message: 'Not enough cash for that bet.', reels: ['?', '?', '?'], payout: 0 };
    const symbols = ['🍒', '🍋', '🔔', '⭐', '7'];
    const reels = Array.from({ length: 3 }, () => symbols[Math.min(4, Math.max(0, Math.floor(this.random() * 5)))]);
    const unique = new Set(reels).size;
    const multiplier = unique === 1 ? (reels[0] === '7' ? 20 : 8) : unique === 2 ? 1 : 0;
    const payout = bet * multiplier;
    this.state.cash += payout - bet; this.state.minutes += 5; this.count('slot-spins'); this.changed();
    return { ok: true, reels, payout, message: multiplier > 1 ? `Jackpot! ${multiplier}× payout: $${payout}.` : multiplier === 1 ? `A pair! Your $${bet} bet is returned.` : `No match. Lost $${bet}.` };
  }
}
