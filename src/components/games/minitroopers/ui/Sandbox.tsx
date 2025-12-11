import React, { useState, useRef } from 'react';
import type { Trooper, TrooperClass, TrooperAttributes, BattleResult, Skill } from '@/logic/minitroopers/types';
import { SKILLS, getDefaultWeapons } from '@/logic/minitroopers/skills';
import { simulateBattle } from '@/logic/minitroopers/combat';
import SkillTooltip from './SkillTooltip';
import { Weapon, Skill as SkillClass } from '@/logic/minitroopers/classes/Skill';
import { useTranslation } from '@/logic/minitroopers/i18n';
import MiniTroopersGame from '../MiniTroopersGame';

// Default Config
const DEFAULT_ATTRIBUTES: TrooperAttributes = {
    hp: 100,
    maxHp: 100,
    initiative: 100,
    range: 1,
    damage: 5,
    aim: 100,
    dodge: 0,
    armor: 0,
    critChance: 5,
    speed: 100
};

interface TrooperConfig {
    weaponIds: string[];
    skillIds: string[];
    equipmentIds: string[];
}

const INITIAL_CONFIG: TrooperConfig = {
    weaponIds: ['pistol'],
    skillIds: [],
    equipmentIds: []
};

const SelectionGrid = ({ 
    items, 
    selectedIds, 
    onSelect, 
    onHover,
    onLeave,
    multiSelect = false,
    maxSelection
}: { 
    items: any[], 
    selectedIds: string[], 
    onSelect: (id: string) => void, 
    onHover: (item: any, rect: DOMRect) => void,
    onLeave: (itemId: string) => void,
    multiSelect?: boolean,
    maxSelection?: number
}) => (
    <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-900 rounded border border-gray-700">
        {items.map(item => {
            const isSelected = selectedIds.includes(item.id);
            return (
                <div 
                    key={item.id}
                    onClick={() => {
                        if (multiSelect && maxSelection && !isSelected && selectedIds.length >= maxSelection) return;
                        onSelect(item.id);
                    }}
                    onMouseEnter={(e) => onHover(item, e.currentTarget.getBoundingClientRect())}
                    onMouseLeave={() => onLeave(item.id)}
                    className={`relative p-2 rounded border cursor-pointer transition-all ${
                        isSelected 
                            ? 'bg-blue-900 border-blue-500 shadow-lg' 
                            : 'bg-gray-800 border-gray-600 hover:border-gray-400 hover:bg-gray-700'
                    } ${multiSelect && maxSelection && !isSelected && selectedIds.length >= maxSelection ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <div className="text-2xl text-center">{item.icon}</div>
                </div>
            );
        })}
    </div>
);

export const Sandbox: React.FC = () => {
    const { t } = useTranslation();
    const [attacker, setAttacker] = useState<TrooperConfig>({ ...INITIAL_CONFIG });
    const [defender, setDefender] = useState<TrooperConfig>({ ...INITIAL_CONFIG, weaponIds: ['shotgun'] });
    const [result, setResult] = useState<BattleResult | null>(null);
    const [hoveredSkill, setHoveredSkill] = useState<{ skill: Skill, rect: DOMRect } | null>(null);
    const hoverTimeout = useRef<any>(null);

    const allWeapons = SKILLS.filter(s => s instanceof Weapon);
    const allSkills = SKILLS.filter(s => !(s instanceof Weapon) && !(s instanceof SkillClass && (s as any).limit)); // Exclude weapons and equipment
    const allEquipment = SKILLS.filter(s => (s as any).limit !== undefined); // Duck typing for Equipment

    // Helper to derive class from skills
    const getTrooperClass = (skillIds: string[]): TrooperClass => {
        const skills = skillIds.map(id => SKILLS.find(s => s.id === id)!);
        const classNames: TrooperClass[] = ['Soldier', 'Sniper', 'Doctor', 'Pilot', 'Commando', 'Scout', 'Spy', 'Saboteur', 'Comms Officer'];
        
        const specialization = skills.find(s => classNames.includes(s.name as TrooperClass));
        return specialization ? (specialization.name as TrooperClass) : 'Recruit';
    };

    const [initialSquads, setInitialSquads] = useState<{ mySquad: Trooper[], opponentSquad: Trooper[] } | null>(null);

    const handleSimulate = () => {
        const createTrooper = (config: TrooperConfig, team: 'A' | 'B', id: string): Trooper => {
            const weapons = config.weaponIds.map(id => SKILLS.find(s => s.id === id)!);
            const skills = config.skillIds.map(id => SKILLS.find(s => s.id === id)!);
            const equipment = config.equipmentIds.map(id => SKILLS.find(s => s.id === id)!);
            const derivedClass = getTrooperClass(config.skillIds);
            
            return {
                id,
                name: team === 'A' ? 'Attacker' : 'Defender',
                class: derivedClass,
                team,
                level: 10, // Default to high level for testing
                attributes: { ...DEFAULT_ATTRIBUTES },
                skills: [...weapons, ...skills, ...equipment],
                isDead: false,
                currentWeaponId: weapons[0]?.id
            };
        };

        const t1 = createTrooper(attacker, 'A', 'attacker');
        const t2 = createTrooper(defender, 'B', 'defender');

        setInitialSquads({ mySquad: [t1], opponentSquad: [t2] });
        const battleResult = simulateBattle([t1], [t2]);
        setResult(battleResult);
    };

    const activeItemIdRef = useRef<string | null>(null);

    const handleHover = (item: any, rect: DOMRect) => {
        activeItemIdRef.current = item.id;
        if (hoverTimeout.current) {
            clearTimeout(hoverTimeout.current);
            hoverTimeout.current = null;
        }
        setHoveredSkill({ skill: item, rect });
    };

    const handleLeave = (itemId: string) => {
        if (activeItemIdRef.current === itemId) {
            hoverTimeout.current = setTimeout(() => {
                if (activeItemIdRef.current === itemId) {
                    setHoveredSkill(null);
                    activeItemIdRef.current = null;
                }
            }, 50);
        }
    };

    const renderConfig = (title: string, config: TrooperConfig, setConfig: (c: TrooperConfig) => void) => {
        const derivedClass = getTrooperClass(config.skillIds);

        const toggleWeapon = (id: string) => {
            const newWeapons = config.weaponIds.includes(id)
                ? config.weaponIds.filter(w => w !== id)
                : [...config.weaponIds, id];
            
            // Allow up to 3 weapons
            if (newWeapons.length <= 3) {
                 setConfig({ ...config, weaponIds: newWeapons });
            }
        };

        const toggleSkill = (id: string) => {
            const newSkills = config.skillIds.includes(id)
                ? config.skillIds.filter(s => s !== id)
                : [...config.skillIds, id];
            
            // Enforce single specialization
            const classNames = ['Soldier', 'Sniper', 'Doctor', 'Pilot', 'Commando', 'Scout', 'Spy', 'Saboteur', 'Comms Officer'];
            const addedSkill = SKILLS.find(s => s.id === id);
            
            if (addedSkill && classNames.includes(addedSkill.name)) {
                // Remove other specializations
                const filtered = newSkills.filter(sid => {
                    const s = SKILLS.find(sk => sk.id === sid);
                    return s && (s.id === id || !classNames.includes(s.name));
                });
                setConfig({ ...config, skillIds: filtered });
            } else {
                setConfig({ ...config, skillIds: newSkills });
            }
        };

        const toggleEquipment = (id: string) => {
             const newEquipment = config.equipmentIds.includes(id)
                ? config.equipmentIds.filter(e => e !== id)
                : [...config.equipmentIds, id];
            setConfig({ ...config, equipmentIds: newEquipment });
        };

        return (
            <div className="flex flex-col gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700 w-1/2">
                <div className="flex justify-between items-center border-b border-gray-600 pb-2">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <span className="text-sm px-2 py-1 bg-blue-900 text-blue-200 rounded border border-blue-700 font-bold">
                        {derivedClass}
                    </span>
                </div>
                
                {/* Weapon */}
                <div>
                    <label className="block text-gray-400 text-sm mb-1 font-bold">Weapons (Max 3)</label>
                    <SelectionGrid 
                        items={allWeapons} 
                        selectedIds={config.weaponIds} 
                        onSelect={toggleWeapon} 
                        onHover={handleHover}
                        onLeave={handleLeave}
                        multiSelect={true}
                        maxSelection={3}
                    />
                </div>

                {/* Skills */}
                <div>
                    <label className="block text-gray-400 text-sm mb-1 font-bold">Skills</label>
                    <SelectionGrid 
                        items={allSkills} 
                        selectedIds={config.skillIds} 
                        onSelect={toggleSkill} 
                        onHover={handleHover}
                        onLeave={handleLeave}
                        multiSelect={true}
                    />
                </div>

                {/* Equipment */}
                <div>
                    <label className="block text-gray-400 text-sm mb-1 font-bold">Equipment</label>
                    <SelectionGrid 
                        items={allEquipment} 
                        selectedIds={config.equipmentIds} 
                        onSelect={toggleEquipment} 
                        onHover={handleHover}
                        onLeave={handleLeave}
                        multiSelect={true}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 p-6 bg-gray-900 min-h-screen text-white relative">
            <h2 className="text-3xl font-bold text-center text-yellow-400">Skill Sandbox</h2>
            
            <div className="flex gap-6">
                {renderConfig('Attacker', attacker, setAttacker)}
                {renderConfig('Defender', defender, setDefender)}
            </div>

            <button 
                onClick={handleSimulate}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all transform hover:scale-105 self-center"
            >
                Simulate Battle
            </button>

            {result && (
                <div className="flex flex-col gap-4">
                     <div className="bg-black p-4 rounded-lg border border-gray-700 h-[600px] w-[800px] self-center">
                        <MiniTroopersGame 
                            battleResult={result} 
                            mySquad={initialSquads?.mySquad} 
                            opponentSquad={initialSquads?.opponentSquad}
                        />
                    </div>

                    <div className="bg-black p-4 rounded-lg border border-gray-700 font-mono text-sm h-96 overflow-y-auto">
                        <h3 className="text-xl font-bold text-green-400 mb-4">Battle Log (Winner: {result.winner})</h3>
                        {result.log.map((entry, i) => (
                            <div key={i} className="mb-1 border-b border-gray-800 pb-1">
                                <span className="text-gray-500 mr-2">[Time {entry.time}]</span>
                                <span className={entry.actorId === 'attacker' ? 'text-blue-400' : 'text-red-400'}>{entry.actorName}</span>
                                <span className="text-gray-300"> {entry.action} </span>
                                {entry.targetName && <span className={entry.targetId === 'attacker' ? 'text-blue-400' : 'text-red-400'}>{entry.targetName}</span>}
                                <span className="text-gray-400"> - {entry.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Floating Tooltip */}
            {hoveredSkill && (
                <div 
                    style={{ 
                        position: 'fixed', 
                        top: hoveredSkill.rect.top, 
                        left: hoveredSkill.rect.left + hoveredSkill.rect.width / 2, 
                        pointerEvents: 'none', 
                        zIndex: 9999 
                    }}
                >
                    <SkillTooltip skill={hoveredSkill.skill} t={t as any} forceVisible={true} />
                </div>
            )}
        </div>
    );
};
