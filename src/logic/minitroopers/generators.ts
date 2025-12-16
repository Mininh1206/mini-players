import { v4 as uuidv4 } from 'uuid';
import type { Trooper, TrooperClass, TrooperAttributes } from './types';
import { getRandomSkill, getDefaultWeapons, getSkillsByLevel, SKILLS } from './skills';
import { getSkillChoices } from './leveler';

const CLASSES: TrooperClass[] = ['Soldier', 'Sniper', 'Doctor', 'Pilot', 'Commando', 'Scout', 'Spy', 'Saboteur'];
const NAMES = ['Sgt. Johnson', 'Pvt. Ryan', 'Cpl. Hicks', 'Lt. Ripley', 'Maj. Kusanagi', 'Capt. Price', 'Soap', 'Ghost', 'Rookie', 'Snake', 'Samus', 'Chief'];
const RAT_NAMES = ['Rat', 'Giant Rat', 'Sewer Rat', 'Plague Rat', 'Mutant Rat'];

const BASE_ATTRIBUTES: Record<TrooperClass, TrooperAttributes> = {
    'Recruit': { hp: 10, maxHp: 10, initiative: 100, range: 1, damage: 0, aim: 100, dodge: 0, armor: 0, critChance: 5, speed: 100 },
    'Soldier': { hp: 10, maxHp: 10, initiative: 100, range: 1, damage: 0, aim: 100, dodge: 0, armor: 1, critChance: 5, speed: 100 },
    'Sniper': { hp: 10, maxHp: 10, initiative: 110, range: 10, damage: 0, aim: 150, dodge: 5, armor: 0, critChance: 25, speed: 100 },
    'Doctor': { hp: 10, maxHp: 10, initiative: 100, range: 2, damage: 0, aim: 100, dodge: 0, armor: 0, critChance: 5, speed: 100 },
    'Pilot': { hp: 10, maxHp: 10, initiative: 100, range: 1, damage: 0, aim: 100, dodge: 10, armor: 0, critChance: 10, speed: 100 },
    'Commando': { hp: 10, maxHp: 10, initiative: 120, range: 1, damage: 0, aim: 110, dodge: 10, armor: 2, critChance: 10, speed: 120 },
    'Scout': { hp: 10, maxHp: 10, initiative: 120, range: 1, damage: 0, aim: 100, dodge: 20, armor: 0, critChance: 15, speed: 130 },
    'Spy': { hp: 10, maxHp: 10, initiative: 110, range: 1, damage: 0, aim: 110, dodge: 10, armor: 0, critChance: 25, speed: 110 },
    'Saboteur': { hp: 10, maxHp: 10, initiative: 100, range: 1, damage: 0, aim: 100, dodge: 10, armor: 0, critChance: 10, speed: 105 },
    'Comms Officer': { hp: 10, maxHp: 10, initiative: 100, range: 1, damage: 0, aim: 100, dodge: 0, armor: 0, critChance: 5, speed: 100 },
    'Rat': { hp: 10, maxHp: 10, initiative: 100, range: 1, damage: 0, aim: 90, dodge: 10, armor: 0, critChance: 5, speed: 120 }
};

export const generateRandomTrooper = (targetLevel: number = 1): Trooper => {
    // 1. Initialize as a Level 1 Recruit
    const trooperClass: TrooperClass = 'Recruit';
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const baseStats = { ...BASE_ATTRIBUTES['Recruit'] };
    // Human base HP correction
    // baseStats.maxHp = 30;
    // baseStats.hp = 30;

    // 2. Pick a default weapon (Level 1)
    const defaultWeapons = getDefaultWeapons();
    const startingWeapon = defaultWeapons[Math.floor(Math.random() * defaultWeapons.length)];
    
    // 3. Pick a random Level 1 skill (excluding the weapon)
    // Exclude specializations (Level 6) for normal skill slots
    const startingSkill = getRandomSkill([startingWeapon], 1, 5, true); 
    
    let skills = [startingWeapon, startingSkill];
    let currentClass: TrooperClass = trooperClass;
    let currentLevel = 1;

    // 4. Simulate Leveling Up
    // 4. Simulate Leveling Up
    while (currentLevel < targetLevel) {
        // Use centralized level up logic
        const tempTrooperShim = {
            level: currentLevel,
            skills: skills,
            class: currentClass,
            attributes: baseStats
        } as Trooper;

        const choices = getSkillChoices(tempTrooperShim);
        const selection = choices[Math.floor(Math.random() * choices.length)];
        
        skills.push(selection);

        // Handle Spec changes (Class Update)
        // If selection is a Specialization (Level 6), update the Class
        // We can check level or instanceof if imported, or just find in SKILLS
        const specMatch = SKILLS.find(s => s.id === selection.id && s.level === 6);
        if (specMatch) {
             currentClass = specMatch.name as TrooperClass;
             if ((specMatch as any).hpBonus) {
                 baseStats.maxHp += (specMatch as any).hpBonus;
                 baseStats.hp += (specMatch as any).hpBonus;
             }
        }
        
        currentLevel++;
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
        wounds: { head: false, chest: false, leftArm: false, rightArm: false, leftLeg: false, rightLeg: false },
        tactics: {
            priority: 'closest',
            targetPart: 'any'
        }
    };
};

export const generateRat = (level: number = 1): Trooper => {
    const name = RAT_NAMES[Math.floor(Math.random() * RAT_NAMES.length)];
    const baseStats = { ...BASE_ATTRIBUTES['Rat'] };
    // Scale Rat stats specifically - BALANCED to be less OP (Original: 10HP)
    baseStats.maxHp += (level - 1) * 2; // Was 5, now 2. Slower scaling.
    baseStats.hp = baseStats.maxHp;
    baseStats.damage += Math.floor((level - 1) * 0.5); // reduced damage scaling

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
        wounds: { head: false, chest: false, leftArm: false, rightArm: false, leftLeg: false, rightLeg: false },
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
         baseStats.maxHp = 10 + (level - 1) * 2;
         baseStats.hp = baseStats.maxHp;
    }

    // 2. Weapons/Skills
    const defaultWeapons = getDefaultWeapons();
    const startingWeapon = defaultWeapons[Math.floor(Math.random() * defaultWeapons.length)];
    let skills: any[] = [startingWeapon];
    
    // Use centralized level up logic
    for (let i = 1; i < level; i++) {
        // Current Level is i. Next Level is i+1.
        // getSkillChoices expects 'trooper.level' (current).
        const tempTrooperShim = {
            level: i, // Current level being leveled FROM
            skills: skills,
            class: trooperClass, // The specific class requested (e.g. 'Spy')
            attributes: baseStats
        } as Trooper;

        // If i=5 (Level 5 -> 6), getSkillChoices will see 'targetLevel=6'.
        // If class='Spy', it will return [SpySkill].
        const choices = getSkillChoices(tempTrooperShim);
        const selection = choices[Math.floor(Math.random() * choices.length)];
        
        skills.push(selection);
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
        wounds: { head: false, chest: false, leftArm: false, rightArm: false, leftLeg: false, rightLeg: false },
        tactics: {
            priority: 'closest',
            targetPart: 'any'
        }
    };
};

export const recalculateTrooperHp = (trooper: Trooper): Trooper => {
    // 1. Base HP (Human Recruit start)
    let newMaxHp = 10;

    // 2. Growth from Leveling
    // Soldier Specialization: +1 HP per Level
    if (trooper.class === 'Soldier') {
        newMaxHp += trooper.level;
    }
    
    // Rat Scaling
    if (trooper.class === 'Rat') {
        newMaxHp = 10 + (trooper.level - 1) * 2;
    }

    // 3. Bonuses from Skills (Specializations - kept for other potential buffs)
    trooper.skills.forEach(skill => {
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
