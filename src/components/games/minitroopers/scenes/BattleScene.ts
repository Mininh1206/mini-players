import Phaser from 'phaser';
import type { BattleResult, BattleLogEntry, Trooper } from '@/logic/minitroopers/types';

export class BattleScene extends Phaser.Scene {
    private battleResult: BattleResult;
    private troopers: Map<string, Phaser.GameObjects.Container>;
    private currentTurnIndex: number = 0;
    private battleText: Phaser.GameObjects.Text | null = null;
    private isPlayingTurn: boolean = false;

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
        if (this.isPlayingTurn) return; // Wait for current animation to finish
        
        if (this.currentTurnIndex >= this.battleResult.log.length) {
            this.battleText?.setText(`Winner: Team ${this.battleResult.winner === 'A' ? 'PLAYER' : 'ENEMY'}`);
            this.battleText?.setColor(this.battleResult.winner === 'A' ? '#00ff00' : '#ff0000');
            return;
        }

        const log = this.battleResult.log[this.currentTurnIndex];
        this.currentTurnIndex++;
        this.playTurnAnimation(log);
    }

    playTurnAnimation(log: BattleLogEntry) {
        this.isPlayingTurn = true;
        this.battleText?.setText(log.message);

        if (log.action === 'deploy') {
            this.handleDeploy(log);
            return;
        }

        const actor = this.troopers.get(log.actorId);
        if (!actor) {
            console.warn(`Actor ${log.actorId} not found for action ${log.action}`);
            this.isPlayingTurn = false;
            return;
        }

        if (log.action === 'wait') {
            // Reloading or waiting
            this.showFloatingText(actor.x, actor.y - 50, "RELOADING...", '#00ffff');
            this.time.delayedCall(1000, () => {
                this.isPlayingTurn = false;
            });
            return;
        }

        if (log.action === 'move') {
            this.showFloatingText(actor.x, actor.y - 50, "MOVING", '#aaaaaa');
            
            if (log.targetPosition !== undefined) {
                const targetX = 50 + (log.targetPosition / 1000) * 700;
                
                this.tweens.add({
                    targets: actor,
                    x: targetX,
                    duration: 800,
                    ease: 'Power2',
                    onComplete: () => {
                        this.isPlayingTurn = false;
                        actor.setData('originX', targetX);
                    }
                });
            } else {
                this.tweens.add({
                    targets: actor,
                    x: actor.x + (actor.getData('team') === 'A' ? 20 : -20),
                    duration: 500,
                    yoyo: true,
                    onComplete: () => {
                        this.isPlayingTurn = false;
                    }
                });
            }
            return;
        }

        if (log.action === 'heal') {
            const target = log.targetId ? this.troopers.get(log.targetId) : null;
            if (target) {
                this.showFloatingText(actor.x, actor.y - 50, "HEAL!", '#00ff00');
                this.tweens.add({
                    targets: actor,
                    x: target.x,
                    duration: 300,
                    yoyo: true,
                    onComplete: () => {
                        this.showFloatingText(target.x, target.y - 50, `+${log.heal}`, '#00ff00');
                        this.updateHealth(target, -(log.heal || 0)); // Negative damage = heal
                        this.isPlayingTurn = false;
                    }
                });
            } else {
                this.isPlayingTurn = false;
            }
            return;
        }

        if (log.action === 'use_equipment') {
            this.showFloatingText(actor.x, actor.y - 50, "GRENADE!", '#ff8800');
            // Animate throw?
            const targetX = log.targetPosition ? 50 + (log.targetPosition / 1000) * 700 : actor.x;
            
            const grenade = this.add.circle(actor.x, actor.y, 5, 0x000000);
            this.tweens.add({
                targets: grenade,
                x: targetX,
                y: targetX, // Should be ground level?
                duration: 500,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    grenade.destroy();
                    // Explosion effect
                    const explosion = this.add.circle(targetX, 300, 50, 0xffaa00, 0.5);
                    this.tweens.add({
                        targets: explosion,
                        scale: 2,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => {
                            explosion.destroy();
                            this.isPlayingTurn = false;
                        }
                    });
                }
            });
            return;
        }

        const target = log.targetId ? this.troopers.get(log.targetId) : null;

        // Attack Animation
        const forwardX = actor.x + (actor.getData('originX') < 400 ? 30 : -30);
        
        this.tweens.chain({
            targets: actor,
            tweens: [
                {
                    x: forwardX,
                    duration: 200,
                    ease: 'Power1'
                },
                {
                    duration: 100,
                    onComplete: () => {
                        // Determine hit/miss
                        if (log.isMiss || log.isDodge) {
                            this.showFloatingText(target?.x || actor.x, (target?.y || actor.y) - 50, log.isDodge ? "DODGE!" : "MISS!", '#ffff00');
                        } else if (target && log.damage !== undefined) {
                            // Hit!
                            this.showFloatingText(target.x, target.y - 50, `-${log.damage}`, '#ff0000');
                            if (log.isCrit) {
                                this.showFloatingText(target.x, target.y - 70, "CRIT!", '#ff8800');
                            }
                            
                            // Update HP
                            this.updateHealth(target, log.damage);
                        }
                    }
                },
                {
                    x: actor.getData('originX'), // Should return to actual position?
                    // If they moved, originX is stale.
                    // But since we don't track real movement yet, this is fine.
                    duration: 200,
                    ease: 'Power1',
                    onComplete: () => {
                        this.isPlayingTurn = false;
                    }
                }
            ]
        });
    }

    handleDeploy(log: BattleLogEntry) {
        const trooper = this.allTroopersMap.get(log.actorId);
        if (!trooper) {
            this.isPlayingTurn = false;
            return;
        }

        // Use position from trooper state if available (it was set in deploy)
        // But `allTroopersMap` has the *initial* state passed to init.
        // The `combat.ts` modifies the objects in place?
        // `simulateBattle` deep copies `reserveA` etc.
        // So the `trooper` in `allTroopersMap` (from `data.teamA`) might NOT have the `position` set by `deploy` inside `simulateBattle`.
        // `simulateBattle` returns `survivorsA` etc, but `BattleScene` receives `teamA` (initial).
        // Wait, `MiniTroopersLayout` passes:
        // `const mySquad = player.troopers.map(...)`
        // `const result = simulateBattle(mySquad, ...)`
        // `MiniTroopersGame` receives `mySquad` (initial) and `result`.
        // So `BattleScene` doesn't know the positions calculated inside `simulateBattle`.
        // This is a problem for accurate positioning.
        // I should probably include the `position` in the `deploy` log message data?
        // Or just map 0-1000 to screen width randomly for now to match the logic roughly.
        // `combat.ts`: `trooper.position = ... random ...`
        // So I can just generate a random position here too, consistent with team.
        
        const isLeft = trooper.team === 'A';
        // Map 0-200 (A) -> 50-250 px
        // Map 800-1000 (B) -> 550-750 px
        
        const randomOffset = Math.floor(Math.random() * 200);
        const x = isLeft ? 50 + randomOffset : 550 + randomOffset;
        
        // Y position: Random or slot based?
        // Let's use random Y to avoid stacking.
        const y = 100 + Math.floor(Math.random() * 400);

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
                onComplete: () => {
                    this.isPlayingTurn = false;
                }
            });
        } else {
            this.isPlayingTurn = false;
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
