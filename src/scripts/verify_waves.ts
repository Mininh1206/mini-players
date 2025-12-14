
import { simulateBattle } from '../logic/minitroopers/combat';
import { generateRandomTrooper } from '../logic/minitroopers/generators';
import type { Trooper } from '../logic/minitroopers/types';

const runVerification = () => {
    console.log("Starting Wave Mechanics Verification...");

    // 1. Generate large armies (10 vs 10)
    const teamA: Trooper[] = [];
    const teamB: Trooper[] = [];

    // Ensure they are all basic recruits for consistent cost (1)
    for (let i = 0; i < 10; i++) {
        const t = generateRandomTrooper(1);
        // Remove Scout skill if present to keep limit at 4 for easier math
        t.skills = t.skills.filter(s => s.id !== 'scout');
        // Remove "Out of Bounds" to ensure standard cost
        t.skills = t.skills.filter(s => s.id !== 'out_of_bounds');
        teamA.push(t);
    }
    
    // Create weak enemies to ensure Team A eventually wipes them and verify own waves? 
    // Or just mirror match. Mirror match is fine.
    for (let i = 0; i < 10; i++) {
        const t = generateRandomTrooper(1);
        t.skills = t.skills.filter(s => s.id !== 'scout');
        t.skills = t.skills.filter(s => s.id !== 'out_of_bounds');
        teamB.push(t);
    }

    console.log(`Teams generated. A: ${teamA.length}, B: ${teamB.length}`);

    // 2. Run simulation
    const result = simulateBattle(teamA, teamB);

    // 3. Analyze Log
    console.log(`Battle simulated. Log length: ${result.log.length}`);

    // Helper to track active count
    const activeA = new Set<string>();
    
    // Config
    const DEPLOYMENT_LIMIT = 4;

    let maxActiveA = 0;
    let waveCount = 0;
    let errors = 0;

    // Iterate through time
    // We need to replay the state somewhat to track "Active" because deaths happen.
    
    for (const entry of result.log) {
        if (entry.action === 'deploy') {
            // Check which team
            if (teamA.some(t => t.id === entry.actorId)) {
                
                // If we are deploying, we should ensure we are not violating limits
                // BUT, combat.ts logic is: Deploy initial wave -> Wait -> Deploy next wave when all dead.
                // So active count should go from 0 -> 4 -> ... -> 0 -> 4.
                
                // If activeA size is 0 before this deployment (and it's not the very first start), it means a new wave started.
                if (activeA.size === 0 && entry.time > 0) {
                     console.log(`[Time ${entry.time}] Wave Restarting for Team A?`);
                     waveCount++;
                }

                activeA.add(entry.actorId);
                if (activeA.size > maxActiveA) maxActiveA = activeA.size;

                if (activeA.size > DEPLOYMENT_LIMIT) {
                    console.error(`[ERROR] Time ${entry.time}: Active troopers for Team A (${activeA.size}) exceeded limit (${DEPLOYMENT_LIMIT})!`);
                    errors++;
                }
            }
        } else if (entry.action === 'attack' && entry.damage && entry.targetId) {
            // Check if someone died
            // We unfortunately don't have "Death" events in the log clearly separate from damage...
            // BUT, we can infer it if we tracked HP.
            // However, the log message sometimes says "is dead"? No.
            // The simulation result has survivors.
            // Let's rely on the fact that `combat.ts` sends correct events?
            // Actually `combat.ts` log doesn't explicitly log "Death".
            // It modifies state.
            // Wait, looking at combat.ts: 
            // `if (actualTarget.attributes.hp === 0) actualTarget.isDead = true;`
            // It does NOT log a specific "Death" event.
            // This makes verification via Log hard.
            
            // ALTERNATIVE:
            // The fact that `deploy` happened gives us clues.
            // `deploy` ONLY happens if `deployedA.length === 0`.
            // So if we see a `deploy` event after T=0, it PROVES that the previous wave was wiped.
            // AND if we check that we never deployed more than 4 in a row without a gap, we are good.
        }
    }

    // Check Initial Wave Size
    // Iterate log to find first N deployments
    let initialDeployments = 0;
    for (const entry of result.log) {
        if (entry.time > 0) break; // Setup phase ends at 0? strictly speaking deploy is at 0.
        if (entry.action === 'deploy' && teamA.some(t => t.id === entry.actorId)) {
            initialDeployments++;
        }
    }

    console.log(`Initial Deployments Team A: ${initialDeployments}`);
    if (initialDeployments > DEPLOYMENT_LIMIT) {
        console.error(`[ERROR] Initial deployment count ${initialDeployments} exceeded limit ${DEPLOYMENT_LIMIT}`);
        errors++;
    }

    // Check if limits respected dynamically
    if (maxActiveA > DEPLOYMENT_LIMIT) {
         console.error(`FAILURE: Max active troopers ${maxActiveA} exceeded limit ${DEPLOYMENT_LIMIT}`);
    } else {
         console.log(`SUCCESS: Max active troopers ${maxActiveA} respected limit ${DEPLOYMENT_LIMIT}`);
    }

    // Verify Waves
    // Count how many "phases" of deployments occurred
    // A phase is a cluster of deployments at the same time.
    // In `combat.ts`, reinforcements happen at `time`. 
    // All reinforcements for a wave happen in one loop.
    
    // Group deployments by time
    const deploymentsByTime: Record<number, number> = {};
    result.log.forEach(e => {
        if (e.action === 'deploy' && teamA.some(t => t.id === e.actorId)) {
            deploymentsByTime[e.time] = (deploymentsByTime[e.time] || 0) + 1;
        }
    });

    console.log("Deployments by Time (Team A):", deploymentsByTime);
    
    // Check if any single deployment burst exceeded limit (shouldn't happen if logic is correct)
    Object.entries(deploymentsByTime).forEach(([time, count]) => {
        if (count > DEPLOYMENT_LIMIT) {
            console.error(`[ERROR] At time ${time}, deployed ${count} troopers! Limit is ${DEPLOYMENT_LIMIT}`);
            errors++;
        }
    });

    if (errors === 0) {
        console.log("VERIFICATION PASSED: Waves behave as expected.");
    } else {
        console.error(`VERIFICATION FAILED with ${errors} errors.`);
        process.exit(1);
    }
};

runVerification();
