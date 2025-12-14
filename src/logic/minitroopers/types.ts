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
}

export interface Skill {
    id: string;
    name: string;
    description: string;
    icon: string;
    level?: number;
}

export interface Trooper {
    id: string;
    name: string;
    class: TrooperClass;
    team: 'A' | 'B';
    attributes: TrooperAttributes;
    skills: Skill[];
    isDead: boolean;
    level: number;
    // Combat State
    position?: { x: number; y: number }; // 2D Coordinates (0-1000, 0-400)
    currentWeaponId?: string;
    ammo?: Record<string, number>; // WeaponID -> Current Ammo
    actionTimer?: number; // Accumulates until threshold (1000)
    recoveryTime?: number; // Ticks to wait before acting again
    cooldown?: number; // Deprecated, kept for compatibility during refactor
    disarmed?: string[]; // IDs of disabled weapons
    tactics?: {
        priority: 'closest' | 'weakest' | 'strongest' | 'random';
        targetPart: 'any' | 'head' | 'heart' | 'arm' | 'leg';
    };
    pendingChoices?: Skill[];
}

export interface BattleLogEntry {
    time: number; // Replaces turn
    turn?: number; // Deprecated
    actorId: string;
    actorName: string;
    targetId?: string;
    targetName?: string;
    action: 'attack' | 'heal' | 'wait' | 'move' | 'deploy' | 'switch_weapon' | 'reload' | 'use_equipment' | 'swap' | 'melee' | 'knockback';
    damage?: number;
    heal?: number;
    targetPosition?: { x: number; y: number };
    isCrit?: boolean;
    isMiss?: boolean;
    isDodge?: boolean;
    message: string;
    data?: any; // Extensible metadata (e.g. weaponId)
}

export interface BattleResult {
    winner: 'A' | 'B' | 'Draw';
    log: BattleLogEntry[];
    survivorsA: Trooper[];
    survivorsB: Trooper[];
}

export interface BattleHistoryEntry {
    id: string;
    date: number;
    opponentName: string;
    result: 'VICTORY' | 'DEFEAT';
    log: BattleLogEntry[];
    mySquadSnapshot?: Trooper[];
    opponentSquadSnapshot?: Trooper[];
}

export interface Player {
    id: string;
    name: string;
    gold: number;
    troopers: Trooper[];
    lastPlayed: number;
    history: BattleHistoryEntry[];
}
