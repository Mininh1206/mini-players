import Phaser from 'phaser';
import type { BattleLogEntry } from '@/logic/minitroopers/types';

export class BattleAnimations {
    private scene: Phaser.Scene;
    private speedMultiplier: number = 1;

    // Centralized animation durations (base values in ms at 1x speed)
    // Adjusted for slower, more cinematic pacing (30 TPS)
    private static readonly DURATIONS = {
        move: 1000,
        attack: 500,
        projectile: 300,
        reload: 800,
        switch: 400,
        heal: 1000,
        death: 800,
        sabotage: 700,
        deploy: 600,
        hit: 200,
        recoil: 80
    };

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public setSpeed(multiplier: number) {
        this.speedMultiplier = multiplier;
    }

    /** Get duration adjusted for current speed */
    private getDuration(key: keyof typeof BattleAnimations.DURATIONS): number {
        return BattleAnimations.DURATIONS[key] / this.speedMultiplier;
    }

    /** Safe animation wrapper - ensures onComplete is always called and guards destroyed containers */
    private safeAnimation(
        container: Phaser.GameObjects.Container | null,
        animationFn: () => void,
        onComplete: () => void,
        maxTimeout: number = 2000
    ): void {
        // Guard: Check if container is still valid
        if (!container || !container.active) {
            onComplete();
            return;
        }

        try {
            // Safety timeout in case animation gets stuck
            const timeoutId = setTimeout(() => {
                console.warn('[BattleAnimations] Animation timeout - forcing completion');
                onComplete();
            }, maxTimeout / this.speedMultiplier);

            // Wrap onComplete to clear timeout
            const safeComplete = () => {
                clearTimeout(timeoutId);
                onComplete();
            };

            // Execute the animation with safe completion
            animationFn();
        } catch (error) {
            console.error('[BattleAnimations] Animation error:', error);
            onComplete();
        }
    }

    // --- VISUALIZATION ---

    public drawTrooper(container: Phaser.GameObjects.Container, data: any) {
        const team = data.team || 'A';
        const color = team === 'A' ? 0x00ff00 : 0xff0000;
        const vehicle = data.vehicle; // Check if deployed with vehicle

        container.removeAll(true);

        const gfx = this.scene.add.graphics();
        gfx.setName('bodyGfx');

        // Vehicle Visuals
        if (vehicle) {
            gfx.fillStyle(color, 1);
            if (vehicle.type.includes('tank')) {
                // Tank Body
                gfx.fillRect(-20, -15, 40, 30);
                // Turret
                gfx.fillStyle(0x444444, 1);
                gfx.fillCircle(0, 0, 12);
            } else if (vehicle.type.includes('helicopter')) {
                // Heli Body
                gfx.fillCircle(0, 0, 15);
                // Tail
                gfx.fillRect(-25, -5, 15, 10);
                // Rotors (Animated separately ideally, but static for now)
                gfx.lineStyle(2, 0xcccccc, 1);
                gfx.lineBetween(-25, -25, 25, 25);
                gfx.lineBetween(-25, 25, 25, -25);
            } else if (vehicle.type.includes('motorcycle')) {
                // Bike Body
                gfx.fillRect(-15, -8, 30, 16);
                // Wheels
                gfx.fillStyle(0x333333, 1);
                gfx.fillCircle(-15, 8, 6);
                gfx.fillCircle(15, 8, 6);
            } else {
                 // Fallback
                 gfx.fillCircle(0, 0, 15);
            }
        } else {
            // Standard Trooper
            gfx.fillStyle(color, 1);
            gfx.fillCircle(0, 0, 10);
        }

        // Weapon sprite placeholder
        const wpnLine = this.scene.add.graphics();
        wpnLine.setName('weaponGfx');
        
        container.add([gfx, wpnLine]);
        
        // Initial Weapon Draw
        this.updateWeaponSprite(container, data.currentWeaponId);
    }

    public updateWeaponSprite(container: Phaser.GameObjects.Container, weaponId?: string) {
        const wpnGfx = container.getByName('weaponGfx') as Phaser.GameObjects.Graphics;
        if (!wpnGfx) return;
        
        wpnGfx.clear();
        
        if (!weaponId || weaponId === 'fists') {
            // Unarmed / Fists: No weapon line, maybe small "hands"?
            wpnGfx.fillStyle(0xffccaa, 1); // Skin toneish
            wpnGfx.fillCircle(8, 5, 3);
            wpnGfx.fillCircle(8, -5, 3);
            return;
        }

        // Draw weapon based on type
        if (weaponId.includes('sniper') || weaponId.includes('rifle')) {
            // Long rifle
            wpnGfx.lineStyle(3, 0x8b4513, 1); // Brown stock
            wpnGfx.lineBetween(5, -2, 12, -2);
            wpnGfx.lineStyle(2, 0x444444, 1); // Metal barrel
            wpnGfx.lineBetween(12, -2, 28, -2);
        } else if (weaponId.includes('shotgun')) {
            // Shotgun
            wpnGfx.lineStyle(4, 0x444444, 1);
            wpnGfx.lineBetween(5, -2, 22, -2);
        } else if (weaponId.includes('pistol') || weaponId.includes('revolver') || weaponId.includes('beretta') || weaponId.includes('eagle')) {
            // Pistol
            wpnGfx.lineStyle(3, 0x333333, 1);
            wpnGfx.lineBetween(8, -2, 16, -2);
        } else if (weaponId.includes('minigun') || weaponId.includes('machine') || weaponId.includes('gatling')) {
            // Heavy weapon
            wpnGfx.lineStyle(5, 0x555555, 1);
            wpnGfx.lineBetween(5, -2, 25, -2);
        } else if (weaponId.includes('knife')) {
             // Knife
            wpnGfx.lineStyle(2, 0xcccccc, 1);
            wpnGfx.lineBetween(10, -2, 18, -2);
        } else if (weaponId.includes('bazooka') || weaponId.includes('rocket') || weaponId.includes('launcher')) {
            // Launcher
            wpnGfx.lineStyle(6, 0x2d5016, 1);
            wpnGfx.lineBetween(5, -2, 26, -2);
        } else {
            // Default weapon line
            wpnGfx.lineStyle(2, 0xaaaaaa, 1);
            wpnGfx.lineBetween(8, -2, 18, -2);
        }
    }

    // --- ANIMATIONS ---

    public animateMove(actor: Phaser.GameObjects.Container, log: BattleLogEntry, onComplete: () => void) {
        if (!log.targetPosition) {
             this.scene.tweens.add({ targets: actor, x: actor.x + 10, duration: 100, yoyo: true, repeat: 2, onComplete });
             return;
        }

        const targetX = 50 + (log.targetPosition.x / 1000) * 700;
        const targetY = 100 + log.targetPosition.y;
        
        if (targetX > actor.x) actor.scaleX = Math.abs(actor.scaleX); 
        else actor.scaleX = -Math.abs(actor.scaleX);

        this.scene.tweens.add({
            targets: actor,
            x: targetX,
            y: targetY,
            duration: this.getDuration('move'),
            ease: 'Power1',
            onComplete
        });
    }

    public animateAttack(actor: Phaser.GameObjects.Container, log: BattleLogEntry, getTrooper: (id: string) => Phaser.GameObjects.Container | undefined, onComplete: () => void) {
        // Data Sync (Ammo) is handled by BattleScene logic before calling this? 
        // Or we pass a callback? Ideally animations are purely visual.
        // Syncing data should happen in the main loop or via a separate data handler.
        // For now, we assume data sync happens elsewhere or is passed in.
        
        const target = log.targetId ? getTrooper(log.targetId) : null;
        let targetX = target ? target.x : (actor.x + 50 * (actor.scaleX > 0 ? 1 : -1));
        let targetY = target ? target.y : actor.y;
        
        if (log.targetPosition) {
             targetX = 50 + (log.targetPosition.x / 1000) * 700;
             targetY = 100 + log.targetPosition.y;
        }

        // Recoil
        this.scene.tweens.add({
            targets: actor,
            x: actor.x - 5 * (actor.scaleX > 0 ? 1 : -1),
            duration: this.getDuration('recoil'),
            yoyo: true,
            repeat: 1
        });

        // Muzzle Flash
        const flash = this.scene.add.circle(actor.x + 20 * (actor.scaleX > 0 ? 1 : -1), actor.y, 10, 0xffff00);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 100,
            onComplete: () => flash.destroy()
        });

        // Projectile / Beam
        const bullet = this.scene.add.circle(actor.x, actor.y, 3, 0xffff00);
        this.scene.tweens.add({
            targets: bullet,
            x: targetX,
            y: targetY,
            duration: this.getDuration('projectile'),
            onComplete: () => {
                bullet.destroy();
                // Hit Effect
                const hit = this.scene.add.circle(targetX, targetY, 15, 0xff0000, 0.5);
                this.scene.tweens.add({ targets: hit, scale: 0, duration: this.getDuration('hit'), onComplete: () => hit.destroy() });
                
                // Shake target if exists
                if (target) {
                    this.scene.tweens.add({ targets: target, x: target.x + (Math.random()*4-2), y: target.y + (Math.random()*4-2), duration: this.getDuration('recoil'), repeat: 3, yoyo: true });
                }
                
                onComplete();
            }
        });
    }

    public animateSwitch(actor: Phaser.GameObjects.Container, log: BattleLogEntry, onComplete: () => void) {
        // Pop effect
        this.scene.tweens.add({
             targets: actor,
             scaleY: 0.8 * Math.abs(actor.scaleY), // Squish
             duration: this.getDuration('switch'),
             yoyo: true,
             onComplete: () => {
                 // Update Sprite
                 if (log.data?.weaponId) {
                     this.updateWeaponSprite(actor, log.data.weaponId);
                 }
                 onComplete();
             }
        });
    }

    public animateReload(actor: Phaser.GameObjects.Container, log: BattleLogEntry, onComplete: () => void) {
        const icon = this.scene.add.text(actor.x, actor.y - 30, '🔄', { fontSize: '20px' }).setOrigin(0.5);
        this.scene.tweens.add({
            targets: icon,
            y: actor.y - 50,
            alpha: 0,
            duration: this.getDuration('reload'),
            onComplete: () => {
                icon.destroy();
                onComplete();
            }
        });
    }

    public animateHeal(actor: Phaser.GameObjects.Container, log: BattleLogEntry, onComplete: () => void) {
        const icon = this.scene.add.text(actor.x, actor.y - 30, '❤️', { fontSize: '20px' }).setOrigin(0.5);
        this.scene.tweens.add({
            targets: icon,
            y: actor.y - 50,
            alpha: 0,
            duration: this.getDuration('heal'),
            onComplete: () => {
                icon.destroy();
                onComplete();
            }
        });
    }
    
    public animateSabotage(actor: Phaser.GameObjects.Container, log: BattleLogEntry, onComplete: () => void) {
        const icon = this.scene.add.text(actor.x, actor.y - 30, '🔧', { fontSize: '20px' }).setOrigin(0.5);
        
        let targetX = actor.x + 50 * (actor.scaleX > 0 ? 1 : -1);
        let targetY = actor.y;
        
        if (log.targetPosition) {
             targetX = 50 + (log.targetPosition.x / 1000) * 700;
             targetY = 100 + log.targetPosition.y;
        }
        
        this.scene.tweens.add({
            targets: icon,
            x: targetX,
            y: targetY,
            rotation: 10,
            duration: this.getDuration('sabotage'),
            onComplete: () => {
                icon.destroy();
                onComplete();
            }
        });
    }

    public animateDeath(actor: Phaser.GameObjects.Container, log: BattleLogEntry, onComplete: () => void) {
        this.scene.tweens.add({
            targets: actor,
            alpha: 0,
            scale: 0,
            angle: 180,
            duration: this.getDuration('death'),
            onComplete: () => {
                actor.setVisible(false);
                onComplete();
            }
        });
    }
}
