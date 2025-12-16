import React from 'react';
import type { Trooper, Skill } from '@/logic/minitroopers/types';
import { SKILLS } from '@/logic/minitroopers/skills';
import { Weapon, Grenade } from '@/logic/minitroopers/classes/Skill';
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

const getHelmetIcon = (trooperClass: string) => {
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

const TrooperProfile: React.FC<TrooperProfileProps & { onRename?: (name: string) => void }> = ({ trooper, gold, onUpgrade, t, onUpdateTactics, onSelectSkill, upgradeCostCalculator, onRename }) => {
    const defaultUpgradeCost = (trooper.level || 1) * 50;
    const upgradeCost = upgradeCostCalculator ? upgradeCostCalculator(trooper.level || 1) : defaultUpgradeCost;
    const canAfford = gold >= upgradeCost;
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [tempName, setTempName] = React.useState(trooper.name);

    const handleSaveName = () => {
        if (onRename && tempName.trim()) {
            onRename(tempName.trim());
        }
        setIsEditingName(false);
    };

    if (trooper.pendingChoices && trooper.pendingChoices.length > 0) {
        return (
            <div className="flex flex-col gap-4 p-6 bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl items-center text-center">
                <h2 className="text-2xl font-black text-white mb-2">Level Up!</h2>
                <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                    {trooper.pendingChoices.map((skill, idx) => (
                        <SkillTooltip key={idx} skill={skill} t={t}>
                            <button
                                onClick={() => onSelectSkill && onSelectSkill(skill)}
                                className="bg-gray-900 p-4 rounded-xl border-2 border-gray-700 hover:border-blue-500 hover:bg-gray-800 transition group flex flex-col items-center gap-2 relative w-full h-full"
                            >
                                <div className="text-4xl group-hover:scale-110 transition-transform">{skill.icon}</div>
                                <h3 className="text-lg font-bold text-white">{skill.name}</h3>
                                <p className="text-xs text-gray-400">{skill.description}</p>
                            </button>
                        </SkillTooltip>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 bg-gray-900 rounded-xl overflow-hidden h-full"> 
           {/* Top Info Bar - Compact */}
            <div className="flex items-center gap-4 bg-gray-800 p-3 border-b border-gray-700">
                {/* Avatar */}
                <div className="w-16 h-16 bg-gray-900 rounded-lg border-2 border-blue-500 flex items-center justify-center shrink-0 relative overflow-hidden">
                    <span className="text-4xl">
                        {getHelmetIcon(trooper.class)}
                    </span>
                    <div className="absolute -bottom-1 right-0 bg-blue-600 text-white px-1.5 py-0.5 rounded-tl text-[10px] font-bold">
                        {trooper.level || 1}
                    </div>
                </div>

                {/* Name & Class & Upgrade */}
                <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    value={tempName} 
                                    onChange={(e) => setTempName(e.target.value)}
                                    className="bg-gray-950 border border-blue-500 rounded px-2 py-0.5 text-lg font-black text-white outline-none w-48"
                                    autoFocus
                                    onBlur={handleSaveName}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                />
                                <button onClick={handleSaveName} className="text-xs text-green-400 hover:text-green-300">💾</button>
                            </div>
                        ) : (
                            <h2 
                                className="text-2xl font-black text-white tracking-tight cursor-pointer hover:text-blue-400 flex items-center gap-2"
                                onClick={() => { setTempName(trooper.name); setIsEditingName(true); }}
                                title="Click to rename"
                            >
                                {trooper.name} <span className="text-xs opacity-30">✎</span>
                            </h2>
                        )}
                        
                        {trooper.class !== 'Recruit' && trooper.class !== 'Rat' && (
                             <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20 uppercase tracking-widest">
                                {trooper.class}
                            </span>
                        )}
                    </div>
                </div>
                
                {/* Upgrade Button - Compact */}
                <button 
                    onClick={() => onUpgrade(upgradeCost)}
                    disabled={!canAfford}
                    className={`px-4 py-2 font-black text-sm rounded-lg shadow-lg transform transition flex flex-col items-center leading-none ${canAfford ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:brightness-110 text-black' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                >
                    <span>{t('upgrade')}</span>
                    <span className="text-xs opacity-80">{upgradeCost} 💰</span>
                </button>
            </div>

            {/* Content Area - Skills Priority */}
            <div className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
                {/* Skills Grid - Takes Priority */}
                <div className="mb-4">
                     <h3 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-full h-px bg-gray-800"></span>
                        <span className="whitespace-nowrap">Skills & Equipment ({trooper.skills.length})</span>
                        <span className="w-full h-px bg-gray-800"></span>
                    </h3>
                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1">
                        {SKILLS.map((skill) => {
                            const hasSkill = trooper.skills.some(s => s.id === skill.id);
                            return (
                                <div key={skill.id} className="aspect-square">
                                    <SkillTooltip skill={skill} t={t} isLocked={!hasSkill}>
                                        <div 
                                            className={`w-full h-full flex items-center justify-center rounded border transition-all cursor-help ${hasSkill ? 'bg-gray-800 border-gray-600 hover:border-yellow-500 hover:bg-gray-750' : 'bg-gray-900/50 border-gray-800/50 opacity-20 grayscale'}`}
                                        >
                                            <div className="text-xl">{skill.icon}</div>
                                        </div>
                                    </SkillTooltip>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tactics (Level 6+) - Compact Row */}
                <div className="bg-gray-950/30 rounded-lg border border-gray-800 p-3">
                     <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Combat Tactics</h3>
                        {trooper.level < 6 && <span className="text-[10px] text-red-900 bg-red-900/20 px-1 rounded">Lvl 6+</span>}
                     </div>
                     
                    {trooper.level >= 6 ? (
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-600 mb-0.5">Priority</label>
                                <select 
                                    value={trooper.tactics?.priority || 'closest'}
                                    onChange={(e) => onUpdateTactics && onUpdateTactics({ ...trooper.tactics, priority: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:border-blue-500 outline-none hover:bg-gray-800 transition"
                                >
                                    <option value="closest">Closest</option>
                                    <option value="weakest">Weakest</option>
                                    <option value="strongest">Strongest</option>
                                    <option value="random">Random</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-gray-600 mb-0.5">Target</label>
                                <select 
                                    value={trooper.tactics?.targetPart || 'any'}
                                    onChange={(e) => onUpdateTactics && onUpdateTactics({ ...trooper.tactics, targetPart: e.target.value as any })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:border-blue-500 outline-none hover:bg-gray-800 transition"
                                >
                                    <option value="any">Any</option>
                                    <option value="head">Head</option>
                                    <option value="heart">Heart</option>
                                    <option value="arm">Arm</option>
                                    <option value="leg">Leg</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-gray-600 mb-0.5">Most Wanted</label>
                                <select 
                                    value={trooper.tactics?.favoriteWeaponId || ''}
                                    onChange={(e) => onUpdateTactics && onUpdateTactics({ ...trooper.tactics, favoriteWeaponId: e.target.value || undefined })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:border-blue-500 outline-none hover:bg-gray-800 transition"
                                >
                                    <option value="">None (Auto)</option>
                                    {trooper.skills.filter(s => {
                                        // Simple duck typing for weapons (has capacity attr in SKILLS def)
                                        const def = SKILLS.find(d => d.id === s.id);
                                        return def && (def as any).capacity !== undefined && !(def instanceof Grenade);
                                    }).map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-gray-700 italic text-center py-2">
                            Unlock advanced AI tactics at Level 6
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrooperProfile;
