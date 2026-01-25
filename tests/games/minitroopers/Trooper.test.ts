
import { describe, it, expect, vi } from 'vitest';
import { Soldier, Sniper, Doctor } from '../../../src/logic/minitroopers/classes/Trooper';
import { SKILLS } from '../../../src/logic/minitroopers/skills';
import type { BattleContext } from '../../../src/logic/minitroopers/systems/SkillSystem';

describe('Trooper Classes', () => {

    it('Soldier should initialize correctly', () => {
        const soldier = new Soldier({
            id: 's1', name: 'John', team: 'A', level: 1, class: 'Soldier',
            skills: [], attributes: { hp: 10, maxHp: 10, speed: 100, initiative: 100, aim: 100, dodge: 0, armor: 0, critChance: 0, damage: 0, range: 0 },
            isDead: false
        });
        expect(soldier.class).toBe('Soldier');
        expect(soldier.playTurn).toBeDefined();
    });

    it('Sniper should have corrected attributes logic if special skills applied', () => {
        // ...
    });

    it('Trooper.playTurn should return false if no enemies', () => {
         const soldier = new Soldier({
            id: 's1', name: 'John', team: 'A', level: 1, class: 'Soldier',
            skills: [], attributes: { hp: 10, maxHp: 10, speed: 100, initiative: 100, aim: 100, dodge: 0, armor: 0, critChance: 0, damage: 0, range: 0 },
            isDead: false,
            position: { x: 0, y: 0 }
        });
        
        const context: BattleContext = {
            log: [],
            time: 0,
            turn: 0,
            allTroopers: [soldier],
            deployedA: [soldier],
            deployedB: [],
            reserveA: [],
            reserveB: [],
            jammedWeapons: new Map()
        };

        const result = soldier.playTurn(context);
        expect(result).toBe(false);
    });

    it('Trooper.playTurn should return true if action taken (Move)', () => {
         const soldier = new Soldier({
            id: 's1', name: 'John', team: 'A', level: 1, class: 'Soldier',
            skills: [], attributes: { hp: 10, maxHp: 10, speed: 100, initiative: 100, aim: 100, dodge: 0, armor: 0, critChance: 0, damage: 0, range: 0 },
            isDead: false,
            position: { x: 0, y: 0 }
        });
        
        const enemy = new Soldier({
            id: 'e1', name: 'BadGuy', team: 'B', level: 1, class: 'Soldier',
            skills: [], attributes: { hp: 10, maxHp: 10, speed: 100, initiative: 100, aim: 100, dodge: 0, armor: 0, critChance: 0, damage: 0, range: 0 },
            isDead: false,
            position: { x: 500, y: 0 }
        });

        const context: BattleContext = {
            log: [],
            time: 0,
            turn: 0,
            allTroopers: [soldier, enemy],
            deployedA: [soldier],
            deployedB: [enemy],
            reserveA: [],
            reserveB: [],
            jammedWeapons: new Map()
        };

        const result = soldier.playTurn(context);
        expect(result).toBe(true);
        expect(context.log.length).toBeGreaterThan(0);
        expect(context.log[0].action).toBe('move');
    });
});
