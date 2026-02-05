import Phaser from 'phaser';

export interface VisualEffect {
    play(scene: Phaser.Scene, startX: number, startY: number, endX: number, endY: number, onComplete: () => void): void;
}

export class BulletEffect implements VisualEffect {
    play(scene: Phaser.Scene, startX: number, startY: number, endX: number, endY: number, onComplete: () => void) {
        const bullet = scene.add.circle(startX, startY, 3, 0xffff00);
        
        // Tracers
        const line = scene.add.line(0, 0, startX, startY, endX, endY, 0xffffaa, 0.5).setOrigin(0);
        scene.tweens.add({
            targets: line,
            alpha: 0,
            duration: 100,
            onComplete: () => line.destroy()
        });

        scene.tweens.add({
            targets: bullet,
            x: endX,
            y: endY,
            duration: 100, // Fast
            onComplete: () => {
                bullet.destroy();
                onComplete();
            }
        });
    }
}

export class RocketEffect implements VisualEffect {
    play(scene: Phaser.Scene, startX: number, startY: number, endX: number, endY: number, onComplete: () => void) {
        const rocket = scene.add.rectangle(startX, startY, 15, 6, 0x666666);
        const flame = scene.add.particles(0, 0, 'flare', { // Assuming flare texture exists or we use circle
            speed: 100,
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            lifespan: 200,
            follow: rocket
        });

        const angle = Phaser.Math.Angle.Between(startX, startY, endX, endY);
        rocket.setRotation(angle);

        scene.tweens.add({
            targets: rocket,
            x: endX,
            y: endY,
            duration: 600,
            ease: 'Quad.easeIn',
            onComplete: () => {
                rocket.destroy();
                flame.destroy();
                // Boom
                const boom = scene.add.circle(endX, endY, 30, 0xffaa00);
                scene.tweens.add({
                    targets: boom,
                    scale: 2,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => boom.destroy()
                });
                onComplete();
            }
        });
    }
}

export class MeleeEffect implements VisualEffect {
    play(scene: Phaser.Scene, startX: number, startY: number, endX: number, endY: number, onComplete: () => void) {
        // Dash to target
        onComplete(); // Handled by actor movement in main scene usually, but we could add a "Hit" spark here
        const spark = scene.add.star(endX, endY, 5, 10, 20, 0xffffff);
        scene.tweens.add({
            targets: spark,
            scale: 2,
            alpha: 0,
            angle: 360,
            duration: 150,
            onComplete: () => spark.destroy()
        });
    }
}

export class GrenadeEffect implements VisualEffect {
    play(scene: Phaser.Scene, startX: number, startY: number, endX: number, endY: number, onComplete: () => void) {
        const grenade = scene.add.circle(startX, startY, 5, 0x00cc00);
        
        // Parabolic arc?
        // Simple tween for now
        scene.tweens.add({
            targets: grenade,
            x: endX,
            y: endY,
            duration: 500,
             ease: 'Sine.easeOut', // Should arc, but simple line ok for now
            onComplete: () => {
                grenade.destroy();
                const boom = scene.add.circle(endX, endY, 40, 0x555555, 0.5);
                scene.tweens.add({
                    targets: boom,
                    alpha: 0,
                    scale: 1.5,
                    duration: 300,
                    onComplete: () => boom.destroy()
                });
                onComplete();
            }
        });
    }
}

export class EffectFactory {
    static getEffect(weaponId: string): VisualEffect {
        // Heuristic based on ID
        if (weaponId.includes('rocket') || weaponId.includes('bazooka')) return new RocketEffect();
        if (weaponId.includes('grenade')) return new GrenadeEffect();
        if (weaponId.includes('knife') || weaponId.includes('sword') || weaponId === 'fists') return new MeleeEffect();
        // Default
        return new BulletEffect();
    }
}
