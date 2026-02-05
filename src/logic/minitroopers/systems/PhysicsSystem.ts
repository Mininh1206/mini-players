import { Trooper, TrooperState, BattleLogEntry, TrooperData } from '../types';

export interface PhysicsContext {
    allTroopers: TrooperData[];
    log: BattleLogEntry[];
    time: number;
}

export class PhysicsSystem {
    
    /**
     * Calculates and applies knockback effects from an explosion.
     */
    applyExplosion(
        origin: { x: number, y: number }, 
        radius: number, 
        maxForce: number, 
        context: PhysicsContext
    ) {
        context.allTroopers.forEach(trooper => {
            if (trooper.isDead) return;

            const tx = trooper.position?.x || 0;
            const ty = trooper.position?.y || 0;
            const dist = Math.sqrt(Math.pow(tx - origin.x, 2) + Math.pow(ty - origin.y, 2));

            if (dist <= radius) {
                // Calculate Force (Linear Falloff)
                const falloff = 1 - (dist / radius);
                const force = maxForce * falloff;

                if (force > 5) { // Threshold for Knockdown
                    this.applyKnockback(trooper, origin, force, context);
                }
            }
        });
    }

    applyKnockback(trooper: TrooperData, sourcePos: { x: number, y: number }, force: number, context: PhysicsContext) {
        // Direction vector
        const tx = trooper.position?.x || 0;
        const ty = trooper.position?.y || 0;
        let dx = tx - sourcePos.x;
        let dy = ty - sourcePos.y;
        
        // Normalize
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        dx /= len;
        dy /= len;

        // Calculate destination
        const pushDistance = force * 10; // Scale factor
        const destX = tx + dx * pushDistance;
        const destY = ty + dy * pushDistance;

        // Update State
        // Duration depends on Force?
        const duration = Math.floor(force * 5); // e.g. force 10 -> 50 ticks (1.5s)
        trooper.state = { 
            type: 'DOWNED', 
            current: 0, 
            duration: Math.max(30, duration), // Min 1s
            recoverProgress: 0
        };

        // Log Event (Visuals will read this)
        context.log.push({
            time: context.time,
            actorId: trooper.id,
            actorName: trooper.name,
            action: 'knock_down',
            message: `${trooper.name} is knocked back!`,
            targetPosition: { x: destX, y: destY }, // Destination
            data: { force, angle: Math.atan2(dy, dx) }
        });

        // Update Logical Position immediately? 
        // Or wait for animation? 
        // Simulation usually updates immediately for targeting logic.
        // Visuals will lerp.
        trooper.position = { x: destX, y: destY };
    }
}
