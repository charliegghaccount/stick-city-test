import { BALANCE } from './balance';
import type { Activity, Skill } from './types';
export const COURSES = [
  { id: 'service-basics', title: 'Service certificate', description: 'Qualifies you for waiter work.', skill: 'charm', skills: { charm: 2 } },
  { id: 'office-certificate', title: 'Office certificate', description: 'Qualifies you for office assistant work.', skill: 'intelligence', skills: { intelligence: 2 } },
  { id: 'first-aid', title: 'First aid certificate', description: 'A prerequisite for professional nursing.', skill: 'intelligence', skills: { intelligence: 2 } },
  { id: 'data-analysis', title: 'Data analysis certificate', description: 'Qualifies you for analyst work.', skill: 'intelligence', skills: { intelligence: 3 }, qualifications: ['office-certificate'] },
  { id: 'nursing-diploma', title: 'Nursing diploma', description: 'Qualifies you for registered nurse work.', skill: 'intelligence', skills: { intelligence: 4 }, qualifications: ['first-aid'] },
  { id: 'medical-technology', title: 'Medical technology certificate', description: 'Qualifies you for medical technician work.', skill: 'intelligence', skills: { intelligence: 3 }, qualifications: ['first-aid'] },
  { id: 'medical-degree', title: 'Medical degree', description: 'Qualifies you for doctor work.', skill: 'intelligence', skills: { intelligence: 6, strength: 3 }, qualifications: ['nursing-diploma', 'medical-technology'] },
  { id: 'public-administration', title: 'Public administration diploma', description: 'Qualifies you for public inspector work.', skill: 'charm', skills: { intelligence: 3, charm: 3 }, qualifications: ['office-certificate'] },
  { id: 'electrical-license', title: 'Electrical trade license', description: 'Qualifies you for electrician work.', skill: 'intelligence', skills: { intelligence: 3, strength: 3 }, qualifications: ['first-aid'] },
  { id: 'management', title: 'Management diploma', description: 'Opens management roles in retail, hospitality and corporate work.', skill: 'charm', skills: { efficiency: 3, charm: 3 } },
] satisfies { id: keyof typeof BALANCE.courses; title: string; description: string; skill: Skill; skills: Partial<Record<Skill, number>>; qualifications?: string[] }[];

const roles: { id: keyof typeof BALANCE.jobs; title: string; building: string; career: string; rank: number; level?: number; skills?: Partial<Record<Skill, number>>; qualifications?: string[]; skill: Skill }[] = [
  { id: 'diner-shift', title: 'Kitchen assistant', building: 'diner', career: 'Hospitality', rank: 1, skill: 'efficiency' },
  { id: 'hospitality-waiter', title: 'Waiter', building: 'diner', career: 'Hospitality', rank: 2, level: 2, skills: { efficiency: 2, charm: 2 }, qualifications: ['service-basics'], skill: 'charm' },
  { id: 'hospitality-supervisor', title: 'Hospitality supervisor', building: 'diner', career: 'Hospitality', rank: 3, level: 3, skills: { efficiency: 3, charm: 3 }, qualifications: ['service-basics'], skill: 'efficiency' },
  { id: 'hospitality-manager', title: 'Restaurant manager', building: 'diner', career: 'Hospitality', rank: 4, level: 5, skills: { efficiency: 4, charm: 4 }, qualifications: ['management'], skill: 'efficiency' },
  { id: 'office-shift', title: 'Office assistant', building: 'office', career: 'Corporate', rank: 1, level: 2, skills: { intelligence: 2 }, qualifications: ['office-certificate'], skill: 'efficiency' },
  { id: 'office-admin', title: 'Administrator', building: 'office', career: 'Corporate', rank: 2, level: 3, skills: { intelligence: 3, efficiency: 2 }, qualifications: ['office-certificate'], skill: 'efficiency' },
  { id: 'office-analyst', title: 'Analyst', building: 'office', career: 'Corporate', rank: 3, level: 4, skills: { intelligence: 4, efficiency: 3 }, qualifications: ['data-analysis'], skill: 'intelligence' },
  { id: 'office-executive', title: 'Executive', building: 'office', career: 'Corporate', rank: 4, level: 7, skills: { intelligence: 6, charm: 5 }, qualifications: ['data-analysis', 'management'], skill: 'charm' },
  { id: 'health-assistant', title: 'Hospital assistant', building: 'clinic', career: 'Healthcare', rank: 1, skill: 'intelligence' },
  { id: 'health-technician', title: 'Medical technician', building: 'clinic', career: 'Healthcare', rank: 2, level: 3, skills: { intelligence: 3, efficiency: 2 }, qualifications: ['medical-technology'], skill: 'intelligence' },
  { id: 'health-nurse', title: 'Registered nurse', building: 'clinic', career: 'Healthcare', rank: 3, level: 4, skills: { intelligence: 4, strength: 2 }, qualifications: ['nursing-diploma'], skill: 'intelligence' },
  { id: 'health-doctor', title: 'Doctor', building: 'clinic', career: 'Healthcare', rank: 4, level: 7, skills: { intelligence: 6, charm: 4, strength: 3 }, qualifications: ['medical-degree'], skill: 'intelligence' },
  { id: 'public-inspector', title: 'Public services inspector', building: 'townhall', career: 'Public services', rank: 2, level: 4, skills: { intelligence: 3, charm: 3 }, qualifications: ['public-administration'], skill: 'charm' },
  { id: 'trade-electrician', title: 'Electrician', building: 'garage', career: 'Trades', rank: 2, level: 4, skills: { intelligence: 3, strength: 3 }, qualifications: ['electrical-license'], skill: 'efficiency' },
  { id: 'retail-assistant', title: 'Shop assistant', building: 'store', career: 'Retail', rank: 1, skill: 'charm' },
  { id: 'retail-manager', title: 'Store manager', building: 'store', career: 'Retail', rank: 2, level: 4, skills: { efficiency: 4, charm: 3 }, qualifications: ['management'], skill: 'efficiency' },
  { id: 'post-shift', title: 'Postal courier', building: 'post', career: 'Public services', rank: 1, level: 2, skills: { efficiency: 2 }, skill: 'efficiency' },
  { id: 'garage-shift', title: 'Workshop assistant', building: 'garage', career: 'Trades', rank: 1, skills: { strength: 2 }, skill: 'efficiency' },
];
export const JOBS: Activity[] = roles.sort((a,b)=>a.rank-b.rank).map(role => {
  const rate = BALANCE.jobs[role.id];
  return { id: role.id, building: role.building, label: role.title, description: `${role.career} · position ${role.rank}`, career: role.career, rank: role.rank,
    cash: Math.floor(rate.pay * BALANCE.multipliers.salary), minutes: rate.minutes, energy: -rate.energy,
    xp: rate.xp, skill: role.skill, skillXP: rate.skillXP, requireLevel: role.level,
    requireSkills: role.skills, requireQualifications: role.qualifications, counter: 'shifts' };
});
export const COURSE_ACTIVITIES: Activity[] = COURSES.map(course => {
  const rate = BALANCE.courses[course.id];
  return { id: `course-${course.id}`, building: 'school', label: course.title, description: course.description,
    qualification: course.id, requireSkills: course.skills, requireQualifications: 'qualifications' in course ? course.qualifications : undefined,
    cash: -rate.cost, minutes: rate.minutes, energy: -rate.energy, xp: rate.xp, skill: course.skill, skillXP: rate.skillXP };
});
export function qualificationName(id: string): string { return COURSES.find(c => c.id === id)?.title ?? id; }
