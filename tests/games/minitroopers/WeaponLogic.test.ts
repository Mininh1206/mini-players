
import { describe, it, expect } from 'vitest';
import { Soldier, Sniper } from '../../../src/logic/minitroopers/classes/Trooper';
import { Weapon } from '../../../src/logic/minitroopers/classes/Skill';
import type { BattleContext } from '../../../src/logic/minitroopers/systems/SkillSystem';

// Mock Weapon Classes for testing
class MockWeapon extends Weapon {
    constructor(id: string, range: number, damage: number, name: string) {
        super(id, name, 'desc', 'icon', damage, 1, range);
    }
}

describe('Trooper Weapon Logic', () => {
    const createTrooper = (weapons: Weapon[]) => {
        return new Soldier({
            id: 't1', name: 'TestTrooper', team: 'A', level: 1, class: 'Soldier',
            skills: weapons,
            attributes: { hp: 10, maxHp: 10, speed: 100, initiative: 100, aim: 100, dodge: 0, armor: 0, critChance: 0, damage: 0, range: 0 },
            isDead: false,
            position: { x: 0, y: 0 },
            ammo: weapons.reduce((acc, w) => ({ ...acc, [w.id]: 10 }), {}), // Full ammo
            currentWeaponId: weapons[0]?.id
        });
    };

    const createTarget = (x: number) => {
        return new Soldier({
            id: 'target', name: 'Target', team: 'B', level: 1, class: 'Soldier',
            skills: [],
            attributes: { hp: 10, maxHp: 10, speed: 100, initiative: 100, aim: 100, dodge: 0, armor: 0, critChance: 0, damage: 0, range: 0 },
            isDead: false,
            position: { x, y: 0 }
        });
    };

    const mockContext: BattleContext = {
        log: [], time: 0, turn: 0, allTroopers: [], deployedA: [], deployedB: [], reserveA: [], reserveB: [], jammedWeapons: new Map()
    };

    it('should switch weapon if current is sabotaged', () => {
        const rifle = new MockWeapon('rifle', 6, 5, 'Rifle');
        const pistol = new MockWeapon('pistol', 3, 3, 'Pistol');
        const trooper = createTrooper([rifle, pistol]);
        trooper.currentWeaponId = 'rifle';
        trooper.sabotagedWeapons = ['rifle'];
        
        const target = createTarget(200);
        trooper.playTurn({ ...mockContext, allTroopers: [trooper, target] });

        expect(trooper.currentWeaponId).toBe('pistol');
        expect(trooper.sabotagedWeapons).toContain('rifle');
    });

    it('should switch weapon if current runs out of ammo', () => {
        const rifle = new MockWeapon('rifle', 6, 5, 'Rifle');
        const pistol = new MockWeapon('pistol', 3, 3, 'Pistol');
        const trooper = createTrooper([rifle, pistol]);
        trooper.currentWeaponId = 'rifle';
        trooper.ammo!['rifle'] = 0; // Empty
        
        const target = createTarget(200);
        trooper.playTurn({ ...mockContext, allTroopers: [trooper, target] });

        expect(trooper.currentWeaponId).toBe('pistol');
    });

    it('should switch to better range weapon (Long Range)', () => {
        const shotgun = new MockWeapon('shotgun', 2, 10, 'Shotgun'); // Close range
        const sniper = new MockWeapon('sniper', 8, 10, 'Sniper'); // Long range
        
        const trooper = createTrooper([shotgun, sniper]);
        trooper.currentWeaponId = 'shotgun';
        
        const target = createTarget(700); // Far away
        trooper.playTurn({ ...mockContext, allTroopers: [trooper, target] });

        expect(trooper.currentWeaponId).toBe('sniper');
    });

    it('should switch to better range weapon (Close Range)', () => {
        const shotgun = new MockWeapon('shotgun', 2, 10, 'Shotgun'); // Close range
        const sniper = new MockWeapon('sniper', 8, 10, 'Sniper'); // Long range, min range issues maybe?
        // Let's assume shotgun is just better for damage/hit at close range logic if implemented
        
        const trooper = createTrooper([sniper, shotgun]);
        trooper.currentWeaponId = 'sniper';
        
        const target = createTarget(50); // Very close
        trooper.playTurn({ ...mockContext, allTroopers: [trooper, target] });

        expect(trooper.currentWeaponId).toBe('shotgun');
    });
});
