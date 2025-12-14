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
    const [hoveredSkill, setHoveredSkill] = React.useState<{ skill: any, rect: DOMRect } | null>(null);
    const hoverTimeout = React.useRef<any>(null);

    const handleHover = (skillId: string, rect: DOMRect) => {
        const skill = getSkillDefinition(skillId);
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setHoveredSkill({ skill, rect });
    };

    const handleLeave = () => {
        hoverTimeout.current = setTimeout(() => setHoveredSkill(null), 50);
    };

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
                    <button onClick={onClose} className="text-gray-500 hover:text-white px-2">✕</button>
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
                            const weapon = getSkillDefinition(s.id) as Weapon;
                            const isEquipped = trooper.currentWeaponId === weapon.id;
                            const ammo = trooper.ammo?.[weapon.id] ?? weapon.capacity;
                            return (
                                <div 
                                    key={idx} 
                                    className={`flex items-center justify-between p-1.5 rounded text-xs cursor-help ${isEquipped ? 'bg-yellow-900/30 border border-yellow-700/50 text-yellow-100' : 'bg-gray-800 text-gray-300'}`}
                                    onMouseEnter={(e) => handleHover(s.id, e.currentTarget.getBoundingClientRect())}
                                    onMouseLeave={handleLeave}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{weapon.icon}</span>
                                        <span className="font-bold">{weapon.name}</span>
                                    </div>
                                    <div className="font-mono text-[10px] opacity-70">
                                        {ammo}/{weapon.capacity}
                                    </div>
                                </div>
                            );
                        })}
                </div>

                 {/* Skills Icons (Row) */}
                 <div className="flex flex-wrap gap-1 mb-4">
                    {trooper.skills
                        .filter(s => !(getSkillDefinition(s.id) instanceof Weapon))
                        .map((skill, idx) => (
                        <div 
                            key={idx} 
                            className="bg-gray-800 p-1 rounded border border-gray-700 text-lg cursor-help transition hover:bg-gray-700 hover:border-gray-500"
                            onMouseEnter={(e) => handleHover(skill.id, e.currentTarget.getBoundingClientRect())}
                            onMouseLeave={handleLeave}
                        >
                            {skill.icon}
                        </div>
                    ))}
                 </div>

                {/* Footer */}
                <button 
                    onClick={onClose}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-xs font-bold py-2 rounded text-gray-300 transition"
                >
                    CLOSE INSPECTOR
                </button>

                {/* Tooltip Portal */}
                {hoveredSkill && ReactDOM.createPortal(
                    <div 
                        style={{ 
                            position: 'fixed', 
                            top: hoveredSkill.rect.top, 
                            left: hoveredSkill.rect.left + hoveredSkill.rect.width / 2, 
                            pointerEvents: 'none', 
                            zIndex: 99999 
                        }}
                    >
                        <SkillTooltip skill={hoveredSkill.skill} t={t} forceVisible={true} />
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};

export default BattleInspector;
