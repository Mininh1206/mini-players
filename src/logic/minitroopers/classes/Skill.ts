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
        public stun: number = 0
    ) {
        super(id, name, description, icon);
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
