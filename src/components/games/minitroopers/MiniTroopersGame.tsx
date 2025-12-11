import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BattleScene } from './scenes/BattleScene';
import BootScene from './scenes/BootScene';
import type { BattleResult, Trooper } from '@/logic/minitroopers/types';

interface MiniTroopersGameProps {
    battleResult?: BattleResult | null;
    mySquad?: Trooper[];
    opponentSquad?: Trooper[];
}

const MiniTroopersGame: React.FC<MiniTroopersGameProps> = ({ battleResult, mySquad, opponentSquad }) => {
    const gameContainer = useRef<HTMLDivElement>(null);
    const gameInstance = useRef<Phaser.Game | null>(null);

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
            if (scene) {
                // If scene is already running, restart it with new data
                scene.scene.restart({ result: battleResult, teamA: mySquad, teamB: opponentSquad });
            } else {
                // Wait for scene to be ready (rare case if game just started)
                gameInstance.current.events.once('ready', () => {
                    const scene = gameInstance.current?.scene.getScene('BattleScene') as BattleScene;
                    scene?.scene.restart({ result: battleResult, teamA: mySquad, teamB: opponentSquad });
                });
            }
        }
    }, [battleResult, mySquad, opponentSquad]);

    return (
        <div className="flex flex-col w-full h-full items-center justify-center bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
            <div ref={gameContainer} id="phaser-game" className="rounded-lg overflow-hidden" />
        </div>
    );
};

export default MiniTroopersGame;
