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

    // All troopers available (for looking up data when spawning)
    private allTroopersMap: Map<string, Trooper> = new Map();

    constructor() {
        super('BattleScene');
        this.troopers = new Map();
        this.battleResult = { winner: '', log: [] } as any; 
    }

    init(data: { result: BattleResult, teamA: Trooper[], teamB: Trooper[] }) {
        this.battleResult = data.result || { winner: '', log: [] };
        
        // Map all troopers for easy access
        this.allTroopersMap.clear();
        [...(data.teamA || []), ...(data.teamB || [])].forEach(t => {
            this.allTroopersMap.set(t.id, t);
        });

        this.currentTurnIndex = 0;
        this.isPlayingTurn = false;
    }

    create() {
        this.add.image(400, 300, 'sky').setAlpha(0.5);
        
        this.battleText = this.add.text(400, 50, 'Battle Start!', {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);

        // Clear any existing sprites
        this.troopers.clear();

        // Start turn execution loop
        this.time.addEvent({
            delay: 1000, // Speed up slightly?
            callback: this.processNextTurn,
            callbackScope: this,
            loop: true
        });
    }

    processNextTurn() {
        if (this.isPaused) return;
        if (this.isPlayingTurn) return; // Wait for current batch to finish
        
        if (this.currentTurnIndex >= this.battleResult.log.length) {
            this.battleText?.setText(`Winner: Team ${this.battleResult.winner === 'A' ? 'PLAYER' : 'ENEMY'}`);
            this.battleText?.setColor(this.battleResult.winner === 'A' ? '#00ff00' : '#ff0000');
            return;
        }

        // Collect all logs with the same time
        const currentLog = this.battleResult.log[this.currentTurnIndex];
        const currentTime = currentLog.time;
        const batch: BattleLogEntry[] = [];

        while (this.currentTurnIndex < this.battleResult.log.length) {
            const nextLog = this.battleResult.log[this.currentTurnIndex];
            if (nextLog.time === currentTime) {
                batch.push(nextLog);
                this.currentTurnIndex++;
            } else {
                break;
            }
        }

        this.playBatchAnimations(batch);
    }

    playBatchAnimations(batch: BattleLogEntry[]) {
        this.isPlayingTurn = true;
        let activeAnimations = 0;

        const onAnimationComplete = () => {
            activeAnimations--;
            if (activeAnimations <= 0) {
                this.isPlayingTurn = false;
            }
        };

        // If batch is empty (shouldn't happen), reset
        if (batch.length === 0) {
            this.isPlayingTurn = false;
            return;
        }

        // Update text for the batch
        this.battleText?.setText(`Time: ${batch[0].time}`);
        
        // Combine messages for the top display
        const combinedMessage = batch.map(l => l.message).join(' | ');
        // Truncate if too long
        const displayMessage = combinedMessage.length > 50 ? combinedMessage.substring(0, 47) + '...' : combinedMessage;
        
        // We can't easily show the message on the main text if we want the timer there.
        // Maybe create a separate text object for the timer?
        // Or format: "Time: 100 - Rat moves..."
        this.battleText?.setText(`[${batch[0].time}] ${displayMessage}`);

        batch.forEach(log => {
            activeAnimations++;
            this.playTurnAnimation(log, onAnimationComplete);
        });
    }

    playTurnAnimation(log: BattleLogEntry, onComplete: () => void) {
        // Individual messages are handled by floating text or the batch text above.

        if (log.action === 'deploy') {
            this.handleDeploy(log, onComplete);
            return;
        }

        const actor = this.troopers.get(log.actorId);
        // Check if actor sprite is valid (not destroyed)
        if (!actor || !actor.scene) { 
            // Actor might be dead/destroyed.
            // If it's a "wait" or "move" from a dead actor (shouldn't happen logic-wise but maybe visual lag), skip.
            console.warn(`Actor ${log.actorId} not found or destroyed for action ${log.action}`);
            onComplete();
            return;
        }

        if (log.action === 'wait') {
            this.showFloatingText(actor.x, actor.y - 50, "...", '#00ffff');
            this.time.delayedCall(500, onComplete);
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
                this.showFloatingText(actor.x, actor.y - 50, "HEAL!", '#00ff00');
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

        if (log.action === 'use_equipment') {
            this.showFloatingText(actor.x, actor.y - 50, "GRENADE!", '#ff8800');
            
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

        const target = log.targetId ? this.troopers.get(log.targetId) : null;

        // Attack Animation
        const forwardX = actor.x + (actor.getData('originX') < 400 ? 30 : -30);
        const forwardY = actor.y; // No vertical lunge for now?
        
        this.tweens.chain({
            targets: actor,
            tweens: [
                {
                    x: forwardX,
                    y: forwardY,
                    duration: 200,
                    ease: 'Power1'
                },
                {
                    duration: 100,
                    onComplete: () => {
                        // Determine hit/miss
                        if (log.isMiss || log.isDodge) {
                            this.showFloatingText(target?.x || actor.x, (target?.y || actor.y) - 50, log.isDodge ? "DODGE!" : "MISS!", '#ffff00');
                        } else if (target && target.scene && log.damage !== undefined) {
                            // Hit!
                            this.showFloatingText(target.x, target.y - 50, `-${log.damage}`, '#ff0000');
                            if (log.isCrit) {
                                this.showFloatingText(target.x, target.y - 70, "CRIT!", '#ff8800');
                            }
                            
                            this.updateHealth(target, log.damage);
                        }
                    }
                },
                {
                    x: actor.getData('originX') || actor.x,
                    y: actor.getData('originY') || actor.y,
                    duration: 200,
                    ease: 'Power1',
                    onComplete: onComplete
                }
            ]
        });
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
        this.isPaused = true;
        this.tweens.pauseAll();
    }

    resume() {
        this.isPaused = false;
        this.tweens.resumeAll();
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
}
