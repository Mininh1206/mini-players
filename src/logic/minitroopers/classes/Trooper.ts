
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
        
        this.disarmed = data.disarmed ? [...data.disarmed] : [];
        this.jammedWeapons = data.jammedWeapons ? [...data.jammedWeapons] : [];
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
            const def = ALL_SKILLS_DEFS.find((d: { id: any; }) => d.id === s.id);
            return def instanceof Weapon;
        };
        const isUsableMainWeapon = (s: any) => isMainWeapon(s) && isUsable(s);


        // --- Burst Fire Continuation ---
        if (this.burstState) {
            const { shotsRemaining, targetId, weaponId } = this.burstState;
            const target = allTroopers.find(t => t.id === targetId);
            const weapon = this.skills.find(s => s.id === weaponId) as Weapon;

            if (target && !target.isDead && weapon && shotsRemaining > 0) {
                 if (resolveWeaponShot) resolveWeaponShot(this, target, weapon, context);
                 if (this.ammo?.[weaponId]) this.ammo[weaponId]--;
                 
                 this.burstState.shotsRemaining--;
                 if (this.burstState.shotsRemaining <= 0) {
                     this.burstState = undefined;
                 }
                 this.recoveryTime = 4;
                 actionTaken = true;
                 return true; // Turn done
            } else {
                this.burstState = undefined; // Cancel burst
            }
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
        let equippedWeapon = this.skills.find(s => s.id === this.currentWeaponId) as Weapon | undefined;
        
        // Auto-equip if none or invalid
        if (!equippedWeapon) {
            const weapons = this.skills.filter(isUsableMainWeapon);
            if (weapons.length > 0) {
                equippedWeapon = weapons[0] as Weapon;
                this.currentWeaponId = equippedWeapon.id;
            }
        }

        // --- Logic Tree ---

        // 0. Force Switch (Jammed/Disarmed)
        if (equippedWeapon && !isUsable(equippedWeapon)) {
              const available = this.skills.filter(isUsableMainWeapon) as Weapon[];
              if (available.length > 0) {
                  const favId = this.tactics?.favoriteWeaponId;
                  available.sort((a, b) => {
                      if (a.id === favId) return -1;
                      if (b.id === favId) return 1;
                      return 0;
                  });
                  this.currentWeaponId = available[0].id;
                  equippedWeapon = available[0];
                   log.push({ 
                      time, actorId: this.id, actorName: this.name, action: 'switch_weapon', 
                      message: `${this.name} switches to ${equippedWeapon.name} (Weapon Broken!)`,
                      data: { weaponId: equippedWeapon.id }
                   });
                   this.actionTimer! += 200;
                   actionTaken = true;
              } else {
                  // Fists
                  const fists = this.skills.find(s => s.id === 'fists');
                  if (fists) {
                       this.currentWeaponId = fists.id;
                       equippedWeapon = fists as Weapon;
                       log.push({ 
                          time, actorId: this.id, actorName: this.name, action: 'switch_weapon', 
                          message: `${this.name} switches to Fists (Weapons lost or jammed!)`,
                          data: { weaponId: fists.id }
                       });
                       this.actionTimer! += 100;
                       actionTaken = true;
                  } else {
                       // Truly unarmed (shouldn't happen with injection)
                       delete this.currentWeaponId;
                       equippedWeapon = undefined;
                       actionTaken = true; // Skip turn or flee?
                  }
              }
        }

        // Tactics: Switch to Favorite
        const favId = this.tactics?.favoriteWeaponId;
        if (favId && this.currentWeaponId !== favId && !actionTaken) {
             const favWeapon = this.skills.find(s => s.id === favId) as Weapon;
             const canUse = favWeapon && isUsableMainWeapon(favWeapon) && (this.ammo?.[favId] ?? 0) > 0;
             if (canUse) {
                 // Safety Check
                 let isSafe = true;
                 const rangeMin = (favWeapon as any).rangeMin ?? 0;
                 const area = (favWeapon as any).area ?? 0;
                 if (area > 0 && dist <= area * 1.2) isSafe = false;
                 if (rangeMin > 0 && dist < rangeMin * 100) isSafe = false;
                 
                 if (isSafe) {
                     this.currentWeaponId = favId;
                     equippedWeapon = favWeapon;
                     log.push({ time, actorId: this.id, actorName: this.name, action: 'switch_weapon', message: `${this.name} draws favorite ${favWeapon.name}.` });
                     this.actionTimer! += 200;
                     actionTaken = true;
                 }
             }
        }

        // Tactics: Grenade
        if (!actionTaken) {
              const grenades = this.skills.filter(s => {
                  const def = ALL_SKILLS_DEFS.find(d => d.id === s.id);
                  return def instanceof Grenade;
              }) as Grenade[];
              
              const validGrenade = grenades.find(g => {
                   const def = ALL_SKILLS_DEFS.find(d => d.id === g.id) as Grenade;
                   return (this.ammo?.[g.id] ?? 0) > 0 && dist <= (def.range * 100) && !this.isWeaponJammed(g.id);
              });

              if (validGrenade && Math.random() < 0.35) {
                   const def = ALL_SKILLS_DEFS.find(d => d.id === validGrenade.id) as Grenade;
                   if (resolveWeaponShot) resolveWeaponShot(this, target as Trooper, def, context);
                   if (this.ammo?.[validGrenade.id]) this.ammo[validGrenade.id]--;
                   this.recoveryTime = 20;
                   actionTaken = true;
                   return true;
              }
        }

        // AI Logic: Safety/Distance
        if (!actionTaken) {
             this.isMoving = false;
             let tooClose = false;
             if (equippedWeapon && (equippedWeapon as any).area > 0) {
                 if (dist <= (equippedWeapon as any).area * 1.2) tooClose = true;
             }
             if (equippedWeapon && (equippedWeapon as any).rangeMin && dist < ((equippedWeapon as any).rangeMin * 100)) {
                 tooClose = true;
             }

             if (tooClose) {
                  // Switch or Retreat
                 const safeWeapon = this.skills.find(s =>
                     (s as any).damage &&
                     !(s as any).area && // No AoE
                     (!((s as any).rangeMin) || dist >= ((s as any).rangeMin * 100)) && // Respect Min Range
                     (this.ammo?.[s.id] || 0) > 0 &&
                     isUsableMainWeapon(s)
                 );
                 
                 if (safeWeapon) {
                     this.currentWeaponId = safeWeapon.id;
                     equippedWeapon = safeWeapon as Weapon;
                     log.push({ time, actorId: this.id, actorName: this.name, action: 'switch_weapon', message: `${this.name} switches weapon (Target too close!).` });
                     this.actionTimer! += 200;
                     actionTaken = true;
                 } else {
                     // Panic/Retreat in place
                     this.performPanicOrRetreat(target as Trooper, dist, log, time, equippedWeapon);
                     actionTaken = true;
                 }
             }
        }

        // Attack
        if (!actionTaken && equippedWeapon) {
             const usable = isUsable(equippedWeapon);
             const range = ((equippedWeapon as any).range || 1) * 100;
             const ammo = this.ammo?.[equippedWeapon.id] || 0;
             
             if (usable && dist <= range && ammo > 0) {
                 const lofBlocked = false; 
                 if (!lofBlocked) {
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
        if (!actionTaken && dist <= 50) {
               const damage = 5 + (this.attributes.damage || 0);
               (target as Trooper).attributes.hp = Math.max(0, (target as Trooper).attributes.hp - damage);
               if ((target as Trooper).attributes.hp === 0) (target as Trooper).isDead = true;
               log.push({ time, actorId: this.id, actorName: this.name, action: 'attack', targetId: target!.id, damage, message: `${this.name} punches ${target!.name}!` });
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

    private isWeaponJammed(weaponId: string): boolean {
        return this.jammedWeapons?.includes(weaponId) || false;
    }

    private performPanicOrRetreat(target: Trooper, dist: number, log: any[], time: number, equippedWeapon?: Weapon) {
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
