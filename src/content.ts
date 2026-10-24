import type { Activity, Building, Mission, Item } from './types';
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
  ['garage', 'City Motors Garage', 'CITY MOTORS', 'garage', 'Help out in the workshop. Vehicles are display models in Version 3.', 0x98bbca, 0x82b3c6],
] as const;

export const BUILDINGS: Building[] = locations.map((location, index) => {
  const [id, name, short, kind, description, color, roof] = location;
  const x = 80 + (index % 4) * 400;
  const y = 100 + Math.floor(index / 4) * 400;
  return { id, name, short, kind, description, x, y, w: 245, h: 220, color, roof,
    door: { x: x + 122.5, y: y + 236 } };
});

export const ITEMS: Record<string, Item> = {
  mealbox: {name:'Meal box',description:'A substantial packed meal: +65 energy, +8 health.',energy:65,health:8},
  traumakit: {name:'Trauma kit',description:'Advanced first aid: +85 health.',health:85},
  lockpicks: {name:'Lockpick set',description:'Reusable equipment: +6 percentage points to robbery success. Does not stack.',equipment:true,robberyBonus:.06},
  shoes: {name:'Running shoes',description:'Reusable equipment: +10% walking speed, including during police pursuits.',equipment:true,speedBonus:.1},
  vest: {name:'Protective vest',description:'Reusable equipment: reduces police damage by 25%.',equipment:true,damageReduction:.25},
  studyguide: {name:'Study guide',description:'Reusable equipment: +20% intelligence skill XP from study and work.',equipment:true,intelligenceBonus:.2},
  sandwich: { name: 'Sandwich', description: 'A packed lunch. Restores 35 energy.', energy: 35 },
  apple: { name: 'Apple', description: 'A quick snack. Restores 12 energy and 5 health.', energy: 12, health: 5 },
  medkit: { name: 'First aid kit', description: 'A small emergency kit. Restores 40 health.', health: 40 },
  coffee: { name: 'Takeaway coffee', description: 'A warm boost. Restores 22 energy.', energy: 22 },
};

const basics: { id: keyof typeof BALANCE.activities; building: string; label: string; description: string; skill?: Activity['skill']; item?: string; training?: boolean }[] = [
  { id:'thieving-practice',building:'gang',label:'Practise Thieving',description:'Learn misdirection with the Gang Leader. Builds Thieving XP.',skill:'thieving',training:true },
  { id:'gang-courier',building:'gang',label:'Gang courier job',description:'Carry sealed packages. Modest pay and Thieving practice.',skill:'thieving' },
  { id:'buy-mealbox',building:'store',label:'Buy meal box',description:ITEMS.mealbox.description,item:'mealbox' },
  { id:'buy-traumakit',building:'clinic',label:'Buy trauma kit',description:ITEMS.traumakit.description,item:'traumakit' },
  { id:'buy-lockpicks',building:'garage',label:'Buy lockpick set',description:ITEMS.lockpicks.description,item:'lockpicks' },
  { id:'buy-shoes',building:'store',label:'Buy running shoes',description:ITEMS.shoes.description,item:'shoes' },
  { id:'buy-vest',building:'garage',label:'Buy protective vest',description:ITEMS.vest.description,item:'vest' },
  { id:'buy-studyguide',building:'library',label:'Buy study guide',description:ITEMS.studyguide.description,item:'studyguide' },
  { id:'buy-coffee',building:'cafe',label:'Buy takeaway coffee',description:ITEMS.coffee.description,item:'coffee' },
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

const missionData: Mission[] = [
  { id: 'welcome', giver: 'townhall', title: 'Welcome to the neighbourhood', description: 'Mayor Bell: “Get to know your new home. Visit four different places, then come back.”', objective: 'Visit 4 different locations', target: 4, reward: 60, xp: 35 },
  { id: 'honest-work', giver: 'townhall', title: 'An honest day’s work', description: 'Mayor Bell: “A city works when its people do. Finish two job shifts and report back.”', objective: 'Finish 2 job shifts', counter: 'shifts', target: 2, reward: 100, xp: 50, prerequisite: 'welcome' },
  { id: 'light-fingers', giver: 'gang', title: 'Light fingers', description: 'The Gang Leader: “Show me you can lift a wallet. Pickpocket a pedestrian and return here. Miss the timing and you risk a fine.”', objective: 'Successfully pickpocket 1 pedestrian', counter: 'pickpockets', target: 1, reward: 80, xp: 40 },
  {id:'community-supplies',giver:'townhall',title:'Supplies for city life',description:'Mayor Bell: “Earn your way and keep useful supplies on hand.”',objective:'Earn $250 through work and buy 3 supplies',target:253,reward:120,xp:55,prerequisite:'honest-work',objectives:[{kind:'counter',key:'earned',target:250,label:'Earn from work'},{kind:'counter',key:'purchases',target:3,label:'Buy supplies'}]},
  {id:'good-neighbour',giver:'townhall',title:'A good neighbour',description:'Mayor Bell: “Learn something and get to know three neighbours.”',objective:'Intelligence 3 and talk to 3 people',target:6,reward:160,xp:65,prerequisite:'community-supplies',objectives:[{kind:'skill',key:'intelligence',target:3,label:'Intelligence level'},{kind:'counter',key:'conversations',target:3,label:'Different neighbours'}]},
  {id:'case-district',giver:'gang',title:'Case the district',description:'Gang Leader: “Build Thieving to 2 and get information from three locals.”',objective:'Thieving 2 and talk to 3 people',target:5,reward:100,xp:50,prerequisite:'light-fingers',objectives:[{kind:'skill',key:'thieving',target:2,label:'Thieving level'},{kind:'counter',key:'conversations',target:3,label:'Different neighbours'}]},
  {id:'first-scores',giver:'gang',title:'Two clean scores',description:'Gang Leader: “Pull off two building robberies. Survive the consequences if caught.”',objective:'Successfully rob 2 buildings',counter:'robberies',target:2,reward:200,xp:70,prerequisite:'case-district'},
];
export const MISSIONS: Mission[] = missionData.map(m => ({ ...m, reward: Math.floor(m.reward * BALANCE.multipliers.missionCash), xp: Math.floor(m.xp * BALANCE.multipliers.missionXP) }));
