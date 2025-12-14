import React from 'react';
import type { Trooper } from '@/logic/minitroopers/types';
import TrooperCard from './TrooperCard';
import SkillTooltip from './SkillTooltip';

interface RecruitmentCenterProps {
    candidates: Trooper[];
    onRecruit: (trooper: Trooper) => void;
    recruitCost?: number;
    recruitCostCalculator?: (count: number) => number;
    currentCount?: number;
    canAfford: (cost: number) => boolean;
    t: (key: any) => string;
}

const RecruitmentCenter: React.FC<RecruitmentCenterProps> = ({ candidates, onRecruit, recruitCost = 50, recruitCostCalculator, currentCount = 0, canAfford, t }) => {
    const finalRecruitCost = recruitCostCalculator ? recruitCostCalculator(currentCount) : recruitCost;
    const isAffordable = typeof canAfford === 'function' ? canAfford(finalRecruitCost) : canAfford; // Fallback for boolean prop if mixed usage (though cleaner to use one)

    return (
        <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4">{t('recruit_trooper')}</h2>
            <p className="text-gray-400 mb-6">Hire new troopers to expand your army. Cost: <span className="text-yellow-400 font-bold">{finalRecruitCost} 💰</span></p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {candidates.map((trooper) => (
                    <div key={trooper.id} className="flex flex-col gap-2 bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <TrooperCard trooper={trooper} isSelected={false} onClick={() => {}} t={t} />
                        
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {/* Weapon */}
                            <div className="relative group bg-gray-800 p-2 rounded border border-gray-600 hover:border-red-500 transition-colors cursor-help">
                                <div className="text-2xl text-center mb-1">{trooper.skills[0]?.icon}</div>
                                <div className="text-xs text-center text-gray-400 truncate">
                                    {t(`skill_${trooper.skills[0]?.id}_name`) !== `skill_${trooper.skills[0]?.id}_name` ? t(`skill_${trooper.skills[0]?.id}_name`) : trooper.skills[0]?.name}
                                </div>
                                {trooper.skills[0] && <SkillTooltip skill={trooper.skills[0]} t={t} />}
                            </div>

                            {/* Skill */}
                            <div className="relative group bg-gray-800 p-2 rounded border border-gray-600 hover:border-yellow-500 transition-colors cursor-help">
                                <div className="text-2xl text-center mb-1">{trooper.skills[1]?.icon}</div>
                                <div className="text-xs text-center text-gray-400 truncate">
                                    {t(`skill_${trooper.skills[1]?.id}_name`) !== `skill_${trooper.skills[1]?.id}_name` ? t(`skill_${trooper.skills[1]?.id}_name`) : trooper.skills[1]?.name}
                                </div>
                                {trooper.skills[1] && <SkillTooltip skill={trooper.skills[1]} t={t} />}
                            </div>
                        </div>

                        <div className="mt-2 p-2 bg-gray-800 rounded text-sm text-gray-300 grid grid-cols-2 gap-x-2">
                            <p>{t('hit_points')}: <span className="text-white font-bold">{trooper.attributes.hp}</span></p>
                            <p>{t('damage')}: <span className="text-white font-bold">{trooper.attributes.damage}</span></p>
                        </div>

                        <button
                            onClick={() => onRecruit(trooper)}
                            disabled={!isAffordable}
                            className={`w-full py-2 px-4 rounded font-bold transition-colors mt-2 ${
                                isAffordable 
                                    ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg transform hover:scale-105' 
                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {t('recruit_trooper')}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecruitmentCenter;
