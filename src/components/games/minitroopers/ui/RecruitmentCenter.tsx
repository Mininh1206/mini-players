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
    const isAffordable = typeof canAfford === 'function' ? canAfford(finalRecruitCost) : canAfford;

    return (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/5 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    🎖️ {t('recruit_trooper')}
                </h2>
                <p className="text-gray-400 mt-2 text-sm">
                    Expand your army with new recruits
                </p>
                <div className="inline-flex items-center gap-2 mt-3 bg-black/30 px-4 py-2 rounded-full border border-white/10">
                    <span className="text-gray-400 text-sm">Cost:</span>
                    <span className={`font-black text-lg ${isAffordable ? 'text-yellow-400' : 'text-red-400'}`}>
                        {finalRecruitCost} 💰
                    </span>
                </div>
            </div>
            
            {/* Candidates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {candidates.map((trooper) => (
                    <div 
                        key={trooper.id} 
                        className="group relative flex flex-col bg-black/30 rounded-xl border border-white/5 overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                    >
                        {/* Card Header */}
                        <div className="p-4 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-white/5">
                            <TrooperCard trooper={trooper} isSelected={false} onClick={() => {}} t={t} />
                        </div>
                        
                        {/* Skills Preview */}
                        <div className="p-4 flex-1">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Loadout</div>
                            <div className="flex gap-2">
                                {/* Weapon */}
                                {trooper.skills[0] && (
                                    <SkillTooltip skill={trooper.skills[0]} t={t}>
                                        <div className="flex-1 group/skill bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 hover:border-red-500/50 transition-all cursor-help text-center">
                                            <div className="text-3xl mb-1 group-hover/skill:scale-110 transition-transform">{trooper.skills[0]?.icon}</div>
                                            <div className="text-[10px] text-gray-400 truncate">
                                                {t(`skill_${trooper.skills[0]?.id}_name`) !== `skill_${trooper.skills[0]?.id}_name` ? t(`skill_${trooper.skills[0]?.id}_name`) : trooper.skills[0]?.name}
                                            </div>
                                        </div>
                                    </SkillTooltip>
                                )}

                                {/* Skill */}
                                {trooper.skills[1] && (
                                    <SkillTooltip skill={trooper.skills[1]} t={t}>
                                        <div className="flex-1 group/skill bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 hover:border-yellow-500/50 transition-all cursor-help text-center">
                                            <div className="text-3xl mb-1 group-hover/skill:scale-110 transition-transform">{trooper.skills[1]?.icon}</div>
                                            <div className="text-[10px] text-gray-400 truncate">
                                                {t(`skill_${trooper.skills[1]?.id}_name`) !== `skill_${trooper.skills[1]?.id}_name` ? t(`skill_${trooper.skills[1]?.id}_name`) : trooper.skills[1]?.name}
                                            </div>
                                        </div>
                                    </SkillTooltip>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-2 bg-slate-900/50 px-2 py-1.5 rounded-lg">
                                    <span className="text-red-400">❤️</span>
                                    <span className="text-gray-400">{t('hit_points')}:</span>
                                    <span className="text-white font-bold ml-auto">{trooper.attributes.hp}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-900/50 px-2 py-1.5 rounded-lg">
                                    <span className="text-orange-400">⚔️</span>
                                    <span className="text-gray-400">{t('damage')}:</span>
                                    <span className="text-white font-bold ml-auto">{trooper.attributes.damage}</span>
                                </div>
                            </div>
                        </div>

                        {/* Recruit Button */}
                        <button
                            onClick={() => onRecruit(trooper)}
                            disabled={!isAffordable}
                            className={`w-full py-3 font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                                isAffordable 
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            <span>➕</span>
                            <span>{t('recruit_trooper')}</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecruitmentCenter;
