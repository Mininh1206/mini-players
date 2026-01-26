/**
 * Combat System Constants
 * Centralized magic numbers for better maintainability
 */

// --- Action & Turn System ---
export const ACTION_THRESHOLD = 1000;  // Timer threshold to take action
export const DEFAULT_ACTION_TIMER_VARIANCE = 500;  // Random start stagger

// --- Distance & Range ---
export const MELEE_RANGE = 50;  // Pixels for melee attack range
export const RANGE_MULTIPLIER = 100;  // Weapon range * this = pixels
export const HITBOX_SIZE = 20;  // Hitbox radius for ballistic collision
export const HEAL_RANGE = 50;  // Doctor heal range

// --- Recovery Times ---
export const MELEE_RECOVERY = 20;  // Ticks after melee attack
export const PANIC_MELEE_RECOVERY = 10;  // Ticks after panic punch
export const WEAPON_SWITCH_PENALTY = 200;  // Timer penalty for switching weapons
export const FISTS_SWITCH_PENALTY = 100;  // Timer penalty for switching to fists
export const GRENADE_RECOVERY = 200;  // Ticks after throwing grenade
export const DEFAULT_RECOVERY = 10;  // Minimum recovery time
export const BURST_SHOT_DELAY = 4;  // Ticks between burst fire shots

// --- Damage ---
export const BASE_MELEE_DAMAGE = 5;  // Base unarmed melee damage
export const PANIC_MELEE_DAMAGE = 3;  // Damage during panic punch
export const HEAD_DAMAGE_MULTIPLIER = 2.0;  // Headshot multiplier
export const WOUNDED_PART_BONUS = 1.0;  // +100% damage to wounded areas
export const PENETRATION_FALLOFF = 0.5;  // Damage reduction per penetrated target

// --- Probabilities ---
export const GRENADE_USE_CHANCE = 0.35;  // 35% chance to use grenade when available
export const HEADING_PERCENTAGES = {
    HEAD: 10,     // 10% chance to hit head
    TORSO: 50,    // 50% chance to hit torso (cumulative: 60%)
    ARM: 20,      // 20% chance to hit arm (cumulative: 80%)
    LEG: 20       // 20% chance to hit leg (cumulative: 100%)
};

// --- Battlefield ---
export const BATTLEFIELD = {
    WIDTH: 1000,
    HEIGHT: 400,
    TEAM_A_SPAWN_START: 0,
    TEAM_A_SPAWN_END: 200,
    TEAM_B_SPAWN_START: 800,
    TEAM_B_SPAWN_END: 1000,
    Y_MIN: 50,
    Y_MAX: 350
};

// --- Battle Limits ---
export const MAX_BATTLE_TIME = 10000;  // Max ticks before draw
export const MAX_DEPLOYMENT_LIMIT = 20;  // Max troops deployed
export const BASE_DEPLOYMENT_LIMIT = 4;  // Starting deployment slots

// --- Crit Multipliers ---
export const DEFAULT_CRIT_MULTIPLIER = 2.0;
export const UMP_HEADSHOT_CRIT = 20.0;  // UMP headshot killshot
export const SPARROWHAWK_CRIT = 50.0;  // Sparrowhawk special crit

// --- Status Effects ---
export const BLIND_DURATION = 1000;
export const POISON_DURATION = 2000;
export const PARALYSIS_DURATION = 200;

// --- Vehicle Stats ---
export const VEHICLE_CRASH_DAMAGE = 5;
