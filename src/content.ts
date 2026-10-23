import type { Activity, Building, Mission } from './types';
import { BALANCE } from './balance';
import { JOBS, COURSE_ACTIVITIES } from './careers';

/** District content is data: adding another block does not change the game systems. */
const locations = [
  ['home', 'Your Apartment', 'HOME', 'home', 'A tiny apartment. A fresh start. Sleep here for free.', 0xd6b280, 0xd88667],
  ['cafe', 'Bean There Café', 'CAFÉ', 'food', 'Coffee, sandwiches, and a little time to watch the world go by.', 0xf0c573, 0xe1bc72],
  ['store', 'City General Store', 'GENERAL STORE', 'shop', 'Supplies for a long day in the city. Purchased items go in your bag.', 0xc4dce3, 0x72b5b2],
  ['diner', 'Sunrise Diner', 'DINER', 'work', 'The manager always needs a spare pair of hands.', 0xe99b88, 0xda8880],
  ['school', 'City College', 'COLLEGE', 'school', 'Study hard to unlock better work at the office.', 0xe9d6ae, 0xd5c697],
  ['bank', 'First City Bank', 'BANK', 'bank', 'Keep your earnings safe. Deposits and withdrawals have no fee.', 0xc4d4df, 0x8fb4c8],
  ['townhall', 'Town Hall', 'TOWN HALL', 'civic', 'The Mayor has a few jobs for a newcomer with ambition.', 0xe6d4bd, 0xd7c7a2],
  ['gym', 'Iron Works Gym', 'GYM', 'gym', 'Train your strength, one session at a time.', 0xe6b56d, 0x86a7b6],
  ['office', 'Metro Offices', 'METRO OFFICES', 'office', 'Skilled work pays more. Education opens the door.', 0xbccbd4, 0x83a5bb],
  ['casino', 'Lucky Star Casino', 'CASINO', 'casino', 'Three reels. One bet. The house usually wins; spend carefully.', 0xd8abd1, 0xb18eb9],
  ['park', 'Founders Park', 'PARK', 'park', 'A patch of peace in the middle of the city.', 0x70b84a, 0x70b84a],
  ['clinic', 'City Health Clinic', 'CLINIC', 'clinic', 'A little care can put you back on your feet.', 0xe6e8df, 0x9ed2c1],
  ['post', 'City Post Depot', 'POST DEPOT', 'post', 'Deliver the post, or try a timed sorting shift.', 0xdfb276, 0xc49765],
  ['library', 'Public Library', 'LIBRARY', 'library', 'A quiet place to read, learn, and practise your charm.', 0xccba9a, 0xbaa480],
  ['gang', 'Back Alley Club', 'BACK ALLEY', 'gang', 'The Gang Leader has opportunities of a less respectable kind.', 0xb9b5ad, 0x85918b],
  ['garage', 'City Motors Garage', 'CITY MOTORS', 'garage', 'Help out in the workshop. Vehicles are display models in Version 2.', 0x98bbca, 0x82b3c6],
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

const basics: { id: keyof typeof BALANCE.activities; building: string; label: string; description: string; skill?: Activity['skill']; item?: string; training?: boolean }[] = [
  { id:'sleep', building:'home', label:'Sleep · 8 hours', description:'Recover all energy and 20 health. Free; no XP.' },
  { id:'coffee', building:'cafe', label:'Drink coffee', description:'A quick energy boost.' },
  { id:'cafe-meal', building:'cafe', label:'Eat a hot meal', description:'Recover energy and health.' },
  { id:'cafe-chat', building:'cafe', label:'Chat with the regulars', description:'Practise conversation a little at a time.', skill:'charm', training:true },
  { id:'buy-sandwich', building:'store', label:'Buy sandwich', description:'Keep it in your bag. Restores 35 energy when eaten.', item:'sandwich' },
  { id:'buy-apple', building:'store', label:'Buy apple', description:'Keep it in your bag. Restores 12 energy and 5 health.', item:'apple' },
  { id:'buy-medkit', building:'store', label:'Buy first aid kit', description:'Keep it in your bag. Restores 40 health.', item:'medkit' },
  { id:'diner-meal', building:'diner', label:'Lunch special', description:'A filling meal restores energy.' },
  { id:'study', building:'school', label:'Study session', description:'Earn intelligence XP. Advanced sessions take longer and cost more.', skill:'intelligence', training:true },
  { id:'gym-train', building:'gym', label:'Strength training', description:'Earn strength XP. Advanced training costs more time and money.', skill:'strength', training:true },
  { id:'park-rest', building:'park', label:'Rest on a bench', description:'Free recovery. No XP.' },
  { id:'park-jog', building:'park', label:'Go for a jog', description:'Slowly build strength through exercise.', skill:'strength', training:true },
  { id:'clinic-heal', building:'clinic', label:'See the doctor', description:'Restore full health.' },
  { id:'read', building:'library', label:'Read a textbook', description:'Free intelligence practice. Higher-level books take longer.', skill:'intelligence', training:true },
  { id:'library-club', building:'library', label:'Join the book club', description:'Practise charm with fellow readers.', skill:'charm', training:true },
];
export const ACTIVITIES: Activity[] = [
  ...basics.map(a => ({ ...a, ...BALANCE.activities[a.id], counter: a.item ? 'purchases' : undefined })),
  ...JOBS, ...COURSE_ACTIVITIES,
];

export const MISSIONS: Mission[] = [
  { id: 'welcome', giver: 'townhall', title: 'Welcome to the neighbourhood', description: 'Mayor Bell: “Get to know your new home. Visit four different places, then come back.”', objective: 'Visit 4 different locations', target: 4, reward: 60, xp: 35 },
  { id: 'honest-work', giver: 'townhall', title: 'An honest day’s work', description: 'Mayor Bell: “A city works when its people do. Finish two job shifts and report back.”', objective: 'Finish 2 job shifts', counter: 'shifts', target: 2, reward: 100, xp: 50, prerequisite: 'welcome' },
  { id: 'light-fingers', giver: 'gang', title: 'Light fingers', description: 'The Gang Leader: “Show me you can lift a wallet. Pickpocket a pedestrian and return here. Miss the timing and you risk a fine.”', objective: 'Successfully pickpocket 1 pedestrian', counter: 'pickpockets', target: 1, reward: 80, xp: 40 },
].map(m => ({ ...m, reward: Math.floor(m.reward * BALANCE.multipliers.missionCash), xp: Math.floor(m.xp * BALANCE.multipliers.missionXP) }));
