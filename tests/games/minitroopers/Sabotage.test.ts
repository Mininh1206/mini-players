import { describe, it, expect, beforeEach } from 'vitest';
import { Trooper } from '../../../src/logic/minitroopers/classes/Trooper';
import { Weapon } from '../../../src/logic/minitroopers/classes/Skill';

describe('Trooper Sabotage Logic', () => {
    let trooper: Trooper;
    const weapon: Weapon = {
        id: 'test_gun',
        name: 'Test Gun',
        damage: 10,
        range: 10,
        aim: 100,
        recovery: 0,
        type: 'weapon'
    } as any;

    beforeEach(() => {
        trooper = new Trooper({
            id: 't1',
            name: 'Test Trooper',
            level: 1,
            team: 'A',
            type: 'Recruit',
            isDead: false,
            attributes: {
                hp: 10, maxHp: 10, aim: 0, armor: 0, critChance: 0,
                damage: 0, dodge: 0, initiative: 0, range: 0, speed: 0
            },
            skills: [weapon],
            currentWeaponId: 'test_gun',
            ammo: { 'test_gun': 10 }
        } as any);
        trooper.recalculateStats();
    });

    it('should return "ready" status initially', () => {
        expect(trooper.getActiveWeaponStatus()).toBe('ready');
    });

    it('should return "jammed" status when weapon is in jammedWeapons list', () => {
        trooper.jammedWeapons = ['test_gun'];
        expect(trooper.getActiveWeaponStatus()).toBe('jammed');
    });

    it('should return "no_ammo" when ammo is 0', () => {
        if (trooper.ammo) trooper.ammo['test_gun'] = 0;
        expect(trooper.getActiveWeaponStatus()).toBe('no_ammo');
    });

    it('should prioritize jammed over no_ammo', () => {
        if (trooper.ammo) trooper.ammo['test_gun'] = 0;
        trooper.jammedWeapons = ['test_gun'];
        // Being jammed is more critical/overrides? Or usually you can't check ammo if jammed.
        // Implementation check: 
        // 1. check jammed
        // 2. check ammo
        // So jammed comes first.
        expect(trooper.getActiveWeaponStatus()).toBe('jammed');
    });
});
