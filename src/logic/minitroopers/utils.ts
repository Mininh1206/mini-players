import { SKILLS } from './skills';
import type { Skill } from './types';

export const getDistance = (p1: {x: number, y: number} | undefined, p2: {x: number, y: number} | undefined) => {
    if (!p1 || !p2) return 9999;
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export const getSkillDefinition = (skillId: string): Skill | undefined => {
    return SKILLS.find(s => s.id === skillId);
};
