
import { describe, it, expect } from 'vitest';
import { Trooper, Soldier } from '../../../src/logic/minitroopers/classes/Trooper';
import { skillManager } from '../../../src/logic/minitroopers/systems/SkillSystem';
import { SKILLS as ALL_SKILLS_DEFS } from '../../../src/logic/minitroopers/skills';
import { registerCoreSkills } from '../../../src/logic/minitroopers/skills/implementations';

// Initialize skills for test
registerCoreSkills();

describe('Munitions & Ammo System', () => {
    it('should initialize troopers with default reserves (3 clips)', () => {
        const rifle = ALL_SKILLS_DEFS.find(s => s.id === 'assault_rifle')!;
        const trooper = new Soldier({
            id: 't1', name: 'Grunt', team: 'A', class: 'Soldier',
            skills: [rifle], // Has generic weapon
            attributes: { maxHp: 10, hp: 10, armor: 0, aim: 0, dodge: 0, speed: 0, initiative: 0, damage: 0, range: 0, critChance: 0 },
            isDead: false, level: 1
        });
        
        trooper.recalculateStats();
        
        const capacity = (rifle as any).capacity || 3;
        expect(trooper.reserves?.['assault_rifle']).toBe(capacity * 3);
        expect(trooper.ammo?.['assault_rifle']).toBe(capacity);
    });

    it('Munitions skill should double initial reserves', () => {
        const rifle = ALL_SKILLS_DEFS.find(s => s.id === 'assault_rifle')!;
        const munitions = ALL_SKILLS_DEFS.find(s => s.id === 'munitions')!;
        
        const trooper = new Soldier({
            id: 't2', name: 'AmmoGuy', team: 'A', class: 'Soldier',
            skills: [rifle, munitions],
            attributes: { maxHp: 10, hp: 10, armor: 0, aim: 0, dodge: 0, speed: 0, initiative: 0, damage: 0, range: 0, critChance: 0 },
            isDead: false, level: 1
        });

        trooper.recalculateStats();
        
        // Emulate Battle Start (where Munitions kicks in)
        skillManager.executeOnBattleStart(trooper, { log: [], time: 0, allTroopers: [trooper], deployedA: [], deployedB: [] } as any);

        const capacity = (rifle as any).capacity || 3;
        const initialReserves = capacity * 3;
        
        expect(trooper.reserves?.['assault_rifle']).toBe((capacity * 3) + (capacity * 2));
    });
});
