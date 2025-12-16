import React from 'react';
import ReactDOM from 'react-dom';
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
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        // Trigger animation next frame
        requestAnimationFrame(() => setIsVisible(true));
    }, [trooper]); // Re-trigger if trooper changes, though the component might be re-mounted.

    // Calculate current HP percentage
    const hpPercent = (trooper.attributes.hp / trooper.attributes.maxHp) * 100;

    // Tooltip State
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <div 
                className={`bg-gray-900 border border-yellow-600/50 rounded-lg p-4 max-w-sm w-full shadow-2xl relative pointer-events-auto transition-all duration-300 transform ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                onPointerDown={(e) => e.stopPropagation()}
            >
                {/* Header Compact */}
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{trooper.class === 'Rat' ? '🐀' : '🪖'}</span>
                        <div>
                            <div className="font-bold text-white leading-none">{trooper.name}</div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Lvl {trooper.level} {trooper.class}</div>
                        </div>
                    </div>
                    {/* Close button removed as per request */}
                </div>

                {/* HP Bar */}
                <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-0.5 uppercase font-bold">
                        <span>HP</span>
                        <span>{trooper.attributes.hp}/{trooper.attributes.maxHp}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                        <div 
                            className={`h-full transition-all duration-300 ${hpPercent < 30 ? 'bg-red-500' : hpPercent < 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${hpPercent}%` }}
                        />
                    </div>
                </div>

                {/* Weapons List (Compact) */}
                <div className="space-y-1 mb-3">
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Loadout</div>
                    {trooper.skills
                        .filter(s => getSkillDefinition(s.id) instanceof Weapon)
                        .map((s, idx) => {
                            const weapon = getSkillDefinition(s.id);
                            if (!weapon) return null;
                            const isEquipped = trooper.currentWeaponId === weapon.id;
                            // Cast to Weapon to access capacity
                            const weaponData = weapon as Weapon; 
                            const ammo = trooper.ammo?.[weapon.id] ?? weaponData.capacity;
                            
                            // Check jamming (Synced from context to trooper.jammedWeapons)
                            const isJammed = trooper.jammedWeapons?.includes(weapon.id); 

                            return (
                                <SkillTooltip key={s.id} skill={weapon} t={t}>
                                    <div 
                                        className={`relative flex items-center justify-between p-2 rounded text-xs cursor-help transition-all duration-300 border-l-4
                                            ${isEquipped 
                                                ? 'bg-gradient-to-r from-yellow-900/60 to-yellow-800/40 border-yellow-400 shadow-md transform scale-[1.02]' 
                                                : 'bg-gray-800 border-transparent text-gray-400 opacity-60'
                                            }
                                            ${isJammed 
                                                ? 'ring-2 ring-red-500 ring-inset grayscale bg-red-900/10' 
                                                : ''
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{weapon.icon}</span>
                                            <span className={`font-bold uppercase tracking-wider ${isEquipped ? 'text-yellow-200' : 'text-gray-400'}`}>{weapon.name}</span>
                                        </div>
                                        <div className={`font-mono font-bold ${isEquipped ? 'text-yellow-400' : 'text-gray-600'}`}>
                                            {ammo}/{weaponData.capacity}
                                        </div>
                                        
                                        {/* JAMMED Overlay Text */}
                                        {isJammed && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <span className="text-[10px] font-black text-red-500 -rotate-12 tracking-widest border-2 border-red-500 px-1 bg-black/80 shadow-lg glow-red">JAMMED</span>
                                            </div>
                                        )}
                                    </div>
                                </SkillTooltip>
                            );
                        })}
                </div>

                 {/* Skills Icons (Row) */}
                 <div className="flex flex-wrap gap-1 w-full">
                    {/* Label removed to be cleaner or keep? User asked for square skills */}
                    {trooper.skills
                        .filter(s => !(getSkillDefinition(s.id) instanceof Weapon))
                        .map((skill, idx) => (
                        <SkillTooltip key={idx} skill={skill} t={t}>
                            <div 
                                className="aspect-square w-10 h-10 bg-gray-800 rounded border border-gray-700 text-xl cursor-help transition hover:bg-gray-700 hover:border-gray-500 hover:text-white flex items-center justify-center shadow-sm text-gray-400"
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
