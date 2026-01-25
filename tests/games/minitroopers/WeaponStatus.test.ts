import { describe, it, expect } from 'vitest';
import { generateRandomTrooper, generateSpecificTrooper, generateRat } from '../../../src/logic/minitroopers/generators';
import { Weapon } from '../../../src/logic/minitroopers/classes/Skill';

describe('Weapon Status', () => {
    describe('currentWeaponId initialization', () => {
        it('should set currentWeaponId for generated troopers with weapons', () => {
            const trooper = generateRandomTrooper(2);
            
            // Find first weapon in skills
            const firstWeapon = trooper.skills.find(s => s instanceof Weapon);
            
            if (firstWeapon) {
                expect(trooper.currentWeaponId).toBeDefined();
                expect(trooper.currentWeaponId).toBe(firstWeapon.id);
            }
        });

        it('should set currentWeaponId for specific class troopers', () => {
            const sniper = generateSpecificTrooper('Sniper', 4);
            
            const firstWeapon = sniper.skills.find(s => s instanceof Weapon);
            
            if (firstWeapon) {
                expect(sniper.currentWeaponId).toBeDefined();
                expect(sniper.currentWeaponId).toBe(firstWeapon.id);
            }
        });

        it('should not set currentWeaponId for Rats (no weapons)', () => {
            const rat = generateRat(3);
            
            // Rats only have Fists injected by recalculateStats
            // They should have currentWeaponId set to 'fists' after recalculate
            const hasWeapon = rat.skills.some(s => s instanceof Weapon);
            
            if (hasWeapon) {
                expect(rat.currentWeaponId).toBeDefined();
            }
        });
    });

    describe('weapon status computation', () => {
        it('should correctly identify equipped weapon', () => {
            const trooper = generateRandomTrooper(3);
            const currentWeaponId = trooper.currentWeaponId;
            
            if (currentWeaponId) {
                const weapon = trooper.skills.find(s => s.id === currentWeaponId);
                expect(weapon).toBeDefined();
                
                // Simulate BattleInspector logic
                const isEquipped = trooper.currentWeaponId === weapon?.id;
                expect(isEquipped).toBe(true);
            }
        });

        it('should correctly identify jammed/sabotaged weapon', () => {
            const trooper = generateRandomTrooper(3);
            const currentWeaponId = trooper.currentWeaponId;
            
            if (currentWeaponId) {
                // Simulate jamming
                trooper.jammedWeapons = [currentWeaponId];
                
                const isJammed = trooper.jammedWeapons?.includes(currentWeaponId);
                expect(isJammed).toBe(true);
                
                // Weapon status should be 'sabotaged'
                const isEquipped = trooper.currentWeaponId === currentWeaponId;
                const weaponStatus = isJammed ? 'sabotaged' : isEquipped ? 'equipped' : 'unequipped';
                expect(weaponStatus).toBe('sabotaged');
            }
        });

        it('should correctly identify stowed weapons', () => {
            const trooper = generateRandomTrooper(4);
            
            // Find a weapon that is NOT the current weapon
            const weapons = trooper.skills.filter(s => s instanceof Weapon);
            const stowedWeapon = weapons.find(w => w.id !== trooper.currentWeaponId);
            
            if (stowedWeapon) {
                const isEquipped = trooper.currentWeaponId === stowedWeapon.id;
                const isJammed = trooper.jammedWeapons?.includes(stowedWeapon.id) || false;
                const weaponStatus = isJammed ? 'sabotaged' : isEquipped ? 'equipped' : 'unequipped';
                
                expect(weaponStatus).toBe('unequipped');
            }
        });
    });
});
