
import { describe, it, expect } from 'vitest';
import { Soldier } from '../../../src/logic/minitroopers/classes/Trooper';
import { simulateBattle } from '../../../src/logic/minitroopers/combat';
import { SKILLS } from '../../../src/logic/minitroopers/skills';
import { registerCoreSkills } from '../../../src/logic/minitroopers/skills/implementations';

registerCoreSkills();

const getSkill = (id: string) => SKILLS.find(sk => sk.id === id)!;

describe('Death Sync Logic', () => {
    it('should kill target in CQC and remove from survivors', () => {
        // Target: Low HP, Team B
        const target = new Soldier({
            id: 'target', name: 'Target', team: 'B', class: 'Soldier', level: 1,
            attributes: { hp: 10, maxHp: 100, aim: 100, armor: 0, damage: 0, dodge: 0, initiative: 0, range: 1, critChance: 0, speed: 100 },
            skills: [],
            isDead: false,
            // Explicitly set position
            position: { x: 50, y: 100 }
        });

        // Attacker: High Damage, Team A, Close placement
        const attacker = new Soldier({
            id: 'attacker', name: 'Killer', team: 'A', class: 'Soldier', level: 1,
            attributes: { hp: 100, maxHp: 100, aim: 100, armor: 0, damage: 100, dodge: 0, initiative: 100, range: 1, critChance: 0, speed: 100 },
            skills: [], // Fists
            isDead: false,
            position: { x: 40, y: 100 } // Distance 10
        });

        const { log, survivorsB } = simulateBattle([attacker], [target]);

        // Find when target died
        const deathLog = log.find(l => l.actorId === 'target' && (l.message.includes('dead') || l.message.includes('eliminated') || l.message.includes('dies')));
        
        if (!deathLog) {
            console.error('FULL LOG:', JSON.stringify(log, null, 2));
        }

        expect(deathLog).toBeDefined();

        // Target should be removed from survivors
        const targetSurvivor = survivorsB.find(t => t.id === 'target');
        if (targetSurvivor) {
             console.error('Target Survivor Found:', targetSurvivor);
        }
        expect(targetSurvivor).toBeUndefined();
        
        // Ensure no attacks ON target after death
        const deathIndex = log.indexOf(deathLog!);
        const attacksAfter = log.slice(deathIndex + 1).filter(l => l.action === 'attack' && l.targetId === 'target');
        expect(attacksAfter.length).toBe(0);
    });
});
