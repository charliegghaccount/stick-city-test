export const SKILLS = ['efficiency', 'charm', 'intelligence', 'strength'] as const;
export type Skill = typeof SKILLS[number];
export interface Position { x: number; y: number }
export interface PlayerState {
 version: 1; position: Position; cash: number; bank: number; energy: number; health: number;
 level: number; xp: number; minutes: number; skills: Record<Skill, number>;
 inventory: Record<string, number>; missions: Record<string, 'active' | 'complete'>;
 counters: Record<string, number>; visited: string[];
}
export interface Building {
 id: string; name: string; short: string; kind: string; description: string;
 x: number; y: number; w: number; h: number; color: number; roof: number; door: Position;
}
export interface Activity {
 id: string; building: string; label: string; description: string;
 cash?: number; energy?: number; health?: number; minutes: number; xp?: number;
 skill?: Skill; skillGain?: number; requireLevel?: number; requireSkill?: [Skill, number];
 item?: string; counter?: string;
}
export interface Mission {
 id: string; giver: string; title: string; description: string; objective: string;
 counter?: string; target: number; reward: number; xp: number; prerequisite?: string;
}
export interface Result { ok: boolean; message: string }
export interface CityBridge {
 goToBuilding(id: string): void;
 stop(): void;
 resetPosition(): void;
}
