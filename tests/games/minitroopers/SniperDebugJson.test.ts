
import { describe, it, expect } from 'vitest';
import { Sniper, Soldier } from '../../../src/logic/minitroopers/classes/Trooper';
import { BattleContext } from '../../../src/logic/minitroopers/systems/SkillSystem';
import { SniperRifle } from '../../../src/logic/minitroopers/classes/Skill';
import fs from 'fs';
import path from 'path';

describe('Sniper AI Debug JSON', () => {
    it('debugs sniper behavior', () => {
        const sniper = new Sniper({
            id: 'sniper', name: 'Sniper', team: 'A', class: 'Sniper',
            attributes: { hp: 10, maxHp: 10, aim: 100, speed: 10, initiative: 10, range: 10, damage: 0, dodge: 0, armor: 0, critChance: 0 },
            skills: [
                new SniperRifle('sniper_rifle', 'Sniper Rifle', 'Desc', 'icon', 10, 1, 100, 0, 100, 100, 1, 5, 0, 10, 2) 
            ],
            isDead: false, level: 1, ammo: { 'sniper_rifle': 1 }, 
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

        const actionTaken = sniper.playTurn(context);
        const lastLog = context.log[context.log.length - 1];

        const debugData = {
            actionTaken,
            lastAction: lastLog?.action,
            lastMessage: lastLog?.message,
            dist: require('../../../src/logic/minitroopers/utils').getDistance(sniper.position, target.position),
            range: 100 * 100,
            ammo: sniper.ammo['sniper_rifle'],
            jammedMap: Array.from(context.jammedWeapons.entries()),
            sniperJammed: (sniper as any).jammedWeapons,
            equippedWeaponId: sniper.currentWeaponId
        };

        fs.writeFileSync(path.resolve(__dirname, 'sniper_debug.json'), JSON.stringify(debugData, null, 2));

        expect(lastLog.action).toBe('attack');
    });
});
