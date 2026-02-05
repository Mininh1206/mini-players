
import { v4 as uuidv4 } from 'uuid';
import type { TrooperData, TrooperAttributes, Skill, TrooperVehicle, Wounds, BattleResult, BattleLogEntry, BodyPart } from '../types';
import type { BattleContext } from '../systems/SkillSystem';
import { skillManager } from '../systems/SkillSystem';
import { getDistance } from '../utils';
import { SKILLS as ALL_SKILLS_IDS } from '../combat'; 
import { Weapon, Grenade, SniperRifle, Launcher, Shotgun, AssaultRifle, MachineGun, Handgun, Melee } from './Skill';
import { SKILLS as ALL_SKILLS_DEFS } from '../skills';

// Helper to determine optimal distance (in pixels)
// NOTE: weapon.range is already in grid units where 1 unit ~ 100px
const getOptimalRetreatDistance = (weapon: Weapon): number => {
    const maxRange = (weapon.range || 1) * 100; // Convert to pixels
    const minRange = (weapon.rangeMin || 0) * 100; // Convert to pixels
    
    if (weapon instanceof SniperRifle) {
        // Sniper optimal: Stay at 70% of max range, but definitely above minRange
        return Math.max(minRange + 100, maxRange * 0.7);
    }
    if (weapon instanceof Launcher) return minRange + 150; // Outside blast + safety
    if (weapon instanceof Shotgun) return minRange + 120; // Safe from melee + some space
    if (weapon instanceof AssaultRifle || weapon instanceof MachineGun) return maxRange * 0.5; // Mid range
    if (weapon instanceof Handgun) return maxRange * 0.4;
    return 0; // Melee or unknown
};

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



        // Initialize Ammo & Reserves
        this.skills.forEach(s => {
            const def = ALL_SKILLS_DEFS.find((d: { id: any; }) => d.id === s.id);
            if (def instanceof Weapon) {
                const w = def as Weapon;
                // Base Ammo
                if (!this.ammo) this.ammo = {};
                if (this.ammo[w.id] === undefined) {
                    this.ammo[w.id] = w.capacity;
                }
                
                // Base Reserves (Default 3 clips)
                if (!this.reserves) this.reserves = {};
                // Only set if not already set (preserve custom/saved state)
                if (this.reserves[w.id] === undefined) {
                    this.reserves[w.id] = w.capacity * 3;
                }
            }
        });
        // NOTE: Don't auto-equip weapon here - let troopers deploy unarmed
        // and equip their weapon as first combat action (like original game)
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
            if (s && typeof s === 'object' && s.constructor?.name === 'Weapon') return true;
            // Also check for quacking like a weapon (has damage, range, aim)
            if (s && typeof s.damage === 'number' && typeof s.range === 'number' && typeof s.aim === 'number') return true;
            
            const def = ALL_SKILLS_DEFS.find((d: { id: any; }) => d.id === s.id);
            return def instanceof Weapon;
        };
        const isUsableMainWeapon = (s: any) => isMainWeapon(s) && isUsable(s);


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

            // SPY AI: Heavily penalize Fists/Melee if we have ranged options and are decent distance
            if (this.class === 'Spy') {
                const isMelee = (w as any).range <= 1;
                if (!isMelee) score += 50; // Bias towards Ranged
                else if (availableWeapons.some(o => (o as any).range > 1 && isUsable(o))) {
                     score -= 50; // Bias against fists if we have gun
                }
            }

            // AMMO LOGIC
            const ammo = this.ammo?.[w.id] ?? 0;
            const reserves = this.reserves?.[w.id] ?? 0;
            const isUnlimited = (w as any).isUnlimited;

            if (!isUnlimited) {
                if (ammo <= 0) {
                    if (reserves <= 0) {
                        return 0.1; // Effectively useless, but keep >0 to prevent weird fallback bugs? No, 0.1 is fine.
                    } else {
                        score *= 0.8; // Penalize for reload time requirement
                    }
                }
            }

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
            } else if (!isUnlimited && ammo <= 0 && availableWeapons.some(w => (this.ammo?.[w.id] ?? 0) > 0 || (w as any).isUnlimited)) {
                // Determine if we should switch or reload
                const reserves = this.reserves?.[currentWeapon.id] ?? 0;
                
                // Switch if NO reserves, OR if we have another weapon and reloading is not an option (e.g. strict melee logic?)
                // Default: If we have reserves, prefer Reload (handled later) UNLESS we are in melee range and current is sniper?
                // But generally, don't force switch if we can reload.
                if (reserves <= 0) {
                    shouldSwitch = true;
                    switchReason = 'no_ammo';
                }
            }
        } else {
             shouldSwitch = true; // No weapon equipped
             switchReason = 'none_equipped';
        }

        // Check 2: Optimization (Better weapon for range?)
        let bestWeapon = currentWeapon;
        if (!shouldSwitch && currentWeapon) {
             const optimalDist = getOptimalRetreatDistance(currentWeapon);
             const canRetreat = optimalDist > 0 && dist < optimalDist && (this.attributes.speed || 0) > 0;
             
             if (canRetreat) {
                 // Calculate urgency
                 const urgency = 1 - (dist / optimalDist); // Closer = Higher urgency (0 to 1)
                 const retreatScore = 50 + (urgency * 100); // Base 50 + up to 100 bonus
                 
                 // Compare with current weapon score
                 // If weapon is useless (rangeMin violation), its score is low.
                 // If weapon is good but we want to be safer...
                 
                 // Compare with Switch Score (if applicable)
                 // bestAlt logic already computed bestAlt.
                 
                 const switchScore = shouldSwitch ? 200 : 0; // Force switch is high priority (200?).
                 // If retreat score is higher than switch score?
                 // Or rather: if We verify Switch is better, we Switch. 
                 // If NOT switching, we check Retreat.
                 
                 // BUT: Sometimes Retreat is BETTER than Switch (e.g. Sniper at 50px).
                 // Switch to Fists (Score 10?) vs Retreat to 800px (Score 150?).
                 
                 // Let's refine:
                 // If we have a secondary, we might switch.
                 // If secondary is Fists, Retreat usually better unless cornered.
                 
                 if (!shouldSwitch || (retreatScore > 100 && availableWeapons.length <= 1)) {
                     // If we are NOT forced to switch (empty ammo), OR if we are forced but Retreat is critical and we have no good backup.
                     // Actually, if Out of Ammo (shouldSwitch=true), we MUST switch or Reload. Retreating won't help ammo.
                     // So Retreat only if has ammo?
                     // Or Retreat to reload safely?
                     
                     // Let's keep it simple:
                     // Priority: 
                     // 1. Force Switch (No Ammo) -> UNLESS Reload possible (already handled).
                     // 2. Retreat (Safety) -> If weapon loaded but too close.
                     // 3. Switch (Optimization) -> If another weapon is better at this range.
                     
                     // If current weapon has ammo:
                     if ((this.ammo?.[currentWeapon.id] || 0) > 0) {
                         // Check Retreat Score vs Switch Optimization
                         let bestAltScore = 0;
                         if (availableWeapons.length > 1) {
                             const bestAlt = availableWeapons.reduce((prev, curr) => getWeaponScore(curr, dist) > getWeaponScore(prev, dist) ? curr : prev, currentWeapon);
                             bestAltScore = getWeaponScore(bestAlt, dist);
                         }
                         
                         const curScore = getWeaponScore(currentWeapon, dist);
                         
                         // If Retreat is high value (e.g. Sniper in face), we prefer it provided we can move.
                         if (retreatScore > bestAltScore && retreatScore > curScore) {
                             this.performRetreat(target, optimalDist, log, time);
                             return true; // End turn
                         }
                     }
                 }
             }

             // Switch Logic (Existing)
             if (!shouldSwitch && availableWeapons.length > 1) {
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
                     if (switchReason === 'none_equipped') msg = `${this.name} raises ${newWeapon.name}!`;
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
                 // No weapons available - will use unarmed melee below
                 this.currentWeaponId = undefined;
            }
        }

        // Ensure currentWeapon is up to date for attack logic
        let equippedWeapon = (this.skills.find(s => s.id === this.currentWeaponId) || ALL_SKILLS_DEFS.find((d: { id: any; }) => d.id === this.currentWeaponId)) as Weapon | undefined;

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
                } else if ((target as Trooper).isDead) {
                      // Target died while we were aiming/moving in this same tick? 
                      // Or just a safety check. If dead, we should re-target next turn or try to find another now?
                      // For simplicity, just yield turn (timer not reset usually? Or reset slightly?)
                      // Actually, if we return false, we might loop again?
                      // Let's just do nothing and return false to let AI pick new target next tick?
                      // But actionTimer was consumed! We lose the turn?
                      // Better: Find new target immediately?
                      // The AI logic (targeting) happened at start of playTurn.
                      // If 'target' is dead now, it means it was dead at start of playTurn?
                      // No, playTurn line 227 filters !isDead.
                      // So target MUST be alive at line 227.
                      // Is it possible it dies between 227 and 401?
                      // No, playTurn is synchronous.
                      // UNLESS: The 'checkLineOfFire' logic somehow mutated it? No.
                      
                      // WAIT. The user says "if they killed an enemy, but an ally was aiming at him".
                      // This implies BURST logic overlap or previous-tick targeting persistence?
                      // Ah, `Trooper.ts` playTurn is atomic per tick.
                      
                      // BUT `combat.ts` loop:
                      // for (const actor of allTroopers) {
                      //    playTurn()
                      // }
                      
                      // If Actor A kills Target T.
                      // Then Actor B (later in loop) playTurn() calls targeting.
                      // Targeting filters !isDead. So Actor B see T as dead.
                      // So Actor B should NOT target T.
                      
                      // CASE: Actor B has `burstState` targeting T.
                      // `combat.ts` handles burst state.
                      // Let's look at `combat.ts` burst handling (lines 200-230).
                      // It checks `if (target && !target.isDead ...)`
                      // So Burst SHOULD stop if target is dead.
                      
                      // Is there any other state?
                      // Maybe `pendingChoices`? No.
                      
                      // Let's double check `combat.ts` logic again.
                      // Line 208: `if (target && !target.isDead && ...)`
                      // If target IS DEAD, it goes to `else` (Line 224).
                      // Line 224: `Burst Interrupted`. Deletes burstState.
                      // AND `continue`.
                      // So it skips the rest of the turn. Correct.
                      
                      // SO why does user say they shoot dead?
                      // Maybe the "Death" status isn't set immediately?
                      // `applyDamage` sets `isDead = true` if hp <= 0.
                      
                      // Maybe the Battle Loop victory check is the issue?
                      // User: "the battle doesn't end until that trooper finishes shooting"
                      // This implies the LOOP continues even if one team is dead.
                      
                      // `combat.ts` Line 170: `if (allTroopers.length === 0) break;` (Safety)
                      // The while loop condition: `(deployedA.length > 0 ... && deployedB.length > 0 ...)`
                      // This is checked at START of tick (Line 161).
                      // Inside the `for (const actor of allTroopers)` loop:
                      // It iterates ALL actors. Even if Team B is wiped out by Actor A (index 0),
                      // Actor C (index 5) will still act in this tick because the loop finishes!
                      
                      // FIX: Add victory check INSIDE the loop!
                      
                      // AND: Check target death in `playTurn` just in case targeting logic picked a dying unit (unlikely if atomic).
                      // But purely for safety, I will add the check here.
                      if ((target as Trooper).isDead) { // Should not happen if targeting filtered correctly
                           // Force retarget next time
                           actionTaken = false; 
                      } else {
                          const bursts = (equippedWeapon as any).bursts || 1;
                          if (resolveWeaponShot) resolveWeaponShot(this, target as Trooper, equippedWeapon, context);
                          // ...
                     }
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
        // Reload logic (Single Bullet)
        if (!actionTaken && equippedWeapon && isUsableMainWeapon(equippedWeapon)) {
               const currentAmmo = this.ammo?.[equippedWeapon.id] || 0;
               const capacity = (equippedWeapon as any).capacity || 1;
               const reserves = this.reserves?.[equippedWeapon.id] || 0;
               
               // Reload if not full and has reserves.
               // We rely on the AI Priorities (above) to "Interrupt" this loop if a better action (Attack) is available.
               // e.g. If enemy is in range and ammo > 0, Attack logic (lines 409+) would typically fire first?
               // Wait, Attack logic runs IF `usable && dist <= range && ammo > 0`.
               // So if we have 1 bullet, Attack fires.
               // If we have 0 bullets, Attack skips. Reload fires.
               // -> Good: Reloads when necessary.
               // -> But user wants to TOP UP ("recargase de 1 en 1").
               // If I have 1 bullet and enemy is far, I should Reload.
               // Attack logic requires `dist <= range`.
               // So if `dist > range` (Enemy Far), Attack skips. Reload fires. -> Good (Top Up).
               // If `dist <= range` (Enemy Close) AND `ammo > 0`: Attack fires. -> Good (Interrupt).
               
               if (currentAmmo < capacity && reserves > 0) {
                   this.ammo![equippedWeapon.id] = currentAmmo + 1;
                   this.reserves![equippedWeapon.id] = reserves - 1;
                   log.push({ time, actorId: this.id, actorName: this.name, action: 'reload', message: `${this.name} reloads (1).` });
                   this.recoveryTime = 5; // Faster for single bullet
                   actionTaken = true;
               }
        }
        
        // Unarmed Melee (when no weapon equipped)
        if (!actionTaken && dist <= 50 && target && target.team !== this.team) {
                // Use trooper's own damage attribute (1-3 base for unarmed)
                const baseDamage = 1 + Math.floor(Math.random() * 3); // 1-3
                const damage = baseDamage + (this.attributes.damage || 0);
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



    private performRetreat(target: Trooper, optimalDist: number, log: any[], time: number) {
        // Calculate vector away from target
        const angle = Math.atan2((this.position!.y) - (target.position!.y), (this.position!.x) - (target.position!.x));
        const moveSpeed = (this.attributes.speed || 100) / 2; // Normal move speed (retreat is same speed?)
        
        // Move towards safety
        // We want to reach optimalDist. 
        // dx, dy to add.
        const moveX = Math.cos(angle) * moveSpeed;
        const moveY = Math.sin(angle) * moveSpeed;
        
        this.position!.x = Math.max(0, Math.min(1000, this.position!.x + moveX));
        this.position!.y = Math.max(0, Math.min(400, this.position!.y + moveY));
        
        this.isMoving = true;
        log.push({ 
            time, 
            actorId: this.id, 
            actorName: this.name, 
            action: 'move', 
            targetPosition: { ...this.position! }, 
            message: `${this.name} falls back to better range!` 
        });
        this.recoveryTime = 10;
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
