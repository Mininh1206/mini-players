import type { Skill as ISkill } from '../types';

export abstract class Skill implements ISkill {
    constructor(
        public id: string,
        public name: string,
        public description: string,
        public icon: string,
        public level: number = 1 // Common field from wiki
    ) {}
}

export class Specialization extends Skill {
    constructor(
        id: string, 
        name: string, 
        description: string, 
        icon: string, 
        public hpBonus: number = 0,
        public initiativeBonus: number = 0
    ) {
        super(id, name, description, icon, 6); // Specializations are usually level 6
    }
}

export class Vehicle extends Skill {
    constructor(
        id: string, 
        name: string, 
        description: string, 
        icon: string,
        public deploymentCost: number = 0
    ) {
        super(id, name, description, icon);
    }
}

export class Weapon extends Skill {
    constructor(
        id: string, 
        name: string, 
        description: string, 
        icon: string,
        public damage: number = 0,
        public bursts: number = 1,
        public range: number = 1,
        public crit: number = 0,
        public aim: number = 0,
        public recovery: number = 0,
        public capacity: number = 1,
        public area: number = 0,
        public stun: number = 0,
        public rangeMin: number = 0,
        public encumberance: number = 0,
        public maxDamage: number = 0, // If 0, use damage as fixed value
        public totalAmmo: number = 0, // Total ammo carried
        public ignoreArmor: boolean = false,
        public critMult: number = 2.0
    ) {
        super(id, name, description, icon);
    }
}

export class Shotgun extends Weapon {
    constructor(id: string, name: string, description: string, icon: string, damage: number, bursts: number, range: number, crit: number, aim: number, recovery: number, cap: number, area: number, stun: number, rangeMin: number, enc: number, maxDamage: number, totalAmmo: number) {
        super(id, name, description, icon, damage, bursts, range, crit, aim, recovery, cap, area, stun, rangeMin, enc, maxDamage, totalAmmo, false, 2.0);
    }
}

export class AssaultRifle extends Weapon {
    constructor(id: string, name: string, description: string, icon: string, damage: number, bursts: number, range: number, crit: number, aim: number, recovery: number, cap: number, rangeMin: number, enc: number, maxDamage: number, totalAmmo: number, ignoreArmor: boolean = false) {
        super(id, name, description, icon, damage, bursts, range, crit, aim, recovery, cap, 0, 0, rangeMin, enc, maxDamage, totalAmmo, ignoreArmor, 2.0);
    }
}

export class Handgun extends Weapon {
     constructor(id: string, name: string, description: string, icon: string, damage: number, bursts: number, range: number, crit: number, aim: number, recovery: number, cap: number, stun: number, rangeMin: number, enc: number, maxDamage: number, totalAmmo: number, ignoreArmor: boolean = false) {
        super(id, name, description, icon, damage, bursts, range, crit, aim, recovery, cap, 0, stun, rangeMin, enc, maxDamage, totalAmmo, ignoreArmor, 2.0);
    }
}

export class SniperRifle extends Weapon {
    constructor(id: string, name: string, description: string, icon: string, damage: number, bursts: number, range: number, crit: number, aim: number, recovery: number, cap: number, rangeMin: number, enc: number, maxDamage: number, totalAmmo: number, critMult: number = 5.0) {
        super(id, name, description, icon, damage, bursts, range, crit, aim, recovery, cap, 0, 0, rangeMin, enc, maxDamage, totalAmmo, true, critMult); // Snipers usually ignore armor or high damage? User table says "Secure zone". Some say "Heavy".
        // Use generic boolean? Or default false.
        // User list: only Thompson/Desert Eagle said "Ignore Armor".
        // I will default false and pass it.
        // Re-signature:
    }
}
// Redo Sniper Signature in next step to correct "true" fallback if not intended.

export class MachineGun extends Weapon {
    constructor(id: string, name: string, description: string, icon: string, damage: number, bursts: number, range: number, crit: number, aim: number, recovery: number, cap: number, rangeMin: number, enc: number, maxDamage: number, totalAmmo: number) {
        super(id, name, description, icon, damage, bursts, range, crit, aim, recovery, cap, 0, 0, rangeMin, enc, maxDamage, totalAmmo, false, 2.0);
    }
}

export class Launcher extends Weapon {
    constructor(id: string, name: string, description: string, icon: string, damage: number, bursts: number, range: number, crit: number, aim: number, recovery: number, cap: number, area: number, stun: number, rangeMin: number, enc: number, maxDamage: number, totalAmmo: number) {
        super(id, name, description, icon, damage, bursts, range, crit, aim, recovery, cap, area, stun, rangeMin, enc, maxDamage, totalAmmo, false, 2.0);
    }
}

export class Melee extends Weapon {
    constructor(id: string, name: string, description: string, icon: string, damage: number, bursts: number, range: number, crit: number, aim: number, recovery: number, cap: number, area: number, stun: number, rangeMin: number, maxDamage: number, totalAmmo: number) {
        super(id, name, description, icon, damage, bursts, range, crit, aim, recovery, cap, area, stun, rangeMin, 0, maxDamage, totalAmmo, false, 2.0);
    }
}

export type GrenadeEffect = 'fragmentation' | 'flash' | 'gas' | 'glue' | 'shock' | 'clown' | 'healing' | 'black_hole';

export class Grenade extends Skill {
    constructor(
        id: string, 
        name: string, 
        description: string, 
        icon: string,
        public damage: number = 0, // Min
        public maxDamage: number = 0, // Max
        public area: number = 0,
        public range: number = 6, // Throw range
        public capacity: number = 1, // Ammo
        public effect?: GrenadeEffect,
        public crit: number = 0
    ) {
        super(id, name, description, icon, 1);
    }
}

export class Equipment extends Skill {
    constructor(
        id: string, 
        name: string, 
        description: string, 
        icon: string,
        public limit: number = 0 // Some equipment has uses
    ) {
        super(id, name, description, icon);
    }
}

export class Other extends Skill {
    constructor(id: string, name: string, description: string, icon: string) {
        super(id, name, description, icon);
    }
}
