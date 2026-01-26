
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Trooper, Soldier } from '../../../src/logic/minitroopers/classes/Trooper';
import { BattleContext, skillManager } from '../../../src/logic/minitroopers/systems/SkillSystem';
import { registerCoreSkills } from '../../../src/logic/minitroopers/skills/implementations';
import { Vehicle } from '../../../src/logic/minitroopers/classes/Skill';

// Register skills once
registerCoreSkills();

describe('Vehicle System', () => {
    let context: BattleContext;

    beforeEach(() => {
        context = {
            log: [], time: 0, turn: 0,
            allTroopers: [], deployedA: [], deployedB: [], reserveA: [], reserveB: [],
            jammedWeapons: new Map()
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should deploy a vehicle based on chance', () => {
        // Mock random to succeed (return 0)
        vi.spyOn(Math, 'random').mockReturnValue(0.0);

        const trooper = new Soldier({
            id: 't1', name: 'Tanker', team: 'A', class: 'Soldier',
            attributes: { hp: 10, maxHp: 10, aim: 0, speed: 10, initiative: 10, range: 1, damage: 0, dodge: 0, armor: 0, critChance: 0 },
            skills: [
                new Vehicle('light_tank', 'Light Tank', 'Desc', 'icon', 2)
            ],
            isDead: false, level: 1
        });
        
        // Execute OnBattleStart mechanics
        // Execute OnBattleStart mechanics
        expect(skillManager.get('light_tank')).toBeDefined();
        skillManager.executeOnBattleStart(trooper, context);
        
        console.log('Vehicle after:', trooper.vehicle);
        console.log('Battle Log:', JSON.stringify(context.log, null, 2)); // Debug log output
        
        expect(trooper.vehicle).toBeDefined();
        expect(trooper.vehicle?.type).toBe('light_tank');
        expect(trooper.vehicle?.hp).toBe(40); // Wiki stat
        expect(trooper.vehicle?.armor).toBe(2);
        
        // Log verification
        const log = context.log.find(l => l.action === 'deploy');
        expect(log).toBeDefined();
        expect(log?.message).toContain('rolls out in a Light Tank');
        
        // Weapon Verification
        const tankGun = trooper.skills.find(s => s.id === 'light_cannon');
        expect(tankGun).toBeDefined();
        expect(trooper.currentWeaponId).toBe('light_cannon');
    });

    it('should NOT deploy vehicle if chance fails', () => {
        // Mock random to fail (return 0.99)
        vi.spyOn(Math, 'random').mockReturnValue(0.99);

        const trooper = new Soldier({
            id: 't2', name: 'Walker', team: 'A', class: 'Soldier',
            attributes: { hp: 10, maxHp: 10, aim: 0, speed: 10, initiative: 10, range: 1, damage: 0, dodge: 0, armor: 0, critChance: 0 },
            skills: [
                new Vehicle('light_tank', 'Light Tank', 'Desc', 'icon', 2)
            ],
            isDead: false, level: 1
        });
        
        skillManager.executeOnBattleStart(trooper, context);
        
        expect(trooper.vehicle).toBeUndefined();
    });

    it('should apply Pilot bonus to deployment chance', () => {
        // Base chance for Light Tank is 0.06 (6%)
        // Pilot Level 1 adds 0.25 (25%) -> Total 31%
        
        // If we roll 0.20, it should fail without pilot (0.20 > 0.06)
        // But succeed with pilot (0.20 < 0.31)
        
        vi.spyOn(Math, 'random').mockReturnValue(0.20);
        
        const pilot = new Soldier({ // Using Soldier class but with Pilot SKILL
            id: 'p1', name: 'Ace', team: 'A', class: 'Pilot',
            attributes: { hp: 10, maxHp: 10, aim: 0, speed: 10, initiative: 10, range: 1, damage: 0, dodge: 0, armor: 0, critChance: 0 },
            skills: [
                new Vehicle('light_tank', 'Light Tank', 'Desc', 'icon', 2),
                { id: 'pilot', name: 'Pilot', description: 'Bonus', icon: 'icon' } as any 
            ],
            isDead: false, level: 1
        });
        
        skillManager.executeOnBattleStart(pilot, context);
        
        expect(pilot.vehicle).toBeDefined();
        expect(pilot.vehicle?.type).toBe('light_tank');
    });
});
