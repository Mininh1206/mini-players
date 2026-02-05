
import { describe, it, expect } from 'vitest';
import { Soldier, Spy } from '../../../src/logic/minitroopers/classes/Trooper';
import { simulateBattle } from '../../../src/logic/minitroopers/combat';
import { SKILLS } from '../../../src/logic/minitroopers/skills';
import { registerCoreSkills } from '../../../src/logic/minitroopers/skills/implementations';

registerCoreSkills();

const getSkill = (id: string) => {
    const s = SKILLS.find(sk => sk.id === id);
    if (!s) throw new Error(`Skill ${id} not found`);
    return s;
};

describe('Spy Logic', () => {
    it('should NOT switch to fists immediately if deployed close with a ranged weapon', () => {
        const sniperRifle = getSkill('sniper_rifle');
        const spySkill = getSkill('spy');
        
        // Use Spy class directly to ensure class property is 'Spy'
        const spy = new Spy({
            id: 'spy', name: 'Spy', team: 'A',
            class: 'Spy',
            level: 5,
            attributes: { hp: 10000, maxHp: 10000, aim: 100, armor: 0, damage: 0, dodge: 0, initiative: 100, range: 1, critChance: 0, speed: 100 },
            skills: [spySkill, sniperRifle],
            isDead: false,
            // Set position valid for Sniper (MinRange 4 = 400px)
            position: { x: 100, y: 100 } 
        });
        spy.currentWeaponId = sniperRifle.id; // Correct initial state
        
        const enemy = new Soldier({
            id: 'enemy', name: 'Enemy', team: 'B',
            class: 'Soldier',
            level: 5,
            attributes: { hp: 100, maxHp: 100, aim: 100, armor: 0, damage: 0, dodge: 0, initiative: 0, range: 1, critChance: 0, speed: 100 },
            skills: [], // Fists default
            isDead: false,
            position: { x: 900, y: 100 }
        });

        const result = simulateBattle([spy], [enemy]);
        const { survivorsA, log, survivorsB } = result;
        
        // Log output for debug
        const deployLog = log.filter(l => l.action === 'deploy');
        console.log('Deploy Log:', deployLog);

        const switchLog = log.find(l => l.actorId === 'spy' && l.action === 'switch_weapon');
        console.log('Switch Log:', switchLog);
        
        console.log('SurvivorsA length:', survivorsA.length);
        if (survivorsA.length > 0) {
             console.log('SurvivorA IDs:', survivorsA.map(t => t.id));
        }

        console.log('SurvivorsB length:', survivorsB.length);
        if (survivorsB.length > 0) {
             console.log('SurvivorB IDs:', survivorsB.map(t => t.id));
        }

        // Check if Spy is in B?
        const spyInB = survivorsB.find(t => t.id === 'spy');
        if (spyInB) console.log('Spy Found in Team B Survivors!');
        
        console.log('FULL LOG:', JSON.stringify(log, null, 2));

        // Death check
        const deathLog = log.find(l => l.targetId === 'spy' && (l.message.includes('dead') || l.message.includes('eliminated')));
        console.log('Spy died?', deathLog);

        const spySurvivor = survivorsA.find(t => t.id === 'spy');
        
        if (!spySurvivor) {
             const deathLog = log.find(l => l.targetId === 'spy' && l.message.includes('dead'));
             console.log('Spy died?', deathLog);
        } else {
             console.log('Spy Weapon:', spySurvivor.currentWeaponId);
        }

        expect(spySurvivor).toBeDefined();
        if (spySurvivor) {
            expect(spySurvivor.currentWeaponId).toBe('sniper_rifle');
        }
    });
});
