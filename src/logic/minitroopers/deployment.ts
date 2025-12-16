import type { Trooper } from './types';
import { Vehicle } from './classes/Skill';

export const getDeploymentLimit = (squad: Trooper[]): number => {
    let limit = 4;
    for (const trooper of squad) {
        if (trooper.skills.some(s => s.id === 'scout')) {
            limit += 1;
        }
        if (trooper.attributes.deploymentLimitBonus) {
            limit += trooper.attributes.deploymentLimitBonus;
        }
    }
    return Math.min(limit, 20); // Capped at 20 per wiki
};

export const getDeploymentCost = (trooper: Trooper): number => {
    // Check for "Out of Bounds" skill (free deployment)
    if (trooper.skills.some(s => s.id === 'out_of_bounds')) {
        return 0;
    }

    // Check for Active Vehicle
    if (trooper.vehicle) {
         switch (trooper.vehicle.type) {
            case 'motorcycle': return 2;
            case 'light_tank': return 6;
            case 'heavy_tank': return 8;
            case 'helicopter': return 4;
            case 'fighter_jet': return 10;
            default: return 1;
        }
    }

    return 1; // Default trooper cost
};
