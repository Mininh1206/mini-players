import type { TrooperData, BattleContext, BattleLogEntry } from '../types';
import { Weapon } from '../classes/Skill';
import { getDistance } from '../utils';
import { Trooper } from '../classes/Trooper';

export interface AIContext {
    allTroopers: TrooperData[];
    log: BattleLogEntry[];
    time: number;
}

export class AISystem {
    public evaluateTurn(trooper: TrooperData, context: AIContext): boolean {
        const { allTroopers } = context;

        // --- Helpers ---
        // Basic check: is weapon jammed or disarmed?
        const isUsable = (w: Weapon): boolean => {
            const globalJammed = trooper.jammedWeapons?.includes(w.id) ?? false;
            // Local check requires method access if using private map, but TrooperData exposes everything?
            // TrooperData usually doesn't have private fields. We check jammedWeapons.
            // If Trooper Class has extra logic, we might miss it. Assuming TrooperData is sufficient.
            const disarmed = trooper.disarmed?.includes(w.id) ?? false;
            const sabotaged = trooper.sabotagedWeapons?.includes(w.id) ?? false;
            return !globalJammed && !disarmed && !sabotaged;
        };

        const isMainWeapon = (s: any): s is Weapon => {
            if (s instanceof Weapon) return true;
            if (s && typeof s === 'object' && s.constructor?.name === 'Weapon') return true;
             // DUCK TYPING
            if (s && typeof s.damage === 'number' && typeof s.range === 'number') return true;
            return false;
        };
        const isUsableMainWeapon = (s: any) => isMainWeapon(s) && isUsable(s);

        // --- Targeting ---
        const enemies = allTroopers.filter(t => t.team !== trooper.team && !t.isDead);
        if (enemies.length === 0) return false;

        let target: TrooperData | undefined = undefined;
        let potentialTargets = [...enemies]; // Clone
        
        const priority = trooper.tactics?.priority || 'closest';

        if (priority === 'weakest') {
             potentialTargets.sort((a, b) => (a.attributes.hp || 0) - (b.attributes.hp || 0));
             target = potentialTargets[0];
        } else if (priority === 'strongest') {
             potentialTargets.sort((a, b) => (b.attributes.hp || 0) - (a.attributes.hp || 0));
             target = potentialTargets[0];
        } else if (priority === 'random') {
             target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
        } else {
             // Closest
             let minDist = 9999;
             potentialTargets.forEach(e => {
                 const dist = getDistance(trooper.position, e.position);
                 if (dist < minDist) {
                     minDist = dist;
                     target = e;
                 }
             });
        }

        if (!target) return false;

        if (!trooper.position || !target.position) return false;

        const dist = getDistance(trooper.position, target.position);

        // --- Weapon Selection ---
        const getWeaponScore = (w: Weapon, d: number): number => {
            let score = 0;
            const wRange = (w.range || 1) * 100;
            
            if (d > wRange) return 0;
            if (w.rangeMin && d < w.rangeMin * 100) return 0;

            score += (w.damage || 0) * (w.bursts || 1) * 2;

            const optimalRange = wRange * 0.7;
            const rangeDiff = Math.abs(d - optimalRange);
            score += Math.max(0, 50 - (rangeDiff / 10));

            if (w.area && w.area > 0 && d < w.area * 1.2) score -= 100;
            if (d > 500 && wRange > 600) score += 20;

            if (trooper.class === 'Spy') {
                const isMelee = (w as any).range <= 1;
                if (!isMelee) score += 50; 
            }

            // Ammo
            const ammo = trooper.ammo?.[w.id] ?? 0;
            const reserves = trooper.reserves?.[w.id] ?? 0;
            const isUnlimited = (w as any).isUnlimited;

            if (!isUnlimited) {
                if (ammo <= 0) {
                    if (reserves <= 0) return 0.1;
                    else score *= 0.8; 
                }
            }
            return score;
        };

        const availableWeapons = (trooper.skills || []).filter(isUsableMainWeapon) as Weapon[];
        const currentWeapon = (trooper.skills || []).find(s => s.id === trooper.currentWeaponId) as Weapon | undefined;

        let shouldSwitch = false;
        let switchReason = '';
        let bestWeapon: Weapon | undefined = undefined;

        // Current status check
        if (currentWeapon) {
            const isSabotaged = trooper.sabotagedWeapons?.includes(currentWeapon.id);
            const isJammed = trooper.jammedWeapons?.includes(currentWeapon.id);
            const ammo = trooper.ammo?.[currentWeapon.id] ?? 0;
            const isUnlimited = (currentWeapon as any).isUnlimited;
            
            if (isSabotaged || isJammed) {
                shouldSwitch = true;
                switchReason = 'jammed';
            } else if (!isUnlimited && ammo <= 0) {
                // Determine if we should reload or switch
                // const currentScore = getWeaponScore(currentWeapon, dist);
            }
        } else {
            shouldSwitch = true; 
        }

        // Find best weapon
        let maxScore = -1;
        availableWeapons.forEach(w => {
            // Penalty for Sabotaged (Should be filtered by isUsable but double check)
            if (trooper.sabotagedWeapons?.includes(w.id)) return;

            const s = getWeaponScore(w, dist);
            if (s > maxScore) {
                maxScore = s;
                bestWeapon = w;
            }
        });

        if (bestWeapon && currentWeapon) {
             const currentScore = getWeaponScore(currentWeapon, dist);
             if (maxScore > currentScore * 1.5) {
                 shouldSwitch = true;
                 switchReason = 'better_score';
             }
             // Ammo check for switch
             const currentAmmo = trooper.ammo?.[currentWeapon.id] ?? 0;
             if (currentAmmo <= 0 && !(currentWeapon as any).isUnlimited && bestWeapon && bestWeapon.id !== currentWeapon.id) {
                 shouldSwitch = true;
                 switchReason = 'empty';
             }
        } else if (bestWeapon && !currentWeapon) {
            shouldSwitch = true;
        }

        // UNARMED SAFETY CHECK
        // If we want to switch but have no weapons to switch TO, cancel switch so we can fallback to Move/Punch.
        if (shouldSwitch && availableWeapons.length === 0) {
            shouldSwitch = false; 
        }

        // --- Decisions ---

        // 1. SWITCH
        if (shouldSwitch && bestWeapon && bestWeapon.id !== trooper.currentWeaponId) {
             // Set state to SWITCHING
             if (!bestWeapon?.id) return false;
             
             trooper.state = {
                 type: 'SWITCHING',
                 targetWeaponId: bestWeapon.id,
                 current: 0,
                 required: 80 // Reduced from 200 (2s) to 0.8s
             };
             // Log? Maybe 'start_switch' or just wait for completion.
             context.log.push({
                 time: context.time,
                 actorId: trooper.id,
                 actorName: trooper.name,
                 action: 'switch_weapon', 
                 message: `${trooper.name} is switching to ${bestWeapon.name}`
             });
             return true;
        }

        // 2. RELOAD
        if (currentWeapon) {
             const ammo = trooper.ammo?.[currentWeapon.id] ?? 0;
             const reserves = trooper.reserves?.[currentWeapon.id] ?? 0;
             const isUnlimited = (currentWeapon as any).isUnlimited;
             
             if (!isUnlimited && ammo <= 0 && reserves > 0) {
                 trooper.state = {
                     type: 'RELOADING',
                     weaponId: currentWeapon.id,
                     current: 0,
                     required: 150 // Reduced from 300 (3s) to 1.5s
                 };
                 context.log.push({
                    time: context.time,
                    actorId: trooper.id,
                    actorName: trooper.name,
                    action: 'reload', 
                    message: `${trooper.name} starts reloading`
                 });
                 return true;
             }
        }

        // 3. ATTACK / AIM
        if (currentWeapon && !shouldSwitch) {
            // Check range
            const score = getWeaponScore(currentWeapon, dist);
            if (score > 0) {
                // AIMING
                const aimTime = (currentWeapon.aim || 50) * 0.5; // Faster aiming (was * 1, orig * 3)
                
                trooper.state = {
                    type: 'AIMING',
                    targetId: target.id,
                    weaponId: currentWeapon.id,
                    current: 0,
                    required: Math.max(50, aimTime)
                };
                context.log.push({
                    time: context.time,
                    actorId: trooper.id,
                    actorName: trooper.name,
                    action: 'start_aim',
                    message: `${trooper.name} takes aim at ${target.name}`
                });
                return true;
            } else {
                return true;
            }
        }

        // 3a. UNARMED / MELEE ATTACK
        if (!currentWeapon && !shouldSwitch && target && dist <= 50) {
             const damage = 1 + Math.floor(Math.random() * 3) + (trooper.attributes.damage || 0);
             
             // Immediate Attack (No Aiming for Fists)
             context.log.push({
                 time: context.time, 
                 actorId: trooper.id, 
                 actorName: trooper.name, 
                 action: 'attack', 
                 targetId: target.id, 
                 damage, 
                 message: `${trooper.name} punches ${target.name}!` 
             });

             // Apply Damage directly (bypass executeAttack which needs weapon)
             // We need access to applyDamage. It's in CombatSystem, not accessible here directly?
             // AISystem is passed 'context'. Context doesn't have system instances usually?
             // Checking 'types.ts' implies context has data.
             // BUT CombatSystem.applyDamage is a method.
             // The simulation loop (combat.ts) has instances.
             // We can't call combatSystem.applyDamage from here unless we pass it or duplicate simple damage logic.
             // Looking at Trooper.ts legacy: it did `target.attributes.hp -= damage`.
             // But we need to use CombatSystem to handle death logs etc consistently.
             
             // WORKAROUND: Create a "Fists" dummy weapon and use AIMING state with 0 duration to trigger executeAttack?
             // OR: Just modify attributes directly effectively matches "Standard Trooper Damage" in CombatSystem.
             // But we miss "Death" logs if we just mod HP.
             // CombatSystem.update calls executeAttack.
             
             // BEST APPROACH: Set state to AIMING with a "Fists" dummy weapon?
             // But 'currentWeapon' is null.
             // Let's manually deduct HP and push Death log if needed.
             // This duplicates CombatSystem.applyDamage logic but it's safe for now.
             
             const armor = target.attributes.armor || 0;
             const finalDamage = Math.max(1, damage - armor);
             target.attributes.hp = Math.max(0, target.attributes.hp - finalDamage);
             
             if (target.attributes.hp === 0 && !target.isDead) {
                 target.isDead = true;
                 context.log.push({
                     time: context.time + 30, // Delay death slightly
                     actorId: target.id,
                     actorName: target.name,
                     action: 'wait',
                     message: `${target.name} dies!`
                 });
             }

             trooper.recoveryTime = 100; // 1s recovery
             return true;
        }

        // 4. FALBACK: MOVE (Unarmed / No Action)
        if (!shouldSwitch && target && target.position) {
             const speed = 100; // Pixels
             const angle = Phaser.Math.Angle.Between(trooper.position!.x, trooper.position!.y, target.position.x, target.position.y);
             const moveX = Math.cos(angle) * speed;
             const moveY = Math.sin(angle) * speed;
             
             trooper.position!.x += moveX;
             trooper.position!.y += moveY;
             
             context.log.push({
                 time: context.time,
                 actorId: trooper.id,
                 actorName: trooper.name,
                 action: 'move',
                 targetPosition: { x: trooper.position!.x, y: trooper.position!.y },
                 message: `${trooper.name} moves (Charging)`
             });
             trooper.recoveryTime = 50; // Reduced from 100 (1s) to 0.5s
             return true;
        }

        
        return false;
    }
}
