import React from 'react';
import type { Trooper } from '@/logic/minitroopers/types';
import { useTranslation } from '@/logic/minitroopers/i18n';

interface TrooperCardProps {
    trooper: Trooper;
    isSelected: boolean;
    onClick: () => void;
    t?: (key: any) => string; // Optional for now to avoid breaking other usages if any
}

const TrooperCard: React.FC<TrooperCardProps> = ({ trooper, isSelected, onClick, t }) => {
    const hpPercent = (trooper.attributes.hp / trooper.attributes.maxHp) * 100;
    // Fallback if t is not provided (though we will pass it)
    const translate = t || ((k: string) => k);

    return (
        <div 
            onClick={onClick}
            className={`relative group overflow-hidden rounded border transition-all duration-200 cursor-pointer ${
                isSelected 
                    ? 'bg-gray-800 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                    : 'bg-gray-900 border-gray-700 hover:border-gray-500 hover:bg-gray-800'
            }`}
        >
            {/* Header / Name */}
            <div className={`px-3 py-2 flex justify-between items-center ${isSelected ? 'bg-blue-900/20' : 'bg-gray-950/30'}`}>
                <span className="font-bold text-gray-200 text-sm truncate">{trooper.name}</span>
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Lvl {trooper.level}</span>
            </div>

            {/* Body */}
            <div className="p-3">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-blue-400 font-bold uppercase">{trooper.class || 'Soldier'}</span>
                    <span className="text-[10px] text-gray-400">{trooper.attributes.hp} HP</span>
                 </div>

                 {/* Bar */}
                 <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${
                            hpPercent > 50 ? 'bg-green-600' : hpPercent > 25 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${hpPercent}%` }}
                    />
                 </div>
            </div>
            
            {/* Selection Indicator */}
            {isSelected && <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none"></div>}
        </div>
    );
};

export default TrooperCard;
