import React from 'react';
import type { TrooperData, Skill } from '@/logic/minitroopers/types';
import SkillTooltip from './SkillTooltip';
import { Weapon } from '@/logic/minitroopers/classes/Skill';
import { getSkillDefinition } from '@/logic/minitroopers/utils';

interface BattleInspectorProps {
    trooper: TrooperData;
    onClose: () => void;
    t: (key: string) => string;
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

const BattleInspector: React.FC<BattleInspectorProps> = ({ trooper, onClose, t }) => {
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
    }, [trooper]);

    const hpPercent = (trooper.attributes.hp / trooper.attributes.maxHp) * 100;

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <div 
                className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-yellow-600/30 rounded-2xl p-4 max-w-sm w-full shadow-2xl relative pointer-events-auto transition-all duration-300 transform ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                onPointerDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 border border-blue-500/30 flex items-center justify-center">
                            <span className="text-2xl">{getClassIcon(trooper.class)}</span>
                        </div>
                        <div>
                            <div className="font-black text-white text-lg leading-none">{trooper.name}</div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">
                                Lvl {trooper.level} • {trooper.class}
                            </div>
                        </div>
                    </div>
                </div>

                {/* HP Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1 uppercase font-bold">
                        <span>HP</span>
                        <span>{trooper.attributes.hp}/{trooper.attributes.maxHp}</span>
                    </div>
                    <div className="h-2.5 bg-black/50 rounded-full overflow-hidden">
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

                {/* Weapons List */}
                <div className="space-y-2 mb-4">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Loadout</div>
                    {trooper.skills
                        .filter(s => getSkillDefinition(s.id) instanceof Weapon)
                        .map((s) => {
                            const weapon = getSkillDefinition(s.id);
                            if (!weapon) return null;
                            const isEquipped = trooper.currentWeaponId === weapon.id;
                            const weaponData = weapon as Weapon; 
                            const ammo = trooper.ammo?.[weapon.id] ?? weaponData.capacity;
                            const isJammed = trooper.jammedWeapons?.includes(weapon.id); 

                            const weaponStatus: 'equipped' | 'unequipped' | 'sabotaged' = 
                                isJammed ? 'sabotaged' : 
                                isEquipped ? 'equipped' : 'unequipped';

                            return (
                                <SkillTooltip key={s.id} skill={weapon} t={t} weaponStatus={weaponStatus}>
                                    <div 
                                        className={`relative flex items-center justify-between p-3 rounded-xl text-xs cursor-help transition-all duration-300
                                            ${isEquipped && !isJammed
                                                ? 'bg-gradient-to-r from-green-900/60 to-emerald-800/40 border-2 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                                                : isJammed
                                                    ? 'bg-gradient-to-r from-red-950/80 to-red-900/60 border-2 border-red-500/50'
                                                    : 'bg-slate-800/50 border border-slate-700/50 opacity-50'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{weapon.icon}</span>
                                            <div>
                                                <span className={`font-bold block ${
                                                    isEquipped && !isJammed ? 'text-green-200' : 
                                                    isJammed ? 'text-red-300' : 'text-gray-400'
                                                }`}>
                                                    {weapon.name}
                                                </span>
                                                {/* Status Badge */}
                                                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 inline-block ${
                                                    isEquipped && !isJammed ? 'bg-green-600 text-white' : 
                                                    isJammed ? 'bg-red-600 text-white animate-pulse' : 
                                                    'bg-slate-700 text-gray-400'
                                                }`}>
                                                    {isJammed ? '⚠ SABOTAGED' : isEquipped ? '✓ EQUIPPED' : '— STOWED'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Ammo */}
                                        <div className={`font-mono font-bold text-sm ${
                                            isEquipped && !isJammed ? 'text-green-400' : 
                                            isJammed ? 'text-red-400' : 'text-gray-600'
                                        }`}>
                                            {ammo}/{weaponData.capacity}
                                        </div>
                                    </div>
                                </SkillTooltip>
                            );
                        })}
                </div>

                {/* Skills Icons */}
                <div className="flex flex-wrap gap-1.5">
                    {trooper.skills
                        .filter(s => !(getSkillDefinition(s.id) instanceof Weapon))
                        .map((skill, idx) => (
                        <SkillTooltip key={idx} skill={skill} t={t}>
                            <div 
                                className="w-10 h-10 bg-slate-800/80 rounded-lg border border-slate-700/50 text-xl cursor-help transition-all hover:bg-slate-700 hover:border-slate-500 hover:scale-110 flex items-center justify-center text-gray-400 hover:text-white"
                            >
                                {skill.icon}
                            </div>
                        </SkillTooltip>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BattleInspector;
