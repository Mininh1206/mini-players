
import { describe, it, expect } from 'vitest';
import { Sniper, Soldier } from '../../../src/logic/minitroopers/classes/Trooper';
import { BattleContext } from '../../../src/logic/minitroopers/systems/SkillSystem';
import { SniperRifle } from '../../../src/logic/minitroopers/classes/Skill';

// Custom logger to stdout
const log = (...args: any[]) => process.stdout.write(args.join(' ') + '\n');

describe('Sniper AI Debug', () => {
    it('debugs sniper behavior', () => {
        const sniper = new Sniper({
            id: 'sniper', name: 'Sniper', team: 'A', class: 'Sniper',
            attributes: { hp: 10, maxHp: 10, aim: 100, speed: 10, initiative: 10, range: 10, damage: 0, dodge: 0, armor: 0, critChance: 0 },
            skills: [
                new SniperRifle('sniper_rifle', 'Sniper Rifle', 'Desc', 'icon', 10, 1, 100, 0, 100, 100, 1, 5, 0, 10, 2) 
                // id, name, desc, icon, damage, burst, range, crit, aim, rec, cap, rangeMin, enc, maxDamage, totalAmmo
            ],
            isDead: false, level: 1, ammo: { 'sniper_rifle': 1 }, 
            // Note: Combat logic uses capacity for ammo init. passing ammo manually here.
            position: { x: 0, y: 0 }
        });

        const target = new Soldier({
            id: 'target', name: 'Target', team: 'B', class: 'Soldier',
            attributes: { hp: 10, maxHp: 10, aim: 10, speed: 10, initiative: 10, range: 10, damage: 0, dodge: 0, armor: 0, critChance: 0 },
            skills: [],
            isDead: false, level: 1,
            position: { x: 800, y: 0 }
        });

        const context: BattleContext = {
            log: [], time: 0, turn: 0,
            allTroopers: [sniper, target],
            deployedA: [sniper], deployedB: [target],
            reserveA: [], reserveB: [],
            jammedWeapons: new Map()
        };

        // Override console.log
        const originalLog = console.log;
        console.log = log;

        const actionTaken = sniper.playTurn(context);
        
        console.log = originalLog;

        const lastLog = context.log[context.log.length - 1];
        
        // Log status
        const debugInfo = `
        Action Taken: ${actionTaken}
        Last Action: ${lastLog?.action}
        Log Entry: ${JSON.stringify(lastLog)}
        Log Count: ${context.log.length}
        Dist: ${require('../../../src/logic/minitroopers/utils').getDistance(sniper.position, target.position)}
        Range: ${100 * 100} (SniperRifle)
        Ammo: ${sniper.ammo['sniper_rifle']}
        Usable(Method): ${JSON.stringify(sniper.jammedWeapons)}
        `;
        console.log("LAST LOG:", JSON.stringify(lastLog, null, 2));

        if (lastLog.action !== 'attack') {
            throw new Error(`DEBUG FAIL: ${debugInfo}`);
        }
        
        expect(lastLog.action).toBe('attack');
    });
});
