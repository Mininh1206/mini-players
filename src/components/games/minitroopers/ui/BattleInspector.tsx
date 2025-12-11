import React from 'react';
import type { Trooper } from '@/logic/minitroopers/types';
import SkillTooltip from './SkillTooltip';

interface BattleInspectorProps {
    trooper: Trooper;
    onClose: () => void;
    t: (key: string) => string;
}

const BattleInspector: React.FC<BattleInspectorProps> = ({ trooper, onClose, t }) => {
    // Calculate current HP percentage
    const hpPercent = (trooper.attributes.hp / trooper.attributes.maxHp) * 100;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-gray-900 border-2 border-yellow-600 rounded-xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-4 border-b border-gray-800 pb-4">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                            {trooper.name}
                            <span className="text-sm bg-yellow-900 text-yellow-100 px-2 py-0.5 rounded border border-yellow-700">
                                Lvl {trooper.level}
                            </span>
                        </h2>
                        <div className="text-gray-400 text-sm font-bold uppercase">{trooper.class}</div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-white transition text-xl font-bold px-2"
                    >
                        ✕
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* HP Bar */}
                    <div className="col-span-2">
                        <div className="flex justify-between text-xs text-gray-400 mb-1 uppercase font-bold">
                            <span>{t('hit_points')}</span>
                            <span>{trooper.attributes.hp} / {trooper.attributes.maxHp}</span>
                        </div>
                        <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                            <div 
                                className={`h-full transition-all duration-500 ${hpPercent < 30 ? 'bg-red-500' : hpPercent < 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                style={{ width: `${hpPercent}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-gray-800 p-2 rounded border border-gray-700 flex justify-between items-center">
                        <span className="text-gray-500 text-xs uppercase font-bold">{t('initiative')}</span>
                        <span className="text-white font-mono font-bold">{trooper.attributes.initiative}</span>
                    </div>
                    <div className="bg-gray-800 p-2 rounded border border-gray-700 flex justify-between items-center">
                        <span className="text-gray-500 text-xs uppercase font-bold">{t('speed')}</span>
                        <span className="text-white font-mono font-bold">{trooper.attributes.speed}</span>
                    </div>
                </div>

                {/* Skills & Weapons */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">{t('weapon')}</h3>
                        <div className="flex gap-2">
                            {trooper.skills.filter(s => s.id === trooper.skills[0]?.id).map((skill, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="bg-gray-800 p-3 rounded border border-gray-600 hover:border-red-500 transition cursor-help">
                                        <div className="text-2xl">{skill.icon}</div>
                                    </div>
                                    <SkillTooltip skill={skill} t={t} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">{t('skills')}</h3>
                        <div className="flex flex-wrap gap-2">
                            {trooper.skills.filter(s => s.id !== trooper.skills[0]?.id).map((skill, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="bg-gray-800 p-2 rounded border border-gray-600 hover:border-yellow-500 transition cursor-help">
                                        <div className="text-xl">{skill.icon}</div>
                                    </div>
                                    <SkillTooltip skill={skill} t={t} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded transition shadow-lg hover:shadow-yellow-500/20"
                    >
                        RESUME BATTLE
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BattleInspector;
