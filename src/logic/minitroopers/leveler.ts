import type { Trooper, Skill } from './types';
import { SKILLS, getRandomSkill, getSkillsByLevel } from './skills';
import { Specialization } from './classes/Skill';

/**
 * Generates a pool of 2 (or 3) skill choices for the trooper's next level.
 * @param trooper The trooper to level up.
 * @returns An array of Skill choices.
 */
export const getSkillChoices = (trooper: Trooper): Skill[] => {
    const targetLevel = trooper.level + 1;
    const numChoices = trooper.skills.some(s => s.id === 'smart') ? 3 : 2;
    const choices: Skill[] = [];

    // Filter already possessed skills to avoid duplicates
    const exclude = [...trooper.skills];

    // LEVEL 6: SPECIALIZATION
    if (targetLevel === 6) {
        // If the trooper ALREADY has a defined Class that matches a Specialization 
        // (e.g. created as "Spy"), force that Specialization.
        const targetSpecId = trooper.class.toLowerCase().replace(/ /g, '_');
        const matchingSpec = SKILLS.find(s => s.id === targetSpecId && s instanceof Specialization);

        if (matchingSpec) {
            return [matchingSpec];
        }

        // Otherwise, offer random Specializations
        const specs = getSkillsByLevel(6);
        // Filter out any (unlikely) already owned specs
        const availableSpecs = specs.filter(s => !exclude.some(e => e.id === s.id));
        
        // Shuffle and pick
        const shuffled = [...availableSpecs].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, numChoices);
    }

    // LEVEL 1-5 & 7+: RANDOM SKILLS (Excluding Specializations)
    // Level 1-5: Pool 1-5.
    // Level 7+: Pool 1-100.
    const maxPoolLevel = targetLevel < 6 ? 5 : 100;

    for (let i = 0; i < numChoices; i++) {
        const skill = getRandomSkill(
            [...exclude, ...choices], // Exclude owned AND already picked choices
            1, 
            maxPoolLevel, 
            true // ALWAYS exclude Specializations (Level 6) from random pool
        );
        choices.push(skill);
    }

    return choices;
};

/**
 * Applies a chosen skill to the trooper, handling Level Up mechanics.
 * @param trooper The trooper to update.
 * @param skill The chosen skill.
 * @returns A new Trooper object with updated stats and skills.
 */
export const applyLevelUp = (trooper: Trooper, skill: Skill): Trooper => {
    const newTrooper = { ...trooper };
    
    // Add Skill
    newTrooper.skills = [...newTrooper.skills, skill];
    newTrooper.level += 1;

    // Initialize Ammo if applicable
    if ((skill as any).capacity) {
        newTrooper.ammo = { ...newTrooper.ammo, [skill.id]: (skill as any).capacity };
    }

    // Handle Specialization changes
    if (skill instanceof Specialization) {
        newTrooper.class = skill.name as any;
        
        // Updates stats based on Spec (e.g. HP bonus)
        // Note: generators.ts 'recalculateTrooperHp' handles this dynamically 
        // if we use it, but here we might need to apply instant bonuses.
        // Specialization constructor has hpBonus and initiativeBonus?
        // Let's rely on explicit bonuses if they exist.
        if (skill.hpBonus) {
             newTrooper.attributes = { ...newTrooper.attributes };
             newTrooper.attributes.maxHp += skill.hpBonus;
             newTrooper.attributes.hp += skill.hpBonus;
        }
    }
    
    // Apply Standard Level Up Stats (Soldier: +1 HP)
    if (newTrooper.class === 'Soldier') { // Or checked via Specialization logic?
        // Standard MiniTroopers logic: Every level up gives +1 HP??
        // Or only for Soldier?
        // generators.ts 'recalculateTrooperHp' implies Soldier gets +1 per level.
        // We should probably invoke 'recalculateTrooperHp' to remain consistent.
        // But we can't import it from 'generators' (Circular dependency risk if generators imports leveler).
        // For now, simple manual update for Soldier.
        if (newTrooper.class === 'Soldier' || skill.name === 'Soldier') {
             // If we just BECAME a soldier, we might get retroactive HP?
             // 'recalculateTrooperHp' handles retroactive.
             // Here we simple increment if already soldier.
             // If we just added 'Soldier' skill, 'hpBonus' in spec handled it?
             // Soldier spec has hpBonus? No, '0' in skills.ts.
             // So logic relies on Class Name check.
             newTrooper.attributes.maxHp += 1;
             newTrooper.attributes.hp += 1;
        }
    }
    
    return newTrooper;
};
