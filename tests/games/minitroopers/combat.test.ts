import { describe, it, expect } from 'vitest';
import { simulateBattle } from '../../../src/logic/minitroopers/combat';
import { SKILLS } from '../../../src/logic/minitroopers/skills';
import { Soldier, Sniper, Recruit } from '../../../src/logic/minitroopers/classes/Trooper';
import { SniperRifle, Melee } from '../../../src/logic/minitroopers/classes/Skill';
import { instantiateTrooper } from '../../../src/logic/minitroopers/generators';
import type { TrooperData } from '../../../src/logic/minitroopers/types';

describe('Combat Logic', () => {

    it('Sniper Rifle should have rangeMin of 2', () => {
        const sniperRifle = SKILLS.find(s => s.id === 'sniper_rifle') as any;
        expect(sniperRifle).toBeDefined();
        expect(sniperRifle.rangeMin).toBe(2);
    });

    it('Sniper should attack if target is beyond rangeMin', () => {
        const sniperData: TrooperData = {
            id: 'sniper-1', name: 'Sniper', team: 'A', level: 1, class: 'Sniper',
            skills: [],
            attributes: { hp: 10, maxHp: 10, speed: 10, initiative: 100, aim: 100, dodge: 0, armor: 0, critChance: 5, damage: 0, aggro: 0, range: 0, recoveryMod: 0, reloadBonus: 0, deploymentLimitBonus: 0 },
            position: { x: 0, y: 0 }, 
            isDead: false,
            disarmed: []
        };
        const sniper = new Sniper(sniperData);
        
        // Add real weapon
        const sniperRifle = new SniperRifle('sniper_rifle', 'Sniper Rifle', 'Long range.', '🎯', 10, 1, 100, 15, 150, 100, 1, 2, 0, 10, 2);
        sniper.skills = [sniperRifle];
        sniper.currentWeaponId = 'sniper_rifle';
        sniper.ammo = { 'sniper_rifle': 1 };

        const targetData: TrooperData = {
            id: 'target-1', name: 'Target', team: 'B', level: 1, class: 'Soldier',
            skills: [],
            attributes: { hp: 10, maxHp: 10, speed: 10, initiative: 50, aim: 10, dodge: 0, armor: 0, critChance: 0, damage: 0, aggro: 0, range: 0, recoveryMod: 0, reloadBonus: 0, deploymentLimitBonus: 0 },
            position: { x: 400, y: 0 }, // Dist 400 > 200 (rangeMin 2*100)
            isDead: false,
            disarmed: []
        };
        const target = new Soldier(targetData);

        const result = simulateBattle([sniper], [target]);
        
        const attackLogs = result.log.filter(l => l.actorId === 'sniper-1' && l.action === 'attack');
        expect(attackLogs.length).toBeGreaterThan(0);
    });

    it('Fists should be auto-injected if no melee weapon exists', () => {
        const recruitData: TrooperData = {
            id: 'recruit-1', name: 'Recruit', team: 'A', level: 1, class: 'Recruit',
            skills: [], // No weapons at all
            attributes: { hp: 10, maxHp: 10, speed: 10, initiative: 100, aim: 100, dodge: 0, armor: 0, critChance: 5, damage: 0, aggro: 0, range: 0, recoveryMod: 0, reloadBonus: 0, deploymentLimitBonus: 0 },
            position: { x: 0, y: 0 },
            isDead: false,
            disarmed: []
        };
        const recruit = new Recruit(recruitData);
        recruit.recalculateStats(); // Triggers Fists injection

        const hasFists = recruit.skills.some(s => s.id === 'fists');
        expect(hasFists).toBe(true);
    });

    it('Trooper should switch to Fists when all weapons are jammed', () => {
        const soldierData: TrooperData = {
            id: 'soldier-1', name: 'Soldier', team: 'A', level: 1, class: 'Soldier',
            skills: [],
            attributes: { hp: 20, maxHp: 20, speed: 10, initiative: 100, aim: 100, dodge: 0, armor: 0, critChance: 5, damage: 0, aggro: 0, range: 0, recoveryMod: 0, reloadBonus: 0, deploymentLimitBonus: 0 },
            position: { x: 0, y: 0 },
            isDead: false,
            disarmed: [],
            jammedWeapons: ['pistol'] // Primary weapon jammed
        };
        const soldier = new Soldier(soldierData);
        
        // Give pistol as only ranged weapon
        const pistol = SKILLS.find(s => s.id === 'pistol');
        if (pistol) soldier.skills = [pistol];
        soldier.currentWeaponId = 'pistol';
        soldier.ammo = { 'pistol': 5 };
        
        // Recalc to inject Fists
        soldier.recalculateStats();

        // Verify Fists was added
        const hasFists = soldier.skills.some(s => s.id === 'fists');
        expect(hasFists).toBe(true);

        const enemyData: TrooperData = {
            id: 'enemy-1', name: 'Enemy', team: 'B', level: 1, class: 'Soldier',
            skills: [],
            attributes: { hp: 10, maxHp: 10, speed: 10, initiative: 50, aim: 10, dodge: 0, armor: 0, critChance: 0, damage: 0, aggro: 0, range: 0, recoveryMod: 0, reloadBonus: 0, deploymentLimitBonus: 0 },
            position: { x: 40, y: 0 }, // Melee range
            isDead: false,
            disarmed: []
        };
        const enemy = new Soldier(enemyData);

        const result = simulateBattle([soldier], [enemy]);
        
        // With pistol jammed and in melee range, soldier should punch (or switch to Fists then attack)
        // Check for any attack log from soldier
        const attackLogsOrSwitch = result.log.filter(l => 
            l.actorId === 'soldier-1' && (l.action === 'attack' || l.action === 'switch_weapon')
        );
        expect(attackLogsOrSwitch.length).toBeGreaterThan(0);
    });
});

