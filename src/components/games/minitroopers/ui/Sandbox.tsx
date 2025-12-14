import React, { useState, useRef, useEffect } from 'react';
import type { Trooper, TrooperClass, TrooperAttributes, BattleResult, Skill, BattleLogEntry } from '@/logic/minitroopers/types';
import { SKILLS } from '@/logic/minitroopers/skills';
import { simulateBattle } from '@/logic/minitroopers/combat';
import SkillTooltip from './SkillTooltip';
import { Weapon, Skill as SkillClass } from '@/logic/minitroopers/classes/Skill';
import { useTranslation } from '@/logic/minitroopers/i18n';
import MiniTroopersGame from '../MiniTroopersGame';
import BattleSimulatorView from './BattleSimulatorView';

// Helper to generate IDs without external dependency
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Default Constants ---

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
    id: string;
    name: string;
    level: number;
    type: 'Human' | 'Rat'; // Visual distinction
    weaponIds: string[];
    skillIds: string[];
    equipmentIds: string[];
}

interface SandboxScenario {
    id: string;
    name: string;
    teamA: TrooperConfig[];
    teamB: TrooperConfig[];
}

interface SandboxHistoryEntry {
    id: string;
    time: number;
    teamA: TrooperConfig[];
    teamB: TrooperConfig[];
    winner: 'A' | 'B' | 'Draw';
    log: BattleLogEntry[];
}

const INITIAL_CONFIG: TrooperConfig = {
    id: 'default',
    name: 'Trooper',
    level: 1,
    type: 'Human',
    weaponIds: ['pistol'],
    skillIds: [],
    equipmentIds: []
};

// --- Helper Components ---

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

// --- Main Component ---

export const Sandbox: React.FC = () => {
    const { t } = useTranslation();
    
    // State
    const [teamA, setTeamA] = useState<TrooperConfig[]>([]);
    const [teamB, setTeamB] = useState<TrooperConfig[]>([]);
    const [history, setHistory] = useState<SandboxHistoryEntry[]>([]);
    const [scenarios, setScenarios] = useState<SandboxScenario[]>([]);
    
    // Editing State
    const [editingTrooper, setEditingTrooper] = useState<{ config: TrooperConfig, team: 'A' | 'B', idx: number } | null>(null);
    const [scenarioName, setScenarioName] = useState('');

    // Battle State
    const [result, setResult] = useState<BattleResult | null>(null);
    const [initialSquads, setInitialSquads] = useState<{ mySquad: Trooper[], opponentSquad: Trooper[] } | null>(null);

    // Tooltip State
    const [hoveredSkill, setHoveredSkill] = useState<{ skill: Skill, rect: DOMRect } | null>(null);
    const hoverTimeout = useRef<any>(null);

    // Data Load
    useEffect(() => {
        const saved = localStorage.getItem('minitroopers_sandbox_scenarios');
        if (saved) {
            try {
                setScenarios(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load scenarios", e);
            }
        }
    }, []);

    const saveScenarios = (newScenarios: SandboxScenario[]) => {
        setScenarios(newScenarios);
        localStorage.setItem('minitroopers_sandbox_scenarios', JSON.stringify(newScenarios));
    };

    // --- Helpers ---

    const allWeapons = SKILLS.filter(s => s instanceof Weapon);
    const allSkills = SKILLS.filter(s => !(s instanceof Weapon) && !(s instanceof SkillClass && (s as any).limit));
    const allEquipment = SKILLS.filter(s => (s as any).limit !== undefined);

    const getTrooperClass = (skillIds: string[]): TrooperClass => {
        const skills = skillIds.map(id => SKILLS.find(s => s.id === id)!);
        const classNames: TrooperClass[] = ['Soldier', 'Sniper', 'Doctor', 'Pilot', 'Commando', 'Scout', 'Spy', 'Saboteur', 'Comms Officer'];
        const specialization = skills.find(s => classNames.includes(s.name as TrooperClass));
        return specialization ? (specialization.name as TrooperClass) : 'Recruit';
    };

    const createTrooperInstance = (config: TrooperConfig, team: 'A' | 'B', idSuffix: string): Trooper => {
        const weapons = config.weaponIds.map(id => SKILLS.find(s => s.id === id)!);
        const skills = config.skillIds.map(id => SKILLS.find(s => s.id === id)!);
        const equipment = config.equipmentIds.map(id => SKILLS.find(s => s.id === id)!);
        const derivedClass = getTrooperClass(config.skillIds);

        // Calculate HP based on level
        const hp = 50 + (config.level * 5);

        return {
            id: config.id + '_' + idSuffix, // Ensure unique IDs in battle
            name: config.name,
            class: derivedClass,
            team,
            level: config.level,
            attributes: { ...DEFAULT_ATTRIBUTES, hp, maxHp: hp },
            skills: [...weapons, ...skills, ...equipment],
            isDead: false,
            currentWeaponId: weapons[0]?.id
        };
    };

    // --- Actions ---

    const addTrooper = (team: 'A' | 'B') => {
        const newTrooper: TrooperConfig = {
            ...INITIAL_CONFIG,
            id: generateId(),
            name: team === 'A' ? `Green Unit ${teamA.length + 1}` : `Red Unit ${teamB.length + 1}`,
            team: team // Just for internal tracking if needed, relying on arrays mostly
        } as any;
        
        if (team === 'A') setTeamA([...teamA, newTrooper]);
        else setTeamB([...teamB, newTrooper]);

        // Auto-open editor
        setEditingTrooper({ config: newTrooper, team, idx: team === 'A' ? teamA.length : teamB.length });
    };

    const removeTrooper = (team: 'A' | 'B', idx: number) => {
        if (team === 'A') setTeamA(teamA.filter((_, i) => i !== idx));
        else setTeamB(teamB.filter((_, i) => i !== idx));
    };

    const updateTrooper = (updated: TrooperConfig) => {
        if (!editingTrooper) return;
        if (editingTrooper.team === 'A') {
            const newTeam = [...teamA];
            newTeam[editingTrooper.idx] = updated;
            setTeamA(newTeam);
        } else {
            const newTeam = [...teamB];
            newTeam[editingTrooper.idx] = updated;
            setTeamB(newTeam);
        }
        setEditingTrooper({ ...editingTrooper, config: updated });
    };

    const saveScenario = () => {
        if (!scenarioName) return;
        const newScenario: SandboxScenario = {
            id: generateId(),
            name: scenarioName,
            teamA,
            teamB
        };
        saveScenarios([...scenarios, newScenario]);
        setScenarioName('');
    };

    const loadScenario = (scenario: SandboxScenario) => {
        setTeamA(scenario.teamA);
        setTeamB(scenario.teamB);
    };

    const deleteScenario = (id: string) => {
        saveScenarios(scenarios.filter(s => s.id !== id));
    };

    const handleSimulate = () => {
        if (teamA.length === 0 || teamB.length === 0) return;

        const squadA = teamA.map(c => createTrooperInstance(c, 'A', 'battle'));
        const squadB = teamB.map(c => createTrooperInstance(c, 'B', 'battle'));

        const battleResult = simulateBattle(squadA, squadB);
        setInitialSquads({ mySquad: squadA, opponentSquad: squadB });
        setResult(battleResult);

        // Add to history
        const historyEntry: SandboxHistoryEntry = {
            id: generateId(),
            time: Date.now(),
            teamA: teamA,
            teamB: teamB,
            winner: battleResult.winner,
            log: battleResult.log
        };
        setHistory([historyEntry, ...history]);
    };
    
    const replayHistory = (entry: SandboxHistoryEntry) => {
        setTeamA(entry.teamA);
        setTeamB(entry.teamB);
    };

    // --- Hover Logic ---
    const handleHover = (item: any, rect: DOMRect) => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setHoveredSkill({ skill: item, rect });
    };
    const handleLeave = () => {
        hoverTimeout.current = setTimeout(() => setHoveredSkill(null), 50);
    };

    // --- Renderers ---

    return (
        <div className="flex w-[1200px] h-[700px] bg-gray-950 text-white overflow-hidden font-sans rounded-xl border border-gray-800 shadow-2xl">
            {/* LEFT SIDEBAR: Scenarios & History */}
            <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800 bg-gray-950">
                    <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">SANDBOX</h1>
                    <div className="text-xs text-gray-500">Developer Mode</div>
                </div>

                {/* Scenarios */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Saved Scenarios</h3>
                        <div className="flex gap-2 mb-2">
                            <input 
                                value={scenarioName} 
                                onChange={e => setScenarioName(e.target.value)}
                                placeholder="Scenario Name"
                                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-purple-500 outline-none"
                            />
                            <button onClick={saveScenario} disabled={!scenarioName} className="bg-green-700 disabled:opacity-50 px-2 rounded text-xs font-bold">SAVE</button>
                        </div>
                        <div className="space-y-1">
                            {scenarios.map(s => (
                                <div key={s.id} className="flex justify-between items-center group bg-gray-800 p-2 rounded hover:bg-gray-700 cursor-pointer" onClick={() => loadScenario(s)}>
                                    <span className="text-sm truncate w-32">{s.name}</span>
                                    <button onClick={(e) => { e.stopPropagation(); deleteScenario(s.id); }} className="text-red-500 opacity-0 group-hover:opacity-100 px-1">×</button>
                                </div>
                            ))}
                            {scenarios.length === 0 && <div className="text-xs text-gray-600 italic">No saved scenarios</div>}
                        </div>
                    </div>

                    <div className="bg-gray-800 h-px"></div>

                    {/* History */}
                    <div>
                         <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Session History</h3>
                         <div className="space-y-2">
                            {history.map(h => (
                                <div key={h.id} className="bg-gray-800 p-2 rounded border border-gray-700 flex flex-col gap-1 cursor-pointer hover:border-gray-500" onClick={() => replayHistory(h)}>
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className={h.winner === 'A' ? 'text-green-400' : 'text-red-400'}>
                                            {h.winner === 'A' ? 'Green Wins' : 'Red Wins'}
                                        </span>
                                        <span className="text-gray-500">{new Date(h.time).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="text-[10px] text-gray-400">
                                        {h.teamA.length} vs {h.teamB.length} Units
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            </div>

            {/* CENTER: Team Editor / Battle */}
            <div className="flex-1 flex flex-col relative">
                {/* Header */}
                <div className="h-16 bg-gray-900 border-b border-gray-800 flex justify-between items-center px-6">
                    <div className="flex gap-8">
                        <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_lime]"></div>
                             <span className="font-bold">Team Green: {teamA.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_red]"></div>
                             <span className="font-bold">Team Red: {teamB.length}</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleSimulate}
                        disabled={teamA.length === 0 || teamB.length === 0}
                        className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-black py-2 px-8 rounded shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        SIMULATE BATTLE
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative bg-black/50">
                    {!result ? (
                        <div className="h-full flex">
                            {/* Team A Panel */}
                            <div className="flex-1 p-6 overflow-y-auto border-r border-gray-800 bg-gray-900/30">
                                <div className="flex justify-between items-center mb-4">
                                     <h2 className="text-2xl font-bold text-green-500">TEAM GREEN</h2>
                                     <button onClick={() => addTrooper('A')} className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded font-bold">+ Unit</button>
                                </div>
                                <div className="space-y-2">
                                    {teamA.map((t, i) => (
                                        <div key={i} className="bg-gray-800 p-3 rounded flex justify-between items-center border border-gray-700 hover:border-green-500/50 cursor-pointer" onClick={() => setEditingTrooper({ config: t, team: 'A', idx: i })}>
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl">{t.type === 'Rat' ? '🐀' : '🪖'}</span>
                                                <div>
                                                    <div className="font-bold">{t.name}</div>
                                                    <div className="text-xs text-gray-400">Lvl {t.level} {getTrooperClass(t.skillIds)}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex gap-1">
                                                    {t.weaponIds.map(w => <span key={w} className="text-xs bg-black px-1 rounded text-gray-300">{SKILLS.find(s=>s.id===w)?.icon}</span>)}
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); removeTrooper('A', i); }} className="text-red-500 hover:text-red-300 px-2">×</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Team B Panel */}
                             <div className="flex-1 p-6 overflow-y-auto bg-gray-900/30">
                                <div className="flex justify-between items-center mb-4">
                                     <h2 className="text-2xl font-bold text-red-500">TEAM RED</h2>
                                     <button onClick={() => addTrooper('B')} className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded font-bold">+ Unit</button>
                                </div>
                                <div className="space-y-2">
                                    {teamB.map((t, i) => (
                                        <div key={i} className="bg-gray-800 p-3 rounded flex justify-between items-center border border-gray-700 hover:border-red-500/50 cursor-pointer" onClick={() => setEditingTrooper({ config: t, team: 'B', idx: i })}>
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl">{t.type === 'Rat' ? '🐀' : '🪖'}</span>
                                                <div>
                                                    <div className="font-bold">{t.name}</div>
                                                    <div className="text-xs text-gray-400">Lvl {t.level} {getTrooperClass(t.skillIds)}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex gap-1">
                                                    {t.weaponIds.map(w => <span key={w} className="text-xs bg-black px-1 rounded text-gray-300">{SKILLS.find(s=>s.id===w)?.icon}</span>)}
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); removeTrooper('B', i); }} className="text-red-500 hover:text-red-300 px-2">×</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // SIMULATION VIEW
                        <BattleSimulatorView
                            battleResult={result}
                            mySquad={initialSquads?.mySquad || []}
                            opponentSquad={initialSquads?.opponentSquad || []}
                            onClose={() => setResult(null)}
                            backLabel="Back to Editor"
                        />
                    )}
                </div>
            </div>

            {/* EDITOR MODAL */}
            {editingTrooper && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8" onClick={() => setEditingTrooper(null)}>
                    <div className="bg-gray-900 border border-gray-600 rounded-xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-xl">
                            <h2 className="text-2xl font-black text-white">EDIT UNIT</h2>
                            <button onClick={() => setEditingTrooper(null)} className="text-gray-400 hover:text-white text-2xl font-bold">×</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 flex gap-6">
                            {/* Left Col: Basic Info & Stats */}
                            <div className="w-1/3 flex flex-col gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                                        <input 
                                            value={editingTrooper.config.name} 
                                            onChange={e => updateTrooper({ ...editingTrooper.config, name: e.target.value })}
                                            className="w-full bg-gray-950 border border-gray-700 p-2 rounded text-white font-bold"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Level</label>
                                            <input 
                                                type="number"
                                                value={editingTrooper.config.level} 
                                                onChange={e => updateTrooper({ ...editingTrooper.config, level: parseInt(e.target.value) || 1 })}
                                                className="w-full bg-gray-950 border border-gray-700 p-2 rounded text-white font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                                            <div className="flex bg-gray-950 rounded border border-gray-700 p-1">
                                                <button 
                                                    className={`flex-1 rounded py-1 text-xs font-bold ${editingTrooper.config.type === 'Human' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                                                    onClick={() => updateTrooper({ ...editingTrooper.config, type: 'Human' })}
                                                >Human</button>
                                                <button 
                                                    className={`flex-1 rounded py-1 text-xs font-bold ${editingTrooper.config.type === 'Rat' ? 'bg-orange-600 text-white' : 'text-gray-500'}`}
                                                    onClick={() => updateTrooper({ ...editingTrooper.config, type: 'Rat' })}
                                                >Rat</button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Derived Class</label>
                                            <div className="text-purple-400 font-bold px-2 py-2 bg-purple-900/20 border border-purple-900 rounded">
                                                {getTrooperClass(editingTrooper.config.skillIds)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: Skills Selector */}
                            <div className="flex-1 flex flex-col gap-6">
                                {/* Weapons */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Weapons (Max 3)</label>
                                    <SelectionGrid 
                                        items={allWeapons}
                                        selectedIds={editingTrooper.config.weaponIds}
                                        multiSelect={true}
                                        maxSelection={3}
                                        onSelect={(id) => {
                                            const current = editingTrooper.config.weaponIds;
                                            const exists = current.includes(id);
                                            let next = exists ? current.filter(x => x !== id) : [...current, id];
                                            if (next.length > 3) return;
                                            updateTrooper({ ...editingTrooper.config, weaponIds: next });
                                        }}
                                        onHover={handleHover}
                                        onLeave={handleLeave}
                                    />
                                </div>

                                {/* Class Skills (Specializations) */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Skills</label>
                                    <SelectionGrid 
                                        items={allSkills}
                                        selectedIds={editingTrooper.config.skillIds}
                                        multiSelect={true}
                                        onSelect={(id) => {
                                            const current = editingTrooper.config.skillIds;
                                            const exists = current.includes(id);
                                            let next = exists ? current.filter(x => x !== id) : [...current, id];
                                            updateTrooper({ ...editingTrooper.config, skillIds: next });
                                        }}
                                        onHover={handleHover}
                                        onLeave={handleLeave}
                                    />
                                </div>

                                {/* Equipment */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Equipment</label>
                                    <SelectionGrid 
                                        items={allEquipment}
                                        selectedIds={editingTrooper.config.equipmentIds}
                                        multiSelect={true}
                                        onSelect={(id) => {
                                             const current = editingTrooper.config.equipmentIds;
                                            const exists = current.includes(id);
                                            let next = exists ? current.filter(x => x !== id) : [...current, id];
                                            updateTrooper({ ...editingTrooper.config, equipmentIds: next });
                                        }}
                                        onHover={handleHover}
                                        onLeave={handleLeave}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tooltip */}
            {hoveredSkill && (
                <div 
                    style={{ 
                        position: 'fixed', 
                        top: hoveredSkill.rect.top, 
                        left: hoveredSkill.rect.left + hoveredSkill.rect.width / 2, 
                        pointerEvents: 'none', 
                        zIndex: 99999 
                    }}
                >
                    <SkillTooltip skill={hoveredSkill.skill} t={t as any} forceVisible={true} />
                </div>
            )}
        </div>
    );
};
