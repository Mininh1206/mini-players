import type { TrooperData, TrooperState, BattleLogEntry, BattleContext } from '../types';

export class TrooperStateSystem {
    /**
     * Updates the state logic for a trooper.
     * Returns true if the trooper is ready to make a new decision (transitioned to IDLE).
     */
    update(trooper: TrooperData, context: BattleContext): boolean {
        // If no state or IDLE, nothing to update here.
        if (!trooper.state || trooper.state.type === 'IDLE') {
            return true; 
        }

        const state = trooper.state;
        const { log, time } = context;

        switch (state.type) {
            case 'AIMING':
                state.current++;
                // Aiming completion is handled by CombatSystem (which checks line of sight / hit chance progression)
                // We just increment ticks here.
                break;

            case 'SWITCHING':
                state.current++;
                if (state.current >= state.required) {
                    // Execute Switch
                    trooper.currentWeaponId = state.targetWeaponId;
                    trooper.state = { type: 'IDLE' };
                    
                    // Log the completion (Visuals usually handle the 'process' via start_switch, but we log result to update UI)
                    // actually switch_weapon action is what updates the UI weapon icon.
                    log.push({
                        time: time,
                        actorId: trooper.id,
                        actorName: trooper.name,
                        action: 'switch_weapon',
                        data: { weaponId: state.targetWeaponId },
                        message: `${trooper.name} switched weapon`
                    });
                    return true;
                }
                break;

            case 'RELOADING':
                state.current++;
                if (state.current >= state.required) {
                     const wId = state.weaponId;
                     if (trooper.ammo && trooper.reserves) {
                          const weapon = trooper.skills.find(s => s.id === wId);
                          // Duck typing for maxAmmo or default 6
                          const magSize = (weapon as any)?.maxAmmo || 6; 
                          
                          const current = trooper.ammo[wId] || 0;
                          const needed = magSize - current;
                          const available = trooper.reserves[wId] || 0;
                          const toLoad = Math.min(needed, available);
                          
                          if (toLoad > 0) {
                              trooper.ammo[wId] += toLoad;
                              trooper.reserves[wId] -= toLoad;
                          }
                     }

                     trooper.state = { type: 'IDLE' };
                     // We don't necessarily log 'reload' completion as an action unless we want a message.
                     return true;
                }
                break;
                
            case 'DOWNED':
                 state.current++;
                 if (state.current >= state.duration) {
                     // Recovering...
                     if (state.recoverProgress === undefined) state.recoverProgress = 0;
                     state.recoverProgress++;
                     if (state.recoverProgress >= 20) { // 20 ticks to stand up
                         trooper.state = { type: 'IDLE' };
                         
                         // Log recovery so visuals can reset rotation
                         log.push({
                             time: time,
                             actorId: trooper.id,
                             actorName: trooper.name,
                             action: 'wait',
                             data: { reason: 'recover' },
                             message: `${trooper.name} stands up`
                         });
                         return true;
                     }
                 }
                 break;
        }

        return false;
    }
}
