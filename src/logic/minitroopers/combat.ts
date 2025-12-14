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

// --- Power Calculation ---

export const calculateTrooperPower = (trooper: Trooper): number => {
    let power = 0;
    // Base power from Level
    power += trooper.level * 10;

    // Stats
    power += trooper.attributes.maxHp / 2; // HP contribution
    power += trooper.attributes.damage * 2; // Damage contribution (rough)
    power += trooper.attributes.aim / 5;
    power += trooper.attributes.dodge;
    power += trooper.attributes.initiative / 2;

    // Skills
    power += trooper.skills.length * 5;

    // Specialization Bonus
    if (trooper.class !== 'Recruit') {
        power += 20;
    }

    return Math.floor(power);
};

export const calculateSquadPower = (squad: Trooper[]): number => {
    return squad.reduce((total, t) => total + calculateTrooperPower(t), 0);
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
        // console.log(`[DEBUG] Time: ${time}, A: ${deployedA.length}, B: ${deployedB.length}`);

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
            const speed = (actor.attributes.speed || 100) + actor.attributes.initiative;
            actor.actionTimer = (actor.actionTimer || 0) + speed;

            // Action Threshold
            if (actor.actionTimer >= 1000) {
                actor.actionTimer -= 1000; // Consume timer

                // Identify enemies
                const enemySquad = actor.team === 'A' ? deployedB : deployedA;
                const livingEnemies = enemySquad.filter(t => !t.isDead);

                if (livingEnemies.length === 0) {
                    break;
                }

                // 0. Skill Turn Start Hooks (e.g. Doctor Heal)
                if (skillManager.executeTurnStart(actor, context)) {
                    actor.recoveryTime = 50; // Small recovery for skill usage
                    continue;
                }

                // 1. Identify Target
                // Filter by Aggro (Bait skill)
                const aggroEnemies = livingEnemies.filter(e => (e.attributes.aggro || 0) > 0);
                const potentialTargets = aggroEnemies.length > 0 ? aggroEnemies : livingEnemies;

                const priority = actor.tactics?.priority || 'closest';

                let target: Trooper | null = null;

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

                if (!target) {
                    console.error("Critical: Target selection failed.");
                    break;
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

                // 0. AI SAFETY CHECK (Self-Injury Avoidance)
                if (equippedWeapon && (equippedWeapon as any).area > 0) {
                    const area = (equippedWeapon as any).area;
                    if (dist <= area * 1.2) { // 20% safety margin
                        // DANGER: Target is too close!
                        const safeWeapon = actor.skills.find(s =>
                            (s as any).damage &&
                            !(s as any).area &&
                            (actor.ammo?.[s.id] || 0) > 0 &&
                            !jammedWeapons.get(actor.id)?.includes(s.id) &&
                            !actor.disarmed?.includes(s.id)
                        );

                        if (safeWeapon) {
                            actor.currentWeaponId = safeWeapon.id;
                            equippedWeapon = safeWeapon as Weapon;
                            log.push({ time, actorId: actor.id, actorName: actor.name, action: 'switch_weapon', message: `${actor.name} switches weapon (Too close for explosives!).` });
                            actor.actionTimer += 200; // Small penalty
                            actionTaken = true; // Act next tick with new weapon
                        } else {
                            if (dist < 50) {
                                log.push({ time, actorId: actor.id, actorName: actor.name, action: 'attack', damage: 3, targetId: target.id, message: `${actor.name} punches ${target.name}!` });
                                target.attributes.hp -= 3; // Weak punch
                                actor.recoveryTime = 10;
                                actionTaken = true;
                            } else {
                                const escapeAngle = Math.atan2((actor.position!.y) - (target.position!.y), (actor.position!.x) - (target.position!.x)); // Away
                                const moveSpeed = (actor.attributes.speed || 100) / 10;
                                actor.position!.x += Math.cos(escapeAngle) * moveSpeed;
                                actor.position!.y += Math.sin(escapeAngle) * moveSpeed;
                                log.push({ time, actorId: actor.id, actorName: actor.name, action: 'move', targetPosition: { ...actor.position! }, message: `${actor.name} retreats to safe distance.` });
                                actor.recoveryTime = 10;
                                actionTaken = true;
                            }
                        }
                    }
                }

                // 1. Shoot (if in range and has ammo, and we didn't just bail)
                if (!actionTaken && equippedWeapon && isUsable(equippedWeapon)) {
                    const range = ((equippedWeapon as any).range || 1) * 100;
                    const ammo = actor.ammo?.[equippedWeapon.id] || 0;

                    if (dist <= range && ammo > 0) {
                        
                        // Check Line of Fire (Friendly Fire) - ONLY FOR FIRST SHOT DECISION
                        let lofBlocked = false; 
                        
                         const vX = (target!.position?.x || 0) - (actor.position?.x || 0);
                         const vY = (target!.position?.y || 0) - (actor.position?.y || 0);
                         const distToTarget = Math.sqrt(vX * vX + vY * vY);
                         const dirX = distToTarget > 0 ? vX / distToTarget : 0;
                         const dirY = distToTarget > 0 ? vY / distToTarget : 0;

                        if (distToTarget > 0) {
                             const friendlies = allTroopers.filter(a => a.team === actor.team && a.id !== actor.id && !a.isDead);
                             for (const friend of friendlies) {
                                 const fx = (friend.position?.x || 0) - (actor.position?.x || 0);
                                 const fy = (friend.position?.y || 0) - (actor.position?.y || 0);
                                 const fDot = fx * dirX + fy * dirY;

                                 if (fDot > 0 && fDot < distToTarget) { // Between shooter and target
                                     const fPerpX = fx - fDot * dirX;
                                     const fPerpY = fy - fDot * dirY;
                                     const fDistFromLine = Math.sqrt(fPerpX * fPerpX + fPerpY * fPerpY);
                                     if (fDistFromLine < 20) { // Hitbox check
                                         lofBlocked = true;
                                         break;
                                     }
                                 }
                             }
                        }

                        if (lofBlocked && Math.random() < 0.7) {
                             // Reposition Logic
                            const moveSpeed = (actor.attributes.speed || 100) / 10;
                            const moveDist = moveSpeed;
                            const angle = Math.atan2(vY, vX);
                            const strafeAngle = angle + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);
                            let newX = (actor.position?.x || 0) + Math.cos(strafeAngle) * moveDist;
                            let newY = (actor.position?.y || 0) + Math.sin(strafeAngle) * moveDist;

                            newX = Math.max(0, Math.min(1000, newX));
                            newY = Math.max(0, Math.min(400, newY));

                            actor.position = { x: newX, y: newY };
                            log.push({
                                time, actorId: actor.id, actorName: actor.name, action: 'move', targetPosition: actor.position,
                                message: `${actor.name} repositions to clear line of fire.`
                            });
                            actor.recoveryTime = 10;
                            actionTaken = true;
                        } else {
                            // EXECUTE ATTACK (First Shot)
                            const bursts = (equippedWeapon as any).bursts || 1;
                            
                            resolveWeaponShot(actor, target!, equippedWeapon!, context);
                            actor.ammo![equippedWeapon!.id]--;
                            
                            if (bursts > 1 && (actor.ammo![equippedWeapon!.id] || 0) > 0 && !target!.isDead) {
                                actor.burstState = {
                                    shotsRemaining: bursts - 1,
                                    targetId: target!.id,
                                    weaponId: equippedWeapon!.id
                                };
                                actor.recoveryTime = 4;
                            } else {
                                const baseRecovery = (equippedWeapon as any).recovery || 10;
                                actor.recoveryTime = Math.max(0, Math.max(10, baseRecovery - (actor.attributes.recoveryMod || 0) * 10));
                            }
                            actionTaken = true;
                        }
                    }
                }

                // 2. Switch Weapon
                if (!actionTaken) {
                    const availableWeapons = actor.skills.filter(s => (s as any).damage !== undefined && isUsable(s as Weapon)) as Weapon[];
                    const betterWeapon = availableWeapons.find(w => {
                        if (w.id === equippedWeapon?.id && (actor.ammo?.[w.id] || 0) <= 0) return false;
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
                            actor.recoveryTime = 20;
                            actionTaken = true;
                        }
                    }
                }

                // 3. Reload
                if (!actionTaken && equippedWeapon && isUsable(equippedWeapon)) {
                    const currentAmmo = actor.ammo?.[equippedWeapon.id] || 0;
                    const capacity = (equippedWeapon as any).capacity || 1;
                    if (currentAmmo < capacity && (currentAmmo <= 0 || dist > ((equippedWeapon as any).range || 1) * 100)) {
                        actor.ammo![equippedWeapon.id] = currentAmmo + 1;
                        log.push({
                            time, actorId: actor.id, actorName: actor.name, action: 'reload',
                            message: `${actor.name} reloads a shell.`
                        });
                        actor.recoveryTime = 10;
                        actionTaken = true;
                    }
                }

                // 4. Melee
                if (!actionTaken && dist <= 50) {
                    const damage = 5 + (actor.attributes.damage || 0);
                    target!.attributes.hp = Math.max(0, target!.attributes.hp - damage);
                    if (target!.attributes.hp === 0) target!.isDead = true;
                    log.push({
                        time, actorId: actor.id, actorName: actor.name, targetId: target!.id, targetName: target!.name,
                        action: 'attack', damage, message: `${actor.name} hits ${target!.name} with Fists for ${damage}`
                    });
                    actor.recoveryTime = 20;
                    actionTaken = true;
                }

                // 5. Move
                if (!actionTaken) {
                    const moveSpeed = (actor.attributes.speed || 100) / 2;
                    const dx = (target!.position?.x || 0) - (actor.position?.x || 0);
                    const dy = (target!.position?.y || 0) - (actor.position?.y || 0);
                    const length = Math.sqrt(dx * dx + dy * dy);

                    if (length > 0) {
                        const moveX = (dx / length) * moveSpeed;
                        const moveY = (dy / length) * moveSpeed;
                        actor.position = {
                            x: Math.max(0, Math.min(1000, (actor.position?.x || 0) + moveX)),
                            y: Math.max(0, Math.min(400, (actor.position?.y || 0) + moveY))
                        };
                        log.push({
                            time, actorId: actor.id, actorName: actor.name, action: 'move', targetPosition: actor.position,
                            message: `${actor.name} moves towards ${target!.name}.`
                        });
                        actor.recoveryTime = 10;
                        actionTaken = true;
                    } else {
                        // Jiggle
                        actor.position!.x = Math.max(0, Math.min(1000, actor.position!.x + (Math.random() - 0.5) * 20));
                        actionTaken = true;
                        actor.recoveryTime = 5;
                    }
                }

                // 6. Fallback
                if (!actionTaken) {
                    log.push({
                        time, actorId: actor.id, actorName: actor.name, action: 'wait',
                        message: `${actor.name} is hesitating...`
                    });
                    actor.recoveryTime = 10;
                    actionTaken = true;
                }

                // Skill Turn End Hooks
                skillManager.executeOnTurnEnd(actor, context);
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

function resolveWeaponShot(actor: Trooper, target: Trooper, weapon: Weapon, context: BattleContext) {
    const { log, allTroopers, time } = context;

    const vX = (target.position?.x || 0) - (actor.position?.x || 0);
    const vY = (target.position?.y || 0) - (actor.position?.y || 0);
    const distToTarget = Math.sqrt(vX * vX + vY * vY);
    const dirX = distToTarget > 0 ? vX / distToTarget : 0;
    const dirY = distToTarget > 0 ? vY / distToTarget : 0;

    const weaponAccuracy = (weapon as any).aim || 100;
    const baseAim = actor.attributes.aim;
    let aimPenalty = 0;
    const targetPart = actor.tactics?.targetPart || 'any';
    if (targetPart === 'head' || targetPart === 'heart') aimPenalty = 25;
    else if (targetPart === 'arm' || targetPart === 'leg') aimPenalty = 10;

    const finalHitChance = ((baseAim - aimPenalty) * (weaponAccuracy / 100)) - target.attributes.dodge;

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
    let isHit = roll <= finalHitChance; // Fixed hitChance variable name usage
    if (isObstructionHit) isHit = true;
    const isCrit = Math.random() * 100 <= ((weapon as any).crit || 0) + (actor.attributes.critChance || 0);

    const weaponArea = (weapon as any).area || 0;
    const weaponStun = (weapon as any).stun || 0;

    if (weaponArea > 0) {
        // --- AOE EXPLOSION LOGIC ---
        let impactX = actualTarget.position!.x;
        let impactY = actualTarget.position!.y;
        const blastRadius = weaponArea;

        if (isHit) {
            let primaryDamage = ((weapon as any).damage || 5) + (actor.attributes.damage || 0);
            if (isCrit) primaryDamage *= 1.5;
            primaryDamage = Math.max(1, Math.floor(primaryDamage - (actualTarget.attributes.armor || 0)));
            actualTarget.attributes.hp = Math.max(0, actualTarget.attributes.hp - primaryDamage);
            if (actualTarget.attributes.hp === 0) actualTarget.isDead = true;

            log.push({
                time, actorId: actor.id, actorName: actor.name, targetId: actualTarget.id, targetName: actualTarget.name,
                action: 'attack', damage: primaryDamage, isCrit, message: `${actor.name} hits ${actualTarget.name} with explosion for ${primaryDamage}`,
                data: { weaponId: weapon.id }
            });
        } else {
            // Miss Logic: Explode somewhere else
            const missDistance = 50 + Math.random() * 150;
            const missAngle = Math.atan2(dirY, dirX) + (Math.random() - 0.5);
            impactX = actualTarget.position!.x + Math.cos(missAngle) * missDistance;
            impactY = actualTarget.position!.y + Math.sin(missAngle) * missDistance;
            impactX = Math.max(0, Math.min(1000, impactX));
            impactY = Math.max(0, Math.min(400, impactY));

            log.push({
                time, actorId: actor.id, actorName: actor.name,
                action: 'attack', isMiss: true, message: `${actor.name} misses! Shot lands nearby.`,
                targetPosition: { x: impactX, y: impactY },
                data: { weaponId: weapon.id }
            });
        }

        // Area Damage & Knockback
        const affectedUnits = allTroopers.filter(t => !t.isDead && t.id !== actor.id);
        affectedUnits.forEach(unit => {
            const distToImpact = Math.sqrt(Math.pow((unit.position!.x) - impactX, 2) + Math.pow((unit.position!.y) - impactY, 2));
            if (distToImpact <= blastRadius) {
                const isPrimaryHit = (unit.id === actualTarget.id && isHit);
                if (!isPrimaryHit) {
                    let splashDamage = ((weapon as any).damage || 5) + (actor.attributes.damage || 0);
                    const falloff = 0.5 + 0.5 * (1 - (distToImpact / blastRadius));
                    splashDamage = Math.floor(splashDamage * falloff);
                    splashDamage = Math.max(0, splashDamage - (unit.attributes.armor || 0));

                    if (splashDamage > 0) {
                        unit.attributes.hp = Math.max(0, unit.attributes.hp - splashDamage);
                        if (unit.attributes.hp === 0) unit.isDead = true;
                        log.push({
                            time, actorId: actor.id, actorName: actor.name, targetId: unit.id, targetName: unit.name,
                            action: 'attack', damage: splashDamage, message: `${unit.name} caught in blast (${splashDamage} dmg).`
                        });
                    }
                }
                if (weaponStun > 0) {
                    const distFactor = distToImpact > 1 ? (1 - (distToImpact / blastRadius)) : 1;
                    const pushForce = weaponStun * distFactor;
                    let angle = (distToImpact > 1) ? Math.atan2((unit.position!.y) - impactY, (unit.position!.x) - impactX) : Math.random() * Math.PI * 2;
                    unit.position!.x = Math.max(0, Math.min(1000, unit.position!.x + Math.cos(angle) * pushForce));
                    unit.position!.y = Math.max(0, Math.min(400, unit.position!.y + Math.sin(angle) * pushForce));
                }
            }
        });

    } else {
        // Standard Single Target
        if (isHit) {
            let damage = ((weapon as any).damage || 5) + (actor.attributes.damage || 0);
            if (isCrit) damage *= 1.5;
            damage = Math.max(1, Math.floor(damage - (actualTarget.attributes.armor || 0)));
            actualTarget.attributes.hp = Math.max(0, actualTarget.attributes.hp - damage);
            if (actualTarget.attributes.hp === 0) actualTarget.isDead = true;
            log.push({
                time, actorId: actor.id, actorName: actor.name, targetId: actualTarget.id, targetName: actualTarget.name,
                action: 'attack', damage, isCrit, message: `${actor.name} hits ${actualTarget.name}${isObstructionHit ? ' (OBSTRUCTION)' : ''} for ${damage}`,
                data: { weaponId: weapon.id }
            });
        } else {
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
