import Phaser from 'phaser';
import type { BattleResult, BattleLogEntry, TrooperData } from '@/logic/minitroopers/types';
import { Trooper } from '@/logic/minitroopers/classes/Trooper';
import { BattleMap } from '@/logic/minitroopers/systems/BattleMap';
import { EffectFactory } from '@/logic/minitroopers/systems/VisualEffects';
import { BattleAnimations } from './BattleAnimations';

export class BattleScene extends Phaser.Scene {
    private battleResult: BattleResult;
    private troopers: Map<string, Phaser.GameObjects.Container>;
    private currentTurnIndex: number = 0;
    private battleText: Phaser.GameObjects.Text | null = null;
    private battleTimerText: Phaser.GameObjects.Text | null = null;
    private isPaused: boolean = false;
    private isBattleEnded: boolean = false;
    private pauseOverlay: Phaser.GameObjects.Rectangle | null = null;
    
    public onTrooperClick?: (trooperId: string) => void;
    public onResume?: () => void;
    public onTimeUpdate?: (time: number) => void;
    
    // Core Logic
    private static readonly TICKS_PER_SECOND = 30; // 30 ticks/s = ~33ms per tick. Cinematic pacing.
    private battleTime: number = 0;
    private speedMultiplier: number = 1;
    
    // Event Queues per Actor
    private actionQueues: Map<string, BattleLogEntry[]> = new Map();
    private isActorBusy: Map<string, boolean> = new Map();

    // Data maps
    private allTroopersMap: Map<string, Trooper> = new Map();
    
    // Systems
    private mapSystem: BattleMap;
    private translations: Record<string, string> = {};

    // HUD
    private teamAStatsText: Phaser.GameObjects.Text | null = null;
    private teamBStatsText: Phaser.GameObjects.Text | null = null;
    private totalCountA: number = 0;
    private totalCountB: number = 0;
    private deployedCountA: number = 0;
    private deployedCountB: number = 0;
    private communicationsA: number = 0;
    private communicationsB: number = 0;
    private sabotageA: number = 0;
    private sabotageB: number = 0;
    
    private animations!: BattleAnimations;
    public onActionStart?: (log: BattleLogEntry) => void;

    constructor() {
        super('BattleScene');
        this.troopers = new Map();
        this.battleResult = { winner: '', log: [] } as any; 
        this.mapSystem = new BattleMap(this);
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
        this.isPaused = false;
        this.isBattleEnded = false;
        this.actionQueues.clear();
        this.isActorBusy.clear();

        this.totalCountA = data.teamA?.length || 0;
        this.totalCountB = data.teamB?.length || 0;
        this.deployedCountA = 0;
        this.deployedCountB = 0;

        // Calculate Stats
        const getComms = (team: Trooper[]) => team.reduce((acc, t) => {
            const comms = t.skills.find(s => s.id === 'comms_officer');
            return acc + (comms ? 5 + (t.level || 1) : 0);
        }, 0);
        const getSabotage = (team: Trooper[]) => team.reduce((acc, t) => {
            const sab = t.skills.find(s => s.id === 'saboteur');
            return acc + (sab ? 5 + (t.level || 1) : 0);
        }, 0);

        this.communicationsA = getComms(data.teamA || []);
        this.communicationsB = getComms(data.teamB || []);
        this.sabotageA = getSabotage(data.teamA || []);
        this.sabotageB = getSabotage(data.teamB || []);
    }

    preload() {
        this.mapSystem.preload();
    }

    create() {
        // MAP
        this.mapSystem.create();
        
        // Camera
        this.cameras.main.centerOn(400, 300);

        // Input Background (for pause)
        const bg = this.add.rectangle(400, 300, 4000, 4000, 0x000000, 0).setInteractive();
        bg.on('pointerdown', () => {
             if (this.isPaused) this.resume();
             else this.pause();
        });

        // Pause Overlay (visual only, doesn't block input - troopers stay clickable)
        this.pauseOverlay = this.add.rectangle(400, 300, 4000, 4000, 0x000000, 0.4)
            .setDepth(999) // Below troopers so they can be clicked
            .setScrollFactor(0)
            .setVisible(false);

        // Battle Timer Text
        this.battleTimerText = this.add.text(400, 50, '00:00', {
            fontSize: '24px', color: '#fff', stroke: '#000', strokeThickness: 4, fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

        // Battle Text
        this.battleText = this.add.text(400, -250, this.translations['battle_start'] || 'Battle Start!', {
            fontSize: '48px', color: '#ffffff', stroke: '#000000', strokeThickness: 6, align: 'center', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

        this.troopers.clear();

        // Cinematic Borders
        this.add.rectangle(400, 0, 4000, 150, 0x000000).setDepth(900).setOrigin(0.5, 1).setScrollFactor(0);
        this.add.rectangle(400, 600, 4000, 150, 0x000000).setDepth(900).setOrigin(0.5, 0).setScrollFactor(0);

        this.createHUD();
        this.scale.on('resize', this.resize, this);
        this.resize({ width: this.scale.width, height: this.scale.height });
        
        this.animations = new BattleAnimations(this);
    }

    private createHUD() {
        const hudY = 575; 
        const style = { fontSize: '12px', color: '#ffffff', stroke: '#000000', strokeThickness: 2, fontStyle: 'bold' };
        
        // Team A Stats
        this.teamAStatsText = this.add.text(20, hudY, '', style).setOrigin(0, 0.5).setDepth(901).setScrollFactor(0);
        // Team B Stats
        this.teamBStatsText = this.add.text(780, hudY, '', style).setOrigin(1, 0.5).setDepth(901).setScrollFactor(0);
    }

    private updateHUD() {
        const format = (deployed: number, total: number, comms: number, sab: number) => 
            `👤${deployed}/${total}  📡${comms}  🔧${sab}`;
            
        if (this.teamAStatsText) this.teamAStatsText.setText(format(this.deployedCountA, this.totalCountA, this.communicationsA, this.sabotageA));
        if (this.teamBStatsText) this.teamBStatsText.setText(format(this.deployedCountB, this.totalCountB, this.communicationsB, this.sabotageB));
        
        // Update Timer
        if (this.battleTimerText) {
             const totalSeconds = this.battleTime / 100; // Convert ticks to seconds (100 ticks = 1s)
             const m = Math.floor(totalSeconds / 60);
             const s = (totalSeconds % 60).toFixed(1);
             this.battleTimerText.setText(`${m.toString().padStart(2, '0')}:${s.padStart(4, '0')}`);
        }
    }

    setSpeed(multiplier: number) {
        this.speedMultiplier = multiplier;
    }

    resume() {
        if (this.isBattleEnded) return; // Don't resume after battle ends
        this.isPaused = false;
        if (this.pauseOverlay) this.pauseOverlay.setVisible(false);
        if (this.onResume) this.onResume();
    }

    pause() {
        this.isPaused = true;
        if (this.pauseOverlay) this.pauseOverlay.setVisible(true);
    }

    getBattleTime(): number {
        return this.battleTime;
    }

    // --- Trooper Data Access ---
    public getTrooperData(trooperId: string): TrooperData | null {
        const container = this.troopers.get(trooperId);
        if (!container) return null;
        
        // Get definition from map for name/skills
        const def = this.allTroopersMap.get(trooperId);
        
        // Return structured data for Inspector
        return {
            id: trooperId,
            attributes: {
                hp: container.getData('hp'),
                maxHp: container.getData('maxHp'),
                initiative: container.getData('initiative') || 100,
            },
            currentWeaponId: container.getData('currentWeaponId'),
            ammo: this.getAllAmmo(container),
            sabotagedWeapons: container.getData('sabotagedWeapons') || [],
            jammedWeapons: container.getData('jammedWeapons') || [],
            wounds: container.getData('wounds') || {},
            name: container.getData('name') || def?.name || 'Unknown',
            team: container.getData('team'),
            class: container.getData('class') || 'Soldier',
            level: container.getData('level') || 1,
            skills: def?.skills || [],
            reserves: this.getReserves(container)
        } as any;
    }
    
    private getReserves(container: Phaser.GameObjects.Container) {
        // Reserves are static for now unless we implement "Reload takes from Reserve" logic in log data?
        // Actually log.data usually implies ammo deduction but reserves logic is in Trooper class.
        // For visual, we can read basic reserves from Definition, as we don't simulate reserve decrements in logs perfectly yet?
        // Wait, 'Trooper.ts' manages reserves logic simulation side.
        // Visual side just needs to know it. 
        // Let's assume Definition is source of truth for initial reserves, and we don't track reserve decrement visually yet (just magazine).
        // Or we can store it in data container too.
        const def = this.allTroopersMap.get(container.getData('id') || '');
        return def?.reserves || {};
    }
    
    private getAllAmmo(container: Phaser.GameObjects.Container) {
        const ammo: Record<string, number> = {};
        container.data.each((parent: any, key: string, value: any) => {
            if (key.startsWith('ammo_')) {
                const wId = key.replace('ammo_', '');
                ammo[wId] = value;
            }
        }, this);
        return ammo;
    }

    update(time: number, delta: number) {
        if (this.isPaused) return;

        // 1. Advance Logical Time (Throttled)
        
        // Check for lagging actors to prevent time drift (Visuals vs Simulation)
        let minPendingTime = Infinity;
        this.actionQueues.forEach((queue, actorId) => {
            if (queue.length > 0) {
                 // If actor is busy, their next action is "blocked" visually.
                 // We consider the time of the *next* action in their queue.
                 const nextLog = queue[0];
                 if (nextLog.time < minPendingTime) {
                     minPendingTime = nextLog.time;
                 }
            }
        });

        // If the oldest pending action is significantly behind current battleTime, slow down.
        // Allow drift (50 ticks = 0.5s) for fluidity, use gradual slowdown instead of hard freeze.
        const MAX_DRIFT = 50; // 0.5s drift allowed before slowdown
        const drift = this.battleTime - minPendingTime;
        
        // Calculate slowdown factor: 1.0 when no drift, approaching 0 when very behind
        let speedFactor = 1.0;
        if (drift > MAX_DRIFT && minPendingTime !== Infinity) {
            speedFactor = Math.max(0.1, 1 - ((drift - MAX_DRIFT) / 100));
        }

        const ticksPerFrame = (delta / 1000) * BattleScene.TICKS_PER_SECOND * this.speedMultiplier * speedFactor;
        this.battleTime += ticksPerFrame;
        
        // Notify listeners of time update (for progressive log)
        if (this.onTimeUpdate) this.onTimeUpdate(this.battleTime);

        // 2. Queue Events
        while (this.currentTurnIndex < this.battleResult.log.length) {
            const nextLog = this.battleResult.log[this.currentTurnIndex];
            if (nextLog.time <= this.battleTime) {
                if (nextLog.actorId) {
                    if (!this.actionQueues.has(nextLog.actorId)) {
                        this.actionQueues.set(nextLog.actorId, []);
                    }
                    this.actionQueues.get(nextLog.actorId)!.push(nextLog);
                }
                this.currentTurnIndex++;
            } else {
                break;
            }
        }

        // 3. Process Queues per Actor
        this.actionQueues.forEach((queue, actorId) => {
            if (queue.length > 0 && !this.isActorBusy.get(actorId)) {
                
                const nextAction = queue[0];
                
                // SPY FIX: Prevent duplicate deploy
                if (nextAction.action === 'deploy' && this.troopers.has(actorId)) {
                    queue.shift(); // Discard duplicate deploy
                    return;
                }

                // Execute
                queue.shift();
                this.playAction(nextAction);
            }
        });
        
        // 4. Update HUD
        this.updateHUD();
        
        // Victory Check (Throttled)
        if (this.currentTurnIndex >= this.battleResult.log.length && Array.from(this.actionQueues.values()).every(q => q.length === 0) && Array.from(this.isActorBusy.values()).every(b => !b)) {
            this.checkVictory();
        }
    }
    
    private checkVictory() {
         const winnerText = this.battleResult.winner === 'A' ? "VICTORY!" : "DEFEAT!";
         if (this.battleText && this.battleText.text !== winnerText) {
             this.isPaused = true; // Stop the timer
             this.isBattleEnded = true; // Permanently end battle
             this.battleText.setText(winnerText);
             this.battleText.setColor(this.battleResult.winner === 'A' ? '#00ff00' : '#ff0000');
             this.tweens.add({
                 targets: this.battleText,
                 scale: { from: 0, to: 1.5 },
                 y: 300, 
                 duration: 1000,
                 ease: 'Elastic',
                 onComplete: () => this.celebrateVictory()
             });
         }
    }

    private celebrateVictory() {
        const victoryPhrases = [
            "Yeah!", "Woohoo!", "Got 'em!", "Easy!", "Victory!",
            "Too slow!", "Boom!", "Owned!", "GG!", "Nice!",
            "Crushed!", "Dominated!", "Ha ha!", "Next!", "Done!"
        ];

        const winnerTeam = this.battleResult.winner;
        // Move completely off-screen (Canvas width is 800)
        const targetX = winnerTeam === 'A' ? 950 : -150; 

        let delay = 0;
        this.troopers.forEach((container, id) => {
            const team = container.getData('team');
            const hp = container.getData('hp') || 0;
            
            // Only living winners celebrate
            if (team === winnerTeam && hp > 0) {
                // Say a phrase with delay
                this.time.delayedCall(delay, () => {
                    const phrase = victoryPhrases[Math.floor(Math.random() * victoryPhrases.length)];
                    this.showFloatingText(container.x, container.y - 40, phrase, '#ffff00');
                });

                // Run to enemy side with delay
                this.time.delayedCall(delay + 300, () => {
                    // Face the right direction
                    container.scaleX = winnerTeam === 'A' ? 2.0 : -2.0;
                    
                    this.tweens.add({
                        targets: container,
                        x: targetX + (Math.random() * 100 - 50),
                        duration: 1500 + Math.random() * 500,
                        ease: 'Power2'
                    });
                });

                delay += 200; // Stagger celebrations
            }
        });
    }
    
    resize(gameSize: { width: number, height: number }) {
        this.mapSystem.resize(gameSize.width, gameSize.height);
        this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
        const zoom = Math.min(gameSize.width / 800, gameSize.height / 600);
        this.cameras.main.setZoom(zoom);
        this.cameras.main.centerOn(400, 300);
    }

    // --- ANIMATION CONTROLLER ---

    private playAction(log: BattleLogEntry) {
        const actorId = log.actorId;
        this.isActorBusy.set(actorId, true);
        
        // Notify UI immediately (for log sync)
        if (this.onActionStart) this.onActionStart(log);

        const onComplete = () => {
             this.isActorBusy.set(actorId, false);
        };
        
        this.animations.setSpeed(this.speedMultiplier); // Sync Speed
        
        if (log.action === 'deploy') {
            this.handleDeploy(log, onComplete);
            return;
        }

        this.applyLogEffects(log);

        const actor = this.troopers.get(actorId);
        if (!actor) {
             onComplete();
             return;
        }

        switch (log.action) {
            case 'move': this.animations.animateMove(actor, log, onComplete); break;
            case 'attack': this.animations.animateAttack(actor, log, (id) => this.troopers.get(id), onComplete); break;
            case 'switch_weapon': this.animations.animateSwitch(actor, log, onComplete); break;
            case 'reload': this.animations.animateReload(actor, log, onComplete); break;
            case 'wait': 
                if (log.message.includes('dies')) this.animations.animateDeath(actor, log, onComplete);
                else this.time.delayedCall(200 / this.speedMultiplier, onComplete);
                break;
            case 'heal': this.animations.animateHeal(actor, log, onComplete); break;
            case 'sabotage': this.animations.animateSabotage(actor, log, onComplete); break;
            default: onComplete();
        }
    }

    private applyLogEffects(log: BattleLogEntry) {
        // Apply state changes from log to container data immediately
        if (log.actorId) {
            const actor = this.troopers.get(log.actorId);
            if (actor) {
                 // Update Weapon
                 if (log.data?.currentWeaponId) {
                     actor.setData('currentWeaponId', log.data.currentWeaponId);
                 } else if (log.action === 'switch_weapon' && log.data?.weaponId) {
                     actor.setData('currentWeaponId', log.data.weaponId);
                 }
                 
                 // Update Ammo (Decrement)
                 if (log.action === 'attack' && log.data?.weaponId) {
                     const wId = log.data.weaponId;
                     const current = actor.getData(`ammo_${wId}`);
                     if (current !== undefined && current > 0) {
                         actor.setData(`ammo_${wId}`, current - 1);
                     }
                 }
                 // Update Ammo (Reload)
                 if (log.action === 'reload') {
                     const wId = actor.getData('currentWeaponId');
                     if (wId) {
                        const cur = actor.getData(`ammo_${wId}`) || 0;
                        actor.setData(`ammo_${wId}`, cur + 1); // Simple +1 for now, or use max capacity if in data?
                     }
                 }
            }
        }
        
        if (log.targetId) {
             const target = this.troopers.get(log.targetId);
             if (target) {
                 // Damage
                 if (log.damage) {
                     const currentHp = target.getData('hp') || 0;
                     const newHp = Math.max(0, currentHp - log.damage);
                     target.setData('hp', newHp);
                 }
                 // Heal
                 if (log.heal) {
                     const currentHp = target.getData('hp') || 0;
                     const maxHp = target.getData('maxHp') || 10;
                     target.setData('hp', Math.min(maxHp, currentHp + log.heal));
                 }
                 // Wounds
                 if (log.hitLocation) {
                    const wounds = target.getData('wounds') || {};
                    switch(log.hitLocation) {
                        case 'head': wounds.head = true; break;
                        case 'torso': wounds.chest = true; break;
                        case 'arm': wounds.leftArm = true; break; // Simplified
                        case 'leg': wounds.leftLeg = true; break;
                    }
                    target.setData('wounds', wounds);
                 }
                 // Sabotage/Jam
                 if (log.action === 'jam_weapon' && log.data?.weaponId) {
                     const list = target.getData('jammedWeapons') || [];
                     if (!list.includes(log.data.weaponId)) {
                         target.setData('jammedWeapons', [...list, log.data.weaponId]);
                     }
                 }
                 // Eject
                 if (log.action === 'eject') {
                    // Visual update for vehicle removed handled by next draw? Or we should force redraw?
                    // We can re-call drawTrooper? 
                    // But drawTrooper needs full data.
                    // For now, next update or specific event handling.
                 }
             }
        }
    }

    private handleDeploy(log: BattleLogEntry, onComplete: () => void) {
        if (this.troopers.has(log.actorId)) {
            // Already deployed?
            onComplete();
            return;
        }

        const def = this.allTroopersMap.get(log.actorId);
        const team = def?.team || 'A';
        
        let x = 400, y = 300;
        
        // Find the LAST deploy log entry for this trooper (spy skill used to create second, now fixed. But we check anyway)
        // We use the current log's targetPosition as source of truth.
        
        if (log.targetPosition) {
             x = 50 + (log.targetPosition.x / 1000) * 700;
             y = 100 + log.targetPosition.y; 
        }

        const container = this.add.container(x, y);
        // Hitbox based on vehicle or default
        const hitRadius = log.data?.vehicle ? 20 : 15;
        const hitArea = new Phaser.Geom.Circle(0, 0, hitRadius);
        container.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
        
        container.on('pointerdown', () => {
             if (this.onTrooperClick) this.onTrooperClick(log.actorId);
        });

        // Hover Effect
        container.on('pointerover', () => {
             document.body.style.cursor = 'pointer';
             this.tweens.add({
                 targets: container,
                 scale: 2.2,
                 duration: 100
             });
        });

        container.on('pointerout', () => {
             document.body.style.cursor = 'default';
             this.tweens.add({
                 targets: container,
                 scale: 2.0,
                 duration: 100
             });
        });

        // Use Animations Helper to draw
        this.animations.drawTrooper(container, {
            team: team,
            vehicle: log.data?.vehicle,
            currentWeaponId: def?.currentWeaponId || log.data?.currentWeaponId
        });

        container.setDepth(1000);
        
        // Initial Data Sync
        container.setData('id', log.actorId);
        if (def) {
            container.setData('name', def.name);
            container.setData('class', def.class);
            container.setData('level', def.level);
            container.setData('team', team);
            container.setData('currentWeaponId', def.currentWeaponId);
            container.setData('hp', def.attributes.hp);
            container.setData('maxHp', def.attributes.maxHp);
            container.setData('initiative', def.attributes.initiative);
            if (def.ammo) Object.entries(def.ammo).forEach(([k, v]) => container.setData(`ammo_${k}`, v));
            container.setData('jammedWeapons', def.jammedWeapons || []);
        }
        
        // Sync sabotagedWeapons from log
        const sabotagedFromLog: string[] = [];
        for (const entry of this.battleResult.log) {
            if (entry.time > log.time) break; 
            if (entry.action === 'jam_weapon' && entry.targetId === log.actorId && entry.data?.weaponId) {
                if (!sabotagedFromLog.includes(entry.data.weaponId)) {
                    sabotagedFromLog.push(entry.data.weaponId);
                }
            }
        }
        container.setData('sabotagedWeapons', sabotagedFromLog);

        this.troopers.set(log.actorId, container);
        if (team === 'A') this.deployedCountA++; else this.deployedCountB++;
        
        container.setAlpha(0);
        container.scale = 0; 
        this.tweens.add({
            targets: container,
            alpha: 1,
            scale: 2.0, 
            duration: 500 / this.speedMultiplier,
            ease: 'Back.out',
            onComplete: () => {
                onComplete();
            }
        });
    }

    private showFloatingText(x: number, y: number, text: string, color: string) {
        const t = this.add.text(x, y, text, { 
            fontSize: '16px', color: color, stroke: '#000', strokeThickness: 3, fontStyle: 'bold' 
        }).setOrigin(0.5);
        this.tweens.add({
            targets: t,
            y: y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => t.destroy()
        });
    }
}
