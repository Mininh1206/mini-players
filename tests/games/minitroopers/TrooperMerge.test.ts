
import { describe, it, expect } from 'vitest';
import { mergeTrooperData } from '../../../src/logic/minitroopers/utils';

describe('Trooper Data Merge Logic', () => {
    it('should correctly merge sabotage status from live data', () => {
        const original = {
            id: 't1',
            name: 'Test',
            sabotagedWeapons: [] as string[],
            attributes: { hp: 100 }
        };

        const liveData = {
            hp: 90,
            ammo: {},
            currentWeaponId: 'gun1',
            jammedWeapons: [],
            sabotagedWeapons: ['gun1']
        };

        const merged = mergeTrooperData(original, liveData);

        expect(merged.attributes.hp).toBe(90);
        expect(merged.sabotagedWeapons).toContain('gun1');
    });
});
