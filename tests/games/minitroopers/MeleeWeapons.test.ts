import { describe, it, expect } from 'vitest';
import { Melee, Weapon } from '../../../src/logic/minitroopers/classes/Skill';
import { SKILLS } from '../../../src/logic/minitroopers/skills';

describe('Melee Weapons', () => {
    describe('Melee class', () => {
        it('should have Infinity capacity (unlimited ammo)', () => {
            const fists = new Melee('test_fists', 'Test Fists', 'Test', '👊', 1);
            
            expect(fists.capacity).toBe(Infinity);
            expect(fists.totalAmmo).toBe(Infinity);
        });

        it('should have isUnlimited flag set to true', () => {
            const knife = new Melee('test_knife', 'Test Knife', 'Test', '🔪', 2);
            
            expect(knife.isUnlimited).toBe(true);
        });

        it('should extend Weapon class', () => {
            const melee = new Melee('test', 'Test', 'Desc', '⚔️', 3);
            
            expect(melee instanceof Weapon).toBe(true);
        });

        it('should have range of 1 by default', () => {
            const melee = new Melee('test', 'Test', 'Desc', '⚔️', 3);
            
            expect(melee.range).toBe(1);
        });
    });

    describe('Fists and Knife definitions', () => {
        it('Fists should exist in SKILLS', () => {
            const fists = SKILLS.find(s => s.id === 'fists');
            
            expect(fists).toBeDefined();
            expect(fists instanceof Melee).toBe(true);
        });

        it('Fists should have Infinity capacity', () => {
            const fists = SKILLS.find(s => s.id === 'fists') as Melee;
            
            expect(fists.capacity).toBe(Infinity);
            expect(fists.totalAmmo).toBe(Infinity);
        });

        it('Knife should exist in SKILLS with unlimited ammo', () => {
            const knife = SKILLS.find(s => s.id === 'knife') as Melee;
            
            expect(knife).toBeDefined();
            expect(knife.capacity).toBe(Infinity);
            expect(knife.isUnlimited).toBe(true);
        });

        it('Fists should have correct damage values', () => {
            const fists = SKILLS.find(s => s.id === 'fists') as Melee;
            
            expect(fists.damage).toBe(1);
            expect(fists.maxDamage).toBe(3);
        });

        it('Knife should have higher damage than Fists', () => {
            const fists = SKILLS.find(s => s.id === 'fists') as Melee;
            const knife = SKILLS.find(s => s.id === 'knife') as Melee;
            
            expect(knife.damage).toBeGreaterThan(fists.damage);
        });
    });
});
