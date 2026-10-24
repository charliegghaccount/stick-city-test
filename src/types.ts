export const SKILLS = ['efficiency', 'charm', 'intelligence', 'strength', 'thieving'] as const;
export type Skill = typeof SKILLS[number];
export interface Position { x: number; y: number }
export interface PlayerState {
 version: 3; position: Position; cash: number; bank: number; energy: number; health: number;
 level: number; xp: number; minutes: number; skills: Record<Skill, number>;
 skillXP: Record<Skill, number>; qualifications: string[]; developerModified: boolean; playSeconds: number;
 currentJob: string | null; pursuit: PursuitState | null; crimeReadyAt: Record<string, number>; contacts: string[]; inventory: Record<string, number>; missions: Record<string, 'active' | 'complete'>;
 counters: Record<string, number>; visited: string[];
}
export interface Building {
 id: string; name: string; short: string; kind: string; description: string;
 x: number; y: number; w: number; h: number; color: number; roof: number; door: Position;
}
export interface Activity {
 id: string; building: string; label: string; description: string;
 cash?: number; energy?: number; health?: number; minutes: number; xp?: number;
 skill?: Skill; skillXP?: number; training?: boolean; career?: string; rank?: number; qualification?: string; requireSkills?: Partial<Record<Skill, number>>; requireQualifications?: string[]; requireLevel?: number; requireSkill?: [Skill, number];
 item?: string; counter?: string;
}
export interface Mission {
 id: string; giver: string; title: string; description: string; objective: string;
 counter?: string; target: number; reward: number; xp: number; prerequisite?: string; objectives?: { kind: 'counter' | 'skill'; key: string; target: number; label: string }[];
}
export interface Result { ok: boolean; message: string }
export interface CityBridge {
 goToBuilding(id: string): void;
 stop(): void;
 resetPosition(): void;
 teleport(x: number, y: number): Result;
 snapshot(): { position: Position; camera: Position; moving: boolean; npcs: number; cars: number; fps: number };
}

export interface LegacyPendingActivity { kind: 'activity' | 'work' | 'pickpocket'; id: string; remainingSeconds: number; totalSeconds: number; accuracy?: number; }
export interface DeveloperModifiers { infiniteEnergy: boolean; infiniteHealth: boolean; speed: 1 | 2 | 3 | 5; noclip: boolean; paused: boolean; }

export interface PursuitState { remaining: number; serial: number; }
export interface Item { name: string; description: string; energy?: number; health?: number; equipment?: boolean; robberyBonus?: number; speedBonus?: number; damageReduction?: number; intelligenceBonus?: number; }
