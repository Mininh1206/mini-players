
import { describe, it, expect } from 'vitest';
import { Spy, Soldier } from '../../../src/logic/minitroopers/classes/Trooper';
import { simulateBattle } from '../../../src/logic/minitroopers/combat';
import { registerCoreSkills } from '../../../src/logic/minitroopers/skills/implementations';
import { SKILLS } from '../../../src/logic/minitroopers/skills';

registerCoreSkills();
const getSkill = (id: string) => SKILLS.find(sk => sk.id === id)!;

describe('Spy Death Logic', () => {
    it('should kill a Spy correctly despite infiltration', () => {
        // Target: Spy, Team B (but infiltrates A)
        const spyTarget = new Spy({
            id: 'spyTarget', name: 'SpyTarget', team: 'B', class: 'Spy', level: 1,
            attributes: { hp: 10, maxHp: 100, aim: 0, armor: 0, damage: 0, dodge: 0, initiative: 0, range: 1, critChance: 0, speed: 0 },
            skills: [getSkill('spy')], // Has Spy skill
            isDead: false,
            // Spy deploy logic usually randomizes position, but we can try to force it via combat if we can.
            // However, combat.ts respects existing position.
            // Let's set it to where a Spy WOULD be (Team A side: x=100)
            position: { x: 100, y: 100 }
        });

        // Attacker: Soldier, Team A
        const attacker = new Soldier({
            id: 'attacker', name: 'Killer', team: 'A', class: 'Soldier', level: 1,
            attributes: { hp: 100, maxHp: 100, aim: 100, armor: 0, damage: 100, dodge: 0, initiative: 100, range: 1, critChance: 0, speed: 100 },
            skills: [],
            isDead: false,
            position: { x: 50, y: 100 }
        });
        
        // Attacker treats Spy as Enemy?
        // Team A vs Team B. Spy is Team B.
        // Even if Spy is at x=100 (Team A zone), it is Team B.
        
        const { log, survivorsB } = simulateBattle([attacker], [spyTarget]);

        // Find death log
        const deathLog = log.find(l => l.actorId === 'spyTarget' && (l.message.includes('dead') || l.message.includes('eliminated') || l.message.includes('dies')));
        
        if (!deathLog) {
             console.log('FULL LOG:', JSON.stringify(log, null, 2));
        }

        expect(deathLog).toBeDefined();

        // Spy should be removed from survivorsB
        const spySurvivor = survivorsB.find(t => t.id === 'spyTarget');
        expect(spySurvivor).toBeUndefined();
    });
});
