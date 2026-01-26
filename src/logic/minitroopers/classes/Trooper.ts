
import { v4 as uuidv4 } from 'uuid';
import type { TrooperData, TrooperAttributes, Skill, TrooperVehicle, Wounds, BattleResult, BattleLogEntry, BodyPart } from '../types';
import type { BattleContext } from '../systems/SkillSystem';
import { skillManager } from '../systems/SkillSystem';
import { getDistance } from '../utils';
import { SKILLS as ALL_SKILLS_IDS } from '../combat'; 
import { Weapon, Grenade } from './Skill';
import { SKILLS as ALL_SKILLS_DEFS } from '../skills';

// Base Class
export abstract class Trooper implements TrooperData {
    public id: string;
    public name: string;
    public abstract class: string; 
    public team: 'A' | 'B';
    public attributes: TrooperAttributes;
    public skills: Skill[];
    public isDead: boolean;
    public level: number;

    // Combat State
    public position?: { x: number; y: number };
    public currentWeaponId?: string;
    public ammo?: Record<string, number>;
    public reserves?: Record<string, number>;
    public actionTimer?: number;
    public recoveryTime?: number;
    public cooldown?: number;
    public disarmed?: string[];
    public jammedWeapons?: string[];
    public sabotagedWeapons?: string[];
    public tactics?: {
        priority: 'closest' | 'weakest' | 'strongest' | 'random';
        targetPart: 'any' | 'head' | 'heart' | 'arm' | 'leg';
        favoriteWeaponId?: string;
    };
    public burstState?: {
        shotsRemaining: number;
        targetId: string;
        weaponId: string;
    };
    public isMoving?: boolean;
    public vehicle?: TrooperVehicle;
    public wounds?: Wounds;
    public status?: Record<string, number>;

    public pendingChoices?: Skill[];

    constructor(data: TrooperData) {
        this.id = data.id;
        this.name = data.name;
        this.team = data.team;
        this.attributes = { ...data.attributes };
        this.skills = [...data.skills];
        this.isDead = data.isDead;
        this.level = data.level;
        this.ammo = data.ammo ? { ...data.ammo } : {};
        if (data.reserves) this.reserves = { ...data.reserves };
        else this.reserves = {};
        
        this.currentWeaponId = data.currentWeaponId;
        this.disarmed = data.disarmed ? [...data.disarmed] : [];
        this.jammedWeapons = data.jammedWeapons ? [...data.jammedWeapons] : [];
        this.sabotagedWeapons = data.sabotagedWeapons ? [...data.sabotagedWeapons] : [];
        this.wounds = data.wounds ? { ...data.wounds } : undefined;
        this.tactics = data.tactics ? { ...data.tactics } : undefined;
        this.actionTimer = data.actionTimer || 0;
        this.recoveryTime = data.recoveryTime || 0;
        this.position = data.position ? { ...data.position } : undefined;
        this.status = data.status ? { ...data.status } : {};
        this.pendingChoices = data.pendingChoices ? [...data.pendingChoices] : undefined;
    }

    // --- Methods ---

    public recalculateStats(): void {
        let newMaxHp = 10;
        
        if (this.class === 'Rat') {
            newMaxHp = 10 + (this.level - 1) * 2;
        } else {
             newMaxHp += (this.level - 1);
        }

        this.skills.forEach(skill => {
            // Check for HP Bonus from definition
             const def = ALL_SKILLS_DEFS.find((s: any) => s.id === skill.id);
             if (def && (def as any).hpBonus) {
                 newMaxHp += (def as any).hpBonus;
            }

            if (skill.id === 'sniper') this.class = 'Sniper';
            if (skill.id === 'doctor') this.class = 'Doctor';
            if (skill.id === 'pilot') this.class = 'Pilot';
            if (skill.id === 'commando') this.class = 'Commando';
            if (skill.id === 'scout') this.class = 'Scout';
            if (skill.id === 'spy') this.class = 'Spy';
            if (skill.id === 'saboteur') this.class = 'Saboteur';
            if (skill.id === 'comms_officer') this.class = 'Comms Officer';
            if (skill.id === 'soldier') this.class = 'Soldier';
        });


        this.attributes.maxHp = newMaxHp;
        this.attributes.hp = newMaxHp; // Fully heal on recalc? usage implies yes for generation.

        // Ensure Fists exist if no Melee weapon
        const hasMelee = this.skills.some(s => {
             const def = ALL_SKILLS_DEFS.find((d: { id: any; }) => d.id === s.id);
             return def instanceof Weapon && (def as any).range === 1; // Melee check
        });

        if (!hasMelee) {
             const fists = ALL_SKILLS_DEFS.find((s: { id: string; }) => s.id === 'fists');
             if (fists && !this.skills.some(s => s.id === 'fists')) {
                 this.skills.push(fists);
             }
        }

        // Set currentWeaponId if not already set but weapons exist
        if (!this.currentWeaponId) {
            const firstWeapon = this.skills.find(s => {
                const def = ALL_SKILLS_DEFS.find((d: { id: any; }) => d.id === s.id);
                return def instanceof Weapon;
            });
            if (firstWeapon) {
                this.currentWeaponId = firstWeapon.id;
            }
        }
    }

    public getActiveWeaponStatus(weaponId?: string): 'ready' | 'jammed' | 'no_ammo' {
        const id = weaponId || this.currentWeaponId;
        if (!id) return 'ready'; // Fists?
        
        if (this.jammedWeapons && this.jammedWeapons.includes(id)) {
            return 'jammed';
        }

        if (this.ammo && this.ammo[id] !== undefined && this.ammo[id] <= 0) {
            return 'no_ammo';
        }

        return 'ready';
    }

    public isWeaponJammed(weaponId: string): boolean {
        return this.jammedWeapons ? this.jammedWeapons.includes(weaponId) : false;
    }

    public getPower(): number {
        let power = 0;
        power += this.level * 10;
        power += this.attributes.maxHp / 2;
        power += this.attributes.damage * 2;
        power += this.attributes.aim / 5;
        power += this.attributes.dodge;
        power += this.attributes.initiative / 2;
        power += this.skills.length * 5;
        if (this.class !== 'Recruit') power += 20;
        return Math.floor(power);
    }

    /**
     * Apply damage to this trooper, respecting armor and marking as dead if HP reaches 0
     * @param amount Raw damage amount before armor reduction
     * @param ignoreArmor If true, skip armor calculation
     * @returns Actual damage dealt after armor
     */
    public takeDamage(amount: number, ignoreArmor: boolean = false): number {
        let finalDamage = amount;
        if (!ignoreArmor) {
            finalDamage = Math.max(1, amount - (this.attributes.armor || 0));
        }
        this.attributes.hp = Math.max(0, this.attributes.hp - finalDamage);
        if (this.attributes.hp === 0) {
            this.isDead = true;
        }
        return finalDamage;
    }

    /**
     * Heal this trooper, capped at maxHp
     * @param amount Amount to heal
     * @returns Actual amount healed
     */
    public heal(amount: number): number {
        const beforeHp = this.attributes.hp;
        this.attributes.hp = Math.min(this.attributes.maxHp, this.attributes.hp + amount);
        return this.attributes.hp - beforeHp;
    }

    public abstract clone(): Trooper;

    public playTurn(context: BattleContext): boolean {
        const { log, time, allTroopers, jammedWeapons, resolveWeaponShot } = context;

        let actionTaken = false;

        // --- Helpers ---
        const isUsable = (w: Weapon) => {
             const globalJammed = jammedWeapons.get(this.id)?.includes(w.id) ?? false;
             const localJammed = this.isWeaponJammed(w.id);
             const disarmed = this.disarmed?.includes(w.id) ?? false;
             return !globalJammed && !localJammed && !disarmed;
        };

        const isMainWeapon = (s: any): s is Weapon => {
            if (s instanceof Weapon) return true;
            const def = ALL_SKILLS_DEFS.find((d: { id: any; }) => d.id === s.id);
            return def instanceof Weapon;
        };
        const isUsableMainWeapon = (s: any) => isMainWeapon(s) && isUsable(s);


        // --- Burst Fire Logic: Handled by Context usually, ensuring no double-dip ---
        // If context handles it (before calling playTurn), we shouldn't be here with burstState unless
        // it's a new state or logic requires it. 
        // For standard simulation, combat loop handles burst continuation.
        // We will remove this block to prevent potential double-execution if combat loop calls playTurn blindly.
        if (this.burstState) {
             return false; // Yield turn if burst is managed externally
        }

        // --- Targeting ---
        const enemies = allTroopers.filter(t => t.team !== this.team && !t.isDead);
        if (enemies.length === 0) return false; // No targets

        let target: Trooper | undefined = undefined;
        let potentialTargets = enemies;
        
        if (this.tactics?.priority === 'weakest') {
             potentialTargets.sort((a, b) => a.attributes.hp - b.attributes.hp);
             target = potentialTargets[0];
        } else if (this.tactics?.priority === 'strongest') {
             potentialTargets.sort((a, b) => b.attributes.hp - a.attributes.hp);
             target = potentialTargets[0];
        } else if (this.tactics?.priority === 'random') {
             target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
        } else {
             // Closest
             let minDist = 9999;
             potentialTargets.forEach(e => {
                 const dist = getDistance(this.position, e.position);
                 if (dist < minDist) {
                     minDist = dist;
                     target = e;
                 }
             });
        }

        if (!target) return false;

        const dist = getDistance(this.position, target.position);

        // --- Weapon Selection ---
        // --- Weapon Selection & Logic (Refactored) ---
        const getWeaponScore = (w: Weapon, dist: number): number => {
            let score = 0;
            const wRange = (w.range || 1) * 100;
            
            // Base Range check (0 if out of range)
            if (dist > wRange) return 0;
            if (w.rangeMin && dist < w.rangeMin * 100) return 0;

            // Damage Potential
            score += (w.damage || 0) * (w.bursts || 1) * 2;

            // Range Optimization
            const optimalRange = wRange * 0.7; // Sweet spot
            const rangeDiff = Math.abs(dist - optimalRange);
            score += Math.max(0, 50 - (rangeDiff / 10)); // Reward being near optimal range

            // Penalize using Close Range weapons at VERY close range if they have area (danger)
            if (w.area > 0 && dist < w.area * 1.2) score -= 100;

            // Favor Sniper at long range
            if (dist > 500 && wRange > 600) score += 20;

            return score;
        };

        const availableWeapons = this.skills.filter(isUsableMainWeapon) as Weapon[];

        // 1. Identify Current State
        let currentWeapon = this.skills.find(s => s.id === this.currentWeaponId) as Weapon | undefined;
        let shouldSwitch = false; 
        let switchReason = '';

        // Check 1: Must Switch (Sabotage / Jammed / Empty)
        if (currentWeapon) {
            const isSabotaged = this.sabotagedWeapons?.includes(currentWeapon.id);
            const isJammed = this.isWeaponJammed(currentWeapon.id);
            const ammo = this.ammo?.[currentWeapon.id] ?? 0;
            const isUnlimited = (currentWeapon as any).isUnlimited;

            if (isSabotaged || isJammed) {
                shouldSwitch = true;
                switchReason = isSabotaged ? 'sabotaged' : 'jammed';
            } else if (!isUnlimited && ammo <= 0 && availableWeapons.some(w => (this.ammo?.[w.id] ?? 0) > 0)) {
                // Only switch for ammo if we have another option with ammo
                shouldSwitch = true;
                switchReason = 'no_ammo';
            }
        } else {
             shouldSwitch = true; // No weapon equipped
             switchReason = 'none_equipped';
        }

        // Check 2: Optimization (Better weapon for range?)
        let bestWeapon = currentWeapon;
        if (!shouldSwitch && currentWeapon && availableWeapons.length > 1) {
             const currentScore = getWeaponScore(currentWeapon, dist);
             
             // Find best alternative
             const bestAlt = availableWeapons.reduce((prev, curr) => {
                 return getWeaponScore(curr, dist) > getWeaponScore(prev, dist) ? curr : prev;
             }, currentWeapon);

             const bestScore = getWeaponScore(bestAlt, dist);
             
             // Threshold for switching (don't flicker)
             if (bestScore > currentScore * 1.5) {
                 shouldSwitch = true;
                 switchReason = 'range_optimization';
                 bestWeapon = bestAlt;
             }
        }

        // Execute Switch
        if (shouldSwitch) {
            // Filter candidates with ammo (unless melee/unlimited)
            const candidates = availableWeapons.filter(w => {
                 if (this.sabotagedWeapons?.includes(w.id)) return false;
                 if (this.isWeaponJammed(w.id)) return false;
                 return (w as any).isUnlimited || (this.ammo?.[w.id] ?? 0) > 0;
            });

            if (candidates.length > 0) {
                 // Pick best by score logic or fallback to first
                 // Reuse getWeaponScore for selection
                 candidates.sort((a, b) => getWeaponScore(b, dist) - getWeaponScore(a, dist));
                 
                 const newWeapon = candidates[0];
                 
                 if (newWeapon.id !== this.currentWeaponId) {
                     this.currentWeaponId = newWeapon.id;
                     currentWeapon = newWeapon;
                     
                     let msg = `${this.name} switches to ${newWeapon.name}.`;
                     if (switchReason === 'sabotaged') msg = `${this.name} discards sabotaged weapon!`;
                     if (switchReason === 'no_ammo') msg = `${this.name} switches (Out of Ammo).`;
                     if (switchReason === 'range_optimization') msg = `${this.name} switches for better range.`;

                     log.push({ 
                        time, actorId: this.id, actorName: this.name, action: 'switch_weapon', 
                        message: msg,
                        data: { weaponId: newWeapon.id, reason: switchReason }
                     });
                     this.actionTimer! += 200;
                     actionTaken = true;
                 }
            } else {
                 // No weapons available! (Fists fallback handled in recalc logic, should have Fists)
                 const fists = this.skills.find(s => s.id === 'fists');
                 if (fists && this.currentWeaponId !== 'fists') {
                     this.currentWeaponId = fists.id;
                     currentWeapon = fists as Weapon;
                     log.push({ time, actorId: this.id, action: 'switch_weapon', actorName: this.name, message: `${this.name} uses Fists!` });
                     this.actionTimer! += 100;
                     actionTaken = true;
                 }
            }
        }

        // Ensure currentWeapon is up to date for attack logic
        let equippedWeapon = this.skills.find(s => s.id === this.currentWeaponId) as Weapon | undefined;

        // Start AI Logic / Attack Execution (Modified from original to reduce duplication)
        if (!actionTaken) {
             // ... Existing movement/attack logic usually follows here ...
             // We replaced the big block of "Force Switch" and "Tactics" with the above unified logic.
             // We need to ensure we don't double-dip or lose logic.
             // The original code had:
             // 1. Force Switch (Done)
             // 2. Tactics Favorite (Integrated into scoring? Or keep separate?)
             //    -> Let's keep Favorite as a distinct high-priority check or simply boost its score.
             //    -> Simpler: Boost score of favorite weapon in getWeaponScore!
        }

        // Attack
        // Attack
        if (!actionTaken && equippedWeapon) {
             const usable = isUsable(equippedWeapon);
             const range = ((equippedWeapon as any).range || 1) * 100;
             const ammo = this.ammo?.[equippedWeapon.id] || 0;
             
             if (usable && dist <= range && ammo > 0) {
                // Check Line of Fire (Friendly Fire Prevention)
                const lofBlocked = this.checkLineOfFire(target as Trooper, allTroopers);
                
                if (lofBlocked) {
                     this.performRelocation(target as Trooper, log, time);
                     actionTaken = true;
                } else {
                      const bursts = (equippedWeapon as any).bursts || 1;
                      if (resolveWeaponShot) resolveWeaponShot(this, target as Trooper, equippedWeapon, context);
                      
                      if (this.ammo?.[equippedWeapon.id]) this.ammo[equippedWeapon.id]--;

                      if (bursts > 1 && (this.ammo?.[equippedWeapon.id] || 0) > 0 && !((target as Trooper).isDead)) {
                          this.burstState = {
                              shotsRemaining: bursts - 1,
                              targetId: (target as Trooper).id,
                              weaponId: equippedWeapon.id
                          };
                          this.recoveryTime = 4;
                      } else {
                          const baseRecovery = (equippedWeapon as any).recovery || 10;
                          this.recoveryTime = Math.max(0, Math.max(10, baseRecovery - (this.attributes.recoveryMod || 0) * 10));
                      }
                      actionTaken = true;
                 }
             } else {
                 // console.log(`[${this.name}] Attack Fail. Usable: ${usable}, Range: ${dist}/${range}, Ammo: ${ammo}`);
             }
        }

        // Reload logic
        if (!actionTaken && equippedWeapon && isUsableMainWeapon(equippedWeapon)) {
               const currentAmmo = this.ammo?.[equippedWeapon.id] || 0;
               const capacity = (equippedWeapon as any).capacity || 1;
               const reserves = this.reserves?.[equippedWeapon.id] || 0;
               
               if (currentAmmo < capacity && reserves > 0 && (currentAmmo <= 0 || dist > ((equippedWeapon as any).range || 1) * 100)) {
                   this.ammo![equippedWeapon.id] = currentAmmo + 1;
                   this.reserves![equippedWeapon.id] = reserves - 1;
                   log.push({ time, actorId: this.id, actorName: this.name, action: 'reload', message: `${this.name} reloads.` });
                   this.recoveryTime = 10;
                   actionTaken = true;
               }
        }
        
        // Melee
        if (!actionTaken && dist <= 50 && target && target.team !== this.team) {
                const damage = 5 + (this.attributes.damage || 0);
                // Log Attack
                log.push({ time, actorId: this.id, actorName: this.name, action: 'attack', targetId: target!.id, damage, message: `${this.name} punches ${target!.name}!` });
                // Apply Damage
                if (context.applyDamage) {
                    context.applyDamage(target as Trooper, damage, context, this);
                } else {
                     // Fallback (Legacy)
                    (target as Trooper).attributes.hp = Math.max(0, (target as Trooper).attributes.hp - damage);
                    if ((target as Trooper).attributes.hp === 0) (target as Trooper).isDead = true;
                }
               this.recoveryTime = 20;
               actionTaken = true;
        }

        // Move
        if (!actionTaken && target) {
             this.performMoveTowards(target as Trooper, log, time);
             actionTaken = true;
        }

        return actionTaken;
    }



    private performPanicOrRetreat(target: Trooper, dist: number, log: any[], time: number, equippedWeapon?: Weapon) {
        // Safety check: never attack allies
        if (target.team === this.team) {
            // Retreat instead of attacking ally
            this.performMoveTowards(target, log, time); // Will move away due to retreat logic
            return;
        }
        
        if (dist < 50) {
            // Melee panic
             const damage = 3;
             target.attributes.hp -= 3;
             if (target.attributes.hp <= 0) target.isDead = true;
             log.push({ time, actorId: this.id, actorName: this.name, action: 'attack', damage: 3, targetId: target.id, message: `${this.name} punches ${target.name}!` });
             this.recoveryTime = 10;
        } else {
             const escapeAngle = Math.atan2((this.position!.y) - (target.position!.y), (this.position!.x) - (target.position!.x)); // Away
             const moveSpeed = (this.attributes.speed || 100) / 10; // Slow retreat?
             let speedMod = 1.0;
             if (equippedWeapon && equippedWeapon.encumberance) speedMod -= (equippedWeapon.encumberance / 100);
             const finalSpeed = Math.max(1, moveSpeed * speedMod);

             this.position!.x += Math.cos(escapeAngle) * finalSpeed;
             this.position!.y += Math.sin(escapeAngle) * finalSpeed;
             
             // Clamp
             this.position!.x = Math.max(0, Math.min(1000, this.position!.x));
             this.position!.y = Math.max(0, Math.min(400, this.position!.y));
             
             this.isMoving = true;
             log.push({ time, actorId: this.id, actorName: this.name, action: 'move', targetPosition: { ...this.position! }, message: `${this.name} retreats to safe distance.` });
             this.recoveryTime = 10;
        }
    }

    private performMoveTowards(target: Trooper, log: any[], time: number) {
        const moveSpeed = (this.attributes.speed || 100) / 2;
        const dx = (target.position?.x || 0) - (this.position?.x || 0);
        const dy = (target.position?.y || 0) - (this.position?.y || 0);
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length > 0) {
             const moveX = (dx / length) * moveSpeed;
             const moveY = (dy / length) * moveSpeed;
             this.position = {
                  x: Math.max(0, Math.min(1000, (this.position?.x || 0) + moveX)),
                  y: Math.max(0, Math.min(400, (this.position?.y || 0) + moveY))
             };
             this.isMoving = true;
             log.push({ time, actorId: this.id, actorName: this.name, action: 'move', targetPosition: { ...this.position }, message: `${this.name} moves towards ${target.name}.` });
             this.recoveryTime = 10;
        }
    }

    private checkLineOfFire(target: Trooper, allTroopers: Trooper[], threshold: number = 20): boolean {
        const vX = (target.position?.x || 0) - (this.position?.x || 0);
        const vY = (target.position?.y || 0) - (this.position?.y || 0);
        const distToTarget = Math.sqrt(vX * vX + vY * vY);
        const dirX = distToTarget > 0 ? vX / distToTarget : 0;
        const dirY = distToTarget > 0 ? vY / distToTarget : 0;

        for (const obs of allTroopers) {
            if (obs.id === this.id || obs.id === target.id) continue;
            if (obs.isDead) continue;
            if (obs.team !== this.team) continue; // Only avoid Allies

            const ox = (obs.position?.x || 0) - (this.position?.x || 0);
            const oy = (obs.position?.y || 0) - (this.position?.y || 0);
            const oDot = ox * dirX + oy * dirY;

            if (oDot > 0 && oDot < distToTarget) { 
                const oPerpX = ox - oDot * dirX;
                const oPerpY = oy - oDot * dirY;
                const oDistFromLine = Math.sqrt(oPerpX * oPerpX + oPerpY * oPerpY);

                if (oDistFromLine < threshold) {
                    return true;
                }
            }
        }
        return false;
    }

    private performRelocation(target: Trooper, log: any[], time: number) {
         // Strafe Logic: Move perpendicular to target line
         const dx = (target.position?.x || 0) - (this.position?.x || 0);
         const dy = (target.position?.y || 0) - (this.position?.y || 0);
         const angle = Math.atan2(dy, dx);
         
         // Try strafing Left or Right randomly to avoid oscillating forever if both blocked?
         // Or consistent direction?
         const strafeDir = Math.random() > 0.5 ? 1 : -1;
         const strafeAngle = angle + (Math.PI / 2) * strafeDir;
         
         const moveSpeed = (this.attributes.speed || 100) / 2;
         const moveX = Math.cos(strafeAngle) * moveSpeed;
         const moveY = Math.sin(strafeAngle) * moveSpeed;
         
         this.position!.x = Math.max(0, Math.min(1000, (this.position!.x || 0) + moveX));
         this.position!.y = Math.max(0, Math.min(400, (this.position!.y || 0) + moveY));
         
         this.isMoving = true;
         log.push({ time, actorId: this.id, actorName: this.name, action: 'move', targetPosition: { ...this.position }, message: `${this.name} repositions for a clear shot.` });
         this.recoveryTime = 10;
    
    }
}

export class Soldier extends Trooper {
    public class = 'Soldier';
    public clone(): Trooper { return new Soldier(this); }
}

export class Sniper extends Trooper {
    public class = 'Sniper';
    public clone(): Trooper { return new Sniper(this); }
}

export class Doctor extends Trooper {
    public class = 'Doctor';
    public clone(): Trooper { return new Doctor(this); }
}

export class Pilot extends Trooper {
    public class = 'Pilot';
    public clone(): Trooper { return new Pilot(this); }
}

export class Commando extends Trooper {
    public class = 'Commando';
    public clone(): Trooper { return new Commando(this); }
}

export class Scout extends Trooper {
    public class = 'Scout';
    public clone(): Trooper { return new Scout(this); }
}

export class Spy extends Trooper {
    public class = 'Spy';
    public clone(): Trooper { return new Spy(this); }
}

export class Saboteur extends Trooper {
    public class = 'Saboteur';
    public clone(): Trooper { return new Saboteur(this); }
}

export class CommsOfficer extends Trooper {
    public class = 'Comms Officer';
    public clone(): Trooper { return new CommsOfficer(this); }
}

export class Rat extends Trooper {
    public class = 'Rat';
    public clone(): Trooper { return new Rat(this); }
}

export class Recruit extends Trooper {
    public class = 'Recruit';
    public clone(): Trooper { return new Recruit(this); }
}
