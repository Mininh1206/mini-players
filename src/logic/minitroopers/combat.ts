import type { Trooper, BattleResult, BattleLogEntry } from './types';
import { getDeploymentLimit, getDeploymentCost } from './deployment';
import { getSabotage } from './stats';
import { Weapon, Equipment } from './classes/Skill';

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

const applyPassiveBonuses = (trooper: Trooper) => {
    trooper.skills.forEach(skill => {
        switch (skill.id) {
            case SKILLS.TANK:
                trooper.attributes.maxHp += 20;
                trooper.attributes.hp += 20;
                break;
            case SKILLS.SNIPER_TRAINING:
                trooper.attributes.range += 2;
                trooper.attributes.critChance += 5;
                break;
            case SKILLS.DODGE_MASTER:
                trooper.attributes.dodge += 10;
                break;
            case SKILLS.EAGLE_EYE:
                trooper.attributes.aim += 10;
                break;
            case SKILLS.SPRINTER:
                trooper.attributes.initiative += 5;
                break;
            case SKILLS.COMMANDO:
                trooper.attributes.initiative += 10;
                break;
            case SKILLS.TWINOID:
                trooper.attributes.initiative += 200; // Massive boost for one turn? Or permanent? Wiki says "Consume pill". Let's treat as passive init boost for now or active? Wiki: "You eat a pill... +500 initiative". It's active.
                // For now let's stick to simple passives.
                break;
        }
    });
};

export function simulateBattle(teamA: Trooper[], teamB: Trooper[]): BattleResult {
    // Deep copy to avoid mutating original state during simulation
    const reserveA = JSON.parse(JSON.stringify(teamA)) as Trooper[];
    const reserveB = JSON.parse(JSON.stringify(teamB)) as Trooper[];
    
    // Apply Passives
    reserveA.forEach(applyPassiveBonuses);
    reserveB.forEach(applyPassiveBonuses);
    
    // Deployment State
    const deployedA: Trooper[] = [];
    const deployedB: Trooper[] = [];
    const limitA = getDeploymentLimit(reserveA);
    const limitB = getDeploymentLimit(reserveB);

    // Sabotage Calculations
    const sabotageA = getSabotage(reserveA); // Sabotage is global, uses full team? Wiki says "not necessarily deployed"
    const sabotageB = getSabotage(reserveB);

    // Jamming State (TrooperID -> List of Jammed Weapon IDs)
    const jammedWeapons = new Map<string, string[]>();

    // Apply Sabotage
    const applySabotage = (targetTeam: Trooper[], sabotageScore: number) => {
        if (sabotageScore <= 0) return;
        
        targetTeam.forEach(t => {
            // Chance to jam based on sabotage score. Let's say 10% per point for now, capped at 50%?
            // Wiki is vague, but "disabling enemy weapons" is the key.
            // Let's jam the first weapon if roll succeeds.
            const jamChance = Math.min(sabotageScore * 10, 50); 
            if (Math.random() * 100 < jamChance) {
                // Fix: Duck typing for Weapon (has damage property)
                const weapons = t.skills.filter(s => (s as any).damage !== undefined); 
                if (weapons.length > 0) {
                    const jammed = weapons[0]; // Jam primary
                    if (!jammedWeapons.has(t.id)) jammedWeapons.set(t.id, []);
                    jammedWeapons.get(t.id)!.push(jammed.id);
                }
            }
        });
    };

    applySabotage(reserveA, sabotageB);
    applySabotage(reserveB, sabotageA);

    // Initial Deployment Helper
    const deploy = (reserve: Trooper[], deployed: Trooper[], limit: number, log: BattleLogEntry[], turn: number, team: 'A' | 'B') => {
        let currentCost = deployed.reduce((sum, t) => sum + getDeploymentCost(t), 0);
        
        while (reserve.length > 0) {
            const nextTrooper = reserve[0];
            const cost = getDeploymentCost(nextTrooper);
            
            if (currentCost + cost <= limit) {
                const trooper = reserve.shift()!;
                // Initialize Combat State
                trooper.position = team === 'A' ? Math.floor(Math.random() * 200) : 800 + Math.floor(Math.random() * 200);
                trooper.cooldown = 0;
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
                    turn,
                    actorId: trooper.id,
                    actorName: trooper.name,
                    action: 'deploy',
                    message: msg
                });
            } else {
                break;
            }
        }
    };

    let turn = 1;
    const log: BattleLogEntry[] = [];
    const maxTurns = 200; // Increased for movement/reloading

    // Initial Deployment
    deploy(reserveA, deployedA, limitA, log, 0, 'A');
    deploy(reserveB, deployedB, limitB, log, 0, 'B');

    while ((deployedA.length > 0 || reserveA.length > 0) && (deployedB.length > 0 || reserveB.length > 0) && turn <= maxTurns) {
        const allTroopers = [...deployedA, ...deployedB].filter(t => !t.isDead);
        if (allTroopers.length === 0) break; 

        // Sort by initiative (modified by Speed?)
        allTroopers.sort((a, b) => {
            const initA = a.attributes.initiative + (a.attributes.speed || 0) / 10;
            const initB = b.attributes.initiative + (b.attributes.speed || 0) / 10;
            return initB - initA;
        });

        for (const actor of allTroopers) {
            if (actor.isDead) continue;

            // Cooldown Check
            if (actor.cooldown && actor.cooldown > 0) {
                actor.cooldown--;
                continue; // Skip turn
            }

            // Identify enemies
            const enemySquad = actor.team === 'A' ? deployedB : deployedA;
            const livingEnemies = enemySquad.filter(t => !t.isDead);

            if (livingEnemies.length === 0) break; 

            // 0. Active Skills (Doctor Heal)
            if (actor.skills.some(s => s.id === SKILLS.DOCTOR)) {
                const woundedAlly = (actor.team === 'A' ? deployedA : deployedB)
                    .filter(t => !t.isDead && t.id !== actor.id && t.attributes.hp < t.attributes.maxHp * 0.5)
                    .sort((a, b) => a.attributes.hp - b.attributes.hp)[0];

                if (woundedAlly) {
                    const distToAlly = Math.abs((actor.position || 0) - (woundedAlly.position || 0));
                    if (distToAlly <= 50) { // Melee range for heal
                        const healAmount = 15; // Fixed heal for now
                        woundedAlly.attributes.hp = Math.min(woundedAlly.attributes.maxHp, woundedAlly.attributes.hp + healAmount);
                        log.push({
                            turn, actorId: actor.id, actorName: actor.name, targetId: woundedAlly.id, targetName: woundedAlly.name,
                            action: 'heal', heal: healAmount, message: `${actor.name} heals ${woundedAlly.name} for ${healAmount} HP.`
                        });
                        actor.cooldown = 1;
                        continue; // End turn after heal
                    }
                }
            }

            // 1. Identify Target
            let target = livingEnemies[0];
            const priority = actor.tactics?.priority || 'closest';
            
            if (priority === 'closest') {
                let minDist = 9999;
                livingEnemies.forEach(e => {
                    const dist = Math.abs((actor.position || 0) - (e.position || 0));
                    if (dist < minDist) {
                        minDist = dist;
                        target = e;
                    }
                });
            } else if (priority === 'weakest') {
                target = livingEnemies.reduce((prev, curr) => prev.attributes.hp < curr.attributes.hp ? prev : curr);
            } else if (priority === 'strongest') {
                target = livingEnemies.reduce((prev, curr) => prev.attributes.hp > curr.attributes.hp ? prev : curr);
            } else {
                target = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
            }

            const dist = Math.abs((actor.position || 0) - (target.position || 0));
            
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
                                turn, actorId: actor.id, actorName: actor.name, targetId: target.id, targetName: target.name,
                                action: 'attack', damage, isCrit, message: `${actor.name} hits ${target.name} for ${damage}${partMsg}`
                            });
                        } else {
                            log.push({
                                turn, actorId: actor.id, actorName: actor.name, targetId: target.id, targetName: target.name,
                                action: 'attack', isMiss: true, message: `${actor.name} misses ${target.name}`
                            });
                        }
                    }
                    actor.cooldown = Math.ceil(((equippedWeapon as any).recovery || 10) / 100);
                    
                    // Trigger Happy Logic
                    if (actor.skills.some(s => s.id === SKILLS.TRIGGER_HAPPY) && Math.random() < 0.2) {
                        log.push({
                            turn, actorId: actor.id, actorName: actor.name,
                            action: 'wait', message: `${actor.name} is Trigger Happy! (Bonus Action)`
                        });
                        actor.cooldown = 0; // Reset cooldown for immediate next turn? Or just allow another action?
                        // For simplicity, let's just reduce cooldown to 0 so they act next turn immediately.
                        // But initiative sorting might put them later.
                        // Better: Just loop again? No, that's complex.
                        // Setting cooldown to 0 ensures they are ready next turn, effectively "fast recovery".
                    }
                    
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
                            const affected = livingEnemies.filter(e => Math.abs((e.position || 0) - (target.position || 0)) <= blastRadius);
                            
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
                                const allies = (actor.team === 'A' ? deployedA : deployedB).filter(t => !t.isDead && Math.abs((t.position || 0) - (actor.position || 0)) <= blastRadius); // Self-centered or target centered? Let's say target centered but target is enemy? 
                                // Healing grenade logic is tricky if targeting enemy. 
                                // Let's skip healing grenade for now or make it target self/allies.
                            }

                            log.push({
                                turn, actorId: actor.id, actorName: actor.name, targetId: target.id, targetName: target.name,
                                action: 'use_equipment', message: msg, targetPosition: target.position
                            });
                            actor.cooldown = 2; // Grenades take time
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
                    log.push({
                        turn, actorId: actor.id, actorName: actor.name, action: 'switch_weapon',
                        message: `${actor.name} switches to ${betterWeapon.name}.`
                    });
                    actor.cooldown = 1; // Switching takes time?
                    actionTaken = true;
                }
            }

            // 3. Reload (if current weapon empty but has capacity)
            if (!actionTaken && equippedWeapon && isUsable(equippedWeapon)) {
                const currentAmmo = actor.ammo?.[equippedWeapon.id] || 0;
                const capacity = (equippedWeapon as any).capacity || 1;
                if (currentAmmo <= 0) {
                    actor.ammo![equippedWeapon.id] = capacity;
                    log.push({
                        turn, actorId: actor.id, actorName: actor.name, action: 'reload',
                        message: `${actor.name} reloads ${equippedWeapon.name}.`
                    });
                    actor.cooldown = 1;
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
                    turn, actorId: actor.id, actorName: actor.name, targetId: target.id, targetName: target.name,
                    action: 'attack', damage, message: `${actor.name} hits ${target.name} with Fists for ${damage}`
                });
                actor.cooldown = 1;
                actionTaken = true;
            }

            // 5. Move (if nothing else)
            if (!actionTaken) {
                const moveSpeed = (actor.attributes.speed || 100) / 2;
                const direction = (target.position || 0) > (actor.position || 0) ? 1 : -1;
                const newPos = (actor.position || 0) + (moveSpeed * direction);
                actor.position = Math.max(0, Math.min(1000, newPos)); // Clamp to battlefield

                log.push({
                    turn, actorId: actor.id, actorName: actor.name, action: 'move', targetPosition: actor.position,
                    message: `${actor.name} moves towards ${target.name}.`
                });
                // No cooldown for moving? Or small cooldown?
                // Wiki says "His Small Speed Speed will determine how much distance he can cover before his turn's over."
                // Implies movement takes the turn.
                actionTaken = true;
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
        deploy(reserveA, deployedA, limitA, log, turn, 'A');
        deploy(reserveB, deployedB, limitB, log, turn, 'B');

        turn++;
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
