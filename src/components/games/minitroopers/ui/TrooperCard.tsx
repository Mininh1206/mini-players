import React from 'react';
import type { Trooper } from '@/logic/minitroopers/types';

interface TrooperCardProps {
    trooper: Trooper;
    isSelected: boolean;
    onClick: () => void;
    t?: (key: any) => string;
}

const getClassIcon = (trooperClass: string) => {
    switch (trooperClass) {
        case 'Doctor': return '⛑️';
        case 'Pilot': return '✈️';
        case 'Sniper': return '🔭';
        case 'Soldier': return '🪖';
        case 'Commando': return '🤺';
        case 'Scout': return '👟';
        case 'Spy': return '🕴️';
        case 'Saboteur': return '💣';
        case 'Comms Officer': return '📡';
        case 'Rat': return '🐀';
        default: return '🪖';
    }
};

const TrooperCard: React.FC<TrooperCardProps> = ({ trooper, isSelected, onClick, t }) => {
    const hpPercent = (trooper.attributes.hp / trooper.attributes.maxHp) * 100;
    const isDead = trooper.isDead || trooper.attributes.hp <= 0;

    return (
        <div 
            onClick={onClick}
            className={`relative group rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                isDead 
                    ? 'bg-slate-900/50 border-red-900/30 opacity-60 grayscale'
                    : isSelected 
                        ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/40 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                        : 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-slate-500 hover:shadow-lg'
            }`}
        >
            {/* Dead Overlay */}
            {isDead && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60">
                    <span className="text-3xl">💀</span>
                </div>
            )}
            
            {/* Header */}
            <div className={`px-3 py-2 flex items-center gap-2 border-b ${
                isSelected ? 'bg-blue-900/30 border-blue-500/30' : 'bg-slate-950/30 border-slate-800/50'
            }`}>
                {/* Class Icon */}
                <span className="text-lg">{getClassIcon(trooper.class)}</span>
                
                {/* Name & Level */}
                <div className="flex-1 min-w-0">
                    <span className="font-bold text-gray-200 text-sm truncate block">{trooper.name}</span>
                </div>
                
                {/* Level Badge */}
                <div className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}>
                    {trooper.level || 1}
                </div>
            </div>

            {/* Body */}
            <div className="p-3">
                {/* Class Name */}
                <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                        isSelected ? 'text-blue-400' : 'text-slate-500'
                    }`}>
                        {trooper.class || 'Recruit'}
                    </span>
                    <span className="text-[10px] text-slate-500">{trooper.attributes.hp}/{trooper.attributes.maxHp}</span>
                </div>

                {/* HP Bar */}
                <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                            hpPercent > 50 ? 'bg-gradient-to-r from-green-600 to-green-400' : 
                            hpPercent > 25 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 
                            'bg-gradient-to-r from-red-600 to-red-400'
                        }`}
                        style={{ width: `${hpPercent}%` }}
                    />
                </div>
            </div>
            
            {/* Selection Glow */}
            {isSelected && !isDead && (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none" />
            )}
            
            {/* Hover Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 pointer-events-none" />
        </div>
    );
};

export default TrooperCard;
