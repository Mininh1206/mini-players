import type { Trooper, BattleResult, BattleLogEntry } from './types';
import { getDeploymentLimit, getDeploymentCost } from './deployment';
import { getSabotage } from './stats';
import { Weapon } from './classes/Skill';
import { skillManager, type BattleContext } from './systems/SkillSystem';
import { registerCoreSkills } from './skills/implementations';
import { getDistance } from './utils';

// Initialize Skills
registerCoreSkills();

export const SKILLS = {
    TRIGGER_HAPPY: 'trigger_happy',
    SNIPER: 'sniper',
    DOCTOR: 'doctor',
    SPRINTER: 'sprinter',
    HARDY: 'hardy',
    TANK: 'tank',
    DODGE_MASTER: 'dodge_master',
    EAGLE_EYE: 'eagle_eye',
    COMMANDO: 'commando',
    SMART: 'smart',
    SNIPER_TRAINING: 'sniper_training',
    SPEEDY: 'speedy',
    TWINOID: 'twinoid',
};

export function simulateBattle(teamA: Trooper[], teamB: Trooper[]): BattleResult {
    // Deep copy to avoid mutating original state during simulation
    const reserveA = JSON.parse(JSON.stringify(teamA)) as Trooper[];
    const reserveB = JSON.parse(JSON.stringify(teamB)) as Trooper[];
    
    // Jamming State (TrooperID -> List of Jammed Weapon IDs)
    const jammedWeapons = new Map<string, string[]>();

    const log: BattleLogEntry[] = [];
    const initialContext: BattleContext = {
        time: 0,
        turn: 0,
        log,
        allTroopers: [...reserveA, ...reserveB],
        deployedA: [],
        deployedB: [],
        reserveA,
        reserveB,
        jammedWeapons
    };

    // Apply Passives & Battle Start Hooks
    reserveA.forEach(t => {
        skillManager.applyStatModifiers(t);
        skillManager.executeOnBattleStart(t, initialContext);
    });
    reserveB.forEach(t => {
        skillManager.applyStatModifiers(t);
        skillManager.executeOnBattleStart(t, initialContext);
    });
    
    // Deployment State
    const deployedA: Trooper[] = [];
    const deployedB: Trooper[] = [];
    const limitA = getDeploymentLimit(reserveA);
    const limitB = getDeploymentLimit(reserveB);

    // Initial Deployment Helper
    const deploy = (reserve: Trooper[], deployed: Trooper[], limit: number, log: BattleLogEntry[], time: number, team: 'A' | 'B') => {
        let currentCost = deployed.reduce((sum, t) => sum + getDeploymentCost(t), 0);
        
        while (reserve.length > 0) {
            const nextTrooper = reserve[0];
            const cost = getDeploymentCost(nextTrooper);
            
            if (currentCost + cost <= limit) {
                const trooper = reserve.shift()!;
                // Initialize Combat State
                trooper.position = {
                    x: team === 'A' ? Math.floor(Math.random() * 200) : 800 + Math.floor(Math.random() * 200),
                    y: 50 + Math.floor(Math.random() * 300) // 50-350 Y range
                };
                trooper.recoveryTime = 0;
                trooper.actionTimer = Math.floor(Math.random() * 500);
                trooper.ammo = {};
                trooper.skills.forEach(s => {
                    if ((s as any).capacity) {
                        trooper.ammo![s.id] = (s as any).capacity;
                    }
                });

                deployed.push(trooper);
                currentCost += cost;
                
                let msg = `${trooper.name} enters the battlefield!`;
                if (jammedWeapons.has(trooper.id)) {
                    msg += ` (Weapon Jammed!)`;
                }

                log.push({
                    time,
                    actorId: trooper.id,
                    actorName: trooper.name,
                    action: 'deploy',
                    message: msg,
                    targetPosition: trooper.position // Include position for visualizer
                });

                // Trigger onDeploy Skills (e.g. Spy, Vehicles)
                skillManager.executeOnDeploy(trooper, {
                    time,
                    turn: time, // Pass time as turn
                    log,
                    allTroopers: [...deployedA, ...deployedB],
                    deployedA,
                    deployedB,
                    reserveA,
                    reserveB,
                    jammedWeapons
                });
            } else {
                break;
            }
        }
    };

    let time = 0;
    const maxTime = 10000; // Max ticks (e.g. 100 seconds if 1 tick = 10ms)

    // Initial Deployment
    deploy(reserveA, deployedA, limitA, log, 0, 'A');
    deploy(reserveB, deployedB, limitB, log, 0, 'B');

    // Initialize Timers
    [...deployedA, ...deployedB].forEach(t => {
        t.actionTimer = Math.floor(Math.random() * 500); // Random start to stagger
        t.recoveryTime = 0;
    });

    while ((deployedA.length > 0 || reserveA.length > 0) && (deployedB.length > 0 || reserveB.length > 0) && time <= maxTime) {
        time++;
        
        const allTroopers = [...deployedA, ...deployedB].filter(t => !t.isDead);
        if (allTroopers.length === 0) break;

        // Create Context
        const context: BattleContext = {
            time,
            turn: time, // Pass time as turn for compatibility
            log,
            allTroopers,
            deployedA,
            deployedB,
            reserveA,
            reserveB,
            jammedWeapons
        };

        // Tick Loop
        for (const actor of allTroopers) {
            if (actor.isDead) continue;

            // Recovery Check
            if (actor.recoveryTime && actor.recoveryTime > 0) {
                actor.recoveryTime--;
                continue;
            }

            // Action Timer Accumulation (Only if fully recovered)
            // Base speed 100. Initiative adds bonus.
            const speed = (actor.attributes.speed || 100) + actor.attributes.initiative;
            actor.actionTimer = (actor.actionTimer || 0) + speed;

            // Action Threshold
            if (actor.actionTimer >= 1000) {
                actor.actionTimer -= 1000; // Consume timer
                
                // Identify enemies
                const enemySquad = actor.team === 'A' ? deployedB : deployedA;
                const livingEnemies = enemySquad.filter(t => !t.isDead);

                if (livingEnemies.length === 0) break; 

                // 0. Skill Turn Start Hooks (e.g. Doctor Heal)
                // Note: executeTurnStart might need refactoring if it assumes turns
                if (skillManager.executeTurnStart(actor, context)) {
                    actor.recoveryTime = 50; // Small recovery for skill usage
                    continue; 
                }

                // 1. Identify Target
                let target = livingEnemies[0];
                
                // Filter by Aggro (Bait skill)
                const aggroEnemies = livingEnemies.filter(e => (e.attributes.aggro || 0) > 0);
                const potentialTargets = aggroEnemies.length > 0 ? aggroEnemies : livingEnemies;

                const priority = actor.tactics?.priority || 'closest';
                
                if (priority === 'closest') {
                    let minDist = 9999;
                    potentialTargets.forEach(e => {
                        const dist = getDistance(actor.position, e.position);
                        if (dist < minDist) {
                            minDist = dist;
                            target = e;
                        }
                    });
                } else if (priority === 'weakest') {
                    target = potentialTargets.reduce((prev, curr) => prev.attributes.hp < curr.attributes.hp ? prev : curr);
                } else if (priority === 'strongest') {
                    target = potentialTargets.reduce((prev, curr) => prev.attributes.hp > curr.attributes.hp ? prev : curr);
                } else {
                    target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
                }

                const dist = getDistance(actor.position, target.position);
                
                // Helper: Get equipped weapon
                let equippedWeapon = actor.skills.find(s => s.id === actor.currentWeaponId) as Weapon | undefined;
                if (!equippedWeapon) {
                    // Auto-equip first available if none
                    const weapons = actor.skills.filter(s => (s as any).damage !== undefined);
                    if (weapons.length > 0) {
                        equippedWeapon = weapons[0] as Weapon;
                        actor.currentWeaponId = equippedWeapon.id;
                    }
                }

                // Helper: Check if weapon is usable (not jammed, not disarmed)
                const isUsable = (w: Weapon) => {
                    return !jammedWeapons.get(actor.id)?.includes(w.id) && !actor.disarmed?.includes(w.id);
                };

                // Action Decision Tree
                let actionTaken = false;

                // 1. Shoot (if in range and has ammo)
                if (equippedWeapon && isUsable(equippedWeapon)) {
                    const range = ((equippedWeapon as any).range || 1) * 100;
                    const ammo = actor.ammo?.[equippedWeapon.id] || 0;
                    
                    if (dist <= range && ammo > 0) {
                        // ATTACK
                        const bursts = (equippedWeapon as any).bursts || 1;
                        const shots = Math.min(bursts, ammo);
                        actor.ammo![equippedWeapon.id] -= shots;
                        
                        // Fire Loop
                        for (let i = 0; i < shots; i++) {
                            if (target.isDead) break;

                            const weaponAccuracy = (equippedWeapon as any).aim || 100;
                            const baseAim = actor.attributes.aim;
                            let aimPenalty = 0;
                            const targetPart = actor.tactics?.targetPart || 'any';
                            if (targetPart === 'head' || targetPart === 'heart') aimPenalty = 25;
                            else if (targetPart === 'arm' || targetPart === 'leg') aimPenalty = 10;

                            const finalHitChance = ((baseAim - aimPenalty) * (weaponAccuracy / 100)) - target.attributes.dodge;
                            
                            if (Math.random() * 100 <= finalHitChance) {
                                let damage = ((equippedWeapon as any).damage || 5) + (actor.attributes.damage || 0);
                                let isCrit = false;
                                let partMsg = '';

                                // Body Part Effects
                                if (targetPart === 'head') { damage *= 2; partMsg = ' (HEADSHOT!)'; }
                                else if (targetPart === 'heart' && Math.random() * 100 <= (actor.attributes.critChance + 50)) { damage *= 1.5; isCrit = true; partMsg = ' (HEART SHOT!)'; }
                                else if (targetPart === 'arm' && Math.random() < 0.3) {
                                    const targetWeapons = target.skills.filter(s => (s as any).damage !== undefined);
                                    if (targetWeapons.length > 0) {
                                        const w = targetWeapons[Math.floor(Math.random() * targetWeapons.length)];
                                        if (!target.disarmed) target.disarmed = [];
                                        if (!target.disarmed.includes(w.id)) {
                                            target.disarmed.push(w.id);
                                            partMsg = ` (DISARMED ${w.name}!)`;
                                        }
                                    }
                                } else if (targetPart === 'leg') {
                                    target.attributes.speed = Math.max(0, (target.attributes.speed || 100) - 20);
                                    partMsg = ' (LEG SHOT!)';
                                }

                                if (!isCrit && Math.random() * 100 <= actor.attributes.critChance) { damage *= 1.5; isCrit = true; }
                                
                                damage = Math.max(1, Math.floor(damage - target.attributes.armor));
                                target.attributes.hp = Math.max(0, target.attributes.hp - damage);
                                if (target.attributes.hp === 0) target.isDead = true;

                                log.push({
                                    time, actorId: actor.id, actorName: actor.name, targetId: target.id, targetName: target.name,
                                    action: 'attack', damage, isCrit, message: `${actor.name} hits ${target.name} for ${damage}${partMsg}`
                                });
                            } else {
                                log.push({
                                    time, actorId: actor.id, actorName: actor.name, targetId: target.id, targetName: target.name,
                                    action: 'attack', isMiss: true, message: `${actor.name} misses ${target.name}`
                                });
                            }
                        }
                        const baseRecovery = (equippedWeapon as any).recovery || 10;
                        actor.recoveryTime = Math.max(0, Math.max(10, (baseRecovery * 10) - (actor.attributes.recoveryMod || 0) * 10));
                        
                        actionTaken = true;
                    }
                }

                // 1.5 Use Equipment (Grenades)
                if (!actionTaken) {
                    // Fix: JSON.parse/stringify destroys class prototypes, so instanceof Equipment fails.
                    // Use duck typing: Equipment has 'limit' property.
                    const equipment = actor.skills.filter(s => (s as any).limit !== undefined && (s as any).limit > 0);
                    if (equipment.length > 0) {
                        // Prioritize grenades if enemies are clustered or just random chance?
                        // Let's say 30% chance to use grenade if available and in range
                        if (Math.random() < 0.3) {
                            const grenade = equipment[0]; // Use first available
                            const range = 400; // Grenade throw range
                            
                            if (dist <= range) {
                                // THROW GRENADE
                                (grenade as any).limit--;
                                
                                // Area Effect
                                const blastRadius = 100;
                                const affected = livingEnemies.filter(e => getDistance(e.position, target.position) <= blastRadius);
                                
                                let msg = `${actor.name} throws ${grenade.name}!`;
                                
                                if (grenade.id === 'frag_grenade' || grenade.id === 'pink_grenade') {
                                    affected.forEach(e => {
                                        const dmg = 20;
                                        e.attributes.hp = Math.max(0, e.attributes.hp - dmg);
                                        if (e.attributes.hp === 0) e.isDead = true;
                                    });
                                    msg += ` Hit ${affected.length} enemies for 20 dmg.`;
                                } else if (grenade.id === 'flashbang') {
                                    affected.forEach(e => {
                                        e.attributes.initiative = Math.max(0, e.attributes.initiative - 10);
                                        e.attributes.aim = Math.max(0, e.attributes.aim - 20);
                                    });
                                    msg += ` Blinded ${affected.length} enemies.`;
                                } else if (grenade.id === 'healing_grenade') {
                                    // Should target allies actually
                                    // const allies = (actor.team === 'A' ? deployedA : deployedB).filter(t => !t.isDead && Math.abs((t.position || 0) - (actor.position || 0)) <= blastRadius); 
                                }

                                log.push({
                                    time, actorId: actor.id, actorName: actor.name, targetId: target.id, targetName: target.name,
                                    action: 'use_equipment', message: msg, targetPosition: target.position
                                });
                                actor.recoveryTime = 200; // Grenades take time
                                actionTaken = true;
                            }
                        }
                    }
                }

                // 2. Switch Weapon (if current is empty/jammed/out of range AND another is better)
                if (!actionTaken) {
                    const availableWeapons = actor.skills.filter(s => (s as any).damage !== undefined && isUsable(s as Weapon)) as Weapon[];
                    // Find a weapon that has ammo and is in range
                    const betterWeapon = availableWeapons.find(w => {
                        if (w.id === equippedWeapon?.id && (actor.ammo?.[w.id] || 0) <= 0) return false; // Skip current if empty
                        const range = ((w as any).range || 1) * 100;
                        return dist <= range && (actor.ammo?.[w.id] || 0) > 0;
                    });

                    if (betterWeapon && betterWeapon.id !== equippedWeapon?.id) {
                        actor.currentWeaponId = betterWeapon.id;
                        const hasJuggler = actor.skills.some(s => s.id === 'juggler');
                        
                        log.push({
                            time, actorId: actor.id, actorName: actor.name, action: 'switch_weapon',
                            message: `${actor.name} switches to ${betterWeapon.name}.${hasJuggler ? ' (Juggler)' : ''}`
                        });
                        
                        if (!hasJuggler) {
                            actor.recoveryTime = 100; // Switching takes time
                            actionTaken = true;
                        }
                        // If Juggler, actionTaken remains false, allowing attack in same turn
                    }
                }

                // 3. Reload (if current weapon empty but has capacity)
                if (!actionTaken && equippedWeapon && isUsable(equippedWeapon)) {
                    const currentAmmo = actor.ammo?.[equippedWeapon.id] || 0;
                    const capacity = (equippedWeapon as any).capacity || 1;
                    if (currentAmmo <= 0) {
                        actor.ammo![equippedWeapon.id] = capacity + (actor.attributes.reloadBonus || 0);
                        log.push({
                            time, actorId: actor.id, actorName: actor.name, action: 'reload',
                            message: `${actor.name} reloads ${equippedWeapon.name}.`
                        });
                        actor.recoveryTime = 100;
                        actionTaken = true;
                    }
                }

                // 4. Melee (if no ammo/cornered/no weapon)
                if (!actionTaken && dist <= 50) { // Melee range
                    // Kick or Fists
                    const damage = 5 + (actor.attributes.damage || 0);
                    target.attributes.hp = Math.max(0, target.attributes.hp - damage);
                    if (target.attributes.hp === 0) target.isDead = true;
                    
                    log.push({
                        time, actorId: actor.id, actorName: actor.name, targetId: target.id, targetName: target.name,
                        action: 'attack', damage, message: `${actor.name} hits ${target.name} with Fists for ${damage}`
                    });
                    actor.recoveryTime = 100; // Increased from 50
                    actionTaken = true;
                }

                // 5. Move (if nothing else)
                if (!actionTaken) {
                    const moveSpeed = (actor.attributes.speed || 100) / 2;
                    
                    // Vector movement
                    const dx = (target.position?.x || 0) - (actor.position?.x || 0);
                    const dy = (target.position?.y || 0) - (actor.position?.y || 0);
                    const length = Math.sqrt(dx * dx + dy * dy);
                    
                    if (length > 0) {
                        const moveX = (dx / length) * moveSpeed;
                        const moveY = (dy / length) * moveSpeed;
                        
                        actor.position = {
                            x: Math.max(0, Math.min(1000, (actor.position?.x || 0) + moveX)),
                            y: Math.max(0, Math.min(400, (actor.position?.y || 0) + moveY))
                        };
                    }

                    log.push({
                        time, actorId: actor.id, actorName: actor.name, action: 'move', targetPosition: actor.position,
                        message: `${actor.name} moves towards ${target.name}.`
                    });
                    actor.recoveryTime = 50; // Increased from 20
                    actionTaken = true;
                }

                // Skill Turn End Hooks (e.g. Trigger Happy)
                skillManager.executeOnTurnEnd(actor, context);
            }
        }

        // Cleanup Dead
        for (let i = deployedA.length - 1; i >= 0; i--) {
            if (deployedA[i].isDead) deployedA.splice(i, 1);
        }
        for (let i = deployedB.length - 1; i >= 0; i--) {
            if (deployedB[i].isDead) deployedB.splice(i, 1);
        }

        // Reinforcements
        deploy(reserveA, deployedA, limitA, log, time, 'A');
        deploy(reserveB, deployedB, limitB, log, time, 'B');
    }

    const survivorsA = [...deployedA, ...reserveA].filter(t => !t.isDead);
    const survivorsB = [...deployedB, ...reserveB].filter(t => !t.isDead);
    
    const winner = survivorsA.length > 0 ? 'A' : (survivorsB.length > 0 ? 'B' : 'Draw');

    return {
        winner,
        log,
        survivorsA,
        survivorsB
    };
}
