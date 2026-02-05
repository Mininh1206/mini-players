import { describe, it, expect } from 'vitest';
import { Soldier } from '../../../src/logic/minitroopers/classes/Trooper';
import { simulateBattle } from '../../../src/logic/minitroopers/combat';

describe('Battle Consistency', () => {
    it('should generate log events in chronological order', () => {
        const tA = new Soldier({ id: 'A', name: 'A', team: 'A', skills: [], attributes: { hp: 100, maxHp: 100 } } as any);
        const tB = new Soldier({ id: 'B', name: 'B', team: 'B', skills: [], attributes: { hp: 100, maxHp: 100 } } as any);
        
        const result = simulateBattle([tA], [tB]);
        
        let lastTime = 0;
        result.log.forEach((entry, idx) => {
            expect(entry.time).toBeGreaterThanOrEqual(lastTime);
            lastTime = entry.time;
        });
    });

    it('should include necessary data in logs for visualization', () => {
        const tA = new Soldier({ id: 'A', name: 'A', team: 'A', skills: [], attributes: { hp: 100, maxHp: 100 } } as any);
        const tB = new Soldier({ id: 'B', name: 'B', team: 'B', skills: [], attributes: { hp: 100, maxHp: 100 } } as any);
        
        // Force a hit
        tA.attributes.aim = 999;
        tB.attributes.dodge = 0;
        
        // Ensure tA has 'fists' or similar if empty
        tA.recalculateStats();

        const result = simulateBattle([tA], [tB]);
        
        const attackLog = result.log.find(l => l.action === 'attack');
        expect(attackLog).toBeDefined();
        if (attackLog) {
            expect(attackLog.actorId).toBeDefined();
            // targetId is optional for some misses (e.g. area miss)
            if (!attackLog.isMiss) {
                 expect(attackLog.targetId).toBeDefined();
            }
            // Expect weaponId in data (even if it's 'fists')
            expect(attackLog.data?.weaponId).toBeDefined();
        }
    });

    it('should log death events correctly', () => {
        const tA = new Soldier({ id: 'A', name: 'Killer', team: 'A', skills: [], attributes: { hp: 100, maxHp: 100, damage: 200, aim: 999 } } as any);
        const tB = new Soldier({ id: 'B', name: 'Victim', team: 'B', skills: [], attributes: { hp: 10, maxHp: 10, dodge: 0 } } as any);
        
        const result = simulateBattle([tA], [tB]);
        
        const deathLogs = result.log.filter(l => (l.action === 'wait' && l.message.includes('dies')) || (l.action as any) === 'die');
        expect(deathLogs.length).toBeGreaterThan(0);
    });
});
