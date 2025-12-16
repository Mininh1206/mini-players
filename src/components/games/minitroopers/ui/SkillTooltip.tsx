import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { Skill } from '@/logic/minitroopers/types';
import { Weapon, Vehicle } from '@/logic/minitroopers/classes/Skill';

interface SkillTooltipProps {
    skill: Skill;
    t: (key: string) => string;
    isLocked?: boolean;
    children?: React.ReactNode;
}

const SkillTooltip: React.FC<SkillTooltipProps> = ({ skill, t, isLocked, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const nameKey = `skill_${skill.id}_name`;
    const descKey = `skill_${skill.id}_desc`;
    const name = t(nameKey) !== nameKey ? t(nameKey) : skill.name;
    const description = t(descKey) !== descKey ? t(descKey) : skill.description;

    const isWeapon = skill instanceof Weapon;
    const isVehicle = skill instanceof Vehicle;

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Position above the trigger, centered
            setPosition({
                top: rect.top - 10, // 10px spacing
                left: rect.left + rect.width / 2
            });
            setIsVisible(true);
        }
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    const tooltipContent = (
        <div 
            className="fixed z-[100] w-64 bg-gray-900 text-white text-sm p-3 rounded-lg border border-yellow-500 shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{ top: position.top, left: position.left }}
        >
            <div className={`font-bold text-base mb-1 ${isLocked ? 'text-gray-500' : 'text-yellow-500'}`}>
                {name} {isLocked ? '(Locked)' : ''}
            </div>
            <div className="text-gray-300 mb-2 italic">{description}</div>
            
            {isWeapon && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs border-t border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between">
                        <span className="text-gray-500">{t('damage')}:</span>
                        <span className="text-white font-mono">{(skill as Weapon).damage}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">{t('range')}:</span>
                        <span className="text-white font-mono">{(skill as Weapon).range}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">{t('crit')}:</span>
                        <span className="text-white font-mono">{(skill as Weapon).crit}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">{t('hit_chance')}:</span>
                        <span className="text-white font-mono">{(skill as Weapon).aim}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">{t('recovery')}:</span>
                        <span className="text-white font-mono">{(skill as Weapon).recovery}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">{t('bursts')}:</span>
                        <span className="text-white font-mono">{(skill as Weapon).bursts}</span>
                    </div>
                    <div className="flex justify-between col-span-2 border-t border-gray-800 pt-1 mt-1">
                        <span className="text-gray-500">{t('capacity')}:</span>
                        <span className="text-white font-mono">{(skill as Weapon).capacity}</span>
                    </div>
                </div>
            )}

            {isVehicle && (
                <div className="border-t border-gray-700 pt-2 mt-2 text-xs">
                    <span className="text-gray-500">Deployment Cost: </span>
                    <span className="text-white font-mono">{(skill as Vehicle).deploymentCost}</span>
                </div>
            )}

            {isLocked && skill.level && (
                <div className="text-red-400 mt-2 text-xs border-t border-gray-700 pt-1">
                    Unlocks at Level {skill.level}
                </div>
            )}
            
            {/* Arrow (Optional, tricky with fixed pos without more math, skipping for simplicity) */}
        </div>
    );

    return (
        <>
            <div 
                ref={triggerRef} 
                onMouseEnter={handleMouseEnter} 
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>
            {isVisible && ReactDOM.createPortal(tooltipContent, document.body)}
        </>
    );
};

export default SkillTooltip;
