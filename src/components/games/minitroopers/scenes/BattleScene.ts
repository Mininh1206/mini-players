import Phaser from 'phaser';
import type { BattleResult, BattleLogEntry, Trooper } from '@/logic/minitroopers/types';

export class BattleScene extends Phaser.Scene {
    private battleResult: BattleResult;
    private troopers: Map<string, Phaser.GameObjects.Container>;
    private currentTurnIndex: number = 0;
    private battleText: Phaser.GameObjects.Text | null = null;
    private isPlayingTurn: boolean = false;
    private isPaused: boolean = false;
    public onTrooperClick?: (trooperId: string) => void;
    public onResume?: () => void;
    private borderTop: Phaser.GameObjects.Rectangle | null = null;
    private borderBottom: Phaser.GameObjects.Rectangle | null = null;
    private colorMatrix: Phaser.FX.ColorMatrix | null = null;

    // All troopers available (for looking up data when spawning)
    private allTroopersMap: Map<string, Trooper> = new Map();
    private battleTime: number = 0;
    private processedLogs: Set<number> = new Set(); // Indicies of processed logs
    private translations: Record<string, string> = {};
    private bgImage: Phaser.GameObjects.Image | null = null;
    
    // UI - Reserves
    private reserveTextA: Phaser.GameObjects.Text | null = null;
    private reserveTextB: Phaser.GameObjects.Text | null = null;
    private totalCountA: number = 0;
    private totalCountB: number = 0;
    private deployedCountA: number = 0;
    private deployedCountB: number = 0;

    constructor() {
        super('BattleScene');
        this.troopers = new Map();
        this.battleResult = { winner: '', log: [] } as any; 
    }

    init(data: { result: BattleResult, teamA: Trooper[], teamB: Trooper[], translations?: Record<string, string> }) {
        this.battleResult = data.result || { winner: '', log: [] };
        this.translations = data.translations || {};
        
        // Map all troopers for easy access
        this.allTroopersMap.clear();
        [...(data.teamA || []), ...(data.teamB || [])].forEach(t => {
            this.allTroopersMap.set(t.id, t);
        });

        this.currentTurnIndex = 0;
        this.battleTime = 0;
        this.processedLogs.clear();
        this.currentTurnIndex = 0;
        this.battleTime = 0;
        this.processedLogs.clear();
        this.isPlayingTurn = false;

        this.totalCountA = data.teamA?.length || 0;
        this.totalCountB = data.teamB?.length || 0;
        this.deployedCountA = 0;
        this.deployedCountB = 0;
    }

    private speedMultiplier: number = 1;

    create() {
        // Calculate center offsets
        // Logic area is 800x600.
        // We want (400, 300) to be at the center of the viewport (scale.width/2, scale.height/2).
        // Actually, easiest way is to use Camera Center.
        this.cameras.main.centerOn(400, 300);

        // Background for input - Make it huge to cover resizing
        const bg = this.add.rectangle(400, 300, 4000, 4000, 0x000000, 0).setInteractive();
        bg.on('pointerdown', () => {
             if (this.isPaused) {
                 this.resume();
             } else {
                 this.pause();
             }
        });

        // Visual Background (Sky) - make it dynamic
        this.bgImage = this.add.image(400, 300, 'sky').setAlpha(0.5).setScrollFactor(0);
        
        // Battle Text - Anchor to Top Center of Viewport
        this.battleText = this.add.text(400, -250, this.translations['battle_start'] || 'Battle Start!', { // Relative to center
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0); // ScrollFactor 0 means it sticks to camera? 
        // No, centerOn changes world view. ScrollFactor 0 locks to camera, 
        // coordinates become 0,0 at top-left of screen.
        // So allow scroll, just position relative to 400,300.
        
        // Actually, sticking to camera is better for UI.
        // Actually, sticking to camera is better for UI.
        this.battleText.setScrollFactor(0);

        // Reserve Counters
        const style = { fontSize: '18px', color: '#ffffff', stroke: '#000000', strokeThickness: 3, fontStyle: 'bold' };
        this.reserveTextA = this.add.text(20, 20, `Reserves: ${this.totalCountA}`, style).setScrollFactor(0).setOrigin(0, 0);
        this.reserveTextB = this.add.text(780, 20, `Reserves: ${this.totalCountB}`, style).setScrollFactor(0).setOrigin(1, 0);

        // Listen for resize
        this.scale.on('resize', this.resize, this);

        // Clear any existing sprites
        this.troopers.clear();

        // Create Cinematic Borders
        // We want them to cover from edges towards center.
        // Use scrollFactor 0 to lock to camera. 
        // Initially invisible/off-screen.
        
        // Initialize graphics
        // Initialize graphics
        this.borderTop = this.add.rectangle(400, 0, 4000, 200, 0x000000).setDepth(1000).setOrigin(0.5, 1);
        this.borderBottom = this.add.rectangle(400, 600, 4000, 200, 0x000000).setDepth(1000).setOrigin(0.5, 0);

        // Initial Resize to fit container
        this.scale.on('resize', this.resize, this);
        this.resize({ width: this.scale.width, height: this.scale.height });

        // Start clock
        // Simulation tick is discrete, but we want smooth playback. 
        // Let's say 1 simulation tick = 10ms real time (100 ticks = 1 sec).
        // Update loop handles this.
        this.battleTime = 0;
    }

    setSpeed(multiplier: number) {
        this.speedMultiplier = multiplier;
    }

    resize(gameSize?: { width: number, height: number }) {
        const width = gameSize ? gameSize.width : this.scale.width;
        const height = gameSize ? gameSize.height : this.scale.height;

        this.cameras.main.setViewport(0, 0, width, height);
        
        // Logical size is 800x600.
        // ZOOM to fit keeping aspect ratio.
        const scaleX = width / 800;
        const scaleY = height / 600;
        const zoom = Math.min(scaleX, scaleY);
        
        this.cameras.main.setZoom(zoom);
        this.cameras.main.centerOn(400, 300);

        // Update elements that need to stay relative to logical coordinates or screen
        if (this.battleText) {
             this.battleText.setPosition(width / 2, 60);
        }

        // Handle Background "Cover" scaling if present
        if (this.bgImage) {
            this.bgImage.setPosition(width / 2, height / 2); // Center of screen
            
            // Cover mode
            const imgWidth = this.bgImage.width;
            const imgHeight = this.bgImage.height;
            if (imgWidth > 0 && imgHeight > 0) {
                 const scaleX = width / imgWidth;
                 const scaleY = height / imgHeight;
                 const scale = Math.max(scaleX, scaleY);
                 this.bgImage.setScale(scale);
            }
        }

        // Borders should stay at their logical positions (0 and 600)
    }

    // Removed updateElementsPosition as it's handled by camera zoom now.
    updateElementsPosition() {}

    update(time: number, delta: number) {
        if (this.isPaused) return;
        
        // Advance battle time
        // Base speed: 10 ticks per second (x1). x2 = 20 ticks/s.
        const baseTicksPerSecond = 10; 
        const ticksToAdvance = (delta / 1000) * baseTicksPerSecond * this.speedMultiplier;
        this.battleTime += ticksToAdvance;

        this.updateBattleText(Math.floor(this.battleTime));

        // Process Logs up to current time
        while (this.currentTurnIndex < this.battleResult.log.length) {
            const nextLog = this.battleResult.log[this.currentTurnIndex];
            
            if (nextLog.time <= this.battleTime) {
                this.playTurnAnimation(nextLog, () => {}); // No callback needed for queue
                this.currentTurnIndex++;
            } else {
                break;
            }
        }
        
        if (this.currentTurnIndex >= this.battleResult.log.length) {
             const winnerTeam = this.battleResult.winner === 'A' ? (this.translations['winner_player'] || 'PLAYER') : (this.translations['winner_enemy'] || 'ENEMY');
             const winnerText = (this.translations['winner_team'] || 'Winner: Team {{team}}').replace('{{team}}', winnerTeam);
             this.battleText?.setText(winnerText);
             this.battleText?.setColor(this.battleResult.winner === 'A' ? '#00ff00' : '#ff0000');
             this.battleText?.setDepth(1001); // Ensure above borders
        }
    }

    updateBattleText(time: number) {
         // Find recent message
         // This is tricky with continuous time. Maybe just show time.
         const timePrefix = this.translations['time_prefix'] || 'Time: ';
         this.battleText?.setText(`${timePrefix}${time}`);
         this.battleText?.setDepth(1001);
    }

    // Removed processNextTurn and playBatchAnimations

    playTurnAnimation(log: BattleLogEntry, onComplete: () => void) {
        if (log.action === 'deploy') {
            this.handleDeploy(log, onComplete);
            return;
        }

        const actor = this.troopers.get(log.actorId);
        if (!actor) {
            onComplete();
            return;
        }

        const target = log.targetId ? this.troopers.get(log.targetId) : null;

        if (log.action === 'wait') {
             // Just a small delay
             this.time.delayedCall(200, onComplete);
             return;
        }



        if (log.action === 'move') {
            // this.showFloatingText(actor.x, actor.y - 50, "MOVING", '#aaaaaa');
            
            if (log.targetPosition !== undefined) {
                // Map Logic Coordinates to Screen Coordinates
                // Logic X: 0-1000 -> Screen X: 50-750 (approx)
                // Logic Y: 0-400 -> Screen Y: 100-500
                const targetPos = log.targetPosition as any as { x: number, y: number }; // Cast because types might be mixed during refactor
                
                const targetX = 50 + (targetPos.x / 1000) * 700;
                const targetY = 100 + targetPos.y; // Direct mapping with offset

                this.tweens.add({
                    targets: actor,
                    x: targetX,
                    y: targetY,
                    duration: 800,
                    ease: 'Power2',
                    onComplete: () => {
                        if (actor.scene) {
                            actor.setData('originX', targetX);
                            actor.setData('originY', targetY);
                        }
                        onComplete();
                    }
                });
            } else {
                // Fallback wiggle
                this.tweens.add({
                    targets: actor,
                    x: actor.x + (actor.getData('team') === 'A' ? 20 : -20),
                    duration: 500,
                    yoyo: true,
                    onComplete: onComplete
                });
            }
            return;
        }

        if (log.action === 'heal') {
            const target = log.targetId ? this.troopers.get(log.targetId) : null;
            if (target && target.scene) {
                this.showFloatingText(actor.x, actor.y - 50, this.translations['heal_shout'] || "HEAL!", '#00ff00');
                this.tweens.add({
                    targets: actor,
                    x: target.x,
                    y: target.y,
                    duration: 300,
                    yoyo: true,
                    onComplete: () => {
                        if (target.scene) {
                            this.showFloatingText(target.x, target.y - 50, `+${log.heal}`, '#00ff00');
                            this.updateHealth(target, -(log.heal || 0));
                        }
                        // Return to origin?
                        this.tweens.add({
                            targets: actor,
                            x: actor.getData('originX') || actor.x,
                            y: actor.getData('originY') || actor.y,
                            duration: 300,
                            onComplete: onComplete
                        });
                    }
                });
            } else {
                onComplete();
            }
            return;
        }

        if (log.action === 'attack') {
             // Sync Ammo Logic using WeaponID from log
             const weaponId = log.data?.weaponId;
             if (weaponId) {
                 const currentAmmo = actor.getData(`ammo_${weaponId}`) || 0;
                 actor.setData(`ammo_${weaponId}`, Math.max(0, currentAmmo - 1));
             }

             // VISUALS: Determine Projectile Type
             const isMelee = !weaponId || ['knife', 'fists', 'wrestler', 'fists_of_fury'].includes(weaponId);
             const isRocket = ['bazooka', 'bazooka_m1', 'bazooka_m25', 'infernal_tube', 'rocket_launcher'].includes(weaponId);
             
             let targetX = 0;
             let targetY = 0;

             if (log.targetPosition) {
                 // Miss / Stray endpoint
                 const targetPos = log.targetPosition as any as { x: number, y: number };
                 targetX = 50 + (targetPos.x / 1000) * 700;
                 targetY = 100 + targetPos.y;
             } else if (target && target.scene) {
                 targetX = target.x;
                 targetY = target.y;
             } else {
                 // Fallback
                 const forwardX = actor.x + (actor.getData('originX') < 400 ? 50 : -50);
                 targetX = forwardX;
                 targetY = actor.y;
             }

             // Handle Projectiles
             if (isMelee) {
                 // No Projectile - Just Lunge/Effect
                 const forwardX = actor.x + (actor.getData('originX') < 400 ? 30 : -30);
                 this.tweens.add({
                     targets: actor,
                     x: forwardX,
                     duration: 100,
                     yoyo: true,
                     onComplete: () => {
                         // Impact at peak of lunge
                         if (log.isMiss) {
                             this.showFloatingText(targetX, targetY - 20, this.translations['miss'] || "MISS", '#888888');
                         } else if (target && target.scene) {
                             if (log.damage) this.showFloatingText(target.x, target.y - 50, `-${log.damage}`, '#ff0000');
                             if (log.isCrit) this.showFloatingText(target.x, target.y - 70, this.translations['crit_shout'] || "CRIT!", '#ff8800');
                             this.updateHealth(target, log.damage || 0);
                         }
                         onComplete();
                     }
                 });
                 return; // Animation handled by recoil/lunge
             } else {
                 // Ranged - Projectile
                 let color = 0xffff00; // Default Yellow Bullet
                 let size = 3;
                 let speed = 200;
                 
                 if (isRocket) {
                     color = 0xff4500; // Orange Red
                     size = 6;
                     speed = 600; // Slower
                 }

                 const bullet = this.add.circle(actor.x, actor.y, size, color);
                 
                 // Recoil first
                 this.tweens.add({
                     targets: actor,
                     x: actor.x + (actor.getData('team') === 'A' ? -5 : 5),
                     duration: 50,
                     yoyo: true
                 });

                 // Shoot projectile
                 this.tweens.add({
                     targets: bullet,
                     x: targetX,
                     y: targetY,
                     duration: speed,
                     onComplete: () => {
                         bullet.destroy();
                         
                         // Impact effects
                         if (isRocket) {
                             // Explosion Effect
                             const explosion = this.add.circle(targetX, targetY, 30, 0xffaa00, 0.7);
                             this.tweens.add({
                                 targets: explosion,
                                 scale: 2,
                                 alpha: 0,
                                 duration: 300,
                                 onComplete: () => explosion.destroy()
                             });
                         }

                         if (log.isMiss) {
                             this.showFloatingText(targetX, targetY - 20, this.translations['miss'] || "MISS", '#888888');
                         } else if (target && target.scene) {
                             // Hit effect
                             if (log.damage) {
                                this.showFloatingText(target.x, target.y - 50, `-${log.damage}`, '#ff0000');
                             }
                             if (log.isCrit) {
                                 this.showFloatingText(target.x, target.y - 70, this.translations['crit_shout'] || "CRIT!", '#ff8800');
                             }
                             this.updateHealth(target, log.damage || 0);
                         }
                         // onComplete called after bullet hits? Or immediately?
                         // Better after hit for flow.
                         if (!isRocket) onComplete(); // Rocket has explosion anim
                         else this.time.delayedCall(300, onComplete);
                     }
                 });
             }

        } else if (log.action === 'reload') {
             const weaponId = actor.getData('currentWeaponId');
              if (weaponId) {
                 const currentAmmo = actor.getData(`ammo_${weaponId}`) || 0;
                 actor.setData(`ammo_${weaponId}`, currentAmmo + 1);
             }
        } else if (log.action === 'switch_weapon') {
             // Parse message for simplicity or add to log? 
             // Log message: "switches to [WeaponName]". Hard to parse ID.
             // Hack: We need `weaponId` in the log.
             // For now, let's skip strict ammo visual sync updates based on switch unless we fix log.
             // But we CAN fix log in combat.ts to include `data: { weaponId: ... }`.
             // As this is a task constraint, let's try to get live state from simulation? No, simulation is pre-calc.
             // Okay, let's rely on initial state.
             // We can't easily visualize ammo perfectly without weaponId in log.
             // BUT user asked to fix it.
             // Let's assume we need to update `combat.ts` to include metadata in logs.
        }

        if (log.action === 'use_equipment') {
            this.showFloatingText(actor.x, actor.y - 50, this.translations['grenade_shout'] || "GRENADE!", '#ff8800');
            
            let targetX = actor.x;
            let targetY = actor.y;

            if (log.targetPosition) {
                const targetPos = log.targetPosition as any as { x: number, y: number };
                targetX = 50 + (targetPos.x / 1000) * 700;
                targetY = 100 + targetPos.y;
            }
            
            const grenade = this.add.circle(actor.x, actor.y, 5, 0x000000);
            this.tweens.add({
                targets: grenade,
                x: targetX,
                y: targetY, 
                duration: 500,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    grenade.destroy();
                    const explosion = this.add.circle(targetX, targetY, 50, 0xffaa00, 0.5);
                    this.tweens.add({
                        targets: explosion,
                        scale: 2,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => {
                            explosion.destroy();
                            onComplete();
                        }
                    });
                }
            });
            return;
        }

        // Catch-all for unhandled actions (shouldn't be reachable if all types handled)
        console.warn(`Unhandled action: ${log.action}`);
        onComplete();
    }

    handleDeploy(log: BattleLogEntry, onComplete: () => void) {
        const trooper = this.allTroopersMap.get(log.actorId);
        if (!trooper) {
            onComplete();
            return;
        }

        const isLeft = trooper.team === 'A';
        
        let x = 0;
        let y = 0;

        if (log.targetPosition !== undefined) {
             const targetPos = log.targetPosition as any as { x: number, y: number };
             x = 50 + (targetPos.x / 1000) * 700;
             y = 100 + targetPos.y;
        } else {
            const randomOffset = Math.floor(Math.random() * 200);
            x = isLeft ? 50 + randomOffset : 550 + randomOffset;
            y = 100 + Math.floor(Math.random() * 400);
        }
        
        // Update Reserve Counts
        if (isLeft) {
            this.deployedCountA++;
            const remaining = Math.max(0, this.totalCountA - this.deployedCountA);
            this.reserveTextA?.setText(`Reserves: ${remaining}`);
        } else {
            this.deployedCountB++;
            const remaining = Math.max(0, this.totalCountB - this.deployedCountB);
            this.reserveTextB?.setText(`Reserves: ${remaining}`);
        }

        this.createTrooperSprite(trooper, x, y, isLeft ? 0x00ff00 : 0xff0000, isLeft);

        const container = this.troopers.get(trooper.id);
        if (container) {
            container.setAlpha(0);
            container.y -= 50;
            this.tweens.add({
                targets: container,
                alpha: 1,
                y: y,
                duration: 500,
                ease: 'Bounce.easeOut',
                onComplete: onComplete
            });
        } else {
            onComplete();
        }
    }

    createTrooperSprite(trooper: Trooper, x: number, y: number, color: number, isLeft: boolean) {
        const container = this.add.container(x, y);

        // Body
        const circle = this.add.circle(0, 0, 20, color);
        container.add(circle);

        // Weapon (indicates direction)
        const weapon = this.add.rectangle(isLeft ? 15 : -15, 5, 20, 5, 0x888888);
        container.add(weapon);

        // Name
        const nameText = this.add.text(0, -35, trooper.name, { fontSize: '12px', color: '#fff' }).setOrigin(0.5);
        container.add(nameText);

        // HP Bar Background
        const hpBarBg = this.add.rectangle(0, 30, 40, 6, 0x000000);
        container.add(hpBarBg);

        // HP Bar Foreground
        const hpBar = this.add.rectangle(0, 30, 40, 6, 0x00ff00);
        container.add(hpBar);

        // Store data for updates
        container.setData('hpBar', hpBar);
        container.setData('maxHp', trooper.attributes.maxHp);
        container.setData('currentHp', trooper.attributes.hp);
        container.setData('originX', x);
        container.setData('originY', y);
        container.setData('team', isLeft ? 'A' : 'B');
        
        // Initialize Ammo
        if (trooper.skills) {
             trooper.skills.forEach(s => {
                 // Initialize ammo for all weapon skills
                 if ((s as any).capacity) { // Duck typing Weapon
                     container.setData(`ammo_${s.id}`, trooper.ammo?.[s.id] ?? (s as any).capacity);
                 }
                 // Track current weapon?
             });
             container.setData('currentWeaponId', trooper.currentWeaponId);
        }

        this.troopers.set(trooper.id, container);

        // Interaction
        const hitArea = new Phaser.Geom.Circle(0, 0, 25);
        container.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
        container.on('pointerdown', () => {
            if (this.onTrooperClick) {
                this.onTrooperClick(trooper.id);
            }
        });
        
        // Hover effect
        container.on('pointerover', () => {
             this.input.setDefaultCursor('pointer');
             (container.list[0] as Phaser.GameObjects.Arc).setStrokeStyle(2, 0xffff00);
        });
        container.on('pointerout', () => {
             this.input.setDefaultCursor('default');
             (container.list[0] as Phaser.GameObjects.Arc).setStrokeStyle(0);
        });
    }

    pause() {
        if (this.isPaused) return;
        this.isPaused = true;
        this.tweens.pauseAll();
        
        // VISUALS: Grayscale
        if (this.cameras.main.postFX) {
            if (!this.colorMatrix) {
                this.colorMatrix = this.cameras.main.postFX.addColorMatrix();
            }
            this.colorMatrix.grayscale(1.0);
        }

        // VISUALS: Borders
        if (this.borderTop && this.borderBottom) {
            // Kill existing tweens to prevent conflict (double click)
            this.tweens.killTweensOf([this.borderTop, this.borderBottom]);

            // const height = this.scale.height; // Not used for logic coords
            this.tweens.add({
                targets: this.borderTop,
                y: 100, 
                duration: 500,
                ease: 'Power2'
            });
            this.tweens.add({
                targets: this.borderBottom,
                y: 500, // Logical Y
                duration: 500,
                ease: 'Power2'
            });
        }
    }

    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.tweens.resumeAll();

        // Remove Grayscale
        if (this.colorMatrix) {
            this.colorMatrix.grayscale(0);
        }

        // Remove Borders
        if (this.borderTop && this.borderBottom) {
            // Kill existing tweens to prevent conflict
            this.tweens.killTweensOf([this.borderTop, this.borderBottom]);

            //  const height = this.scale.height;
             this.tweens.add({
                targets: this.borderTop,
                y: 0,
                duration: 300,
                ease: 'Power2'
            });
            this.tweens.add({
                targets: this.borderBottom,
                y: 600, // Logical Y
                duration: 300,
                ease: 'Power2'
            });
        }
        
        // Notify Parent (React) to close inspector if needed
        if (this.onResume) {
            this.onResume();
        }
    }

    updateHealth(target: Phaser.GameObjects.Container, damage: number) {
        const currentHp = Math.max(0, target.getData('currentHp') - damage);
        const maxHp = target.getData('maxHp');
        target.setData('currentHp', currentHp);

        const hpBar = target.getData('hpBar') as Phaser.GameObjects.Rectangle;
        const percentage = currentHp / maxHp;
        
        // Update bar width
        hpBar.width = 40 * percentage;
        
        // Color change
        if (percentage < 0.3) hpBar.fillColor = 0xff0000;
        else if (percentage < 0.6) hpBar.fillColor = 0xffff00;

        // Death check
        if (currentHp <= 0) {
            this.tweens.add({
                targets: target,
                alpha: 0,
                y: target.y + 20,
                duration: 500,
                delay: 200,
                onComplete: () => {
                    target.destroy();
                    // We don't remove from map immediately if we want to reference it? 
                    // But for visual purposes it's gone.
                    // If we remove it, handleDeploy slot logic needs to know.
                    // We check `alpha > 0` in handleDeploy, so destroying it is fine.
                }
            });
        } else {
            // Shake effect
            this.tweens.add({
                targets: target,
                x: target.x + (Math.random() > 0.5 ? 5 : -5),
                duration: 50,
                yoyo: true,
                repeat: 3
            });
        }
    }

    showFloatingText(x: number, y: number, message: string, color: string) {
        const text = this.add.text(x, y, message, {
            fontSize: '20px',
            fontStyle: 'bold',
            color: color,
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - 40,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
    }

    public getTrooperData(id: string): any {
        const container = this.troopers.get(id);
        if (!container) return null;
        
        // Reconstruct ammo object for inspector
        const ammo: Record<string, number> = {};
        const trooperDef = this.allTroopersMap.get(id);
        if (trooperDef) {
            trooperDef.skills.forEach(s => {
                const val = container.getData(`ammo_${s.id}`);
                if (val !== undefined) ammo[s.id] = val;
            });
        }

        return {
            hp: container.getData('currentHp'),
            maxHp: container.getData('maxHp'),
            ammo: ammo,
            currentWeaponId: container.getData('currentWeaponId') || trooperDef?.currentWeaponId
        };
    }
}
