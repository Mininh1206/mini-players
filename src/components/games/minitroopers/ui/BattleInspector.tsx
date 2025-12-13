import React from 'react';
import type { Trooper } from '@/logic/minitroopers/types';
import SkillTooltip from './SkillTooltip';
import { Weapon } from '@/logic/minitroopers/classes/Skill';
import { getSkillDefinition } from '@/logic/minitroopers/utils';

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
                        <div className="space-y-2">
                            {trooper.skills
                                .map(s => getSkillDefinition(s.id))
                                .filter((s): s is Weapon => s instanceof Weapon)
                                .map((weapon, idx) => {
                                    const isEquipped = trooper.currentWeaponId === weapon.id;
                                    const currentAmmo = trooper.ammo?.[weapon.id] ?? weapon.capacity;
                                    
                                    return (
                                        <div 
                                            key={idx} 
                                            className={`relative group bg-gray-800 rounded border transition-all ${
                                                isEquipped 
                                                 ? 'border-yellow-500 ring-1 ring-yellow-500 shadow-md shadow-yellow-900/20' 
                                                 : 'border-gray-600 hover:border-gray-400'
                                            }`}
                                        >
                                            <div className="flex items-center p-2 gap-3">
                                                <div className="text-2xl bg-gray-900 p-2 rounded">{weapon.icon}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={`font-bold text-sm truncate ${isEquipped ? 'text-yellow-400' : 'text-gray-200'}`}>
                                                            {t(`skill_${weapon.id}_name`) !== `skill_${weapon.id}_name` ? t(`skill_${weapon.id}_name`) : weapon.name}
                                                        </span>
                                                        {isEquipped && <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider bg-yellow-900/30 px-1.5 py-0.5 rounded border border-yellow-900/50">Equipped</span>}
                                                    </div>
                                                    
                                                    {/* Ammo Bar */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-yellow-600"
                                                                style={{ width: `${(currentAmmo / weapon.capacity) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-mono text-gray-400">
                                                            {currentAmmo}/{weapon.capacity}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Detailed Stats Row */}
                                            <div className="grid grid-cols-4 gap-1 px-2 pb-2 text-[10px] text-gray-400 text-center border-t border-gray-700 mt-1 pt-1">
                                                <div title={t('damage')}>
                                                    <span className="text-gray-500 block uppercase text-[8px]">DMG</span>
                                                    <span className="text-gray-200 font-bold">{weapon.damage}</span>
                                                </div>
                                                <div title={t('range')}>
                                                    <span className="text-gray-500 block uppercase text-[8px]">RNG</span>
                                                    <span className="text-gray-200 font-bold">{weapon.range}</span>
                                                </div>
                                                <div title={t('crit')}>
                                                    <span className="text-gray-500 block uppercase text-[8px]">CRIT</span>
                                                    <span className="text-gray-200 font-bold">{weapon.crit}%</span>
                                                </div>
                                                <div title={t('hit_chance')}>
                                                    <span className="text-gray-500 block uppercase text-[8px]">AIM</span>
                                                    <span className="text-gray-200 font-bold">{weapon.aim}%</span>
                                                </div>
                                            </div>

                                            <SkillTooltip skill={weapon} t={t} />
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">{t('skills')}</h3>
                        <div className="flex flex-wrap gap-2">
                            {trooper.skills
                                .filter(s => !(getSkillDefinition(s.id) instanceof Weapon))
                                .map((skill, idx) => (
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
