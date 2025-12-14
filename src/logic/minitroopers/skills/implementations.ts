import { skillManager, type SkillImplementation, type BattleContext } from '../systems/SkillSystem';
import type { Trooper } from '../types';
import type { Weapon } from '../classes/Skill';
import { SKILLS } from '../combat'; 
import { getDistance } from '../utils'; 

// --- Passive Skills ---

const Tank: SkillImplementation = {
    id: 'tank',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.maxHp += 20;
        trooper.attributes.hp += 20;
    }
};

const SniperTraining: SkillImplementation = {
    id: 'sniper',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.range += 2;
        trooper.attributes.critChance += 5;
    }
};

const DodgeMaster: SkillImplementation = {
    id: 'dodge_master',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.dodge += 10;
    }
};

const EagleEye: SkillImplementation = {
    id: 'eagle_eye',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.aim += 10;
    }
};

const Sprinter: SkillImplementation = {
    id: 'sprinter',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.initiative += 5;
    }
};

const Commando: SkillImplementation = {
    id: 'commando',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.initiative += 10;
    }
};

// --- Active Skills ---

const Doctor: SkillImplementation = {
    id: 'doctor',
    modifyStats: (trooper: Trooper) => {
        // Logic handled in onTurnStart
    },
    onBattleStart: (trooper: Trooper, context: BattleContext) => {
        const allies = context.allTroopers.filter(t => t.team === trooper.team);
        allies.forEach(a => {
            const bonus = 1 * (trooper.level || 1);
            a.attributes.maxHp += bonus;
            a.attributes.hp += bonus;
        });
        context.log.push({
            time: context.time,
            actorId: trooper.id,
            actorName: trooper.name,
            action: 'wait',
            message: `${trooper.name} (Doctor) buffs team HP (+${1 * (trooper.level || 1)})`
        });
    },
    onTurnStart: (trooper: Trooper, context: BattleContext): boolean => {
        // Heal Logic
        const { deployedA, deployedB, log, turn } = context;
        const allies = trooper.team === 'A' ? deployedA : deployedB;
        
        // Find wounded ally
        const woundedAlly = allies
            .filter(t => !t.isDead && t.id !== trooper.id && t.attributes.hp < t.attributes.maxHp * 0.5)
            .sort((a, b) => a.attributes.hp - b.attributes.hp)[0];

        if (woundedAlly) {
            const distToAlly = getDistance(trooper.position, woundedAlly.position);
            if (distToAlly <= 50) { // Melee range
                const healAmount = 15;
                woundedAlly.attributes.hp = Math.min(woundedAlly.attributes.maxHp, woundedAlly.attributes.hp + healAmount);
                
                log.push({
                    time: context.time, 
                    actorId: trooper.id, 
                    actorName: trooper.name, 
                    targetId: woundedAlly.id, 
                    targetName: woundedAlly.name,
                    action: 'heal', 
                    heal: healAmount, 
                    message: `${trooper.name} heals ${woundedAlly.name} for ${healAmount} HP.`
                });
                
                trooper.recoveryTime = 50; // Doctor action cost
                return true; // Action taken
            }
        }
        return false;
    }
};

const TriggerHappy: SkillImplementation = {
    id: 'trigger_happy',
    onTurnEnd: (trooper: Trooper, context: BattleContext) => {
        if (Math.random() < 0.2) {
            context.log.push({
                time: context.time, 
                actorId: trooper.id, 
                actorName: trooper.name,
                action: 'wait', 
                message: `${trooper.name} is Trigger Happy! (Bonus Action)`
            });
            trooper.cooldown = 0; // Reset cooldown
        }
    }
};

// --- New Passives (Phase 1) ---

const Smart: SkillImplementation = {
    id: 'smart',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.initiative += 5;
    }
};

const Vicious: SkillImplementation = {
    id: 'vicious',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.damage = (trooper.attributes.damage || 0) + 2;
    }
};

const ColdBlooded: SkillImplementation = {
    id: 'cold_blooded',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.aim += 10;
    }
};

const KingOfBoules: SkillImplementation = {
    id: 'king_of_boules',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.damage = (trooper.attributes.damage || 0) + 1;
    }
};

const Biped: SkillImplementation = {
    id: 'biped',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.speed += 10;
    }
};

const EyeOfTheTiger: SkillImplementation = {
    id: 'eye_of_the_tiger',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.critChance += 10;
        trooper.attributes.dodge += 5;
    }
};

const HeatSensor: SkillImplementation = {
    id: 'heat_sensor',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.aim += 15;
    }
};

const BarrelExtension: SkillImplementation = {
    id: 'barrel_extension',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.range += 1;
    }
};

const Compensator: SkillImplementation = {
    id: 'compensator',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.aim += 5;
    }
};

const Heartbreaker: SkillImplementation = {
    id: 'heartbreaker',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.critChance += 10;
    }
};

const Loader: SkillImplementation = {
    id: 'loader',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.reloadBonus = (trooper.attributes.reloadBonus || 0) + 1; // +1 Ammo per reload
    }
};

const OnPoint: SkillImplementation = {
    id: 'on_point',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.aim += 10;
    }
};

const Enthusiastic: SkillImplementation = {
    id: 'enthusiastic',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.initiative += 10;
    }
};

const ThermosOfCoffee: SkillImplementation = {
    id: 'thermos_of_coffee',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.initiative += 10;
        trooper.attributes.speed += 5;
    }
};

const Nervous: SkillImplementation = {
    id: 'nervous',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.initiative += 20;
        trooper.attributes.aim -= 10;
    }
};

const Hyperactive: SkillImplementation = {
    id: 'hyperactive',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.speed += 20;
    }
};

const AmphetamineShot: SkillImplementation = {
    id: 'amphetamine_shot',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.speed += 50;
        trooper.attributes.initiative += 20;
    }
};

const WifeBeater: SkillImplementation = {
    id: 'wife_beater',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.maxHp += 10;
        trooper.attributes.hp += 10;
    }
};

const Hurry: SkillImplementation = {
    id: 'hurry',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.speed += 15;
    }
};

const BattleReady: SkillImplementation = {
    id: 'battle_ready',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.initiative += 10;
    }
};

const Binoculars: SkillImplementation = {
    id: 'binoculars',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.range += 2;
        trooper.attributes.aim += 5;
    }
};

const FullMetalBalaclava: SkillImplementation = {
    id: 'full_metal_balaclava',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.armor += 1;
    }
};

const BulletproofVest: SkillImplementation = {
    id: 'bulletproof_vest',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.armor += 2;
    }
};

const HeavyArmor: SkillImplementation = {
    id: 'heavy_armor',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.armor += 4;
        trooper.attributes.speed -= 10;
    }
};

const HardBoiled: SkillImplementation = {
    id: 'hard_boiled',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.maxHp += 10;
        trooper.attributes.hp += 10;
        trooper.attributes.armor += 1;
    }
};

const LuckyCharm: SkillImplementation = {
    id: 'lucky_charm',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.critChance += 5;
        trooper.attributes.dodge += 5;
    }
};

const Dodger: SkillImplementation = {
    id: 'dodger',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.dodge += 15;
    }
};

const Camouflage: SkillImplementation = {
    id: 'camouflage',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.dodge += 10;
    }
};

const HugeCalves: SkillImplementation = {
    id: 'huge_calves',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.speed += 10;
        trooper.attributes.maxHp += 5;
        trooper.attributes.hp += 5;
    }
};

const BrickWall: SkillImplementation = {
    id: 'brick_shithouse',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.maxHp += 20;
        trooper.attributes.hp += 20;
        trooper.attributes.speed -= 5;
    }
};

const LaserSights: SkillImplementation = {
    id: 'laser_sights',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.aim += 20;
    }
};

const Anatomy: SkillImplementation = {
    id: 'anatomy',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.critChance += 15;
    }
};

const BlindFury: SkillImplementation = {
    id: 'blind_fury',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.damage = (trooper.attributes.damage || 0) + 5;
        trooper.attributes.aim -= 20;
    }
};

const NimbleFingers: SkillImplementation = {
    id: 'nimble_fingers',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.recoveryMod = (trooper.attributes.recoveryMod || 0) + 1; // Reduces cooldown by 1?
        // Or maybe it's a percentage?
        // Let's say recoveryMod is flat reduction for now.
    }
};

const Twinoid: SkillImplementation = {
    id: 'twinoid',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.initiative += 200;
        trooper.attributes.speed += 50;
    }
};

const Frenetic: SkillImplementation = {
    id: 'frenetic',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.speed += 20;
        trooper.attributes.initiative += 10;
    }
};

const Adrenaline: SkillImplementation = {
    id: 'adrenaline',
    onDamageTaken: (victim: Trooper, attacker: Trooper | undefined, damage: number, context: BattleContext) => {
        victim.attributes.initiative += 20;
        context.log.push({
            time: context.time,
            actorId: victim.id,
            actorName: victim.name,
            action: 'wait',
            message: `${victim.name} feels Adrenaline!`
        });
    }
};

const SurvivalInstinct: SkillImplementation = {
    id: 'survival_instinct',
    onBeforeAttack: (attacker: Trooper, target: Trooper, weapon: Weapon) => {
        if (target.attributes.hp < target.attributes.maxHp * 0.3) {
            target.attributes.dodge += 20;
        }
    }
};

// --- Phase 2: Combat Modifiers ---

const Juggler: SkillImplementation = {
    id: 'juggler',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.initiative += 5;
    }
};

const ReverseAttack: SkillImplementation = {
    id: 'reverse_attack',
    onDamageTaken: (victim: Trooper, attacker: Trooper | undefined, damage: number, context: BattleContext) => {
        if (attacker && !attacker.isDead && Math.random() < 0.2) {
            const counterDmg = Math.floor(damage * 0.5);
            attacker.attributes.hp = Math.max(0, attacker.attributes.hp - counterDmg);
            context.log.push({
                time: context.time,
                actorId: victim.id,
                actorName: victim.name,
                targetId: attacker.id,
                targetName: attacker.name,
                action: 'attack',
                damage: counterDmg,
                message: `${victim.name} REVERSES attack on ${attacker.name} for ${counterDmg} damage!`
            });
        }
    }
};

const Interception: SkillImplementation = {
    id: 'interception',
    // Placeholder
};

const FriendlyFire: SkillImplementation = {
    id: 'friendly_fire',
    // Placeholder
};

const Crybaby: SkillImplementation = {
    id: 'crybaby',
    onDamageTaken: (victim: Trooper, attacker: Trooper | undefined, damage: number, context: BattleContext) => {
        if (attacker) {
            attacker.attributes.initiative = Math.max(0, attacker.attributes.initiative - 10);
            context.log.push({
                time: context.time,
                actorId: victim.id,
                actorName: victim.name,
                action: 'wait',
                message: `${victim.name} cries! ${attacker.name} feels guilty (-10 Init).`
            });
        }
    }
};

const Survivor: SkillImplementation = {
    id: 'survivor',
    onDamageTaken: (victim: Trooper, attacker: Trooper | undefined, damage: number, context: BattleContext) => {
        if (victim.attributes.hp === 0 && Math.random() < 0.3) {
            victim.attributes.hp = 1;
            victim.isDead = false;
            context.log.push({
                time: context.time,
                actorId: victim.id,
                actorName: victim.name,
                action: 'wait',
                message: `${victim.name} refuses to die! (Survivor)`
            });
        }
    }
};

const Unforgiving: SkillImplementation = {
    id: 'unforgiving',
    onHit: (attacker: Trooper, target: Trooper, damage: number, context: BattleContext) => {
        if (target.isDead) {
            attacker.recoveryTime = 0;
            context.log.push({
                time: context.time,
                actorId: attacker.id,
                actorName: attacker.name,
                action: 'wait',
                message: `${attacker.name} is Unforgiving! (Reset Recovery)`
            });
        }
    }
};

const Faceboot: SkillImplementation = {
    id: 'faceboot',
    onBeforeAttack: (attacker: Trooper, target: Trooper, weapon: Weapon) => {
        // Placeholder
    }
};

const FistsOfFury: SkillImplementation = {
    id: 'fists_of_fury',
    // Placeholder
};

const Wrestler: SkillImplementation = {
    id: 'wrestler',
    // Placeholder
};

const Charge: SkillImplementation = {
    id: 'charge',
    onTurnStart: (trooper: Trooper, context: BattleContext): boolean => {
        return false;
    }
};

const Bait: SkillImplementation = {
    id: 'bait',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.aggro = 100;
    }
};

// --- Phase 3: Equipment & Shells ---

const GrenadeLogic = (id: string, name: string, effect: (enemies: Trooper[], center: {x: number, y: number}) => string): SkillImplementation => ({
    id,
    onTurnAction: (trooper: Trooper, context: BattleContext): boolean => {
        // Find the skill instance to check limit
        const skillInstance = trooper.skills.find(s => s.id === id);
        if (!skillInstance || (skillInstance as any).limit <= 0) return false;

        const { deployedA, deployedB, log, turn } = context;
        const enemies = trooper.team === 'A' ? deployedB : deployedA;
        const livingEnemies = enemies.filter(t => !t.isDead);
        
        if (livingEnemies.length === 0) return false;

        // Target logic: Cluster or Random?
        // Let's pick a random target for now, or the one with most neighbors.
        const target = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
        const dist = getDistance(trooper.position, target.position);
        
        if (dist <= 400) { // Throw range
            if (Math.random() < 0.3) { // 30% chance to use if available
                (skillInstance as any).limit--;
                
                const blastRadius = 100;
                const affected = livingEnemies.filter(e => getDistance(e.position, target.position) <= blastRadius);
                
                const effectMsg = effect(affected, target.position || {x: 0, y: 0});
                
                log.push({
                    time: context.time, 
                    actorId: trooper.id, 
                    actorName: trooper.name, 
                    targetId: target.id, 
                    targetName: target.name,
                    action: 'use_equipment', 
                    message: `${trooper.name} throws ${name}! ${effectMsg}`,
                    targetPosition: target.position
                });
                
                trooper.recoveryTime = 200;
                return true;
            }
        }
        return false;
    }
});

const FragGrenade = GrenadeLogic('frag_grenade', 'Frag Grenade', (enemies) => {
    let hits = 0;
    enemies.forEach(e => {
        const dmg = 20;
        e.attributes.hp = Math.max(0, e.attributes.hp - dmg);
        if (e.attributes.hp === 0) e.isDead = true;
        hits++;
    });
    return `Hit ${hits} enemies for 20 dmg.`;
});

const Flashbang = GrenadeLogic('flashbang', 'Flashbang', (enemies) => {
    enemies.forEach(e => {
        e.attributes.initiative = Math.max(0, e.attributes.initiative - 10);
        e.attributes.aim = Math.max(0, e.attributes.aim - 20);
    });
    return `Blinded ${enemies.length} enemies.`;
});

const GasGrenade = GrenadeLogic('gas_grenade', 'Gas Grenade', (enemies) => {
    enemies.forEach(e => {
        // Poison effect? Just direct damage for now or status?
        // Let's do direct damage + init malus
        e.attributes.hp = Math.max(0, e.attributes.hp - 10);
        e.attributes.initiative -= 5;
        if (e.attributes.hp === 0) e.isDead = true;
    });
    return `Poisoned ${enemies.length} enemies.`;
});

const GlueGrenade = GrenadeLogic('glue_grenade', 'Glue Grenade', (enemies) => {
    enemies.forEach(e => {
        e.attributes.speed = Math.max(0, e.attributes.speed - 20);
    });
    return `Slowed ${enemies.length} enemies.`;
});

const ShockGrenade = GrenadeLogic('shock_grenade', 'Shock Grenade', (enemies) => {
    enemies.forEach(e => {
        e.attributes.initiative = Math.max(0, e.attributes.initiative - 20);
        e.disarmed = e.disarmed || []; // Stun = disarm? Or just init?
        // Let's say stun = massive init penalty
    });
    return `Stunned ${enemies.length} enemies.`;
});

const HealingGrenade: SkillImplementation = {
    id: 'healing_grenade',
    onTurnAction: (trooper: Trooper, context: BattleContext): boolean => {
        const skillInstance = trooper.skills.find(s => s.id === 'healing_grenade');
        if (!skillInstance || (skillInstance as any).limit <= 0) return false;

        const { deployedA, deployedB, log, turn } = context;
        const allies = trooper.team === 'A' ? deployedA : deployedB;
        const woundedAllies = allies.filter(t => !t.isDead && t.attributes.hp < t.attributes.maxHp);
        
        if (woundedAllies.length > 0) {
             if (Math.random() < 0.4) {
                (skillInstance as any).limit--;
                const target = woundedAllies[Math.floor(Math.random() * woundedAllies.length)];
                const blastRadius = 100;
                const affected = allies.filter(e => !e.isDead && getDistance(e.position, target.position) <= blastRadius);
                
                affected.forEach(a => {
                    a.attributes.hp = Math.min(a.attributes.maxHp, a.attributes.hp + 20);
                });

                log.push({
                    time: context.time, 
                    actorId: trooper.id, 
                    actorName: trooper.name, 
                    action: 'use_equipment', 
                    message: `${trooper.name} throws Healing Grenade! Healed ${affected.length} allies.`,
                    targetPosition: target.position
                });
                
                trooper.recoveryTime = 200;
                return true;
             }
        }
        return false;
    }
};

const ExplosiveShells: SkillImplementation = {
    id: 'explosive_shells',
    onHit: (attacker: Trooper, target: Trooper, damage: number, context: BattleContext) => {
        // AoE damage around target
        const { deployedA, deployedB } = context;
        const enemies = target.team === 'A' ? deployedA : deployedB; // Friendly fire? No, usually enemies.
        // Wait, target is enemy. So enemies of attacker are target's team.
        const nearby = enemies.filter(e => !e.isDead && e.id !== target.id && getDistance(e.position, target.position) <= 50);
        
        nearby.forEach(e => {
            const splash = Math.floor(damage * 0.5);
            e.attributes.hp = Math.max(0, e.attributes.hp - splash);
            if (e.attributes.hp === 0) e.isDead = true;
            context.log.push({
                time: context.time,
                actorId: attacker.id,
                actorName: attacker.name,
                targetId: e.id,
                targetName: e.name,
                action: 'attack',
                damage: splash,
                message: `${attacker.name}'s Explosive Shell hits ${e.name} for ${splash} splash damage.`
            });
        });
    }
};

const HydroshockShells: SkillImplementation = {
    id: 'hydroshock_shells',
    onHit: (attacker: Trooper, target: Trooper, damage: number, context: BattleContext) => {
        // Chance to stun? Or just extra damage?
        // Wiki: "Increases chance to stun".
        if (Math.random() < 0.2) {
            target.attributes.initiative -= 10;
            context.log.push({
                time: context.time,
                actorId: attacker.id,
                actorName: attacker.name,
                targetId: target.id,
                targetName: target.name,
                action: 'wait',
                message: `${target.name} is shocked by Hydroshock Shells!`
            });
        }
    }
};

const ParalysingShells: SkillImplementation = {
    id: 'paralysing_shells',
    onHit: (attacker: Trooper, target: Trooper, damage: number, context: BattleContext) => {
        if (Math.random() < 0.1) {
            target.recoveryTime = (target.recoveryTime || 0) + 200; // Stun for 200 ticks
             context.log.push({
                time: context.time,
                actorId: attacker.id,
                actorName: attacker.name,
                targetId: target.id,
                targetName: target.name,
                action: 'wait',
                message: `${target.name} is PARALYZED!`
            });
        }
    }
};

const ToxicShells: SkillImplementation = {
    id: 'toxic_shells',
    onHit: (attacker: Trooper, target: Trooper, damage: number, context: BattleContext) => {
        // Poison logic?
        // Just extra damage for now.
        target.attributes.hp = Math.max(0, target.attributes.hp - 5);
        if (target.attributes.hp === 0) target.isDead = true;
    }
};

const ArmorPiercingShells: SkillImplementation = {
    id: 'armor_piercing_shells',
    onBeforeAttack: (attacker: Trooper, target: Trooper, weapon: Weapon) => {
        // Ignore armor?
        // We can't modify armor easily here without resetting it.
        // But we can modify damage in onHit? No, damage is calculated before onHit usually?
        // Wait, onHit receives calculated damage.
        // onBeforeAttack can modify target attributes temporarily?
        // Let's reduce armor temporarily.
        // But we need to restore it.
        // SkillSystem doesn't support "onAfterAttack".
        // Maybe just reduce it permanently? Armor damage is a thing.
        target.attributes.armor = Math.max(0, target.attributes.armor - 1);
    }
};

// Register Skills


// --- Phase 4: Specializations & Vehicles ---

const Soldier: SkillImplementation = {
    id: 'soldier',
    modifyStats: (trooper: Trooper) => {
        const bonus = 1 * (trooper.level || 1);
        trooper.attributes.maxHp += bonus;
        trooper.attributes.hp += bonus;
    }
};

const DoctorPassive: SkillImplementation = {
    id: 'doctor_passive_placeholder', // Renamed to avoid ID conflict, but logic moved to Doctor
    modifyStats: (trooper: Trooper) => {} 
};

const Pilot: SkillImplementation = {
    id: 'pilot',
    modifyStats: (trooper: Trooper) => {
        // Passive effect handled in Vehicle logic
    }
};

const Scout: SkillImplementation = {
    id: 'scout',
    modifyStats: (trooper: Trooper) => {
        trooper.attributes.deploymentLimitBonus = 1;
    }
};

const Spy: SkillImplementation = {
    id: 'spy',
    onDeploy: (trooper: Trooper, context: BattleContext) => {
        // Switch team
        const originalTeam = trooper.team;
        const newTeam = originalTeam === 'A' ? 'B' : 'A';
        
        // Only switch if not already switched (idempotency)
        // But onDeploy is called once.
        
        // Move from deployed list
        const sourceList = originalTeam === 'A' ? context.deployedA : context.deployedB;
        const targetList = originalTeam === 'A' ? context.deployedB : context.deployedA;
        
        const index = sourceList.findIndex(t => t === trooper);
        if (index !== -1) {
            sourceList.splice(index, 1);
            targetList.push(trooper);
            trooper.team = newTeam;
            
            // Update position (random in enemy zone)
            const x = newTeam === 'A' ? Math.floor(Math.random() * 200) : 800 + Math.floor(Math.random() * 200);
            trooper.position = { x, y: 0 };
            
            context.log.push({
                time: context.time,
                actorId: trooper.id,
                actorName: trooper.name,
                action: 'move',
                message: `${trooper.name} (Spy) infiltrates enemy lines!`
            });
        }
    }
};

const Saboteur: SkillImplementation = {
    id: 'saboteur',
    onBattleStart: (trooper: Trooper, context: BattleContext) => {
        const enemies = context.allTroopers.filter(t => t.team !== trooper.team);
        const numSabotaged = 3;
        let sabotagedCount = 0;
        
        for (let i = 0; i < numSabotaged; i++) {
            if (enemies.length === 0) break;
            const victimIndex = Math.floor(Math.random() * enemies.length);
            const victim = enemies[victimIndex];
            
            const weapons = victim.skills.filter(s => (s as any).damage !== undefined);
            if (weapons.length > 0) {
                const weapon = weapons[Math.floor(Math.random() * weapons.length)];
                if (!context.jammedWeapons.has(victim.id)) context.jammedWeapons.set(victim.id, []);
                context.jammedWeapons.get(victim.id)!.push(weapon.id);
                sabotagedCount++;
            }
        }
        
        if (sabotagedCount > 0) {
            context.log.push({
                time: 0,
                actorId: trooper.id,
                actorName: trooper.name,
                action: 'wait',
                message: `${trooper.name} sabotages ${sabotagedCount} enemy weapons!`
            });
        }
    }
};

const CommsOfficer: SkillImplementation = {
    id: 'comms_officer',
    onBattleStart: (trooper: Trooper, context: BattleContext) => {
        const allies = context.allTroopers.filter(t => t.team === trooper.team && t.id !== trooper.id);
        allies.forEach(a => {
            a.attributes.initiative += 5;
            a.attributes.speed += 1;
        });
        context.log.push({
            time: 0,
            actorId: trooper.id,
            actorName: trooper.name,
            action: 'wait',
            message: `${trooper.name} coordinates the team! (+Init/Speed to allies)`
        });
    }
};

// Vehicle Logic Helper
const deployVehicle = (trooper: Trooper, context: BattleContext, name: string, hpBonus: number, armorBonus: number, weapon: Weapon | null, speedBonus: number = 0) => {
    let chance = 0.25; // Base chance
    if (trooper.skills.some(s => s.id === 'pilot')) chance += 0.25;
    
    if (Math.random() < chance) {
        trooper.attributes.maxHp += hpBonus;
        trooper.attributes.hp += hpBonus;
        trooper.attributes.armor += armorBonus;
        trooper.attributes.speed += speedBonus;
        
        if (weapon) {
            trooper.skills.unshift(weapon); // Add as primary
            trooper.currentWeaponId = weapon.id;
        }
        
        context.log.push({
            time: context.time,
            actorId: trooper.id,
            actorName: trooper.name,
            action: 'deploy',
            message: `${trooper.name} deploys in a ${name}!`
        });
    }
};

const LightTank: SkillImplementation = {
    id: 'light_tank',
    onDeploy: (trooper: Trooper, context: BattleContext) => {
        const tankGun: Weapon = { id: 'tank_gun', name: 'Tank Gun', description: '', icon: '', damage: 20, range: 10, recovery: 20, aim: 80, crit: 10 } as any;
        deployVehicle(trooper, context, 'Light Tank', 100, 20, tankGun);
    }
};

const HeavyTank: SkillImplementation = {
    id: 'heavy_tank',
    onDeploy: (trooper: Trooper, context: BattleContext) => {
        const heavyGun: Weapon = { id: 'heavy_tank_gun', name: 'Heavy Tank Gun', description: '', icon: '', damage: 40, range: 10, recovery: 30, aim: 80, crit: 10 } as any;
        deployVehicle(trooper, context, 'Heavy Tank', 200, 40, heavyGun);
    }
};

const Helicopter: SkillImplementation = {
    id: 'helicopter',
    onDeploy: (trooper: Trooper, context: BattleContext) => {
        const machineGun: Weapon = { id: 'heli_machine_gun', name: 'Machine Gun', description: '', icon: '', damage: 6, range: 8, recovery: 5, aim: 70, bursts: 5 } as any;
        deployVehicle(trooper, context, 'Helicopter', 50, 10, machineGun);
        // Flying logic?
    }
};

const Motorcycle: SkillImplementation = {
    id: 'motorcycle',
    onDeploy: (trooper: Trooper, context: BattleContext) => {
        deployVehicle(trooper, context, 'Motorcycle', 0, 0, null, 50);
        trooper.attributes.initiative += 20;
    }
};

// Register Skills
export const registerCoreSkills = () => {
    skillManager.register(Tank);
    skillManager.register(SniperTraining);
    skillManager.register(DodgeMaster);
    skillManager.register(EagleEye);
    skillManager.register(Sprinter);
    skillManager.register(Commando);
    skillManager.register(Doctor);
    skillManager.register(TriggerHappy);
    
    // Phase 1
    skillManager.register(Smart);
    skillManager.register(Vicious);
    skillManager.register(ColdBlooded);
    skillManager.register(KingOfBoules);
    skillManager.register(Biped);
    skillManager.register(EyeOfTheTiger);
    skillManager.register(HeatSensor);
    skillManager.register(BarrelExtension);
    skillManager.register(Compensator);
    skillManager.register(Heartbreaker);
    skillManager.register(OnPoint);
    skillManager.register(Enthusiastic);
    skillManager.register(ThermosOfCoffee);
    skillManager.register(Nervous);
    skillManager.register(Hyperactive);
    skillManager.register(AmphetamineShot);
    skillManager.register(WifeBeater);
    skillManager.register(Hurry);
    skillManager.register(BattleReady);
    skillManager.register(Binoculars);
    skillManager.register(FullMetalBalaclava);
    skillManager.register(BulletproofVest);
    skillManager.register(HeavyArmor);
    skillManager.register(HardBoiled);
    skillManager.register(LuckyCharm);
    skillManager.register(Dodger);
    skillManager.register(Camouflage);
    skillManager.register(HugeCalves);
    skillManager.register(BrickWall);
    skillManager.register(LaserSights);
    skillManager.register(Anatomy);
    skillManager.register(BlindFury);
    skillManager.register(Twinoid);
    skillManager.register(SurvivalInstinct);
    skillManager.register(Juggler);

    // Phase 2
    skillManager.register(ReverseAttack);
    skillManager.register(Crybaby);
    skillManager.register(Survivor);
    skillManager.register(Unforgiving);
    skillManager.register(Bait);

    // Phase 3
    skillManager.register(FragGrenade);
    skillManager.register(Flashbang);
    skillManager.register(GasGrenade);
    skillManager.register(GlueGrenade);
    skillManager.register(ShockGrenade);
    skillManager.register(HealingGrenade);
    skillManager.register(ExplosiveShells);
    skillManager.register(HydroshockShells);
    skillManager.register(ParalysingShells);
    skillManager.register(ToxicShells);
    skillManager.register(ArmorPiercingShells);

    // Phase 4
    skillManager.register(Soldier);
    skillManager.register(Pilot);
    skillManager.register(Scout);
    skillManager.register(Spy);
    skillManager.register(Saboteur);
    skillManager.register(CommsOfficer);
    skillManager.register(LightTank);
    skillManager.register(HeavyTank);
    skillManager.register(Helicopter);
    skillManager.register(Motorcycle);
};
