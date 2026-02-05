
import { describe, it, expect } from 'vitest';
import { Soldier } from '../../../src/logic/minitroopers/classes/Trooper';
import { simulateBattle } from '../../../src/logic/minitroopers/combat';
import { SKILLS } from '../../../src/logic/minitroopers/skills';
import { registerCoreSkills } from '../../../src/logic/minitroopers/skills/implementations';
import { getDistance } from '../../../src/logic/minitroopers/utils';

registerCoreSkills();

const getSkill = (id: string) => SKILLS.find(sk => sk.id === id)!;

describe('Tactics Verification', () => {
    it('Priority: Closest - should target closest enemy', () => {
        const attacker = new Soldier({
            id: 'att', name: 'Attacker', team: 'A', class: 'Soldier', level: 1,
            attributes: { hp: 100, maxHp: 100, aim: 100, armor: 0, damage: 0, dodge: 0, initiative: 0, range: 1, critChance: 0, speed: 0 },
            skills: [getSkill('sniper_rifle')],
            isDead: false,
            tactics: { priority: 'closest', targetPart: 'any' },
            position: { x: 0, y: 0 }
        });
        attacker.currentWeaponId = 'sniper_rifle';

        const nearEnemy = new Soldier({
            id: 'near', name: 'Near', team: 'B', class: 'Soldier', level: 1,
            attributes: { hp: 100, maxHp: 100, aim: 100, armor: 0, damage: 0, dodge: 0, initiative: 0, range: 1, critChance: 0, speed: 0 },
            skills: [], isDead: false,
            position: { x: 100, y: 0 }
        });

        const farEnemy = new Soldier({
            id: 'far', name: 'Far', team: 'B', class: 'Soldier', level: 1,
            attributes: { hp: 100, maxHp: 100, aim: 100, armor: 0, damage: 0, dodge: 0, initiative: 0, range: 1, critChance: 0, speed: 0 },
            skills: [], isDead: false,
            position: { x: 500, y: 0 }
        });

        // Mock getDistance if needed? No, logic uses utils.
        // Simulate 1 tick of battle where attacker shoots.
        // Or check `playTurn` logic via mocked context?
        // Full simulation is easier.
        
        const { log } = simulateBattle([attacker], [nearEnemy, farEnemy]);
        
        // Find attack log
        const attack = log.find(l => l.actorId === 'att' && l.action === 'attack');
        expect(attack).toBeDefined();
        expect(attack?.targetId).toBe('near');
    });

    it('Priority: Weakest - should target lowest HP enemy', () => {
         const attacker = new Soldier({
            id: 'att', name: 'Attacker', team: 'A', class: 'Soldier', level: 1,
            attributes: { hp: 100, maxHp: 100, aim: 100, armor: 0, damage: 0, dodge: 0, initiative: 0, range: 1, critChance: 0, speed: 0 },
            skills: [getSkill('sniper_rifle')],
            isDead: false,
            tactics: { priority: 'weakest', targetPart: 'any' }, // Weakest logic implemented?
            position: { x: 0, y: 0 }
        });
        attacker.currentWeaponId = 'sniper_rifle';

        const heavyEnemy = new Soldier({
             id: 'heavy', name: 'Heavy', team: 'B', class: 'Soldier', level: 1,
             attributes: { hp: 200, maxHp: 200, aim: 100, armor: 0, damage: 0, dodge: 0, initiative: 0, range: 1, critChance: 0, speed: 0 },
             skills: [], isDead: false,
             position: { x: 100, y: 0 }
        });

        const weakEnemy = new Soldier({
             id: 'weak', name: 'Weak', team: 'B', class: 'Soldier', level: 1,
             attributes: { hp: 10, maxHp: 10, aim: 100, armor: 0, damage: 0, dodge: 0, initiative: 0, range: 1, critChance: 0, speed: 0 },
             skills: [], isDead: false,
             position: { x: 100, y: 100 }
        });

        const { log } = simulateBattle([attacker], [heavyEnemy, weakEnemy]);
        
        const attack = log.find(l => l.actorId === 'att' && l.action === 'attack');
        expect(attack?.targetId).toBe('weak');
    });
    
    // Test Target: Head (aim penalty check?)
    // Hard to verify probability in 1 run. 
    // We can check hitLocation in log if it hits.
    
    // Weapon: Auto (Checked in Spy/Trooper logic)
});
