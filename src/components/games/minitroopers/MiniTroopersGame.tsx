import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BattleScene } from './scenes/BattleScene';
import BootScene from './scenes/BootScene';
import type { BattleResult, Trooper, BattleLogEntry } from '@/logic/minitroopers/types';
import BattleInspector from './ui/BattleInspector';
import { useTranslation } from '@/logic/minitroopers/i18n';
import { mergeTrooperData } from '@/logic/minitroopers/utils';

interface MiniTroopersGameProps {
    battleResult?: BattleResult | null;
    mySquad?: Trooper[];
    opponentSquad?: Trooper[];
    translations?: Record<string, string>;
    onBattleTimeUpdate?: (time: number) => void;
    onLogEntry?: (log: BattleLogEntry) => void;
}

const MiniTroopersGame: React.FC<MiniTroopersGameProps> = ({ battleResult, mySquad, opponentSquad, translations, onBattleTimeUpdate, onLogEntry }) => {
    const gameContainer = useRef<HTMLDivElement>(null);
    const gameInstance = useRef<Phaser.Game | null>(null);
    const [inspectedTrooper, setInspectedTrooper] = React.useState<Trooper | null>(null);
    const { t } = useTranslation();
    const [speedLabel, setSpeedLabel] = React.useState('1x');

    // Use ref to store the latest callback so we don't trigger re-renders
    const timeUpdateRef = useRef(onBattleTimeUpdate);

    // Update ref when callback changes
    useEffect(() => {
        timeUpdateRef.current = onBattleTimeUpdate;
        // Also update running scene if it exists
        if (gameInstance.current) {
            const scene = gameInstance.current.scene.getScene('BattleScene') as BattleScene;
            if (scene) {
                scene.onTimeUpdate = onBattleTimeUpdate;
            }
        }
    }, [onBattleTimeUpdate]);

    useEffect(() => {
        if (typeof window !== 'undefined' && gameContainer.current && !gameInstance.current) {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                scale: {
                    mode: Phaser.Scale.RESIZE,
                    width: '100%',
                    height: '100%',
                    autoCenter: Phaser.Scale.NO_CENTER
                },
                parent: gameContainer.current,
                scene: [BootScene, BattleScene],
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { x: 0, y: 0 },
                        debug: false
                    }
                },
                backgroundColor: '#1a1a1a'
            };

            gameInstance.current = new Phaser.Game(config);
        }

        return () => {
            if (gameInstance.current) {
                gameInstance.current.destroy(true);
                gameInstance.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (gameInstance.current && battleResult && mySquad && opponentSquad) {
            const scene = gameInstance.current.scene.getScene('BattleScene') as BattleScene;

            const startScene = (s: BattleScene) => {
                // Restart scene first
                s.scene.restart({ result: battleResult, teamA: mySquad, teamB: opponentSquad, translations });

                // Wait a frame for scene to restart, then setup callbacks
                // Using requestAnimationFrame to ensure scene has time to initialize
                requestAnimationFrame(() => {
                    const newScene = gameInstance.current?.scene.getScene('BattleScene') as BattleScene;
                    if (!newScene) return;

                    // Setup callbacks on the newly restarted scene
                    newScene.onTrooperClick = (trooperId: string) => {
                        const liveData = newScene.getTrooperData(trooperId);
                        const trooperDef = [...(mySquad || []), ...(opponentSquad || [])].find(t => t.id === trooperId);
                        if (trooperDef) {
                            const trooper = liveData ? mergeTrooperData(trooperDef, liveData) : trooperDef;
                            setInspectedTrooper(trooper);
                            newScene.pause();
                        }
                    };

                    newScene.onResume = () => {
                        setInspectedTrooper(null);
                    };

                    if (timeUpdateRef.current) {
                        newScene.onTimeUpdate = timeUpdateRef.current;
                    }

                    // Intercept log entry to update Inspector
                    newScene.onActionStart = (log: BattleLogEntry) => {
                        // 1. Pass to parent (Simulator View)
                        if (onLogEntry) onLogEntry(log);

                        // 2. Update Inspected Trooper if active
                        setInspectedTrooper(prev => {
                            // Only update if we are inspecting someone, and the log relates to them
                            // (Either they are actor or target, or global event)
                            if (!prev) return null;

                            // Optimization: Only update if relevant? 
                            // Validating all updates ensures we catch side effects (e.g. splash damage)
                            // Safest to always update if inspecting.
                            const liveData = newScene.getTrooperData(prev.id);
                            if (liveData) {
                                // We need to merge with original def to keep skills/static data
                                // But getTrooperData already merges?
                                // getTrooperData returns full object with current stats.
                                // But wait, getTrooperData returns TrooperData (interface), not Trooper (class instance).
                                // setInspectedTrooper expects Trooper | null.
                                // We might need to merge carefully or cast.
                                // Utils 'mergeTrooperData' handles this?

                                // We need the original definition to merge effectively
                                const def = [...(mySquad || []), ...(opponentSquad || [])].find(t => t.id === prev.id);
                                if (def) {
                                    return mergeTrooperData(def, liveData);
                                }
                            }
                            return prev;
                        });
                    };
                });
            };

            if (scene) {
                startScene(scene);
            } else {
                gameInstance.current.events.once('ready', () => {
                    const s = gameInstance.current?.scene.getScene('BattleScene') as BattleScene;
                    if (s) startScene(s);
                });
            }
        }
    }, [battleResult, mySquad, opponentSquad, translations]);

    const handleCloseInspector = () => {
        setInspectedTrooper(null);
        const scene = gameInstance.current?.scene.getScene('BattleScene') as BattleScene;
        if (scene) {
            scene.resume();
        }
    };

    return (
        <div className="flex flex-col w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 relative">
            <div ref={gameContainer} id="phaser-game" className="w-full h-full overflow-hidden" />

            {inspectedTrooper && (
                <BattleInspector
                    key={inspectedTrooper.id}
                    trooper={inspectedTrooper}
                    onClose={handleCloseInspector}
                    t={t}
                    scene={gameInstance.current?.scene.getScene('BattleScene') as any}
                />
            )}

            {/* Speed Controls */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
                {[1, 2, 4].map(scale => (
                    <button
                        key={scale}
                        className={`font-bold py-1 px-3 rounded text-xs transition-colors border ${speedLabel === `${scale}x`
                            ? 'bg-yellow-600 text-white border-yellow-500'
                            : 'bg-gray-800/80 text-gray-300 border-gray-600 hover:bg-gray-700'
                            }`}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            const scene = gameInstance.current?.scene.getScene('BattleScene') as BattleScene;
                            if (scene) {
                                scene.setSpeed(scale);
                                setSpeedLabel(`${scale}x`);
                            }
                        }}
                    >
                        x{scale}
                    </button>
                ))}
            </div>



        </div>
    );
};

export default MiniTroopersGame;
