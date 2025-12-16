import React from 'react';
import MiniTroopersGame from '../MiniTroopersGame';
import type { BattleResult, Trooper } from '@/logic/minitroopers/types';
import { useTranslation } from '@/logic/minitroopers/i18n';

interface BattleSimulatorViewProps {
    battleResult: BattleResult;
    mySquad: Trooper[];
    opponentSquad: Trooper[];
    onClose: () => void;
    title?: string;
    backLabel?: string;
}

const BattleSimulatorView: React.FC<BattleSimulatorViewProps> = ({ 
    battleResult, 
    mySquad, 
    opponentSquad, 
    onClose,
    title = "Battle Simulation",
    backLabel = "Back"
}) => {
    const { t } = useTranslation();

    // Prepare translations dictionary for BattleScene
    const translations = {
        battle_start: t('battle_start'),
        winner_team: t('winner_team'),
        winner_player: t('winner_player'),
        winner_enemy: t('winner_enemy'),
        time_prefix: t('time_prefix'),
        miss: t('miss'),
        crit_shout: t('crit_shout'),
        heal_shout: t('heal_shout'),
        grenade_shout: t('grenade_shout')
    };

    return (
        <div className="flex flex-row h-[600px] w-full overflow-hidden bg-black">
            {/* Game Area */}
            <div className="flex-1 relative">
                {/* Overlay UI: Back Button & Header */}
                <div className="absolute top-4 left-4 z-50 flex gap-4 items-center" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                    <button 
                        onClick={onClose} 
                        className="bg-gray-800/80 hover:bg-gray-700 backdrop-blur text-white px-4 py-2 rounded font-bold border border-gray-600 shadow-lg transition"
                    >
                        ← {backLabel === 'Back' ? t('back_to_editor') : (backLabel === 'Back to Arena' ? t('back_to_arena') : backLabel)}
                    </button>
                    {/* Optional Result Badge if we want it floating */}
                    <div className={`px-4 py-2 rounded font-bold shadow-lg backdrop-blur border ${
                        battleResult.winner === 'A' 
                            ? 'bg-green-900/80 text-green-100 border-green-700' 
                            : 'bg-red-900/80 text-red-100 border-red-700'
                    }`}>
                        {battleResult.winner === 'A' ? t('victory') : t('defeat')}
                    </div>
                </div>

                <MiniTroopersGame 
                    battleResult={battleResult}
                    mySquad={mySquad}
                    opponentSquad={opponentSquad}
                    translations={translations}
                />
            </div>

            {/* Sidebar Log */}
            <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0">
                <div className="p-3 border-b border-gray-800 bg-gray-950 flex justify-between items-center">
                    <span className="font-bold text-gray-400 uppercase text-xs">{t('combat_log')}</span>
                    <span className="text-xs text-gray-600">{(t('events_count') as string).replace('{{count}}', String(battleResult.log.length))}</span>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-4 font-mono text-xs text-gray-400">
                    {battleResult.log.map((entry, idx) => {
                        const isMyUnit = entry.actorId && mySquad.some(s => s.id === entry.actorId);
                        return (
                            <div key={idx} className="mb-1 border-b border-gray-800/50 pb-1 last:border-0 flex gap-2 hover:bg-gray-800/50 rounded px-1 -mx-1 transition-colors">
                                <span className="text-yellow-600 shrink-0 opacity-70">[{entry.time.toFixed(1)}s]</span>
                                <div className="flex-1">
                                    <span className={`font-bold ${isMyUnit ? 'text-green-400' : 'text-red-400'}`}>
                                        {entry.actorName}
                                    </span>
                                    <span className="text-gray-300 ml-1 opacity-90">{entry.message}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BattleSimulatorView;
