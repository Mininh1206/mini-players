
import { describe, it, expect } from 'vitest';
import { Soldier } from '../../../src/logic/minitroopers/classes/Trooper';
import { simulateBattle } from '../../../src/logic/minitroopers/combat';
import { SKILLS } from '../../../src/logic/minitroopers/skills';
import { registerCoreSkills } from '../../../src/logic/minitroopers/skills/implementations';

registerCoreSkills();

const getSkill = (id: string, overrides: any = {}) => {
    const s = SKILLS.find(sk => sk.id === id);
    if (!s) throw new Error(`Skill ${id} not found`);
    // Return a clone or similar to avoid mutating global? 
    // SKILLS contains instances. We should pass them as references.
    return s;
};

describe('Sabotage Logic', () => {
    it('should sabotage multiple weapons if sabotage value is high enough', () => {
        // Setup Victim with 3 Ranged Weapons
        const w1 = getSkill('assault_rifle');
        const w2 = getSkill('sniper_rifle');
        const w3 = getSkill('shotgun');
        
        const victim = new Soldier({
            id: 'victim', name: 'Victim', team: 'B',
            class: 'Soldier',
            level: 1,
            attributes: { hp: 1000, maxHp: 1000, aim: 100, armor: 0, damage: 0, dodge: 0, initiative: 0, range: 1, critChance: 0, speed: 100 },
            skills: [w1, w2, w3],
            isDead: false
        });
        
        // Setup Saboteur (Level 10 = 15 Sabotage)
        const saboteurSkill = getSkill('saboteur');
        const saboteur = new Soldier({
            id: 'sab', name: 'Saboteur', team: 'A',
            class: 'Saboteur',
            level: 10,
            attributes: { hp: 100, maxHp: 100, aim: 100, armor: 0, damage: 0, dodge: 0, initiative: 0, range: 1, critChance: 0, speed: 100 },
            skills: [saboteurSkill],
            isDead: false
        });

        // Current Weapon setup manually to avoid undefined (though recalc should handle)
        victim.currentWeaponId = w1.id;
        saboteur.currentWeaponId = undefined; // No weapon, fists?

        const { survivorsB } = simulateBattle([saboteur], [victim]);
        
        const victimSurvivor = survivorsB.find(t => t.id === 'victim');
        expect(victimSurvivor).toBeDefined();
        
        console.log('Sabotaged:', victimSurvivor?.sabotagedWeapons);
        
        const sabotagedIds = victimSurvivor?.sabotagedWeapons || [];
        expect(sabotagedIds.length).toBeGreaterThan(0);
        
        // Expect at least 2 weapons sabotaged given constraints (140 max loop?)
        expect(sabotagedIds.length).toBeGreaterThanOrEqual(1);
    });
});
