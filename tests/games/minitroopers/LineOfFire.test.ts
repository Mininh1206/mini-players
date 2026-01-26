
import { describe, it, expect, vi } from 'vitest';
import { Soldier } from '../../../src/logic/minitroopers/classes/Trooper';
import { simulateBattle } from '../../../src/logic/minitroopers/combat';
import { getDistance } from '../../../src/logic/minitroopers/utils';
import type { BattleContext } from '../../../src/logic/minitroopers/systems/SkillSystem';

describe('Line of Fire Logic', () => {
    it('should relocate if line of fire is blocked by an ally', () => {
        const shooter = new Soldier({
            id: 'A1', name: 'Shooter', team: 'A',
            skills: [{ id: 'assault_rifle', range: 6 } as any], 
            attributes: { hp: 10, maxHp: 10, aim: 100, speed: 100, damage: 1, armor: 0, dodge: 0, initiative: 0 },
            isDead: false, level: 1
        });
        shooter.recalculateStats();
        // Ensure weapon equipped
        shooter.currentWeaponId = 'assault_rifle';
        shooter.ammo = { 'assault_rifle': 10 };

        const ally = new Soldier({
            id: 'A2', name: 'Ally', team: 'A',
            skills: [],
            attributes: { hp: 10, maxHp: 10 },
            isDead: false, level: 1
        });

        const enemy = new Soldier({
            id: 'B1', name: 'Enemy', team: 'B',
            skills: [],
            attributes: { hp: 10, maxHp: 10 },
            isDead: false, level: 1
        });

        // Position: A1(0,0) -> A2(50,0) -> B1(200,0)
        // A2 is strictly in between.
        shooter.position = { x: 0, y: 0 };
        ally.position = { x: 50, y: 0 };
        enemy.position = { x: 200, y: 0 };

        const allTroopers = [shooter, ally, enemy];
        const log: any[] = [];
        const jammedWeapons = new Map();

        const context: BattleContext = {
            log,
            time: 1,
            turn: 1,
            allTroopers,
            deployedA: [shooter, ally],
            deployedB: [enemy],
            reserveA: [],
            reserveB: [],
            jammedWeapons,
            resolveWeaponShot: vi.fn(), // Mock to ensure NOT called
            applyDamage: vi.fn()
        };

        // Execute Turn
        const actionTaken = shooter.playTurn(context);

        expect(actionTaken).toBe(true);
        
        // Should have MOVED (Relocated)
        const moveLog = log.find(entry => entry.actorId === 'A1' && entry.action === 'move');
        expect(moveLog).toBeDefined();
        expect(moveLog.message).toContain('repositions');
        
        // Should NOT have attacked
        expect(context.resolveWeaponShot).not.toHaveBeenCalled();
    });

    it('should shoot if line of fire is clear', () => {
        const shooter = new Soldier({
            id: 'A1', name: 'Shooter', team: 'A',
            skills: [{ id: 'assault_rifle', range: 6 } as any], 
            attributes: { hp: 10, maxHp: 10, aim: 100, speed: 100, damage: 1, armor: 0, dodge: 0, initiative: 0 },
            isDead: false, level: 1
        });
        shooter.recalculateStats();
        shooter.currentWeaponId = 'assault_rifle';
        shooter.ammo = { 'assault_rifle': 10 };

        const ally = new Soldier({
            id: 'A2', name: 'Ally', team: 'A',
            skills: [],
            attributes: { hp: 10, maxHp: 10 },
            isDead: false, level: 1
        });

        const enemy = new Soldier({
            id: 'B1', name: 'Enemy', team: 'B',
            skills: [],
            attributes: { hp: 10, maxHp: 10 },
            isDead: false, level: 1
        });

        // Position: A1(0,0) -> A2(0, 100) -> B1(200,0)
        // A2 is NOT in between.
        shooter.position = { x: 0, y: 0 };
        ally.position = { x: 0, y: 100 }; // Out of line
        enemy.position = { x: 200, y: 0 };

        const allTroopers = [shooter, ally, enemy];
        const log: any[] = [];
        const jammedWeapons = new Map();

        const context: BattleContext = {
            log,
            time: 1,
            turn: 1,
            allTroopers,
            deployedA: [shooter, ally],
            deployedB: [enemy],
            reserveA: [],
            reserveB: [],
            jammedWeapons,
            resolveWeaponShot: vi.fn(), // Mock
            applyDamage: vi.fn()
        };

        // Execute Turn
        const actionTaken = shooter.playTurn(context);

        expect(actionTaken).toBe(true);
        expect(context.resolveWeaponShot).toHaveBeenCalled();
    });
});
