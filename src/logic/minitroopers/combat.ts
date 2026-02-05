import type { TrooperData, BattleResult, BattleLogEntry, BodyPart } from './types';
import { Trooper, Soldier, Sniper, Doctor, Pilot, Commando, Scout, Spy, Saboteur, CommsOfficer, Rat } from './classes/Trooper';

import { getDeploymentLimit, getDeploymentCost } from './deployment';
import { getSabotage } from './stats';
import { Weapon, Grenade, Shotgun, AssaultRifle, Handgun, SniperRifle, MachineGun, Launcher, Melee } from './classes/Skill';
import { skillManager, type BattleContext } from './systems/SkillSystem';
import { registerCoreSkills } from './skills/implementations';
import { getDistance } from './utils';
import { SKILLS as ALL_SKILLS } from './skills';

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

// --- Power Calculation ---


// Power Calculation delegated to Trooper class

export const calculateSquadPower = (squad: Trooper[]): number => {
    return squad.reduce((total, t) => total + t.getPower(), 0);
};

export function simulateBattle(teamA: Trooper[], teamB: Trooper[]): BattleResult {
    // Deep copy to avoid mutating original state during simulation
    // Use clone() instead of JSON.parse logic if possible, but input is Trooper[]. 
    // If input is generic TrooperData, we need to instantiate.
    // Assuming input is already Trooper instances? 
    // Or we should convert them here.
    // For now, let's assume they are instances or we instantiate them.
    // To be safe with the Refactor, let's assume simulateBattle receives instances.
    const reserveA = teamA.map(t => t.clone());
    const reserveB = teamB.map(t => t.clone());

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
    // Deploy initial troops
    const limitA = getDeploymentLimit(teamA);
    const limitB = getDeploymentLimit(teamB);

    // Initial Deployment Helper
    const deploy = (reserve: Trooper[], deployed: Trooper[], limit: number, log: BattleLogEntry[], time: number, team: 'A' | 'B') => {
        let currentCost = deployed.filter(t => !t.isDead).reduce((sum, t) => sum + getDeploymentCost(t), 0);

        while (reserve.length > 0) {
            const nextTrooper = reserve[0];
            const cost = getDeploymentCost(nextTrooper);

            if (currentCost + cost <= limit) {
                const trooper = reserve.shift()!;
                // Initialize Combat State
                // Spy Deployment Logic
                const isSpy = trooper.skills.some(s => s.id === 'spy');
                const isTeamA = (team === 'A');
                const deployOnA = isSpy ? !isTeamA : isTeamA;

                // Respect existing position if set (for tests/scenarios)
                if (!trooper.position) {
                    trooper.position = {
                        x: deployOnA ? Math.floor(Math.random() * 200) : 800 + Math.floor(Math.random() * 200),
                        y: 50 + Math.floor(Math.random() * 300) // 50-350 Y range
                    };
                    console.log(`[DEPLOY] ${trooper.name} (Team ${team}) randomized to ${trooper.position.x}, ${trooper.position.y}`);
                } else {
                    console.log(`[DEPLOY] ${trooper.name} (Team ${team}) kept existing position ${trooper.position.x}, ${trooper.position.y}`);
                }
                
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
                    targetPosition: { ...trooper.position }, // Clone to avoid mutation by ref
                    data: { 
                        attributes: { ...trooper.attributes },
                        maxHp: trooper.attributes.maxHp, // Explicitly separate for easy access
                        hp: trooper.attributes.hp
                    }
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
        // console.log(`[DEBUG] Time: ${time}, A: ${deployedA.length}, B: ${deployedB.length}`);

        // Reinforcements (Fill slots if available)
        deploy(reserveA, deployedA, limitA, log, time, 'A');
        deploy(reserveB, deployedB, limitB, log, time, 'B');

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
            jammedWeapons,
            resolveWeaponShot,
            applyDamage
        };

        // Tick Loop
        for (const actor of allTroopers) {
            // console.log(`[DEBUG] Actor: ${actor.name} (${actor.class}) Rec:${actor.recoveryTime} Timer:${actor.actionTimer} Dead:${actor.isDead}`);
            if (actor.isDead) continue;

            // Recovery Check
            // Recovery Check
            if (actor.recoveryTime && actor.recoveryTime > 0) {
                actor.recoveryTime--;
                continue;
            }

            // --- BURST FIRE HANDLING ---
            if (actor.burstState) {
                const burst = actor.burstState!;
                // Validate Target
                const targetId = burst.targetId;
                const target = context.allTroopers.find(t => t.id === targetId);
                const weaponId = burst.weaponId;
                const weapon = actor.skills.find(s => s.id === weaponId) as Weapon | undefined;

                if (target && !target.isDead && weapon && (actor.ammo?.[weaponId] || 0) > 0) {
                    // Fire Shot
                    resolveWeaponShot(actor, target, weapon, context);
                    actor.ammo![weaponId]--;
                    
                    burst.shotsRemaining--;
                    
                    if (burst.shotsRemaining > 0 && (actor.ammo?.[weaponId] || 0) > 0 && !target.isDead) {
                        // Continue Burst
                         actor.recoveryTime = 4; // 4 ticks between shots (~40ms?)
                    } else {
                        // End Burst
                        delete actor.burstState;
                        const baseRecovery = (weapon as any).recovery || 10;
                        actor.recoveryTime = Math.max(0, Math.max(10, baseRecovery - (actor.attributes.recoveryMod || 0) * 10));
                    }
                } else {
                    // Burst Interrupted (Target dead, no ammo, etc)
                    delete actor.burstState;
                     const baseRecovery = (weapon && (weapon as any).recovery) || 10;
                    actor.recoveryTime = Math.max(0, Math.max(10, baseRecovery - (actor.attributes.recoveryMod || 0) * 10));
                }
                continue; // Skip normal action decision this tick
            }

            // Action Timer Accumulation (Only if fully recovered)
            // Base speed 100. Initiative adds bonus.
            const speed = (actor.attributes.speed || 100) + (actor.attributes.initiative || 0);
            actor.actionTimer = (actor.actionTimer || 0) + speed;

            // Action Threshold
            if (actor.actionTimer >= 1000) {
                actor.actionTimer -= 1000; // Consume timer

                // Execute Turn Logic
                const actionTaken = actor.playTurn(context);

                if (actionTaken) {
                    // Timer was consumed by action logic or reset
                }

                // Skill Turn End Hooks
                skillManager.executeOnTurnEnd(actor, context);
            }
            // Victory Check inside loop to prevent Overkill
            const aliveA = context.deployedA.filter(t => !t.isDead).length + context.reserveA.length;
            const aliveB = context.deployedB.filter(t => !t.isDead).length + context.reserveB.length;
            
            if (aliveA === 0 || aliveB === 0) {
                 // Battle Over
                 break; 
            }
        } // End of for loop

        // Cleanup Dead
        for (let i = deployedA.length - 1; i >= 0; i--) {
            if (deployedA[i].isDead) deployedA.splice(i, 1);
        }
        for (let i = deployedB.length - 1; i >= 0; i--) {
            if (deployedB[i].isDead) deployedB.splice(i, 1);
        }

        // Reinforcements
        if (deployedA.length === 0 && reserveA.length > 0) {
            deploy(reserveA, deployedA, limitA, log, time, 'A');
        }
        if (deployedB.length === 0 && reserveB.length > 0) {
            deploy(reserveB, deployedB, limitB, log, time, 'B');
        }
    } // End of while loop

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


// --- Hit Location Helper ---
const getHitLocation = (aimPenalty: number): BodyPart => {
    const roll = Math.random() * 100;
    // Simple table based on doc? Doc says "Probability for zones".
    // Let's infer probabilities. Head is hard, Torso easy.
    // Standard Spread:
    // Head: 10%
    // Torso: 50%
    // Arm: 20%
    // Leg: 20%
    
    // Targeted shots (Head/Heart) modify this, but for now let's use a base table.
    // If strict aiming (aimPenalty > 0), maybe increase head chance?
    
    if (roll < 10) return 'head';
    if (roll < 60) return 'torso';
    if (roll < 80) return 'arm'; // Split Left/Right later or just generic 'arm'
    return 'leg';
};

const applyWound = (trooper: Trooper, location: BodyPart, log: BattleLogEntry[], time: number) => {
    if (!trooper.wounds) trooper.wounds = { head: false, chest: false, leftArm: false, rightArm: false, leftLeg: false, rightLeg: false };
    
    let partName = '';
    switch (location) {
        case 'head':
            trooper.wounds.head = true;
            partName = 'Head';
            break;
        case 'torso':
            trooper.wounds.chest = true;
            partName = 'Torso';
            break;
        case 'arm':
            // Randomly pick left or right
            if (Math.random() > 0.5) {
                trooper.wounds.rightArm = true;
                partName = 'Right Arm';
                // Disarm
                if (trooper.currentWeaponId) {
                     if (!trooper.disarmed) trooper.disarmed = [];
                     trooper.disarmed.push(trooper.currentWeaponId);
                     log.push({ time, actorId: trooper.id, actorName: trooper.name, action: 'knockback', message: `${trooper.name} drops their weapon!` });
                }
            } else {
                trooper.wounds.leftArm = true;
                partName = 'Left Arm';
            }
            break;
        case 'leg':
             if (Math.random() > 0.5) {
                trooper.wounds.rightLeg = true;
                partName = 'Right Leg';
            } else {
                trooper.wounds.leftLeg = true;
                partName = 'Left Leg';
            }
            // Cripple handled in speed calc
            break;
    }
};

export const applyDamage = (target: Trooper, damage: number, context: BattleContext, source?: Trooper) => {
    // Vehicle Damage Absorption
    if (target.vehicle) {
        const vehicle = target.vehicle;
        // Vehicle armor reduces damage?
        const dmg = Math.max(1, damage - (vehicle.armor || 0)); // Minimum 1 damage if hit? Or 0?
        // Wiki: Vehicles have their own armor.
        
        vehicle.hp -= dmg;
        
        // Log removed here to prevent duplication with resolveWeaponShot. Caller must log attack.

        if (vehicle.hp <= 0) {
            // Ejection
            target.vehicle = undefined;
            context.log.push({
                time: context.time,
                actorId: target.id,
                actorName: target.name,
                action: 'eject',
                message: `${target.name} is ejected from the destroyed ${vehicle.name}!`
            });
            // Ejection damage? 
            // Maybe stunned?
        }
        return; // Trooper takes NO damage if in vehicle (unless penetrating?)
    }

    // Standard Trooper Damage
    const armor = target.attributes.armor || 0;
    const finalDamage = Math.max(1, damage - armor); // Minimum 1 damage logic? Or 0?
    // Let's assume standard armor reduction.
    
    target.attributes.hp = Math.max(0, target.attributes.hp - finalDamage);
    
    // Log handled by caller usually? No, let's log "Damage Taken" here if generic?
    // But attackers log "Attack". 
    // If we duplicate logs, it's noisy.
    // Usually 'resolveWeaponShot' logs the Attack/Damage.
    // But if 'applyDamage' is called by Grenades, they log their own thing.
    // We should just apply the value.
    // BUT vehicle logic MUST log.
    
    if (target.attributes.hp === 0 && !target.isDead) {
        target.isDead = true;
        context.log.push({
            time: context.time,
            actorId: target.id,
            actorName: target.name,
            action: 'wait',
            message: `${target.name} dies!`
        });
    }
};

export function resolveWeaponShot(actor: Trooper, target: Trooper, weapon: Weapon | Grenade, context: BattleContext) {
    const { log, allTroopers, time, applyDamage } = context;

    const vX = (target.position?.x || 0) - (actor.position?.x || 0);
    const vY = (target.position?.y || 0) - (actor.position?.y || 0);
    const distToTarget = Math.sqrt(vX * vX + vY * vY);
    const dirX = distToTarget > 0 ? vX / distToTarget : 0;
    const dirY = distToTarget > 0 ? vY / distToTarget : 0;

    const weaponAccuracy = (weapon as any).aim || 100;
    const baseAim = actor.attributes.aim;
    let aimPenalty = 0;
    const targetPart = actor.tactics?.targetPart || 'any';
    
    // Penalties for aiming at specific parts
    if (targetPart === 'head' || targetPart === 'heart') aimPenalty = 25;
    else if (targetPart === 'arm' || targetPart === 'leg') aimPenalty = 10;
    
    // Min Range Penalty (Sniper)
    if ((weapon as any).rangeMin && distToTarget < ((weapon as any).rangeMin * 100)) {
        aimPenalty += 50; // Huge penalty for sniping close up
    }
    
    // Helicopter Melee Immunity
    if (target.vehicle && target.vehicle.type === 'helicopter' && ((weapon as any).range || 1) <= 1) {
        log.push({ time, actorId: actor.id, actorName: actor.name, action: 'attack', isMiss: true, message: `${actor.name} cannot reach the Helicopter!` });
        return;
    }

    let dodge = target.attributes.dodge || 0;
    if (target.isMoving && target.skills.some(s => s.id === 'zigzag')) {
        dodge += 25; // Zigzag bonus
    }

    const finalHitChance = ((baseAim - aimPenalty) * (weaponAccuracy / 100)) - dodge;
    
    // BALLISTICS SIMULATION
    let actualTarget = target;
    let obstruction: Trooper | null = null;
    let isObstructionHit = false;

    const potentialObstacles = allTroopers.filter(a => a.id !== actor.id && !a.isDead);
    let minObstacleDist = distToTarget;

    for (const obs of potentialObstacles) {
        if (obs.id === target.id) continue;

        const ox = (obs.position?.x || 0) - (actor.position?.x || 0);
        const oy = (obs.position?.y || 0) - (actor.position?.y || 0);
        const oDot = ox * dirX + oy * dirY;

        if (oDot > 0 && oDot < minObstacleDist) { // Before target
            const oPerpX = ox - oDot * dirX;
            const oPerpY = oy - oDot * dirY;
            const oDistFromLine = Math.sqrt(oPerpX * oPerpX + oPerpY * oPerpY);

            if (oDistFromLine < 20) { // Hitbox
                minObstacleDist = oDot;
                obstruction = obs;
            }
        }
    }

    if (obstruction) {
        actualTarget = obstruction;
        isObstructionHit = true;
    }

    const roll = Math.random() * 100;
    let isHit = roll <= finalHitChance;
    if (isObstructionHit) isHit = true; // Obstructions always hit if in line? Or maybe check their dodge? Assume hit for now.
    
    // Auto-Crit calculation
    let critChance = ((weapon as any).crit || 0) + (actor.attributes.critChance || 0);
    const isCrit = Math.random() * 100 <= critChance;

    const weaponArea = (weapon as any).area || 0;
    const weaponStun = (weapon as any).stun || 0;

    if (weaponArea > 0) {
        // --- AOE EXPLOSION LOGIC ---
        let impactX = actualTarget.position!.x;
        let impactY = actualTarget.position!.y;
        const blastRadius = weaponArea;

        if (isHit) {
            // Direct Hit Logic within AoE
             // ... (Reuse logic but add vehicle/location check if needed, though AoE usually hits Body/Hull)
            let minDamage = ((weapon as any).damage || 5);
            let maxDamage = ((weapon as any).maxDamage || minDamage);
            let damage = Math.floor(minDamage + Math.random() * (maxDamage - minDamage + 1));
            damage += (actor.attributes.damage || 0);
            if (isCrit) damage *= 1.5;
            
            // Log attack
            log.push({
                time, actorId: actor.id, actorName: actor.name, targetId: actualTarget.id, targetName: actualTarget.name,
                action: 'attack', damage, isCrit, message: `${actor.name} hits ${actualTarget.name} with explosion for ${damage}`,
                data: { weaponId: weapon.id }
            });

            // Apply Damage (Handles Vehicles & Armor)
            applyDamage!(actualTarget, damage, context, actor);

        } else {
            // Miss Logic
            const missDistance = 50 + Math.random() * 150;
            const missAngle = Math.atan2(dirY, dirX) + (Math.random() - 0.5);
            impactX = actualTarget.position!.x + Math.cos(missAngle) * missDistance;
            impactY = actualTarget.position!.y + Math.sin(missAngle) * missDistance;
            
             log.push({
                time, actorId: actor.id, actorName: actor.name,
                action: 'attack', isMiss: true, message: `${actor.name} misses! Shot lands nearby.`,
                targetPosition: { x: impactX, y: impactY },
                data: { weaponId: weapon.id }
            });
        }

        // Splash Damage
        const affectedUnits = allTroopers.filter(t => !t.isDead && t.id !== actor.id);
        affectedUnits.forEach(unit => {
            const distToImpact = Math.sqrt(Math.pow((unit.position!.x) - impactX, 2) + Math.pow((unit.position!.y) - impactY, 2));
            if (distToImpact <= blastRadius) {
                 if (unit.id === actualTarget.id && isHit) return; // Already processed direct hit

                let splashDamage = ((weapon as any).damage || 5) + (actor.attributes.damage || 0);
                const falloff = 0.5 + 0.5 * (1 - (distToImpact / blastRadius));
                splashDamage = Math.floor(splashDamage * falloff);
                
                if (splashDamage !== 0) {
                     // Healing Grenade Check (Custom Logic)
                    if (weapon instanceof Grenade && weapon.effect === 'healing') {
                        // Healing handled outside applyDamage usually? Or negative damage?
                        // If applyDamage doesn't handle neg damage as heal, we do it here.
                         unit.attributes.hp = Math.min(unit.attributes.maxHp, unit.attributes.hp + 5); 
                         // Logging for heal needed?
                    } else {
                        applyDamage!(unit, splashDamage, context, actor);
                    }
                }
            } // End dist check

             if (weaponStun > 0) {
                 // Knockback logic
                 const distToImpact = Math.sqrt(Math.pow((unit.position!.x) - impactX, 2) + Math.pow((unit.position!.y) - impactY, 2));
                 if (distToImpact <= blastRadius) {
                    const pushFactor = (1 - (distToImpact/blastRadius));
                    const force = weaponStun * pushFactor;
                    const angle = Math.atan2(unit.position!.y - impactY, unit.position!.x - impactX);
                    unit.position!.x += Math.cos(angle) * force;
                    unit.position!.y += Math.sin(angle) * force;
                 }
            }
 
            // Grenade Effects
            if (weapon instanceof Grenade && weapon.effect) {
                     const g = weapon as Grenade;
                     if (!unit.status) unit.status = {};
                     
                     if (g.effect === 'flash') unit.status['blind'] = 1000;
                     if (g.effect === 'gas') unit.status['poison'] = 2000;
                     if (g.effect === 'glue') unit.attributes.initiative = Math.max(1, unit.attributes.initiative - 200);
                     if (g.effect === 'shock') {
                         if (unit.currentWeaponId) {
                             if (!unit.disarmed) unit.disarmed = [];
                             unit.disarmed.push(unit.currentWeaponId);
                             log.push({ time, actorId: actor.id, actorName: actor.name, action: 'jam_weapon', message: `${unit.name} drops their weapon!` });
                         }
                     }
                     if (g.effect === 'clown') {
                         // Just visual for now
                     }
                }
            }); // End forEach

    } else {
        // --- STANDARD SHOT ---
        if (isHit) {
            // 1. Determine Hit Location
            const hitLocation = getHitLocation(aimPenalty);
            
            // 2. Calculate Modifiers
            let locMult = 1.0;
            switch(hitLocation) {
                case 'head': locMult = 2.0; break;
                // Torso/Arms/Legs = 1.0 base
            }
            
            // Wound Bonus
            let isWoundedPart = false;
            if (target.wounds) {
                if (hitLocation === 'head' && target.wounds.head) isWoundedPart = true;
                if (hitLocation === 'torso' && target.wounds.chest) isWoundedPart = true;
                if (hitLocation === 'arm' && (target.wounds.leftArm || target.wounds.rightArm)) isWoundedPart = true;
                if (hitLocation === 'leg' && (target.wounds.leftLeg || target.wounds.rightLeg)) isWoundedPart = true;
            }

            if (isWoundedPart) {
                locMult += 1.0; // +100% if hitting wounded area (Doc says +100 or +200)
            }
            
            let minDamage = ((weapon as any).damage || 5);
            let maxDamage = ((weapon as any).maxDamage || minDamage);
            let damage = Math.floor(minDamage + Math.random() * (maxDamage - minDamage + 1));
            damage += (actor.attributes.damage || 0);
            
            // Crit Multiplier
            let critMult = 1.0;
            if (isCrit) {
                critMult = 2.0; 
                if (weapon.id === 'ump' && hitLocation === 'head') critMult = 20.0; // Killshot crit
                if (weapon.id === 'sparrowhawk') critMult = 50.0;
            }
            
            const finalDamage = Math.floor(damage * critMult * locMult);
            
            // Calculate ACTUAL damage for log (to match applyDamage reduction)
            let actualDamage = finalDamage;
            if (actualTarget.vehicle) {
                 actualDamage = Math.max(1, finalDamage - (actualTarget.vehicle.armor || 0));
            } else {
                 actualDamage = Math.max(1, finalDamage - (actualTarget.attributes.armor || 0));
            }

            // Log Attack (Detailed)
            log.push({
                time, actorId: actor.id, actorName: actor.name, targetId: actualTarget.id, targetName: actualTarget.name,
                action: 'attack', damage: actualDamage, isCrit, hitLocation, 
                message: `${actor.name} hits ${actualTarget.name} in ${hitLocation} for ${actualDamage}${isCrit ? ' (CRIT!)' : ''}`,
                isVehicleHit: !!actualTarget.vehicle,
                data: { weaponId: weapon.id }
            });

            // Apply Damage
            applyDamage!(actualTarget, finalDamage, context, actor);
            
            // Apply Wound/Debuff (Infantry Only?)
            if (!actualTarget.vehicle) {
                 applyWound(actualTarget, hitLocation, log, time);
            }
            
            // Stun/Knockback (Shotguns & Grenades & Weapons)
            if (weaponStun > 0) {
                 // Knockback (Directional from actor)
                const angle = Math.atan2(actualTarget.position!.y - actor.position!.y, actualTarget.position!.x - actor.position!.x);
                actualTarget.position!.x += Math.cos(angle) * weaponStun;
                actualTarget.position!.y += Math.sin(angle) * weaponStun;
                
                // Add Recovery
                actualTarget.recoveryTime = (actualTarget.recoveryTime || 0) + 100;
                log.push({ 
                    time, actorId: actor.id, actorName: actor.name, 
                    targetId: actualTarget.id, targetName: actualTarget.name,
                    action: 'knockback', 
                    message: `${actualTarget.name} is knocked down!`,
                    targetPosition: { x: actualTarget.position!.x, y: actualTarget.position!.y }
                });
            }
            
            // Grenade Effects (Single Target)
            if (weapon instanceof Grenade && weapon.effect) {
                     const g = weapon as Grenade;
                     const unit = actualTarget; // Alias for consistency
                     if (!unit.status) unit.status = {};
                     
                     if (g.effect === 'flash') unit.status['blind'] = 1000;
                     if (g.effect === 'gas') unit.status['poison'] = 2000;
                     if (g.effect === 'glue') unit.attributes.initiative = Math.max(1, unit.attributes.initiative - 200);
                     if (g.effect === 'shock') {
                         if (unit.currentWeaponId) {
                             if (!unit.disarmed) unit.disarmed = [];
                             unit.disarmed.push(unit.currentWeaponId);
                             log.push({ time, actorId: actor.id, actorName: actor.name, action: 'jam_weapon', message: `${unit.name} drops their weapon!` });
                         }
                     }
                     if (g.effect === 'clown') {
                         // Visualization
                     }
                }

                // --- BULLET PENETRATION ---
                const weaponPenetration = (weapon as any).penetration || 0;
                if (weaponPenetration > 0 && !actualTarget.isDead) {
                    // Find enemies BEHIND the actualTarget in the line of fire
                    const penetrationTargets: Trooper[] = [];
                    const actorPos = actor.position || { x: 0, y: 0 };
                    const targetPos = actualTarget.position || { x: 0, y: 0 };
                    
                    allTroopers
                        .filter(t => t.id !== actor.id && t.id !== actualTarget.id && !t.isDead && t.team !== actor.team)
                        .forEach(candidate => {
                            const candPos = candidate.position || { x: 0, y: 0 };
                            // Check if candidate is beyond target in same direction
                            const candDist = Math.sqrt(Math.pow(candPos.x - actorPos.x, 2) + Math.pow(candPos.y - actorPos.y, 2));
                            const targetDist = Math.sqrt(Math.pow(targetPos.x - actorPos.x, 2) + Math.pow(targetPos.y - actorPos.y, 2));
                            
                            if (candDist > targetDist) {
                                // Check if in firing line (perpendicular distance < 30px)
                                const dx = candPos.x - actorPos.x;
                                const dy = candPos.y - actorPos.y;
                                const dot = dx * dirX + dy * dirY;
                                const perpX = candPos.x - (actorPos.x + dirX * dot);
                                const perpY = candPos.y - (actorPos.y + dirY * dot);
                                const perpDist = Math.sqrt(perpX * perpX + perpY * perpY);
                                
                                if (perpDist < 30) {
                                    penetrationTargets.push(candidate);
                                }
                            }
                        });
                    
                    // Sort by distance (closest first)
                    penetrationTargets.sort((a, b) => {
                        const aDist = Math.sqrt(Math.pow((a.position?.x || 0) - actorPos.x, 2) + Math.pow((a.position?.y || 0) - actorPos.y, 2));
                        const bDist = Math.sqrt(Math.pow((b.position?.x || 0) - actorPos.x, 2) + Math.pow((b.position?.y || 0) - actorPos.y, 2));
                        return aDist - bDist;
                    });
                    
                    // Apply penetration damage (reduced by 50% per target)
                    let remainingPen = weaponPenetration;
                    let dmgMult = 0.5;
                    for (const penTarget of penetrationTargets) {
                        if (remainingPen <= 0) break;
                        
                        let penDamage = Math.floor(finalDamage * dmgMult);
                        penDamage = Math.max(1, penDamage - (penTarget.attributes.armor || 0));
                        
                        penTarget.attributes.hp = Math.max(0, penTarget.attributes.hp - penDamage);
                        if (penTarget.attributes.hp === 0) penTarget.isDead = true;
                        
                        log.push({
                            time, actorId: actor.id, actorName: actor.name, targetId: penTarget.id, targetName: penTarget.name,
                            action: 'attack', damage: penDamage, 
                            message: `Bullet penetrates! ${penTarget.name} hit for ${penDamage}`,
                            data: { weaponId: weapon.id }
                        });
                        
                        remainingPen--;
                        dmgMult *= 0.5;
                }
            }
        } else {
             // Miss
            const missX = (target.position?.x || 0) + dirX * 200;
            const missY = (target.position?.y || 0) + dirY * 200;
            log.push({
                time, actorId: actor.id, actorName: actor.name, targetId: target.id, targetName: target.name,
                action: 'attack', isMiss: true, message: `${actor.name} misses ${target.name}.`,
                targetPosition: { x: missX, y: missY },
                data: { weaponId: weapon.id }
            });
        }
    }
}
