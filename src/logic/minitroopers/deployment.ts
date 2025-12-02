import type { Trooper } from './types';
import { Vehicle } from './classes/Skill';

export const getDeploymentLimit = (squad: Trooper[]): number => {
    let limit = 4;
    for (const trooper of squad) {
        if (trooper.skills.some(s => s.id === 'scout')) {
            limit += 1;
        }
    }
    return Math.min(limit, 20); // Capped at 20 per wiki
};

export const getDeploymentCost = (trooper: Trooper): number => {
    // Check for "Out of Bounds" skill (free deployment)
    if (trooper.skills.some(s => s.id === 'out_of_bounds')) {
        return 0;
    }

    // Check for Vehicles
    const vehicle = trooper.skills.find(s => s instanceof Vehicle) as Vehicle | undefined;
    if (vehicle) {
        // If it's a vehicle, cost is usually higher, but wiki says:
        // Light Tank: 2, Helicopter: 2, Heavy Tank: 6.
        // But wait, the wiki says "Deployment Cost" for vehicles is what they COST to deploy.
        // It also says "Required" deployment to be fielded.
        // For simplicity in this iteration, we will use the cost defined in the class or default to 1.
        if (vehicle.deploymentCost > 0) {
             return vehicle.deploymentCost;
        }
    }

    return 1; // Default trooper cost
};
