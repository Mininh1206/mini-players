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
                    const trooper = [...(mySquad || []), ...(opponentSquad || [])].find(t => t.id === trooperId);
                    if (trooper) {
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
        </div>
    );
};

export default MiniTroopersGame;
