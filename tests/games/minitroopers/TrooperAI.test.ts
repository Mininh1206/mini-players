
import { describe, it, expect, vi } from 'vitest';
import { Soldier, Trooper } from '../../../src/logic/minitroopers/classes/Trooper';
import { Weapon } from '../../../src/logic/minitroopers/classes/Skill';

// Mock Weapon
class MockRifle extends Weapon {
    constructor() {
        super('mock_rifle', 'Mock Rifle', 'Desc', 'icon', 10, 1, 100, 10, 100, 10, 1, 0, 0, 10, 2); // Cap 1, Shots 2? No, Cap 1 for easy empty.
    }
}

class MockFists extends Weapon {
    constructor() {
        super('fists', 'Fists', 'Desc', 'icon', 2, 1, 1, 5, 100, 10, 0, 0, 0, 0, 0);
    }
}

describe('Trooper AI Logic', () => {
    it('should NOT switch weapon if ammo is empty but reserves exist', () => {
        const rifle = new MockRifle();
        (rifle as any).capacity = 1;
        const fists = new MockFists();
        (fists as any).isUnlimited = true;

        const trooper = new Soldier({
            id: 't1', name: 'Tester', team: 'A', class: 'Soldier',
            skills: [rifle, fists],
            attributes: { maxHp: 10, hp: 10, armor: 0, aim: 0, dodge: 0, speed: 0, initiative: 0, damage: 0, range: 0, critChance: 0 },
            isDead: false, level: 1
        });
        
        // Setup State: Empty Rifle, Has Reserves
        trooper.currentWeaponId = 'mock_rifle';
        trooper.ammo = { 'mock_rifle': 0 };
        trooper.reserves = { 'mock_rifle': 3 };
        
        // Mock Context
        const context: any = {
            log: [],
            time: 100,
            allTroopers: [trooper, { 
                id: 'enemy', team: 'B', isDead: false, position: {x: 200, y: 0},
                attributes: { hp: 10 },
                skills: []
            }], // Enemy nearby
            jammedWeapons: new Map(),
            resolveWeaponShot: vi.fn(),
            applyDamage: vi.fn()
        };
        trooper.position = { x: 0, y: 0 }; // Distance 200 to enemy. Rifle Range 10000. Fists 100.
        // Fists out of range (dist 200 > 100).
        
        // Run Turn
        trooper.playTurn(context);
        
        // Expectation: Should RELOAD (Action 'reload').
        // Should NOT switch to Fists.
        
        const reloadAction = context.log.find((l: any) => l.action === 'reload');
        const switchAction = context.log.find((l: any) => l.action === 'switch_weapon');
        
        expect(switchAction).toBeUndefined();
        expect(reloadAction).toBeDefined();
        expect(trooper.ammo['mock_rifle']).toBe(1); // Reloaded 1 bullet
        expect(reloadAction.message).toContain('reloads (1)');
    });

    it('should switch weapon if ammo AND reserves are empty', () => {
        const rifle = new MockRifle();
        (rifle as any).capacity = 1;
        const fists = new MockFists();
        (fists as any).isUnlimited = true;
        (fists as any).range = 10; // Make fists range 1000 effectively

        const trooper = new Soldier({
            id: 't2', name: 'Tester2', team: 'A', class: 'Soldier',
            skills: [rifle, fists],
            attributes: { maxHp: 10, hp: 10, armor: 0, aim: 0, dodge: 0, speed: 0, initiative: 0, damage: 0, range: 0, critChance: 0 },
            isDead: false, level: 1
        });
        
        trooper.currentWeaponId = 'mock_rifle';
        trooper.ammo = { 'mock_rifle': 0 };
        trooper.reserves = { 'mock_rifle': 0 }; // NO RESERVES
        
        const context: any = {
            log: [],
            time: 100,
            allTroopers: [trooper, { 
                id: 'enemy', team: 'B', isDead: false, position: {x: 50, y: 0}, // Close enemy (50)
                attributes: { hp: 10 },
                skills: []
            }], 
            jammedWeapons: new Map(),
            resolveWeaponShot: vi.fn(),
            applyDamage: vi.fn()
        };
        trooper.position = { x: 0, y: 0 };
        
        // Fists In Range (50 < 100).
        // Rifle Empty.
        
        trooper.playTurn(context);
        
        const switchAction = context.log.find((l: any) => l.action === 'switch_weapon');
        expect(switchAction).toBeDefined();
        expect(trooper.currentWeaponId).toBe('fists');
    });
});
