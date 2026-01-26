import type { VehicleType } from './types';

export interface VehicleConfig {
    id: VehicleType;
    name: string;
    hp: number;
    armor: number;
    deploymentCost: number;
    initiativeBonus: number;
    speedBonus: number;
    baseDeployChance: number;
    weapons: string[]; // Weapon IDs
    description: string;
}

export const VEHICLES: Record<VehicleType, VehicleConfig> = {
    'motorcycle': {
        id: 'motorcycle',
        name: 'Motorcycle',
        hp: 5, // Minimal protection
        armor: 0,
        deploymentCost: 1,
        initiativeBonus: 50, // Significant boost
        speedBonus: 100, // Very fast
        baseDeployChance: 0.30, // 30% base
        weapons: [],
        description: 'Takes you within range of closest target + Initiative boost'
    },
    'light_tank': {
        id: 'light_tank',
        name: 'Light Tank',
        hp: 40,
        armor: 2,
        deploymentCost: 2,
        initiativeBonus: 0,
        speedBonus: 0,
        baseDeployChance: 0.06, // 6% base
        weapons: ['light_cannon', 'machine_gun_vehicle'], // Custom vehicle versions
        description: 'Armored combat vehicle'
    },
    'heavy_tank': {
        id: 'heavy_tank',
        name: 'Heavy Tank',
        hp: 100,
        armor: 8, // Very heavy armor
        deploymentCost: 6,
        initiativeBonus: -10, // Slower to start
        speedBonus: -20, // Slower movement
        baseDeployChance: 0.02, // 2% base (Rare)
        weapons: ['heavy_cannon', 'machine_gun_vehicle'],
        description: 'Heavy armored vehicle'
    },
    'helicopter': {
        id: 'helicopter',
        name: 'Helicopter',
        hp: 30,
        armor: 0, // Hard to hit but not armored like a tank? Wiki says 0 armor usually for heli? Let's check assumptions. 
        // Actually wiki might imply some resilience. But armor 0 is safer default if not specified.
        deploymentCost: 2,
        initiativeBonus: 20,
        speedBonus: 50,
        baseDeployChance: 0.04, // 4% base
        weapons: ['twin_machine_gun'],
        description: 'Air support'
    },
    'fighter_jet': {
        id: 'fighter_jet',
        name: 'Fighter Jet',
        hp: 10, // Not really interactable in same way?
        armor: 0,
        deploymentCost: 0, // Special logic
        initiativeBonus: 0,
        speedBonus: 0,
        baseDeployChance: 0.05, // 5%
        weapons: [], // Handled via bombardment sequence
        description: "Trooper doesn't appear, just bombards"
    }
};

export function getVehicleConfig(type: VehicleType): VehicleConfig {
    return VEHICLES[type];
}
