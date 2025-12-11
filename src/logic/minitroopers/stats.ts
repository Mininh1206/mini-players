import type { Trooper } from './types';


export const getCommunications = (squad: Trooper[]): number => {
    let comms = 0;
    for (const trooper of squad) {
        // Base Comms Officer bonus: 5 + 1 per level
        // Assuming 'comms_officer' is the ID for the specialization
        const commsSkill = trooper.skills.find(s => s.id === 'comms_officer');
        if (commsSkill) {
            comms += 5 + (trooper.level || 1);
        }
        
        // Other items might add comms (e.g. Walky-Talky)
        if (trooper.skills.some(s => s.id === 'talky_walky')) {
            comms += 1; // Wiki doesn't specify exact amount for item, assuming 1 for now
        }
    }
    return comms;
};

export const getSabotage = (squad: Trooper[]): number => {
    let sabotage = 0;
    for (const trooper of squad) {
        // Base Saboteur bonus: 5 + 1 per level
        const saboteurSkill = trooper.skills.find(s => s.id === 'saboteur');
        if (saboteurSkill) {
            sabotage += 5 + (trooper.level || 1);
        }
    }
    return sabotage;
};
