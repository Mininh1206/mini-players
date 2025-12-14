import React from 'react';
import type { Trooper, Skill } from '@/logic/minitroopers/types';
import { SKILLS } from '@/logic/minitroopers/skills';
import SkillTooltip from './SkillTooltip';


interface TrooperProfileProps {
    trooper: Trooper;
    gold: number;
    onUpgrade: (cost: number) => void;
    t: (key: any) => string;
    onUpdateTactics?: (tactics: any) => void;
    onSelectSkill?: (skill: any) => void;
    upgradeCostCalculator?: (level: number) => number;
}

const StatRow: React.FC<{ label: string; value: number | string; icon?: string }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
        <span className="text-gray-400">{label}</span>
        <span className="font-mono text-white font-bold">{value}</span>
    </div>
);

const TrooperProfile: React.FC<TrooperProfileProps> = ({ trooper, gold, onUpgrade, t, onUpdateTactics, onSelectSkill, upgradeCostCalculator }) => {
    const defaultUpgradeCost = (trooper.level || 1) * 50;
    const upgradeCost = upgradeCostCalculator ? upgradeCostCalculator(trooper.level || 1) : defaultUpgradeCost;
    const canAfford = gold >= upgradeCost;

    if (trooper.pendingChoices && trooper.pendingChoices.length > 0) {
        return (
            <div className="flex flex-col gap-8 p-8 bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl items-center text-center">
                <h2 className="text-3xl font-black text-white mb-4">Level Up!</h2>
                <p className="text-gray-400 mb-8">Choose a new skill for {trooper.name}:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                    {trooper.pendingChoices.map((skill, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSelectSkill && onSelectSkill(skill)}
                            className="bg-gray-900 p-8 rounded-xl border-2 border-gray-700 hover:border-blue-500 hover:bg-gray-800 transition group flex flex-col items-center gap-4 relative"
                        >
                            <div className="text-6xl group-hover:scale-110 transition-transform">{skill.icon}</div>
                            <h3 className="text-2xl font-bold text-white">{skill.name}</h3>
                            <p className="text-gray-400">{skill.description}</p>
                            
                            {/* Context Menu on Hover */}
                            <SkillTooltip skill={skill} t={t} />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col xl:flex-row gap-8 p-8 bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl">
            {/* Left Column: Avatar & Main Info */}
            <div className="w-full xl:w-1/3 flex flex-col items-center bg-gray-900/50 p-6 rounded-xl border border-gray-700/50">
                <div className="w-56 h-56 bg-gray-900 rounded-full border-4 border-blue-500 flex items-center justify-center mb-6 shadow-xl overflow-hidden relative group transition-transform hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-40"></div>
                    <span className="text-7xl relative z-10">
                        {trooper.class === 'Rat' ? '🐀' : '🪖'}
                    </span>
                    <div className="absolute bottom-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        Lvl {trooper.level || 1}
                    </div>
                </div>
                <h2 className="text-4xl font-black text-white mb-2 tracking-tight">{trooper.name}</h2>
                <div className="flex flex-col items-center gap-1 mb-6">
                    <div className="flex items-center gap-2 text-gray-400 text-sm font-bold uppercase tracking-wider bg-gray-800 px-3 py-1 rounded-full">
                        <span>🧬</span>
                        <span>{trooper.class === 'Rat' ? 'Species: Rat' : 'Species: Human'}</span>
                    </div>
                    {trooper.class !== 'Recruit' && trooper.class !== 'Rat' && (
                        <div className="flex items-center gap-2 text-yellow-400 text-lg font-black uppercase tracking-widest animate-pulse">
                            <span>🎖️</span>
                            <span>{trooper.class}</span>
                        </div>
                    )}
                </div>
                
                <button 
                    onClick={() => onUpgrade(upgradeCost)}
                    disabled={!canAfford}
                    className={`w-full py-4 font-black text-lg rounded-xl shadow-lg transform transition ${canAfford ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black hover:scale-105 active:scale-95' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                >
                    {t('upgrade')} <span className="ml-2 text-sm opacity-80">({upgradeCost} 💰)</span>
                </button>
            </div>

            {/* Right Column: Stats & Skills */}
            <div className="w-full xl:w-2/3 flex flex-col gap-8">
                {/* Stats Grid */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 shadow-inner">
                    <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-3 flex items-center gap-2">
                        <span>📊</span> {t('combat_stats')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                        <StatRow label={t('hit_points')} value={`${trooper.attributes.hp} / ${trooper.attributes.maxHp}`} />
                        <StatRow label={t('initiative')} value={trooper.attributes.initiative} />
                        <StatRow label={t('speed')} value={trooper.attributes.speed || 0} />
                        <StatRow label={t('damage')} value={trooper.attributes.damage} />
                        <StatRow label={t('range')} value={trooper.attributes.range} />
                        <StatRow label={t('hit_chance')} value={`${trooper.attributes.aim}%`} />
                        <StatRow label={t('dodge')} value={`${trooper.attributes.dodge}%`} />
                        <StatRow label={t('armor')} value={trooper.attributes.armor} />
                        <StatRow label={t('crit_chance')} value={`${trooper.attributes.critChance}%`} />
                    </div>
                </div>

                {/* Skills Grid */}
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Skills & Equipment</h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {SKILLS.map((skill) => {
                            const hasSkill = trooper.skills.some(s => s.id === skill.id);
                            return (
                                <div 
                                    key={skill.id} 
                                    className={`relative group bg-gray-800 p-2 rounded border transition-colors cursor-help ${hasSkill ? 'border-gray-600 hover:border-yellow-500' : 'border-gray-800 opacity-30 grayscale hover:opacity-50'}`}
                                    title={`${skill.name}\n${skill.description}`}
                                >
                                    <div className="text-2xl text-center mb-1">{skill.icon}</div>
                                    {/* Custom Tooltip on Hover */}
                                    <SkillTooltip skill={skill} t={t} isLocked={!hasSkill} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tactics (Level 6+) */}
                {trooper.level >= 6 ? (
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                        <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider flex justify-between items-center">
                            <span>Tactics</span>
                            <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">Unlocked</span>
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Target Priority</label>
                                <select 
                                    value={trooper.tactics?.priority || 'closest'}
                                    onChange={(e) => onUpdateTactics && onUpdateTactics({ ...trooper.tactics, priority: e.target.value as any })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200 focus:border-yellow-500 outline-none"
                                >
                                    <option value="closest">Closest</option>
                                    <option value="weakest">Weakest</option>
                                    <option value="strongest">Strongest</option>
                                    <option value="random">Random</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Target Part</label>
                                <select 
                                    value={trooper.tactics?.targetPart || 'any'}
                                    onChange={(e) => onUpdateTactics && onUpdateTactics({ ...trooper.tactics, targetPart: e.target.value as any })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200 focus:border-yellow-500 outline-none"
                                >
                                    <option value="any">Any</option>
                                    <option value="head">Head (Crit/Miss)</option>
                                    <option value="heart">Heart (Crit)</option>
                                    <option value="arm">Arm (Disarm)</option>
                                    <option value="leg">Leg (Slow)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-800 opacity-50 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] z-10">
                            <span className="text-xs font-bold text-gray-400 bg-black/50 px-3 py-1 rounded border border-gray-600">
                                Tactics unlock at Level 6
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">Tactics</h3>
                        <div className="grid grid-cols-2 gap-4 blur-sm select-none pointer-events-none">
                            <div className="h-10 bg-gray-800 rounded"></div>
                            <div className="h-10 bg-gray-800 rounded"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrooperProfile;
