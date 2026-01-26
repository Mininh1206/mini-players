import { SKILLS } from './skills';
import { Weapon, Grenade, Melee } from './classes/Skill';
import type { Skill } from './types';

/**
 * Calculate Euclidean distance between two points
 */
export const getDistance = (p1: {x: number, y: number} | undefined, p2: {x: number, y: number} | undefined): number => {
    if (!p1 || !p2) return 9999;
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

/**
 * Get skill definition from the global SKILLS array
 */
export const getSkillDefinition = (skillId: string): Skill | undefined => {
    return SKILLS.find(s => s.id === skillId);
};

/**
 * Check if a skill is a Weapon (any type)
 */
export const isWeapon = (skill: Skill | any): skill is Weapon => {
    const def = SKILLS.find(s => s.id === skill.id);
    return def instanceof Weapon;
};

/**
 * Check if a skill is a Melee weapon (range = 1)
 */
export const isMelee = (skill: Skill | any): boolean => {
    const def = SKILLS.find(s => s.id === skill.id);
    return def instanceof Melee || (def instanceof Weapon && (def as any).range === 1);
};

/**
 * Check if a skill is a Ranged weapon (range > 1)
 */
export const isRanged = (skill: Skill | any): boolean => {
    const def = SKILLS.find(s => s.id === skill.id);
    return def instanceof Weapon && (def as any).range > 1;
};

/**
 * Check if a skill is a Grenade
 */
export const isGrenade = (skill: Skill | any): skill is Grenade => {
    const def = SKILLS.find(s => s.id === skill.id);
    return def instanceof Grenade;
};

/**
 * Check if a weapon has area damage (AOE)
 */
export const hasAreaDamage = (skill: Skill | any): boolean => {
    const def = SKILLS.find(s => s.id === skill.id);
    return (def as any)?.area > 0;
};

/**
 * Check if a weapon has penetration
 */
export const hasPenetration = (skill: Skill | any): boolean => {
    const def = SKILLS.find(s => s.id === skill.id);
    return (def as any)?.penetration > 0;
};
