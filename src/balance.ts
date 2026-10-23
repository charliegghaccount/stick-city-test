/** All economy and pacing knobs live here. Real timers count active play only. */
export const BALANCE = {
  character: { base: 120, linear: 70, quadratic: 30, maxLevel: 10000 },
  skill: { base: 60, linear: 40, quadratic: 10, maxLevel: 50 },
  secondsPerGameMinute: 0.45,
  trainingIncreasePerLevel: 0.2,
  multipliers: { characterXP: 1, skillXP: 1, salary: 1, missionCash: .75, missionXP: .4 },
  timing: { minutes: 30, energy: 8, minPay: 3, maxPay: 8, xp: 3, skillXP: 2, crimeXP: 3, crimeMin: 8, crimeRange: 15, fine: 25, injury: 10 },
  slots: { minBet: 5, maxBet: 100, triple: 8, sevens: 20, pair: 1, minutes: 5 },
  jobs: {
    'diner-shift': { pay: 24, minutes: 120, energy: 18, xp: 18, skillXP: 6 },
    'hospitality-waiter': { pay: 42, minutes: 150, energy: 23, xp: 21, skillXP: 8 },
    'hospitality-manager': { pay: 135, minutes: 240, energy: 36, xp: 50, skillXP: 12 },
    'office-shift': { pay: 52, minutes: 180, energy: 24, xp: 24, skillXP: 8 },
    'office-analyst': { pay: 100, minutes: 240, energy: 31, xp: 40, skillXP: 11 },
    'office-executive': { pay: 220, minutes: 300, energy: 40, xp: 65, skillXP: 14 },
    'health-assistant': { pay: 30, minutes: 150, energy: 20, xp: 20, skillXP: 6 },
    'health-nurse': { pay: 110, minutes: 240, energy: 34, xp: 40, skillXP: 11 },
    'retail-assistant': { pay: 23, minutes: 120, energy: 16, xp: 16, skillXP: 6 },
    'retail-manager': { pay: 105, minutes: 240, energy: 32, xp: 40, skillXP: 11 },
    'post-shift': { pay: 38, minutes: 150, energy: 22, xp: 20, skillXP: 7 },
    'garage-shift': { pay: 46, minutes: 180, energy: 26, xp: 24, skillXP: 8 },
  },
  courses: {
    'service-basics': { cost: 100, minutes: 120, energy: 14, xp: 8, skillXP: 12 },
    'office-certificate': { cost: 180, minutes: 180, energy: 18, xp: 12, skillXP: 16 },
    'first-aid': { cost: 120, minutes: 120, energy: 14, xp: 8, skillXP: 12 },
    'data-analysis': { cost: 450, minutes: 240, energy: 24, xp: 18, skillXP: 20 },
    'nursing-diploma': { cost: 650, minutes: 360, energy: 30, xp: 24, skillXP: 25 },
    'management': { cost: 600, minutes: 300, energy: 25, xp: 20, skillXP: 22 },
  },
  activities: {
    sleep: { minutes: 480, seconds: 30, energy: 100, health: 20, xp: 0 },
    coffee: { minutes: 10, cash: -9, energy: 22 },
    'cafe-meal': { minutes: 30, cash: -20, energy: 45, health: 10 },
    'cafe-chat': { minutes: 30, energy: -5, xp: 2, skillXP: 6 },
    'buy-sandwich': { minutes: 5, cash: -14 },
    'buy-apple': { minutes: 5, cash: -6 },
    'buy-medkit': { minutes: 5, cash: -30 },
    'diner-meal': { minutes: 30, cash: -18, energy: 40 },
    study: { minutes: 90, cash: -30, energy: -16, xp: 4, skillXP: 14 },
    'gym-train': { minutes: 60, cash: -20, energy: -18, xp: 3, skillXP: 10 },
    'park-rest': { minutes: 60, seconds: 18, energy: 25 },
    'park-jog': { minutes: 30, energy: -12, xp: 2, skillXP: 5 },
    'clinic-heal': { minutes: 60, cash: -40, health: 100 },
    read: { minutes: 60, energy: -8, xp: 3, skillXP: 8 },
    'library-club': { minutes: 60, energy: -6, xp: 3, skillXP: 8 },
  },
} as const;

export function levelXP(level: number): number {
  const n = Math.max(0, Math.floor(level) - 1), c = BALANCE.character;
  return c.base + c.linear * n + c.quadratic * n * n;
}
export function skillXP(level: number): number {
  const n = Math.max(0, Math.floor(level) - 1), c = BALANCE.skill;
  return c.base + c.linear * n + c.quadratic * n * n;
}
export function totalLevelXP(level: number): number {
  let total = 0; for (let i = 1; i < level; i++) total += levelXP(i); return total;
}
