
import { describe, it, expect } from 'vitest';
import { Sniper, Soldier } from '../../../src/logic/minitroopers/classes/Trooper';
import { BattleContext } from '../../../src/logic/minitroopers/systems/SkillSystem';
import { Weapon } from '../../../src/logic/minitroopers/classes/Skill';

describe('Sniper AI Behavior', () => {
    it('should shoot at long range target instead of retreating', () => {
        const sniper = new Sniper({
            id: 'sniper', name: 'Sniper', team: 'A', class: 'Sniper',
            attributes: { hp: 10, maxHp: 10, aim: 100, speed: 10, initiative: 10, range: 10, damage: 0, dodge: 0, armor: 0, critChance: 0 },
            skills: [
                new Weapon('sniper_rifle', 'Sniper Rifle', 'Desc', 'icon', 10, 1, 50, 0, 100, 100, 1, 100, 10, 1)
                // id, name, desc, icon, damage, burst, range, crit, aim, rec, cap, cost, ammo, shots
            ],
            isDead: false, level: 1, ammo: { 'sniper_rifle': 10 },
            position: { x: 0, y: 0 }
        });

        const target = new Soldier({
            id: 'target', name: 'Target', team: 'B', class: 'Soldier',
            attributes: { hp: 10, maxHp: 10, aim: 10, speed: 10, initiative: 10, range: 10, damage: 0, dodge: 0, armor: 0, critChance: 0 },
            skills: [],
            isDead: false, level: 1,
            position: { x: 800, y: 0 } // Distance 800
        });

        const context: BattleContext = {
            log: [], time: 0, turn: 0,
            allTroopers: [sniper, target],
            deployedA: [sniper], deployedB: [target],
            reserveA: [], reserveB: [],
            jammedWeapons: new Map()
        };

        const actionTaken = sniper.playTurn(context);

        expect(actionTaken).toBe(true);
        const lastLog = context.log[context.log.length - 1];
        
        // Should be attack, not move
        expect(lastLog.action).toBe('attack');
        expect(lastLog.message).toContain('Sniper Rifle');
        
        // Ensure no movement
        expect(sniper.isMoving).toBeFalsy();
    });

    it('should retreat if target is too close (< rangeMin)', () => {
        const sniper = new Sniper({
            id: 'sniper', name: 'Sniper', team: 'A', class: 'Sniper',
            attributes: { hp: 10, maxHp: 10, aim: 100, speed: 10, initiative: 10, range: 10, damage: 0, dodge: 0, armor: 0, critChance: 0 },
            skills: [
                new Weapon({ id: 'sniper_rifle', name: 'Sniper Rifle', range: 10, rangeMin: 2, damage: 10, cost: 100 })
            ],
            isDead: false, level: 1, ammo: { 'sniper_rifle': 10 },
            position: { x: 0, y: 0 }
        });

        const target = new Soldier({
            id: 'target', name: 'Target', team: 'B', class: 'Soldier',
            attributes: { hp: 10, maxHp: 10, aim: 10, speed: 10, initiative: 10, range: 10, damage: 0, dodge: 0, armor: 0, critChance: 0 },
            skills: [],
            isDead: false, level: 1,
            position: { x: 100, y: 0 } // Distance 100 (< 200 min range)
        });

        const context: BattleContext = {
            log: [], time: 0, turn: 0,
            allTroopers: [sniper, target],
            deployedA: [sniper], deployedB: [target],
            reserveA: [], reserveB: [],
            jammedWeapons: new Map()
        };

        const actionTaken = sniper.playTurn(context);

        expect(actionTaken).toBe(true);
        const lastLog = context.log[context.log.length - 1];
        
        // Should be move/retreat (or switch if secondary available, but none given)
        expect(lastLog.action).toBe('move'); // Retreat
    });
});
