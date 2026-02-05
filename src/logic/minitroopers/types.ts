export type TrooperClass = 'Recruit' | 'Soldier' | 'Sniper' | 'Doctor' | 'Pilot' | 'Commando' | 'Scout' | 'Spy' | 'Saboteur' | 'Comms Officer' | 'Rat';

export interface TrooperAttributes {
    hp: number;
    maxHp: number;
    initiative: number; // Determines turn order
    range: number; // 1-10
    damage: number;
    aim: number; // Percentage 0-100+
    dodge: number; // Percentage 0-100
    armor: number; // Damage reduction
    critChance: number; // Percentage 0-100
    speed: number; // New stat
    aggro?: number; // Target priority
    recoveryMod?: number; // Reduces weapon recovery
    reloadBonus?: number; // Extra ammo per reload
    deploymentLimitBonus?: number; // Increases deployment limit
    encumberance?: number; // Reduces speed/dodge
}

export interface Skill {
    id: string;
    name: string;
    description: string;
    icon: string;
    level?: number;
}

export type BodyPart = 'head' | 'torso' | 'arm' | 'leg';

export interface Wounds {
    head: boolean;
    chest: boolean;
    leftArm: boolean;
    rightArm: boolean;
    leftLeg: boolean;
    rightLeg: boolean;
}

export type VehicleType = 'motorcycle' | 'light_tank' | 'heavy_tank' | 'helicopter' | 'fighter_jet';

export interface TrooperVehicle {
    type: VehicleType;
    name: string;
    hp: number;
    maxHp: number;
    armor: number;
    // Vehicle weapons with their ammo
    weaponAmmo?: Record<string, number>;
}

export type Trooper = TrooperData;

export interface TrooperData {
    id: string;
    name: string;
    class: string;
    team: 'A' | 'B';
    attributes: TrooperAttributes;
    skills: Skill[];
    isDead: boolean;
    level: number;
    // Combat State
    position?: { x: number; y: number }; // 2D Coordinates (0-1000, 0-400)
    currentWeaponId?: string;
    ammo?: Record<string, number>; // WeaponID -> Current Magazine Ammo
    reserves?: Record<string, number>; // WeaponID -> Total Reserve Ammo
    actionTimer?: number; // Accumulates until threshold (1000)
    recoveryTime?: number; // Ticks to wait before acting again
    cooldown?: number; // Deprecated, kept for compatibility during refactor
    disarmed?: string[]; // IDs of disabled weapons
    sabotagedWeapons?: string[]; // IDs of sabotaged weapons
    jammedWeapons?: string[]; // IDs of jammed weapons
    tactics?: {
        priority: 'closest' | 'weakest' | 'strongest' | 'random';
        targetPart: 'any' | 'head' | 'heart' | 'arm' | 'leg';
        favoriteWeaponId?: string;
    };
    burstState?: {
        shotsRemaining: number;
        targetId: string;
        weaponId: string;
    };
    pendingChoices?: Skill[];
    
    // New Props
    isMoving?: boolean;
    vehicle?: TrooperVehicle;
    wounds?: Wounds;
    status?: Record<string, number>; // Effect -> Duration/Value
    state?: TrooperState;
}

export interface BattleLogEntry {
    time: number; // Replaces turn
    turn?: number; // Deprecated
    actorId: string;
    actorName: string;
    targetId?: string;
    targetName?: string;
    action: 'attack' | 'heal' | 'wait' | 'move' | 'deploy' | 'switch_weapon' | 'reload' | 'use_equipment' | 'swap' | 'melee' | 'knockback' | 'vehicle_destroy' | 'eject' | 'jam_weapon' | 'sabotage' | 'start_aim' | 'aim_complete' | 'knock_down';
    damage?: number;
    heal?: number;
    targetPosition?: { x: number; y: number };

    isCrit?: boolean;
    isMiss?: boolean;
    isDodge?: boolean;
    hitLocation?: BodyPart;
    isKillshot?: boolean;
    isGlancing?: boolean;
    message: string;
    isVehicleHit?: boolean;
    data?: any; // Extensible metadata (e.g. weaponId)
}

export type TrooperState = 
  | { type: 'IDLE' }
  | { type: 'AIMING'; targetId: string; weaponId: string; current: number; required: number }
  | { type: 'SWITCHING'; targetWeaponId: string; current: number; required: number }
  | { type: 'RELOADING'; weaponId: string; current: number; required: number }
  | { type: 'DOWNED'; current: number; duration: number; recoverProgress?: number };

export interface BattleResult {
    winner: 'A' | 'B' | 'Draw';
    log: BattleLogEntry[];
    survivorsA: TrooperData[];
    survivorsB: TrooperData[];
}

export interface BattleHistoryEntry {
    id: string;
    date: number;
    opponentName: string;
    result: 'VICTORY' | 'DEFEAT';
    log: BattleLogEntry[];
    mySquadSnapshot?: TrooperData[];
    opponentSquadSnapshot?: TrooperData[];
}

export interface Player {
    id: string;
    name: string;
    gold: number;
    troopers: TrooperData[];
    lastPlayed: number;
    history: BattleHistoryEntry[];
}

export interface BattleContext {
    time: number;
    turn: number;
    log: BattleLogEntry[];
    allTroopers: TrooperData[];
    deployedA?: TrooperData[];
    deployedB?: TrooperData[];
    reserveA?: TrooperData[];
    reserveB?: TrooperData[];
    jammedWeapons?: Map<string, string[]>;
    // Optional helpers or properties can be added here
}
