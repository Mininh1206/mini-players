import { v4 as uuidv4 } from 'uuid';
import type { Trooper, TrooperClass, TrooperAttributes } from './types';
import { getRandomSkill, getDefaultWeapons, getSkillsByLevel, SKILLS } from './skills';

const CLASSES: TrooperClass[] = ['Soldier', 'Sniper', 'Doctor', 'Pilot', 'Commando', 'Scout', 'Spy', 'Saboteur'];
const NAMES = ['Sgt. Johnson', 'Pvt. Ryan', 'Cpl. Hicks', 'Lt. Ripley', 'Maj. Kusanagi', 'Capt. Price', 'Soap', 'Ghost', 'Rookie', 'Snake', 'Samus', 'Chief'];
const RAT_NAMES = ['Rat', 'Giant Rat', 'Sewer Rat', 'Plague Rat', 'Mutant Rat'];

const BASE_ATTRIBUTES: Record<TrooperClass, TrooperAttributes> = {
    'Recruit': { hp: 10, maxHp: 10, initiative: 10, range: 1, damage: 10, aim: 80, dodge: 10, armor: 0, critChance: 5, speed: 100 },
    'Soldier': { hp: 10, maxHp: 10, initiative: 10, range: 1, damage: 10, aim: 80, dodge: 10, armor: 1, critChance: 5, speed: 100 },
    'Sniper': { hp: 10, maxHp: 10, initiative: 15, range: 10, damage: 20, aim: 90, dodge: 5, armor: 0, critChance: 20, speed: 100 },
    'Doctor': { hp: 10, maxHp: 10, initiative: 8, range: 2, damage: 5, aim: 70, dodge: 15, armor: 0, critChance: 5, speed: 100 },
    'Pilot': { hp: 10, maxHp: 10, initiative: 12, range: 1, damage: 8, aim: 75, dodge: 20, armor: 0, critChance: 10, speed: 100 },
    'Commando': { hp: 10, maxHp: 10, initiative: 12, range: 1, damage: 12, aim: 85, dodge: 10, armor: 2, critChance: 10, speed: 120 },
    'Scout': { hp: 10, maxHp: 10, initiative: 20, range: 1, damage: 7, aim: 85, dodge: 30, armor: 0, critChance: 15, speed: 130 },
    'Spy': { hp: 10, maxHp: 10, initiative: 30, range: 1, damage: 10, aim: 90, dodge: 20, armor: 0, critChance: 25, speed: 110 },
    'Saboteur': { hp: 10, maxHp: 10, initiative: 15, range: 1, damage: 10, aim: 80, dodge: 15, armor: 0, critChance: 10, speed: 105 },
    'Comms Officer': { hp: 10, maxHp: 10, initiative: 10, range: 1, damage: 8, aim: 75, dodge: 10, armor: 0, critChance: 5, speed: 100 },
    'Rat': { hp: 20, maxHp: 20, initiative: 20, range: 1, damage: 5, aim: 80, dodge: 25, armor: 0, critChance: 10, speed: 140 }
};

export const generateRandomTrooper = (targetLevel: number = 1): Trooper => {
    // 1. Initialize as a Level 1 Recruit
    const trooperClass: TrooperClass = 'Recruit';
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const baseStats = { ...BASE_ATTRIBUTES['Recruit'] };
    // Human base HP correction
    baseStats.maxHp = 30;
    baseStats.hp = 30;

    // 2. Pick a default weapon (Level 1)
    const defaultWeapons = getDefaultWeapons();
    const startingWeapon = defaultWeapons[Math.floor(Math.random() * defaultWeapons.length)];
    
    // 3. Pick a random Level 1 skill (excluding the weapon)
    // Exclude specializations (Level 6) for normal skill slots
    const startingSkill = getRandomSkill([startingWeapon], 1, 5); 
    
    let skills = [startingWeapon, startingSkill];
    let currentClass: TrooperClass = trooperClass;
    let currentLevel = 1;

    // 4. Simulate Leveling Up
    while (currentLevel < targetLevel) {
        currentLevel++;
        
        if (currentLevel === 6) {
            // Level 6: Specialization
            const specializations = getSkillsByLevel(6);
            if (specializations.length > 0) {
                const spec = specializations[Math.floor(Math.random() * specializations.length)];
                skills.push(spec);
                
                // Update Class and Stats
                currentClass = spec.name as TrooperClass;
                if ((spec as any).hpBonus) {
                    baseStats.maxHp += (spec as any).hpBonus;
                    baseStats.hp += (spec as any).hpBonus; // Heal on level up? Or just increase max. Let's increase both.
                }
                if ((spec as any).initiativeBonus) {
                    baseStats.initiative += (spec as any).initiativeBonus;
                }
            }
        } else {
            // Standard Level: Random Skill (Level 1-100, excluding Level 6 Specializations)
            // Filter out existing skills
            const newSkill = getRandomSkill(skills, 1, 100);
            
            // Hacky: Ensure we don't pick a Specialization by accident if getRandomSkill doesn't exclude them perfectly 
            // (Our logic in skills.ts assumes maxLevel handles it, but let's be safe. 
            // Actually Specializations are Level 6. So if we ask for Level 1-100, we might get them? 
            // We should modify getRandomSkill usage or filter locally. 
            // For now, let's assume we want to exclude Level 6 triggers if we aren't at Level 6? 
            // No, getting a specialization later might be weird. Let's filter:
            if ((newSkill.level === 6) && currentLevel !== 6) {
                // Try again or just accept it? User said "Specialization at lvl 6". 
                // Let's force retry or just pick another.
                const fallback = getRandomSkill([...skills, newSkill], 1, 5); // Pick low level skill safe
                skills.push(fallback);
            } else {
                skills.push(newSkill);
            }
        }

        // Stat scaling per level
        // baseStats.maxHp += 2; // Removed per user request: HP does not scale with level
        // baseStats.hp = baseStats.maxHp;
    }

    // Initialize Ammo
    const ammo: Record<string, number> = {};
    skills.forEach(s => {
        if ((s as any).capacity) {
            ammo[s.id] = (s as any).capacity;
        }
    });

    return {
        id: uuidv4(),
        name,
        class: currentClass,
        team: 'A', 
        attributes: baseStats,
        skills,
        isDead: false,
        level: currentLevel,
        cooldown: 0,
        ammo,
        disarmed: [],
        tactics: {
            priority: 'closest',
            targetPart: 'any'
        }
    };
};

export const generateRat = (level: number = 1): Trooper => {
    const name = RAT_NAMES[Math.floor(Math.random() * RAT_NAMES.length)];
    const baseStats = { ...BASE_ATTRIBUTES['Rat'] };
    // Scale Rat stats specifically
    baseStats.maxHp += (level - 1) * 5;
    baseStats.hp = baseStats.maxHp;
    baseStats.damage += (level - 1) * 2;

    const skills: any[] = []; // Rats don't use standard weapons/skills yet, simple melee
    // Potentially add "Bite" weapon or similar if strictly needed by combat system, 
    // but combat system defaults to Fists/Melee if no weapon. 
    // Let's rely on Melee fallback for now as "Bite".

    return {
        id: uuidv4(),
        name,
        class: 'Rat',
        team: 'B', 
        attributes: baseStats,
        skills,
        isDead: false,
        level,
        cooldown: 0,
        ammo: {},
        disarmed: [],
        tactics: {
            priority: 'closest',
            targetPart: 'any'
        }
    };
};

export const generateSpecificTrooper = (trooperClass: TrooperClass, level: number): Trooper => {
    // Force specific class generation for Campaign
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const baseStats = { ...BASE_ATTRIBUTES[trooperClass] };
    
    // Manual Level Up Simulation to reach desired stats for that Class
    // 1. Init Stats
    if (trooperClass as string !== 'Rat') {
         baseStats.maxHp = 30 + (level - 1) * 2; // Campaign mobs scale HP? YES, static difficulty.
         baseStats.hp = baseStats.maxHp;
    } else {
         baseStats.maxHp = 20 + (level - 1) * 5;
         baseStats.hp = baseStats.maxHp;
    }

    // 2. Weapons/Skills
    const defaultWeapons = getDefaultWeapons();
    const startingWeapon = defaultWeapons[Math.floor(Math.random() * defaultWeapons.length)];
    let skills: any[] = [startingWeapon];
    
    // Fill skills to match level
    for (let i = 1; i < level; i++) {
        if (i < 5) {
             skills.push(getRandomSkill(skills, 1, 5));
        } else if (i === 5) {
             // Spec
             const specializations = getSkillsByLevel(6);
             if (specializations.length > 0) skills.push(specializations[Math.floor(Math.random()*specializations.length)]);
        } else {
             skills.push(getRandomSkill(skills, 1, 100));
        }
    }
    
    if (trooperClass as string === 'Rat') skills = []; // Rats override

    // Ammo
    const ammo: Record<string, number> = {};
    skills.forEach(s => {
        if ((s as any).capacity) {
            ammo[s.id] = (s as any).capacity;
        }
    });

    return {
        id: uuidv4(),
        name,
        class: trooperClass,
        team: 'B', 
        attributes: baseStats,
        skills,
        isDead: false,
        level,
        cooldown: 0,
        ammo,
        disarmed: [],
        tactics: {
            priority: 'closest',
            targetPart: 'any'
        }
    };
};

export const recalculateTrooperHp = (trooper: Trooper): Trooper => {
    // 1. Base HP (Human Recruit start)
    let newMaxHp = 30;

    // 2. Growth from Leveling
    // RAM: User clarified HP should NOT scale with level.
    // if (trooper.level > 1) {
    //    newMaxHp += (trooper.level - 1) * 2;
    // }

    // 3. Bonuses from Skills (Specializations)
    trooper.skills.forEach(skill => {
        // Find the skill definition to be sure we get the bonus
        // (skill in trooper might be a trimmed object or missing non-serializable props)
        const def = SKILLS.find(s => s.id === skill.id);
        if (def && (def as any).hpBonus) {
            newMaxHp += (def as any).hpBonus;
        }
    });

    return {
        ...trooper,
        attributes: {
            ...trooper.attributes,
            maxHp: newMaxHp,
            hp: newMaxHp // Full Heal on update/recalc
        }
    };
};
