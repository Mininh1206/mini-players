
import { describe, it, expect } from 'vitest';
import { Sniper, Soldier } from '../../../src/logic/minitroopers/classes/Trooper';
import type { BattleContext } from '../../../src/logic/minitroopers/systems/SkillSystem';
import { Weapon, SniperRifle } from '../../../src/logic/minitroopers/classes/Skill';

describe('Sniper AI Behavior', () => {
    it('should shoot at long range target instead of retreating', () => {
        const sniper = new Sniper({
            id: 'sniper', name: 'Sniper', team: 'A', class: 'Sniper',
            attributes: { hp: 10, maxHp: 10, aim: 100, speed: 10, initiative: 10, range: 10, damage: 0, dodge: 0, armor: 0, critChance: 0 },
            skills: [
                new SniperRifle('sniper_rifle', 'Sniper Rifle', 'Desc', 'icon', 10, 1, 10, 0, 100, 100, 1, 2, 10, 1, 10)
            ],
            isDead: false, level: 1, ammo: { 'sniper_rifle': 10 },
            currentWeaponId: 'sniper_rifle',
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
            jammedWeapons: new Map(),
            resolveWeaponShot: (source, target, weapon, ctx) => {
                ctx.log.push({
                    time: ctx.time,
                    actorId: source.id,
                    actorName: source.name,
                    action: 'attack',
                    message: `Bang with ${weapon.name}`
                });
            },
            applyDamage: () => {} // Add missing mock
        };

        const actionTaken = sniper.playTurn(context);

        expect(actionTaken).toBe(true);
        const lastLog = context.log[context.log.length - 1];
        
        expect(lastLog.action).toBe('attack');
        expect(lastLog.message).toContain('Sniper Rifle');
        
        expect(sniper.isMoving).toBeFalsy();
    });

    it('should retreat if target is too close (< rangeMin)', () => {
        const sniper = new Sniper({
            id: 'sniper', name: 'Sniper', team: 'A', class: 'Sniper',
            attributes: { hp: 10, maxHp: 10, aim: 100, speed: 10, initiative: 10, range: 10, damage: 0, dodge: 0, armor: 0, critChance: 0 },
            skills: [
                new SniperRifle('sniper_rifle', 'Sniper Rifle', 'Desc', 'icon', 10, 1, 10, 0, 100, 20, 1, 2, 10, 1, 10)
            ],

            isDead: false, level: 1, ammo: { 'sniper_rifle': 10 },
            currentWeaponId: 'sniper_rifle',
            position: { x: 0, y: 0 }
        });
        
        // Manual property set for minRange if constructor doesn't have it?
        (sniper.skills[0] as any).rangeMin = 2;

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
        
        // Should be move (Retreat) due to Smart Tactics
        expect(lastLog.action).toBe('move'); 
        expect(lastLog.message).toContain('better range');
    });
});
