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
            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                isSelected 
                    ? 'bg-blue-600 border-blue-400 shadow-lg scale-105' 
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600'
            }`}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white truncate">{trooper.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-900 text-gray-400 border border-gray-700">
                    {translate('lvl')} {trooper.level || 1}
                </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                <span className="capitalize">{trooper.class}</span>
            </div>

            <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden border border-gray-700">
                <div 
                    className={`h-full transition-all duration-500 ${
                        hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${hpPercent}%` }}
                />
            </div>
            <div className="text-xs text-right text-gray-500 mt-1">
                {trooper.attributes.hp} / {trooper.attributes.maxHp} HP
            </div>
        </div>
    );
};

export default TrooperCard;
