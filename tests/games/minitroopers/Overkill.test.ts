
import { describe, it, expect } from 'vitest';
import { Soldier } from '../../../src/logic/minitroopers/classes/Trooper';
import { simulateBattle } from '../../../src/logic/minitroopers/combat';
import { Weapon } from '../../../src/logic/minitroopers/classes/Skill';

describe('Overkill Logic', () => {
    it('should stop burst fire immediately when target dies', () => {
        const attacker = new Soldier({
            id: 'attacker_burst',
            name: 'AttackerBurst',
            team: 'A',
            type: 'soldier',
            skills: []
        });
        attacker.attributes.aim = 999;
        attacker.attributes.damage = 100;
        
        // Burst Rifle: 3 shots. High damage (should kill in 1).
        const burstWeapon = new Weapon(
            'burst_rifle', 'Burst Rifle', 'desc', 'icon',
            100, // damage
            3, // bursts
            20, // range
            0, 100, 10, 50, 0, 0, 0, 0, 0, 50, false, 2.0, 0
        );
        
        attacker.skills.push(burstWeapon);
        attacker.equippedWeapon = burstWeapon;
        attacker.ammo = { [burstWeapon.id]: 50 };

        const target = new Soldier({
            id: 'target_burst',
            name: 'TargetBurst',
            team: 'B',
            type: 'soldier',
            skills: []
        });
        target.attributes.hp = 1;
        target.attributes.maxHp = 10;
        target.attributes.dodge = 0;

        const result = simulateBattle([attacker], [target]);

        const deathLogs = result.log.filter(l => l.message?.includes('dies'));
        const attackLogs = result.log.filter(l => l.action === 'attack');
        
        expect(deathLogs.length).toBe(1);
        expect(result.survivorsB.length).toBe(0);
        
        // Should be 1 attack (fatal) or maybe 2 if logging is detailed?
        // With current code: detailed log only.
        // So 1 attack log.
        expect(attackLogs.length).toBe(1);
    });

    it('should not allow dead troopers to shoot', () => {
        const attacker = new Soldier({
            id: 'attacker',
            name: 'Attacker',
            team: 'A',
            type: 'soldier',
            skills: []
        });
        attacker.attributes.initiative = 200;
        attacker.attributes.aim = 999;
        attacker.attributes.damage = 100;
        
        const weaponA = new Weapon('gun', 'Gun', 'desc', 'icon', 100, 1, 20, 0, 100, 10, 10, 0, 0, 0, 0, 100, 10);
        attacker.skills.push(weaponA);
        attacker.equippedWeapon = weaponA;
        attacker.ammo = { 'gun': 10 };

        const victim = new Soldier({
            id: 'victim',
            name: 'Victim',
            team: 'B',
            type: 'soldier',
            skills: []
        });
        victim.attributes.hp = 1;
        victim.attributes.maxHp = 10;
        victim.attributes.armor = 0;
        victim.attributes.initiative = 0;
        
        const weaponB = new Weapon('gunB', 'GunB', 'desc', 'icon', 100, 1, 20, 0, 100, 10, 10, 0, 0, 0, 0, 100, 10);
        victim.skills.push(weaponB);
        victim.equippedWeapon = weaponB;
        victim.ammo = { 'gunB': 10 };
        
        const result = simulateBattle([attacker], [victim]);
        
        const victimAttacks = result.log.filter(l => l.actorId === 'victim' && l.action === 'attack');
        
        expect(victimAttacks.length).toBe(0);
        expect(result.survivorsB.length).toBe(0);
    });
});
