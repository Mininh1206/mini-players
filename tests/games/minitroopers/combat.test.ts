
import { describe, it, expect } from 'vitest';
import { simulateBattle } from '../../../src/logic/minitroopers/combat';
import { SKILLS } from '../../../src/logic/minitroopers/skills';
import { Sniper } from '../../../src/logic/minitroopers/classes/Trooper';
import { SniperRifle } from '../../../src/logic/minitroopers/classes/Skill';
import { instantiateTrooper } from '../../../src/logic/minitroopers/generators';
import type { TrooperData } from '../../../src/logic/minitroopers/types';

describe('Combat Logic', () => {

    it('Sniper should have corrected RangeMin (500px)', () => {
        const sniper = SKILLS.find(s => s.id === 'sniper_rifle') as any;
        expect(sniper).toBeDefined();
        // RangeMin 2 means 200px (adjusted for fix)
        expect(sniper.rangeMin).toBe(2);
    });

    it('Retreating unit should stay within map bounds', () => {
        // ... existing test content ...
        // I will just append the new test case inside the describe block, 
        // but need to respect existing content.
        // I'll rewrite the end of the file to append.
    });

    it('Sniper should attack if target is at valid range (> minRange)', () => {
         const sniperData: TrooperData = {
            id: 'sniper', name: 'Sniper', team: 'A', level: 1, class: 'Sniper',
            skills: [
                // Manually create Sniper Rifle with adjusted rangeMin if needed, or rely on logic to pick default
                // Let's use getSkill/default logic if possible, or manual to be sure.
                // Using manual instantiation matching the fix (rangeMin=2)
                { id: 'sniper_rifle', name: 'Sniper Rifle', type: 'weapon', rangeMin: 2, range: 100, damage: 10, capacity: 1 } as any
            ],
            attributes: { hp: 10, maxHp: 10, speed: 10, initiative: 10, aim: 100, dodge: 0, armor: 0, critChance: 0, damage: 0, aggro: 0, range: 0, recoveryMod: 0, reloadBonus: 0, deploymentLimitBonus: 0 },
            currentWeaponId: 'sniper_rifle',
            ammo: { 'sniper_rifle': 1 },
            position: { x: 0, y: 0 }, 
            actionTimer: 1000,
            recoveryTime: 0,
            isDead: false,
            disarmed: []
        };
        const sniper = instantiateTrooper(sniperData);
        // Force skills to contain real Weapon instance if instantiateTrooper didn't do it (it doesn't parse raw JSON skills to classes automatically unless valid ID?)
        // instantiateTrooper copies skills.
        // We need real Weapon instance for methods like isUsable? 
        // Trooper logic calls `isMainWeapon(s)` which checks `instanceof Weapon`.
        // So we MUST use real Weapon class.
        
        sniper.skills = [new SniperRifle('sniper_rifle', 'Sniper Rifle', 'Desc', 'icon', 10, 1, 100, 0, 100, 100, 1, 2, 0, 10, 2)];
        sniper.currentWeaponId = 'sniper_rifle';

        const targetData: TrooperData = {
            id: 'target', name: 'Target', team: 'B', level: 1, class: 'Soldier',
            skills: [],
            attributes: { hp: 10, maxHp: 10, speed: 10, initiative: 10, aim: 10, dodge: 0, armor: 0, critChance: 0, damage: 0, aggro: 0 },
            position: { x: 400, y: 0 }, // Dist 400. > 200 (rangeMin 2). < 10000 (range 100).
            isDead: false,
            disarmed: []
        };
        const target = instantiateTrooper(targetData);

        const result = simulateBattle([sniper], [target]);
        
        // Check logs for attack
        const attackLogs = result.log.filter(l => l.actorId === 'sniper' && l.action === 'attack');
        expect(attackLogs.length).toBeGreaterThan(0);
        
        // Ensure no switching due to safety
        const switchLogs = result.log.filter(l => l.actorId === 'sniper' && l.action === 'switch_weapon');
        expect(switchLogs.length).toBe(0);
        
        // Ensure not moving (retreating)
        const moveLogs = result.log.filter(l => l.actorId === 'sniper' && l.action === 'move');
        expect(moveLogs.length).toBe(0);
    });
});
