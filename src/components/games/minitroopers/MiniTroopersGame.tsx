import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BattleScene } from './scenes/BattleScene';
import BootScene from './scenes/BootScene';
import type { BattleResult, Trooper } from '@/logic/minitroopers/types';
import BattleInspector from './ui/BattleInspector';
import { useTranslation } from '@/logic/minitroopers/i18n';

interface MiniTroopersGameProps {
    battleResult?: BattleResult | null;
    mySquad?: Trooper[];
    opponentSquad?: Trooper[];
}

const MiniTroopersGame: React.FC<MiniTroopersGameProps> = ({ battleResult, mySquad, opponentSquad }) => {
    const gameContainer = useRef<HTMLDivElement>(null);
    const gameInstance = useRef<Phaser.Game | null>(null);
    const [inspectedTrooper, setInspectedTrooper] = React.useState<Trooper | null>(null);
    const { t } = useTranslation();
    const [speedLabel, setSpeedLabel] = React.useState('1x');

    useEffect(() => {
        if (typeof window !== 'undefined' && gameContainer.current && !gameInstance.current) {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: 800,
                height: 600,
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
                s.scene.restart({ result: battleResult, teamA: mySquad, teamB: opponentSquad });
                // Setup callbacks
                s.onTrooperClick = (trooperId: string) => {
                    // Try to get live data from scene
                    const liveData = s.getTrooperData(trooperId);
                    
                    const trooperDef = [...(mySquad || []), ...(opponentSquad || [])].find(t => t.id === trooperId);
                    if (trooperDef) {
                        // Merge live data if available
                        const trooper = liveData ? { ...trooperDef, attributes: { ...trooperDef.attributes, hp: liveData.hp }, ammo: liveData.ammo, currentWeaponId: liveData.currentWeaponId } : trooperDef;
                        
                        setInspectedTrooper(trooper);
                        s.pause();
                    }
                };
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
    }, [battleResult, mySquad, opponentSquad]);

    const handleCloseInspector = () => {
        setInspectedTrooper(null);
        const scene = gameInstance.current?.scene.getScene('BattleScene') as BattleScene;
        if (scene) {
            scene.resume();
        }
    };

    return (
        <div className="flex flex-col w-full h-full items-center justify-center bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 relative">
            <div ref={gameContainer} id="phaser-game" className="rounded-lg overflow-hidden" />
            
            {inspectedTrooper && (
                <BattleInspector 
                    trooper={inspectedTrooper} 
                    onClose={handleCloseInspector}
                    t={t}
                />
            )}
            {inspectedTrooper && (
                <BattleInspector 
                    trooper={inspectedTrooper} 
                    onClose={handleCloseInspector}
                    t={t}
                />
            )}

            {/* Speed Control Button */}
            <button 
                className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded border border-gray-600 z-10"
                onClick={() => {
                     const scene = gameInstance.current?.scene.getScene('BattleScene') as BattleScene;
                     if (scene) {
                         const currentSpeed = (scene as any).speedMultiplier || 1;
                         const newSpeed = currentSpeed === 1 ? 2 : 1;
                         scene.setSpeed(newSpeed);
                         // Force update to show button text change (though we could use local state if we want strict UI sync)
                         // For now, assume it toggles. We'll add text update if needed, but a simple toggle is enough.
                         // Actually, let's use a ref or state for button label if we want it perfect, but let's stick to simple "Toggle Speed" or "x1/x2" text.
                         // But we can't easily read back from scene without state.
                         // Let's use simple state here.
                         setSpeedLabel(newSpeed === 1 ? '1x' : '2x');
                     }
                }}
            >
                {speedLabel}
            </button>
        </div>
    );
};

export default MiniTroopersGame;
