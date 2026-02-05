import type { TrooperData, BattleContext, BattleLogEntry, BodyPart } from '../types';
import { Weapon, Grenade } from '../classes/Skill';

export class CombatSystem {

    private getHitLocation(aimPenalty: number): BodyPart {
        const roll = Math.random() * 100;
        if (roll < 10) return 'head';
        if (roll < 60) return 'torso';
        if (roll < 80) return 'arm'; 
        return 'leg';
    }

    private applyWound(trooper: TrooperData, location: BodyPart, log: BattleLogEntry[], time: number) {
        if (!trooper.wounds) trooper.wounds = { head: false, chest: false, leftArm: false, rightArm: false, leftLeg: false, rightLeg: false };
        
        switch (location) {
            case 'head':
                trooper.wounds.head = true;
                break;
            case 'torso':
                trooper.wounds.chest = true;
                break;
            case 'arm':
                if (Math.random() > 0.5) {
                    trooper.wounds.rightArm = true;
                    // Disarm
                    if (trooper.currentWeaponId) {
                         if (!trooper.disarmed) trooper.disarmed = [];
                         trooper.disarmed.push(trooper.currentWeaponId);
                         log.push({ time, actorId: trooper.id, actorName: trooper.name, action: 'knockback', message: `${trooper.name} drops their weapon!` });
                    }
                } else {
                    trooper.wounds.leftArm = true;
                }
                break;
            case 'leg':
                 if (Math.random() > 0.5) trooper.wounds.rightLeg = true;
                 else trooper.wounds.leftLeg = true;
                break;
        }
    }

    public applyDamage(target: TrooperData, damage: number, context: BattleContext, source?: TrooperData) {
        // Vehicle Damage Absorption
        if (target.vehicle) {
            const vehicle = target.vehicle;
            const dmg = Math.max(1, damage - (vehicle.armor || 0)); 
            
            vehicle.hp -= dmg;
            
            if (vehicle.hp <= 0) {
                // Ejection
                const vName = vehicle.name; // Capture before clearing
                target.vehicle = undefined;
                context.log.push({
                    time: context.time,
                    actorId: target.id,
                    actorName: target.name,
                    action: 'eject',
                    message: `${target.name} is ejected from the destroyed ${vName}!`
                });
            }
            return; 
        }
    
        // Standard Trooper Damage
        const armor = target.attributes.armor || 0;
        const finalDamage = Math.max(1, damage - armor); 
        
        target.attributes.hp = Math.max(0, target.attributes.hp - finalDamage);
        
        if (target.attributes.hp === 0 && !target.isDead) {
            target.isDead = true;
            context.log.push({
                time: context.time + 30, // Visual Delay: Ensure Death happens after impact
                actorId: target.id,
                actorName: target.name,
                action: 'wait',
                message: `${target.name} dies!`
            });
        }
    };

    public executeAttack(actor: TrooperData, target: TrooperData, weapon: Weapon | Grenade, context: BattleContext) {
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
        
        if ((weapon as any).rangeMin && distToTarget < ((weapon as any).rangeMin * 100)) {
            aimPenalty += 50; 
        }
        
        if (target.vehicle && target.vehicle.type === 'helicopter' && ((weapon as any).range || 1) <= 1) {
            log.push({ time, actorId: actor.id, actorName: actor.name, action: 'attack', isMiss: true, message: `${actor.name} cannot reach the Helicopter!` });
            return;
        }
    
        let dodge = target.attributes.dodge || 0;
        // Zigzag skill check would need skill lookup, assuming resolved in 'dodge' attribute? 
        // Or check target.skills.
        if (target.status && target.status['zigzag']) dodge += 25; // Assuming Status applied elsewhere or checked here
        // If skill checking is needed explicitly:
        const hasZigzag = (target.skills || []).some(s => s.id === 'zigzag');
        // 'isMoving' check requires previous position or flag? Handled by 'Move' action setting flag?
        // Let's assume zigzag is passive always active for now.
        if (hasZigzag) dodge += 25;
    
        const finalHitChance = ((baseAim - aimPenalty) * (weaponAccuracy / 100)) - dodge;
        
        // BALLISTICS SIMULATION (Obstruction)
        let actualTarget = target;
        let obstruction: TrooperData | null = null;
        let isObstructionHit = false;
    
        const potentialObstacles = allTroopers.filter(a => a.id !== actor.id && !a.isDead);
        let minObstacleDist = distToTarget;
    
        for (const obs of potentialObstacles) {
            if (obs.id === target.id) continue;
    
            const ox = (obs.position?.x || 0) - (actor.position?.x || 0);
            const oy = (obs.position?.y || 0) - (actor.position?.y || 0);
            const oDot = ox * dirX + oy * dirY;
    
            if (oDot > 0 && oDot < minObstacleDist) {
                const oPerpX = ox - oDot * dirX;
                const oPerpY = oy - oDot * dirY;
                const oDistFromLine = Math.sqrt(oPerpX * oPerpX + oPerpY * oPerpY);
    
                if (oDistFromLine < 20) { 
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
        if (isObstructionHit) isHit = true; 
        
        let critChance = ((weapon as any).crit || 0) + (actor.attributes.critChance || 0);
        const isCrit = Math.random() * 100 <= critChance;
    
        const weaponArea = (weapon as any).area || 0;
        const weaponStun = (weapon as any).stun || 0;
    
        if (weaponArea > 0) {
            const isShotgun = weapon.id.includes('shotgun') || weapon.id.includes('scatter') || weapon.id.includes('pump');
            
            if (isShotgun) {
                // --- SHOTGUN "SPREAD" LOGIC (Cone, No Falloff) ---
                
                // Primary Hit (already calculated hit/crit)
                if (isHit) {
                    let minDamage = ((weapon as any).damage || 5);
                    let maxDamage = ((weapon as any).maxDamage || minDamage);
                    let damage = Math.floor(minDamage + Math.random() * (maxDamage - minDamage + 1));
                    damage += (actor.attributes.damage || 0);
                    if (isCrit) damage *= 1.5;

                    log.push({
                        time, actorId: actor.id, actorName: actor.name, targetId: actualTarget.id, targetName: actualTarget.name,
                        action: 'attack', damage, isCrit, message: `${actor.name} blasts ${actualTarget.name} with buckshot for ${damage}`,
                        data: { weaponId: weapon.id }
                    });
                    this.applyDamage(actualTarget, damage, context, actor);
                } else {
                     log.push({
                        time, actorId: actor.id, actorName: actor.name,
                        action: 'attack', isMiss: true, message: `${actor.name} fires wide!`,
                        data: { weaponId: weapon.id }
                    });
                }

                // Secondary Pellets (Cone Check)
                // Cone angle ~30 degrees? +/- 15 deg from dir to target.
                // Range = weapon range (or slightly less for spread effectiveness?) logic says weaponArea usually 1-2 for shotgun, maybe scale it?
                // Actually weapon.area for shotgun is 1 (small) or 2. Let's use weapon.range check + Angle check.
                const coneAngle = Math.PI / 6; // 30 degrees
                const rangeLimit = (weapon.range || 4) * 100;
                
                const affectedUnits = allTroopers.filter(t => !t.isDead && t.id !== actor.id && t.id !== actualTarget.id);
                
                affectedUnits.forEach(unit => {
                     const uX = (unit.position?.x || 0) - (actor.position?.x || 0);
                     const uY = (unit.position?.y || 0) - (actor.position?.y || 0);
                     const dist = Math.sqrt(uX*uX + uY*uY);
                     
                     if (dist <= rangeLimit) {
                         const unitAngle = Math.atan2(uY, uX);
                         const attackAngle = Math.atan2(dirY, dirX);
                         let angleDiff = Math.abs(unitAngle - attackAngle);
                         if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
                         
                         if (angleDiff <= coneAngle) {
                             // Hit secondary!
                             // Damage slightly reduced? Or full? Let's say random 50-100%
                             let baseDmg = ((weapon as any).damage || 5);
                             let damage = Math.floor(baseDmg * (0.5 + Math.random() * 0.5));
                             
                             log.push({
                                time, actorId: actor.id, actorName: actor.name, targetId: unit.id, targetName: unit.name,
                                action: 'attack', damage, message: `${unit.name} is caught in the spread for ${damage}`,
                                data: { weaponId: weapon.id }
                            });
                             this.applyDamage(unit, damage, context, actor);
                         }
                     }
                });

            } else {
                // --- EXPLOSIVE LOGIC (Circular, Falloff, Knockback, Fall Dmg) ---
                let impactX = actualTarget.position!.x;
                let impactY = actualTarget.position!.y;
                const blastRadius = weaponArea; // Multiplied by constants? Usually weaponArea is raw radius? 
                // In Minigun check, area was checked with < w.area * 1.2. 
                // Let's assume weaponArea needs scaling if it's small (1-2) vs large (100).
                // Shotgun was 1. Bazooka is 50? Wait, checking Skill.ts...
                // Bazooka: area: 50. Shotgun: area: 1.
                // Okay, if area is small usually it means tile radius? But physics uses pixels.
                // If Area > 10, treat as pixels? If Area < 10, treat as tiles * X?
                // Let's assume passed weaponArea is correct pixel radius OR tile count.
                // Checking Skill.ts: Bazooka area=50. Shotgun area=1. 
                // 50 pixels is small. Maybe 50 is tile count? Or maybe just radius?
                // Let's assume 50 is radius for now (50px = 0.5m?). Maybe need scaling.
                // Actually scale: 100px ~= 1m? No 100 units = 1 speed... 
                // Let's ensure Blast Radius is meaningful. If < 10, multiply by 50?
                const effectiveRadius = weaponArea < 10 ? weaponArea * 50 : weaponArea;

                if (isHit) {
                    let minDamage = ((weapon as any).damage || 5);
                    let maxDamage = ((weapon as any).maxDamage || minDamage);
                    let damage = Math.floor(minDamage + Math.random() * (maxDamage - minDamage + 1));
                    damage += (actor.attributes.damage || 0);
                    if (isCrit) damage *= 1.5;
                    
                    log.push({
                        time, actorId: actor.id, actorName: actor.name, targetId: actualTarget.id, targetName: actualTarget.name,
                        action: 'attack', damage, isCrit, message: `${actor.name} hits ${actualTarget.name} with explosion for ${damage}`,
                        data: { weaponId: weapon.id }
                    });
        
                    this.applyDamage(actualTarget, damage, context, actor);
        
                } else {
                    const missDistance = 50 + Math.random() * 150;
                    const missAngle = Math.atan2(dirY, dirX) + (Math.random() - 0.5);
                    impactX = actualTarget.position!.x + Math.cos(missAngle) * missDistance;
                    impactY = actualTarget.position!.y + Math.sin(missAngle) * missDistance;
                    
                     log.push({
                        time, actorId: actor.id, actorName: actor.name,
                        action: 'attack', isMiss: true, message: `${actor.name} misses! Shot explodes nearby.`,
                        targetPosition: { x: impactX, y: impactY },
                        data: { weaponId: weapon.id }
                    });
                }
        
                // Splash Loop
                const affectedUnits = allTroopers.filter(t => !t.isDead && t.id !== actor.id);
                affectedUnits.forEach(unit => {
                    const distToImpact = Math.sqrt(Math.pow((unit.position!.x) - impactX, 2) + Math.pow((unit.position!.y) - impactY, 2));
                    
                    if (distToImpact <= effectiveRadius) {
                         // Skip primary target if already hit (to avoid double dip, though standard logic might apply both?)
                         // Usually primary hit includes "direct hit" damage + "splash"? 
                         // For now, if direct hit processed, skip splash damage for them.
                         if (unit.id === actualTarget.id && isHit) {
                             // Do nothing for damage, but check knockback?
                         } else {
                            let splashDamage = ((weapon as any).damage || 5) + (actor.attributes.damage || 0);
                            const falloff = 0.5 + 0.5 * (1 - (distToImpact / effectiveRadius));
                            splashDamage = Math.floor(splashDamage * falloff);
                            
                            if (splashDamage > 0) {
                                this.applyDamage(unit, splashDamage, context, actor);
                            }
                         }

                         // KNOCKBACK & FALL DAMAGE
                         if (weaponStun > 0) {
                            const pushFactor = (1 - (distToImpact/effectiveRadius));
                            const force = weaponStun * pushFactor; // Stun 10-50 usually
                            
                            // Apply force
                            const angle = Math.atan2(unit.position!.y - impactY, unit.position!.x - impactX);
                            unit.position!.x += Math.cos(angle) * force * 2; // Multiplier for visual effect
                            unit.position!.y += Math.sin(angle) * force * 2;

                            // Downed State
                            if (force > 15) {
                                unit.recoveryTime = (unit.recoveryTime || 0) + 100;
                                if (!unit.isDead) {
                                    unit.state = { 
                                        type: 'DOWNED', 
                                        current: 0, 
                                        duration: 300 // 3s
                                    };
                                    log.push({ 
                                        time, actorId: actor.id, actorName: actor.name, 
                                        targetId: unit.id, targetName: unit.name,
                                        action: 'knock_down',
                                        message: `${unit.name} is sent flying!`,
                                        targetPosition: { x: unit.position!.x, y: unit.position!.y }
                                    });

                                    // FALL DAMAGE
                                    // If force was very high, they take damage on "landing"
                                    if (force > 30) {
                                        const fallDmg = Math.floor(force / 5);
                                        this.applyDamage(unit, fallDmg, context, undefined); // No source for env damage? Or actor?
                                        log.push({
                                            time, actorId: unit.id, actorName: unit.name, targetId: unit.id, targetName: unit.name,
                                            action: 'wait', damage: fallDmg,
                                            message: `${unit.name} takes ${fallDmg} damage from falling!`
                                        });
                                    }
                                }
                            }
                         }
                         
                         // Grenade Effects
                        const g = weapon as any;
                        if (g.effect) {
                             if (!unit.status) unit.status = {}; 
                             if (g.effect === 'flash') {
                                 unit.status['blind'] = 1000;
                                 log.push({ time, actorId: actor.id, actorName: actor.name, targetId: unit.id, targetName: unit.name, action: 'wait', message: `${unit.name} is blinded!` });
                             }
                             if (g.effect === 'gas') unit.status['poison'] = 2000;
                             if (g.effect === 'glue') {
                                 unit.attributes.initiative = Math.max(1, unit.attributes.initiative - 200);
                                 log.push({ time, actorId: actor.id, actorName: actor.name, targetId: unit.id, targetName: unit.name, action: 'wait', message: `${unit.name} is slowed by glue!` });
                             }
                             if (g.effect === 'shock' && unit.currentWeaponId) {
                                   if (!unit.disarmed) unit.disarmed = [];
                                   unit.disarmed.push(unit.currentWeaponId);
                                   log.push({ time, actorId: actor.id, actorName: actor.name, action: 'jam_weapon', message: `${unit.name} drops their weapon from shock!` });
                             }
                        }
                    } 
                });
            }
        } else {
            // SINGLE TARGET
            if (isHit) {
                const hitLocation = this.getHitLocation(aimPenalty);
                
                let locMult = 1.0;
                if (hitLocation === 'head') locMult = 2.0;
                
                let isWoundedPart = false;
                if (actualTarget.wounds) {
                    if (hitLocation === 'head' && actualTarget.wounds.head) isWoundedPart = true;
                    if (hitLocation === 'torso' && actualTarget.wounds.chest) isWoundedPart = true;
                    if (hitLocation === 'arm' && (actualTarget.wounds.leftArm || actualTarget.wounds.rightArm)) isWoundedPart = true;
                    if (hitLocation === 'leg' && (actualTarget.wounds.leftLeg || actualTarget.wounds.rightLeg)) isWoundedPart = true;
                }
                if (isWoundedPart) locMult += 1.0;
                
                let minDamage = ((weapon as any).damage || 5);
                let maxDamage = ((weapon as any).maxDamage || minDamage);
                let damage = Math.floor(minDamage + Math.random() * (maxDamage - minDamage + 1));
                damage += (actor.attributes.damage || 0);
                
                let critMult = 1.0;
                if (isCrit) {
                    critMult = 2.0; 
                    if (weapon.id === 'ump' && hitLocation === 'head') critMult = 20.0; 
                    if (weapon.id === 'sparrowhawk') critMult = 50.0;
                }
                
                const finalDamage = Math.floor(damage * critMult * locMult);
                
                let actualDamage = finalDamage;
                if (actualTarget.vehicle) {
                     actualDamage = Math.max(1, finalDamage - (actualTarget.vehicle.armor || 0));
                } else {
                     actualDamage = Math.max(1, finalDamage - (actualTarget.attributes.armor || 0));
                }
    
                log.push({
                    time, actorId: actor.id, actorName: actor.name, targetId: actualTarget.id, targetName: actualTarget.name,
                    action: 'attack', damage: actualDamage, isCrit, hitLocation, 
                    message: `${actor.name} hits ${actualTarget.name} in ${hitLocation} for ${actualDamage}${isCrit ? ' (CRIT!)' : ''}`,
                    isVehicleHit: !!actualTarget.vehicle,
                    data: { weaponId: weapon.id }
                });
    
                this.applyDamage(actualTarget, finalDamage, context, actor);
                
                if (!actualTarget.vehicle) {
                     this.applyWound(actualTarget, hitLocation, log, time);
                }
                
                if (weaponStun > 0) {
                     // Knockback
                    const angle = Math.atan2(actualTarget.position!.y - actor.position!.y, actualTarget.position!.x - actor.position!.x);
                    actualTarget.position!.x += Math.cos(angle) * weaponStun;
                    actualTarget.position!.y += Math.sin(angle) * weaponStun;
                    
                    actualTarget.recoveryTime = (actualTarget.recoveryTime || 0) + 100;
                    
                    // Trigger Knock Down Animation via specific action
                    // Also set state to DOWNED?
                    if (!actualTarget.isDead) {
                        actualTarget.state = { 
                            type: 'DOWNED', 
                            current: 0, 
                            duration: 300 // Ticks ~3s
                        };
                        
                        log.push({ 
                            time, actorId: actor.id, actorName: actor.name, 
                            targetId: actualTarget.id, targetName: actualTarget.name,
                            action: 'knock_down', // New Action for Visuals
                            message: `${actualTarget.name} is knocked down!`,
                            targetPosition: { x: actualTarget.position!.x, y: actualTarget.position!.y }
                        });
                    }
                }
    
                // Penetration Logic Omitted for brevity (can add back if valid)
    
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

    public update(actor: TrooperData, context: BattleContext) {
        if (actor.state?.type === 'AIMING') {
             if (actor.state.current >= actor.state.required) {
                 const target = context.allTroopers.find(t => t.id === (actor.state as any).targetId);
                 const weapon = actor.skills.find(s => s.id === (actor.state as any).weaponId);
                 
                 if (target && !target.isDead && weapon) {
                     this.executeAttack(actor, target, weapon as Weapon, context);
                     
                     if (actor.ammo && actor.ammo[weapon.id] !== undefined && !(weapon as any).isUnlimited) {
                         actor.ammo[weapon.id]--;
                     }
                     
                     actor.state = { type: 'IDLE' };
                     const recovery = (weapon as any).recovery || 20;
                     actor.recoveryTime = Math.max(0, (recovery * 10) - (actor.attributes.recoveryMod || 0) * 10);

                 } else {
                     actor.state = { type: 'IDLE' };
                     actor.recoveryTime = 100;
                 }
             }
        }
    }
}
