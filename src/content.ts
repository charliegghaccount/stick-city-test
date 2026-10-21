import type { Activity, Building, Mission } from './types';

/** District content is data: adding another block does not change the game systems. */
const locations = [
  ['home', 'Your Apartment', 'HOME', 'home', 'A tiny apartment. A fresh start. Sleep here for free.', 0xd6b280, 0xa6a7a5],
  ['cafe', 'Bean There Café', 'CAFÉ', 'food', 'Coffee, sandwiches, and a little time to watch the world go by.', 0xf0c573, 0xaaa9a3],
  ['store', 'City General Store', 'GENERAL STORE', 'shop', 'Supplies for a long day in the city. Purchased items go in your bag.', 0xc4dce3, 0x939fa3],
  ['diner', 'Sunrise Diner', 'DINER', 'work', 'The manager always needs a spare pair of hands.', 0xe99b88, 0x929597],
  ['school', 'City College', 'COLLEGE', 'school', 'Study hard to unlock better work at the office.', 0xe9d6ae, 0xadaba6],
  ['bank', 'First City Bank', 'BANK', 'bank', 'Keep your earnings safe. Deposits and withdrawals have no fee.', 0xc4d4df, 0x969fa4],
  ['townhall', 'Town Hall', 'TOWN HALL', 'civic', 'The Mayor has a few jobs for a newcomer with ambition.', 0xe6d4bd, 0xb8b5ac],
  ['gym', 'Iron Works Gym', 'GYM', 'gym', 'Train your strength, one session at a time.', 0xe6b56d, 0x8c9399],
  ['office', 'Metro Offices', 'METRO OFFICES', 'office', 'Skilled work pays more. Education opens the door.', 0xbccbd4, 0x747d87],
  ['casino', 'Lucky Star Casino', 'CASINO', 'casino', 'Three reels. One bet. The house usually wins; spend carefully.', 0xd8abd1, 0x8e8894],
  ['park', 'Founders Park', 'PARK', 'park', 'A patch of peace in the middle of the city.', 0x70b84a, 0x70b84a],
  ['clinic', 'City Health Clinic', 'CLINIC', 'clinic', 'A little care can put you back on your feet.', 0xe6e8df, 0x8babb0],
  ['post', 'City Post Depot', 'POST DEPOT', 'post', 'Deliver the post, or try a timed sorting shift.', 0xdfb276, 0x796955],
  ['library', 'Public Library', 'LIBRARY', 'library', 'A quiet place to read, learn, and practise your charm.', 0xccba9a, 0x85715d],
  ['gang', 'Back Alley Club', 'BACK ALLEY', 'gang', 'The Gang Leader has opportunities of a less respectable kind.', 0xb9b5ad, 0x595958],
  ['garage', 'City Motors Garage', 'CITY MOTORS', 'garage', 'Help out in the workshop. Vehicles are display models in Version 1.', 0x98bbca, 0x687f88],
] as const;

export const BUILDINGS: Building[] = locations.map((location, index) => {
  const [id, name, short, kind, description, color, roof] = location;
  const x = 80 + (index % 4) * 400;
  const y = 100 + Math.floor(index / 4) * 400;
  return { id, name, short, kind, description, x, y, w: 245, h: 220, color, roof,
    door: { x: x + 122.5, y: y + 236 } };
});

export const ITEMS: Record<string, { name: string; description: string; energy?: number; health?: number }> = {
  sandwich: { name: 'Sandwich', description: 'A packed lunch. Restores 35 energy.', energy: 35 },
  apple: { name: 'Apple', description: 'A quick snack. Restores 12 energy and 5 health.', energy: 12, health: 5 },
  medkit: { name: 'First aid kit', description: 'A small emergency kit. Restores 40 health.', health: 40 },
  coffee: { name: 'Takeaway coffee', description: 'A warm boost. Restores 22 energy.', energy: 22 },
};

export const ACTIVITIES: Activity[] = [
  { id: 'sleep', building: 'home', label: 'Sleep · 8 hours', description: 'Recover all energy and 20 health. No charge.', minutes: 480, energy: 100, health: 20, xp: 5 },
  { id: 'coffee', building: 'cafe', label: 'Drink coffee · $8', description: '+25 energy · 10 minutes', cash: -8, energy: 25, minutes: 10 },
  { id: 'cafe-meal', building: 'cafe', label: 'Eat a hot meal · $18', description: '+45 energy, +10 health · 30 minutes', cash: -18, energy: 45, health: 10, minutes: 30 },
  { id: 'cafe-chat', building: 'cafe', label: 'Chat with the regulars', description: '+1 charm, +8 XP · 30 minutes · 5 energy', energy: -5, minutes: 30, xp: 8, skill: 'charm', skillGain: 1 },
  { id: 'buy-sandwich', building: 'store', label: 'Buy sandwich · $12', description: 'Adds a sandwich to your bag: +35 energy when eaten.', cash: -12, minutes: 5, item: 'sandwich', counter: 'purchases' },
  { id: 'buy-apple', building: 'store', label: 'Buy apple · $5', description: 'Adds an apple to your bag: +12 energy, +5 health.', cash: -5, minutes: 5, item: 'apple', counter: 'purchases' },
  { id: 'buy-medkit', building: 'store', label: 'Buy first aid kit · $25', description: 'Adds a first aid kit to your bag: +40 health.', cash: -25, minutes: 5, item: 'medkit', counter: 'purchases' },
  { id: 'diner-shift', building: 'diner', label: 'Wash dishes · Earn $45', description: '2 hours · 22 energy · +20 XP · +1 efficiency', cash: 45, energy: -22, minutes: 120, xp: 20, skill: 'efficiency', skillGain: 1, counter: 'shifts' },
  { id: 'diner-meal', building: 'diner', label: 'Lunch special · $15', description: '+40 energy · 30 minutes', cash: -15, energy: 40, minutes: 30 },
  { id: 'study', building: 'school', label: 'Take a class · $25', description: '+2 intelligence, +30 XP · 2 hours · 18 energy', cash: -25, energy: -18, minutes: 120, xp: 30, skill: 'intelligence', skillGain: 2, counter: 'classes' },
  { id: 'office-shift', building: 'office', label: 'Office assistant · Earn $120', description: 'Level 2 + intelligence 3 required · 3 hours · 28 energy · +45 XP', requireLevel: 2, requireSkill: ['intelligence', 3], cash: 120, energy: -28, minutes: 180, xp: 45, skill: 'efficiency', skillGain: 2, counter: 'shifts' },
  { id: 'gym-train', building: 'gym', label: 'Strength training · $15', description: '+2 strength, +18 XP · 1 hour · 20 energy', cash: -15, energy: -20, minutes: 60, xp: 18, skill: 'strength', skillGain: 2 },
  { id: 'park-rest', building: 'park', label: 'Rest on a bench', description: '+20 energy · 1 hour · Free', energy: 20, minutes: 60 },
  { id: 'park-jog', building: 'park', label: 'Go for a jog', description: '+1 strength, +10 XP · 30 minutes · 12 energy', energy: -12, minutes: 30, xp: 10, skill: 'strength', skillGain: 1 },
  { id: 'clinic-heal', building: 'clinic', label: 'See the doctor · $35', description: 'Restore full health · 1 hour', cash: -35, health: 100, minutes: 60 },
  { id: 'post-shift', building: 'post', label: 'Deliver the post · Earn $75', description: 'Level 2 + efficiency 2 required · 2 hours · 26 energy · +30 XP · +1 efficiency', requireLevel: 2, requireSkill: ['efficiency', 2], cash: 75, energy: -26, minutes: 120, xp: 30, skill: 'efficiency', skillGain: 1, counter: 'shifts' },
  { id: 'read', building: 'library', label: 'Read a textbook', description: '+1 intelligence, +15 XP · 1 hour · 8 energy · Free', energy: -8, minutes: 60, xp: 15, skill: 'intelligence', skillGain: 1 },
  { id: 'library-club', building: 'library', label: 'Join the book club', description: '+1 charm, +10 XP · 1 hour · 6 energy · Free', energy: -6, minutes: 60, xp: 10, skill: 'charm', skillGain: 1 },
  { id: 'garage-shift', building: 'garage', label: 'Help in the workshop · Earn $60', description: 'Strength 2 required · 2 hours · 25 energy · +25 XP', requireSkill: ['strength', 2], cash: 60, energy: -25, minutes: 120, xp: 25, skill: 'efficiency', skillGain: 1, counter: 'shifts' },
];

export const MISSIONS: Mission[] = [
  { id: 'welcome', giver: 'townhall', title: 'Welcome to the neighbourhood', description: 'Mayor Bell: “Get to know your new home. Visit four different places, then come back.”', objective: 'Visit 4 different locations', target: 4, reward: 60, xp: 35 },
  { id: 'honest-work', giver: 'townhall', title: 'An honest day’s work', description: 'Mayor Bell: “A city works when its people do. Finish two job shifts and report back.”', objective: 'Finish 2 job shifts', counter: 'shifts', target: 2, reward: 100, xp: 50, prerequisite: 'welcome' },
  { id: 'light-fingers', giver: 'gang', title: 'Light fingers', description: 'The Gang Leader: “Show me you can lift a wallet. Pickpocket a pedestrian and return here. Miss the timing and you risk a fine.”', objective: 'Successfully pickpocket 1 pedestrian', counter: 'pickpockets', target: 1, reward: 80, xp: 40 },
];
