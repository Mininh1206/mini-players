import { v4 as uuidv4 } from 'uuid';
import type { Trooper, TrooperClass, TrooperAttributes } from './types';
import { getRandomSkill, getDefaultWeapons } from './skills';

const CLASSES: TrooperClass[] = ['Soldier', 'Sniper', 'Doctor', 'Pilot', 'Commando', 'Scout', 'Spy', 'Saboteur'];
const NAMES = ['Sgt. Johnson', 'Pvt. Ryan', 'Cpl. Hicks', 'Lt. Ripley', 'Maj. Kusanagi', 'Capt. Price', 'Soap', 'Ghost', 'Rookie', 'Snake', 'Samus', 'Chief'];

const BASE_ATTRIBUTES: Record<TrooperClass, TrooperAttributes> = {
    'Recruit': { hp: 50, maxHp: 50, initiative: 10, range: 1, damage: 10, aim: 80, dodge: 10, armor: 0, critChance: 5, speed: 100 },
    'Soldier': { hp: 60, maxHp: 60, initiative: 10, range: 1, damage: 10, aim: 80, dodge: 10, armor: 1, critChance: 5, speed: 100 },
    'Sniper': { hp: 40, maxHp: 40, initiative: 15, range: 10, damage: 20, aim: 90, dodge: 5, armor: 0, critChance: 20, speed: 100 },
    'Doctor': { hp: 50, maxHp: 50, initiative: 8, range: 2, damage: 5, aim: 70, dodge: 15, armor: 0, critChance: 5, speed: 100 },
    'Pilot': { hp: 55, maxHp: 55, initiative: 12, range: 1, damage: 8, aim: 75, dodge: 20, armor: 0, critChance: 10, speed: 100 },
    'Commando': { hp: 70, maxHp: 70, initiative: 12, range: 1, damage: 12, aim: 85, dodge: 10, armor: 2, critChance: 10, speed: 120 },
    'Scout': { hp: 45, maxHp: 45, initiative: 20, range: 1, damage: 7, aim: 85, dodge: 30, armor: 0, critChance: 15, speed: 130 },
    'Spy': { hp: 40, maxHp: 40, initiative: 30, range: 1, damage: 10, aim: 90, dodge: 20, armor: 0, critChance: 25, speed: 110 },
    'Saboteur': { hp: 50, maxHp: 50, initiative: 15, range: 1, damage: 10, aim: 80, dodge: 15, armor: 0, critChance: 10, speed: 105 },
    'Comms Officer': { hp: 45, maxHp: 45, initiative: 10, range: 1, damage: 8, aim: 75, dodge: 10, armor: 0, critChance: 5, speed: 100 }
};

export const generateRandomTrooper = (level: number = 1): Trooper => {
    // If level < 6, force Recruit. Else, pick random class (excluding Recruit for variety, or include it? Let's exclude for "advanced" feel)
    const trooperClass: TrooperClass = level < 6 ? 'Recruit' : CLASSES[Math.floor(Math.random() * CLASSES.length)];
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const baseStats = { ...BASE_ATTRIBUTES[trooperClass] };
    
    // Scale stats with level (simplified)
    baseStats.maxHp += (level - 1) * 10;
    baseStats.hp = baseStats.maxHp;
    baseStats.damage += (level - 1) * 2;

    // Initialize Skills & Ammo
    // 1. Pick a default weapon
    const defaultWeapons = getDefaultWeapons();
    const startingWeapon = defaultWeapons[Math.floor(Math.random() * defaultWeapons.length)];
    
    // 2. Pick a random Level 1 skill (excluding the weapon)
    const startingSkill = getRandomSkill([startingWeapon], 1, 1);
    
    const skills = [startingWeapon, startingSkill];
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
        team: 'A', // Default to player team, can be changed
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
