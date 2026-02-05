import React, { useState, useRef, useEffect, useMemo } from 'react';
import MiniTroopersGame from '../MiniTroopersGame';
import type { BattleResult, BattleLogEntry } from '@/logic/minitroopers/types';
import { Trooper } from '@/logic/minitroopers/classes/Trooper';
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
    const [battleTime, setBattleTime] = useState(0);
    const [liveLogs, setLiveLogs] = useState<BattleLogEntry[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Reset live logs when battle result changes
    useEffect(() => {
        setLiveLogs([]);
        setBattleTime(0);
    }, [battleResult]);

    const handleLogEntry = (log: BattleLogEntry) => {
        setLiveLogs(prev => {
            // Avoid duplicates just in case
            if (prev.some(l => l === log)) return prev;
            return [...prev, log];
        });
    };

    // Filter log to only show entries up to current battle time
    // Sort by time to ensure chronological display (animations may complete out of order)
    const visibleLog = useMemo(() =>
        [...liveLogs].sort((a, b) => a.time - b.time),
        [liveLogs]
    );

    // Auto-scroll log to bottom when new entries appear
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [visibleLog.length]);

    // Prepare translations dictionary for BattleScene
    const translations = useMemo(() => ({
        battle_start: t('battle_start'),
        winner_team: t('winner_team'),
        winner_player: t('winner_player'),
        winner_enemy: t('winner_enemy'),
        time_prefix: t('time_prefix'),
        miss: t('miss'),
        crit_shout: t('crit_shout'),
        heal_shout: t('heal_shout'),
        grenade_shout: t('grenade_shout')
    }), [t]);

    return (
        <div className="h-full w-full flex flex-col bg-gray-950 overflow-hidden font-vt323">
            {/* Top Toolbar */}
            <div className="h-16 shrink-0 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shadow-md z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="pixel-btn bg-gray-700 hover:bg-gray-600 border-gray-500 text-gray-200 text-lg py-1 flex items-center gap-2 transition"
                    >
                        <span className="text-xl">←</span> {backLabel === 'Back' ? t('back_to_editor') : (backLabel === 'Back to Arena' ? t('back_to_arena') : backLabel)}
                    </button>
                    <div className="h-8 w-px bg-gray-700 mx-2"></div>
                    <h2 className="text-2xl text-gray-300 font-bold uppercase tracking-wide">{title}</h2>
                </div>

                {/* Result Badge */}
                <div className={`px-6 py-2 rounded-sm border-2 text-xl font-bold tracking-wider shadow-lg ${battleResult.winner === 'A'
                    ? 'bg-green-900/40 text-green-400 border-green-500/50'
                    : 'bg-red-900/40 text-red-400 border-red-500/50'
                    }`}>
                    {battleResult.winner === 'A' ? t('victory') : t('defeat')}
                </div>
            </div>

            {/* Main Content Area - Fills remaining height */}
            <div className="flex-1 min-h-0 flex flex-row relative">

                {/* Game Canvas Container */}
                <div className="flex-1 relative bg-black shadow-inner">
                    <MiniTroopersGame
                        battleResult={battleResult}
                        mySquad={mySquad}
                        opponentSquad={opponentSquad}
                        translations={translations}
                        onBattleTimeUpdate={setBattleTime}
                        onLogEntry={handleLogEntry}
                    />

                    {/* Overlay Text (optional/if scene doesn't render it) */}
                </div>

                {/* Sidebar Log - Fixed width */}
                <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0 shadow-2xl relative z-20">
                    <div className="p-4 border-b border-gray-800 bg-gray-950/50 flex justify-between items-center backdrop-blur-sm">
                        <span className="font-bold text-gray-300 uppercase text-xl tracking-wider">{t('combat_log')}</span>
                        <span className="text-base text-gray-500 bg-gray-800 px-2 py-0.5 rounded border border-gray-700 font-mono">
                            {(t('events_count') as string).replace('{{count}}', String(visibleLog.length))}
                        </span>
                    </div>

                    {/* Log List - Scrolls independently */}
                    <div ref={logContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 bg-gray-900 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        {visibleLog.map((entry, idx) => {
                            const isMyUnit = entry.actorId && mySquad.some(s => s.id === entry.actorId);
                            return (
                                <div key={idx} className="border-b border-gray-800/50 pb-2 last:border-0 hover:bg-white/5 p-2 rounded transition-colors group">
                                    <div className="flex items-baseline gap-2 mb-0.5">
                                        <span className="text-yellow-600 font-mono text-base shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                                            [{(entry.time / 100).toFixed(1)}s]
                                        </span>
                                        <span className={`font-bold text-lg leading-none ${isMyUnit ? 'text-green-400' : 'text-red-400'}`}>
                                            {entry.actorName}
                                        </span>
                                    </div>
                                    <div className="text-gray-400 text-lg leading-tight pl-2 border-l-2 border-gray-800 group-hover:border-gray-600 transition-colors">
                                        {entry.message}
                                    </div>
                                </div>
                            );
                        })}
                        {/* Spacer for bottom scroll */}
                        <div className="h-4"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BattleSimulatorView;
