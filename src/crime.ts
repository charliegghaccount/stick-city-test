import type { PlayerState } from './types';
export const CRIME = {
  pursuitSeconds:30, policeSpeed:110, shotDamage:12, shotInterval:1.15, bulletSpeed:250,
  hospitalHealth:60, hospitalEnergy:40, hospitalMinutes:120, maxHospitalBill:150,
  pickpocket:{minutes:15,energy:8,xp:3,skillSuccess:6,skillFailure:2,minPay:8,maxPay:22,fine:25,injury:10,resetMinutes:60},
} as const;
export interface RobberyTier { building:string; skill:number; level:number; min:number; max:number; chance:number; energy:number; minutes:number; resetMinutes:number; skillXP:number; xp:number }
export const ROBBERIES:RobberyTier[]=[
 {building:'cafe',skill:1,level:1,min:25,max:45,chance:.55,energy:14,minutes:30,resetMinutes:240,skillXP:8,xp:4},
 {building:'store',skill:2,level:1,min:60,max:100,chance:.52,energy:18,minutes:40,resetMinutes:360,skillXP:10,xp:5},
 {building:'diner',skill:2,level:1,min:55,max:95,chance:.54,energy:18,minutes:40,resetMinutes:360,skillXP:10,xp:5},
 {building:'post',skill:3,level:2,min:90,max:150,chance:.5,energy:22,minutes:45,resetMinutes:480,skillXP:12,xp:6},
 {building:'garage',skill:4,level:2,min:130,max:210,chance:.48,energy:24,minutes:50,resetMinutes:600,skillXP:14,xp:8},
 {building:'office',skill:5,level:3,min:200,max:330,chance:.45,energy:28,minutes:60,resetMinutes:720,skillXP:16,xp:10},
 {building:'casino',skill:7,level:4,min:350,max:550,chance:.4,energy:34,minutes:90,resetMinutes:1080,skillXP:20,xp:12},
 {building:'bank',skill:10,level:5,min:600,max:950,chance:.35,energy:40,minutes:120,resetMinutes:1440,skillXP:24,xp:15},
];
export function robberyChance(state:PlayerState,tier:RobberyTier,equipmentBonus=0):number {
 return Math.min(.92,Math.max(.18,tier.chance+Math.max(0,state.skills.thieving-tier.skill)*.035+Math.min(10,state.skills.charm)*.003+equipmentBonus));
}
export function pickpocketChance(state:PlayerState,equipmentBonus=0):number {
 return Math.min(.92,.5+(state.skills.thieving-1)*.025+Math.min(10,state.skills.charm)*.005+equipmentBonus/2);
}
