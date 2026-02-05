import React from 'react';
import type { Trooper, Skill } from '@/logic/minitroopers/types';
import { SKILLS } from '@/logic/minitroopers/skills';
import { Weapon, Grenade } from '@/logic/minitroopers/classes/Skill';
import SkillTooltip from './SkillTooltip';
import { GetSkillIcon, GetTrooperClassIcon } from './VectorAssets';

interface TrooperProfileProps {
    trooper: Trooper;
    gold: number;
    onUpgrade: (cost: number) => void;
    t: (key: any) => string;
    onUpdateTactics?: (tactics: any) => void;
    onSelectSkill?: (skill: any) => void;
    upgradeCostCalculator?: (level: number) => number;
    onRename?: (name: string) => void;
}

const TrooperProfile: React.FC<TrooperProfileProps> = ({ trooper, gold, onUpgrade, t, onUpdateTactics, onSelectSkill, upgradeCostCalculator, onRename }) => {
    const defaultUpgradeCost = (trooper.level || 1) * 50;
    const upgradeCost = upgradeCostCalculator ? upgradeCostCalculator(trooper.level || 1) : defaultUpgradeCost;
    const canAfford = gold >= upgradeCost;
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [tempName, setTempName] = React.useState(trooper.name);
    const hpPercent = (trooper.attributes.hp / trooper.attributes.maxHp) * 100;

    const handleSaveName = () => {
        if (onRename && tempName.trim()) {
            onRename(tempName.trim());
        }
        setIsEditingName(false);
    };

    // Level Up Choice UI
    if (trooper.pendingChoices && trooper.pendingChoices.length > 0) {
        return (
            <div className="relative p-6 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-900/80 to-purple-900/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-center bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-6">
                        🎖️ LEVEL UP!
                    </h2>
                    <p className="text-center text-gray-300 mb-6">Choose a new skill for {trooper.name}</p>
                    <div className="grid grid-cols-2 gap-4">
                        {trooper.pendingChoices.map((skill, idx) => (
                            <SkillTooltip key={idx} skill={skill} t={t}>
                                <button
                                    onClick={() => onSelectSkill && onSelectSkill(skill)}
                                    className="group relative bg-black/40 backdrop-blur-sm p-5 rounded-xl border border-white/10 hover:border-yellow-500/50 hover:bg-black/60 transition-all duration-300 flex flex-col items-center gap-3 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(234,179,8,0.2)]"
                                >
                                    <div className="group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                        {GetSkillIcon(skill.id, 48, "white")}
                                    </div>
                                    <h3 className="text-lg font-bold text-white">{skill.name}</h3>
                                    <p className="text-xs text-gray-400 text-center line-clamp-2">{skill.description}</p>
                                </button>
                            </SkillTooltip>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/5 shadow-2xl">

            {/* Header - Glass Effect */}
            <div className="relative p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/5">
                <div className="absolute inset-0 backdrop-blur-sm" />
                <div className="relative flex items-center gap-4">

                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-blue-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                            <div className="drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
                                {GetTrooperClassIcon(trooper.class, 48, "white")}
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-2 py-0.5 rounded-lg text-xs font-black shadow-lg">
                            LV.{trooper.level || 1}
                        </div>
                    </div>

                    {/* Name & Class */}
                    <div className="flex-1 min-w-0">
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    className="bg-black/50 border border-blue-500 rounded-lg px-3 py-1 text-xl font-black text-white outline-none w-full"
                                    autoFocus
                                    onBlur={handleSaveName}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                />
                            </div>
                        ) : (
                            <h2
                                className="text-2xl font-black text-white truncate cursor-pointer hover:text-blue-400 transition-colors flex items-center gap-2"
                                onClick={() => { setTempName(trooper.name); setIsEditingName(true); }}
                            >
                                {trooper.name}
                                <span className="text-xs opacity-30 hover:opacity-100">✎</span>
                            </h2>
                        )}
                        {trooper.class !== 'Recruit' && trooper.class !== 'Rat' && (
                            <span className="inline-block mt-1 text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20 uppercase tracking-widest">
                                {trooper.class}
                            </span>
                        )}

                        {/* HP Bar */}
                        <div className="mt-2">
                            <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                                <span>HP</span>
                                <span>{trooper.attributes.hp}/{trooper.attributes.maxHp}</span>
                            </div>
                            <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 rounded-full ${hpPercent > 50 ? 'bg-gradient-to-r from-green-600 to-green-400' :
                                            hpPercent > 25 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' :
                                                'bg-gradient-to-r from-red-600 to-red-400'
                                        }`}
                                    style={{ width: `${hpPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Upgrade Button */}
                    <button
                        onClick={() => onUpgrade(upgradeCost)}
                        disabled={!canAfford}
                        className={`shrink-0 px-5 py-3 font-black text-sm rounded-xl shadow-lg transition-all duration-300 flex flex-col items-center leading-tight ${canAfford
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black hover:scale-105 hover:shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        <span className="text-base">{t('upgrade')}</span>
                        <span className="text-xs opacity-80 flex items-center gap-1">{upgradeCost} 💰</span>
                    </button>
                </div>
            </div>

            {/* Skills Section */}
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Skills & Equipment</h3>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                </div>

                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
                    {SKILLS.map((skill) => {
                        const hasSkill = trooper.skills.some((s: Skill) => s.id === skill.id);
                        return (
                            <SkillTooltip key={skill.id} skill={skill} t={t} isLocked={!hasSkill}>
                                <div
                                    className={`aspect-square flex items-center justify-center rounded-lg border cursor-help transition-all duration-200 ${hasSkill
                                            ? 'bg-slate-800/80 border-slate-600/50 hover:border-yellow-500/50 hover:bg-slate-700/80 hover:scale-110 hover:shadow-lg'
                                            : 'bg-slate-900/30 border-slate-800/30 opacity-20 grayscale'
                                        }`}
                                >
                                    <div className={hasSkill ? 'text-white drop-shadow-md' : 'text-gray-600'}>
                                        {GetSkillIcon(skill.id, 24, hasSkill ? "white" : "#4b5563")}
                                    </div>
                                </div>
                            </SkillTooltip>
                        );
                    })}
                </div>

                {/* Tactics Section */}
                <div className="mt-6 p-4 rounded-xl bg-black/30 border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            ⚔️ Combat Tactics
                        </h3>
                        {trooper.level < 6 && (
                            <span className="text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">🔒 Level 6</span>
                        )}
                    </div>

                    {trooper.level >= 6 ? (
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1 uppercase">Priority</label>
                                <select
                                    value={trooper.tactics?.priority || 'closest'}
                                    onChange={(e) => onUpdateTactics && onUpdateTactics({ ...trooper.tactics, priority: e.target.value as any })}
                                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-gray-300 focus:border-blue-500 outline-none hover:bg-slate-800 transition"
                                >
                                    <option value="closest">Closest</option>
                                    <option value="weakest">Weakest</option>
                                    <option value="strongest">Strongest</option>
                                    <option value="random">Random</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1 uppercase">Target</label>
                                <select
                                    value={trooper.tactics?.targetPart || 'any'}
                                    onChange={(e) => onUpdateTactics && onUpdateTactics({ ...trooper.tactics, targetPart: e.target.value as any })}
                                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-gray-300 focus:border-blue-500 outline-none hover:bg-slate-800 transition"
                                >
                                    <option value="any">Any</option>
                                    <option value="head">Head</option>
                                    <option value="heart">Heart</option>
                                    <option value="arm">Arm</option>
                                    <option value="leg">Leg</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1 uppercase">Weapon</label>
                                <select
                                    value={trooper.tactics?.favoriteWeaponId || ''}
                                    onChange={(e) => onUpdateTactics && onUpdateTactics({ ...trooper.tactics, favoriteWeaponId: e.target.value || undefined })}
                                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-gray-300 focus:border-blue-500 outline-none hover:bg-slate-800 transition"
                                >
                                    <option value="">Auto</option>
                                    {trooper.skills.filter((s: Skill) => {
                                        const def = SKILLS.find(d => d.id === s.id);
                                        return def && (def as any).capacity !== undefined && !(def instanceof Grenade);
                                    }).map((w: Skill) => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-gray-600 italic text-center py-4">
                            Unlock advanced AI tactics at Level 6
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrooperProfile;
