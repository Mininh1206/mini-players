
import { describe, it, expect } from 'vitest';
import { Soldier } from '../../../src/logic/minitroopers/classes/Trooper';
import { applyLevelUp } from '../../../src/logic/minitroopers/leveler';
import { Weapon } from '../../../src/logic/minitroopers/classes/Skill';

describe('Level Up Mechanics', () => {
    it('should correctly level up a trooper', () => {
        const trooper = new Soldier({
            id: 't1', name: 'Rookie', team: 'A', level: 1, class: 'Recruit',
            skills: [],
            attributes: { hp: 10, maxHp: 10, speed: 100, initiative: 100, aim: 100, dodge: 0, armor: 0, critChance: 0, damage: 0, range: 0 },
            isDead: false
        });

        const newSkill = new Weapon('new_gun', 'New Gun', 'desc', 'icon', 5);
        
        // Apply level up
        const upgradedTrooper = applyLevelUp(trooper, newSkill);

        // Expect Level Increase
        expect(upgradedTrooper.level).toBe(2);
        
        // Expect Skill Added
        expect(upgradedTrooper.skills.length).toBe(1);
        expect(upgradedTrooper.skills[0].id).toBe('new_gun');

        // Expect Instance Persistence (Should return A NEW OBJECT usually in Redux/Immutable patterns, 
        // but `applyLevelUp` implementation returns a shallow copy?
        // Let's check if the returned object is indeed a valid Trooper class instance or just a plain object)
        expect(upgradedTrooper).toBeInstanceOf(Object); // Basic check
        // Ideally checking if it has methods
        // If applyLevelUp does `{ ...trooper }`, it loses the Prototype!
        expect(typeof upgradedTrooper.playTurn).toBe('function'); 
        // ^^^ This is likely the bug. `{...trooper}` strips class methods.
    });
});
