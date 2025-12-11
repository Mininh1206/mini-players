
import React, { useState, useEffect } from 'react';
import { Sandbox } from './Sandbox';
import TrooperCard from './TrooperCard';
import TrooperProfile from './TrooperProfile';
import BattleArena from './BattleArena';
import RecruitmentCenter from './RecruitmentCenter';
import type { Trooper, BattleResult, Player, BattleHistoryEntry } from '@/logic/minitroopers/types';
import { useTranslation } from '@/logic/minitroopers/i18n';
import { simulateBattle } from '@/logic/minitroopers/combat';
import MiniTroopersGame from '@/components/games/minitroopers/MiniTroopersGame';
import { saveGame, loadGame } from '@/logic/minitroopers/storage';
import { generateRandomTrooper } from '@/logic/minitroopers/generators';
import { getRandomSkill, getSkillsByLevel } from '@/logic/minitroopers/skills';
import { v4 as uuidv4 } from 'uuid';

// Mock Opponents (kept for now)
// Mock Opponents
const MOCK_OPPONENTS: Record<string, Trooper[]> = {
    'Training: Rats': [
         { id: 'r1', name: 'Rat', class: 'Scout', team: 'B', isDead: false, skills: [], level: 1, attributes: { hp: 10, maxHp: 10, initiative: 5, range: 1, damage: 2, aim: 60, dodge: 10, armor: 0, critChance: 5, speed: 80 }, ammo: {}, cooldown: 0, disarmed: [] },
         { id: 'r2', name: 'Rat', class: 'Scout', team: 'B', isDead: false, skills: [], level: 1, attributes: { hp: 10, maxHp: 10, initiative: 5, range: 1, damage: 2, aim: 60, dodge: 10, armor: 0, critChance: 5, speed: 80 }, ammo: {}, cooldown: 0, disarmed: [] }
    ],
    'Training: Recruits': [
        { id: 'n1', name: 'Recruit', class: 'Recruit', team: 'B', isDead: false, skills: [], level: 1, attributes: { hp: 50, maxHp: 50, initiative: 10, range: 1, damage: 10, aim: 80, dodge: 10, armor: 0, critChance: 5, speed: 100 }, ammo: {}, cooldown: 0, disarmed: [] }
    ],
    'Mission: Infiltration': [
         { id: 'r1', name: 'Rat', class: 'Scout', team: 'B', isDead: false, skills: [], level: 1, attributes: { hp: 10, maxHp: 10, initiative: 20, range: 1, damage: 3, aim: 90, dodge: 30, armor: 0, critChance: 50, speed: 150 }, ammo: {}, cooldown: 0, disarmed: [] },
         { id: 'r2', name: 'Rat', class: 'Scout', team: 'B', isDead: false, skills: [], level: 1, attributes: { hp: 10, maxHp: 10, initiative: 20, range: 1, damage: 3, aim: 90, dodge: 30, armor: 0, critChance: 50, speed: 150 }, ammo: {}, cooldown: 0, disarmed: [] },
         { id: 'r3', name: 'Giant Rat', class: 'Soldier', team: 'B', isDead: false, skills: [], level: 1, attributes: { hp: 50, maxHp: 50, initiative: 10, range: 1, damage: 10, aim: 80, dodge: 10, armor: 1, critChance: 10, speed: 110 }, ammo: {}, cooldown: 0, disarmed: [] }
    ],
    'Mission: Raid': [
        { id: 'b1', name: 'Boss', class: 'Soldier', team: 'B', isDead: false, skills: [], level: 1, attributes: { hp: 200, maxHp: 200, initiative: 15, range: 2, damage: 20, aim: 95, dodge: 10, armor: 5, critChance: 10, speed: 120 }, ammo: {}, cooldown: 0, disarmed: [] }
    ],
    // Standard Opponents
    'Army of Darkness': [
        generateRandomTrooper(3),
        generateRandomTrooper(3),
        generateRandomTrooper(3)
    ],
    'The Peacekeepers': [
        generateRandomTrooper(4),
        generateRandomTrooper(4),
        generateRandomTrooper(4),
        generateRandomTrooper(4)
    ],
    'Random Noobs': [
        generateRandomTrooper(2),
        generateRandomTrooper(2),
        generateRandomTrooper(2)
    ],
    // Advanced Opponents
    'The Elite Guard': [
        generateRandomTrooper(6),
        generateRandomTrooper(6),
        generateRandomTrooper(6)
    ],
    'Special Forces': [
        generateRandomTrooper(7),
        generateRandomTrooper(7),
        generateRandomTrooper(7),
        generateRandomTrooper(7)
    ],
    'Cyber Command': [
        generateRandomTrooper(8),
        generateRandomTrooper(8),
        generateRandomTrooper(8),
        generateRandomTrooper(8),
        generateRandomTrooper(8)
    ],
    'Shadow Ops': [
        generateRandomTrooper(9),
        generateRandomTrooper(9),
        generateRandomTrooper(9),
        generateRandomTrooper(9),
        generateRandomTrooper(9),
        generateRandomTrooper(9)
    ],
    'The Immortals': [
        generateRandomTrooper(10),
        generateRandomTrooper(10),
        generateRandomTrooper(10),
        generateRandomTrooper(10),
        generateRandomTrooper(10),
        generateRandomTrooper(10),
        generateRandomTrooper(10)
    ]
};

type View = 'HQ' | 'BATTLE' | 'HISTORY' | 'SIMULATION' | 'RECRUIT';

const MiniTroopersLayout: React.FC = () => {
    const { t, lang, changeLanguage } = useTranslation();
    const [currentView, setCurrentView] = useState<View>('HQ');
    const [selectedTrooperId, setSelectedTrooperId] = useState<string | null>(null);
    const [player, setPlayer] = useState<Player | null>(null);
    const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
    const [recruitCandidates, setRecruitCandidates] = useState<Trooper[]>([]);
    const [currentOpponent, setCurrentOpponent] = useState<Trooper[]>([]);

    // Load game on mount
    useEffect(() => {
        const savedState = loadGame();
        if (savedState) {
            // Migration: Ensure history exists
            if (!savedState.history) savedState.history = [];
            setPlayer(savedState);
            if (savedState.troopers.length > 0) {
                setSelectedTrooperId(savedState.troopers[0].id);
            }
        } else {
            // Initialize new player with NO troopers, force recruitment
            const newPlayer: Player = {
                id: uuidv4(),
                name: 'Commander',
                gold: 50, // Enough for one recruit
                troopers: [],
                lastPlayed: Date.now(),
                history: []
            };
            setPlayer(newPlayer);
            saveGame(newPlayer);
            
            // Generate initial candidates
            const candidates = [
                generateRandomTrooper(1),
                generateRandomTrooper(1),
                generateRandomTrooper(1)
            ];
            setRecruitCandidates(candidates);
            setCurrentView('RECRUIT');
        }
    }, []);

    // Save game on state changes
    useEffect(() => {
        if (player) {
            saveGame(player);
        }
    }, [player]);

    const handleResetData = () => {
        if (confirm(t('confirm_reset') || 'Are you sure you want to delete all data? This cannot be undone.')) {
            localStorage.removeItem('minitroopers_save_v2');
            window.location.reload();
        }
    };

    const handleStartBattle = (opponentName: string) => {
        if (!player) return;
        const opponentSquad = MOCK_OPPONENTS[opponentName];
        if (!opponentSquad) {
            alert('Opponent not found!');
            return;
        }
        
        // Deep copy to avoid mutating initial state across battles
        const mySquad = player.troopers.map(t => ({ ...t, isDead: false, attributes: { ...t.attributes, hp: t.attributes.maxHp } }));
        const enemySquad = opponentSquad.map(t => ({ ...t, team: 'B' as const, isDead: false, attributes: { ...t.attributes, hp: t.attributes.maxHp } }));

        // Store for visualization (Use enemySquad which has correct Team B assignment)
        setCurrentOpponent(enemySquad);

        const result = simulateBattle(mySquad, enemySquad);
        setBattleResult(result);
        
        // Update Player History & Gold
        setPlayer(prev => {
            if (!prev) return null;
            const newHistory = [
                {
                    id: uuidv4(),
                    date: Date.now(),
                    opponentName,
                    result: (result.winner === 'A' ? 'VICTORY' : 'DEFEAT') as 'VICTORY' | 'DEFEAT',
                    log: result.log
                },
                ...(prev.history || [])
            ].slice(0, 20); // Keep last 20 battles

            let newGold = prev.gold;
            if (result.winner === 'A') {
                const reward = opponentName === 'Mission: Raid' ? 100 : 10;
                newGold += reward;
            }

            return { ...prev, gold: newGold, history: newHistory };
        });
        
        setCurrentView('SIMULATION');
    };

    const handleUpgradeTrooper = (trooperId: string, cost: number) => {
        if (!player) return;
        if (player.gold >= cost) {
            setPlayer(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    gold: prev.gold - cost,
                    troopers: prev.troopers.map(t => {
                        if (t.id === trooperId) {
                            // Level 6 Specialization Choice
                            if (t.level + 1 === 6) {
                                const specializations = getSkillsByLevel(6);
                                // Pick 2 random specializations
                                const shuffled = specializations.sort(() => 0.5 - Math.random());
                                const choice1 = shuffled[0];
                                const choice2 = shuffled[1];
                                return {
                                    ...t,
                                    pendingChoices: [choice1, choice2]
                                };
                            } else {
                                // Standard Level Up
                                const choice1 = getRandomSkill(t.skills);
                                const choice2 = getRandomSkill([...t.skills, choice1]);
                                return {
                                    ...t,
                                    pendingChoices: [choice1, choice2]
                                };
                            }
                        }
                        return t;
                    })
                };
            });
        }
    };

    const handleSelectSkill = (trooperId: string, skill: any) => {
        if (!player) return;
        setPlayer(prev => {
            if (!prev) return null;
            return {
                ...prev,
                troopers: prev.troopers.map(t => {
                    if (t.id === trooperId) {
                        const newSkills = [...t.skills, skill];
                        const newAmmo = { ...t.ammo };
                        if (skill.capacity) {
                            newAmmo[skill.id] = skill.capacity;
                        }

                        // Update Class if Specialization (Level 6)
                        let newClass = t.class;
                        if (skill.level === 6) {
                            // Assuming skill name matches class name
                            newClass = skill.name as any; 
                        }

                        return {
                            ...t,
                            level: t.level + 1,
                            class: newClass,
                            attributes: {
                                ...t.attributes,
                                hp: t.attributes.hp + 10,
                                maxHp: t.attributes.maxHp + 10,
                                damage: t.attributes.damage + 2
                            },
                            skills: newSkills,
                            ammo: newAmmo,
                            pendingChoices: undefined
                        };
                    }
                    return t;
                })
            };
        });
    };

    const handleEnterRecruit = () => {
        // Generate candidates if not already generated or refresh them
        const candidates = [
            generateRandomTrooper(1),
            generateRandomTrooper(1),
            generateRandomTrooper(1)
        ];
        setRecruitCandidates(candidates);
        setCurrentView('RECRUIT');
    };

    const handleRecruit = (trooper: Trooper) => {
        if (!player) return;
        const cost = 50; // Fixed cost for now
        if (player.gold >= cost) {
            setPlayer(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    gold: prev.gold - cost,
                    troopers: [...prev.troopers, trooper]
                };
            });
            setCurrentView('HQ');
            setSelectedTrooperId(trooper.id);
        }
    };

    const handleUpdateTactics = (tactics: any) => {
        if (player && selectedTrooperId) {
            setPlayer(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    troopers: prev.troopers.map(t => {
                        if (t.id === selectedTrooperId) {
                            return { ...t, tactics };
                        }
                        return t;
                    })
                };
            });
        }
    };

    if (!player) return <div className="text-white">Loading...</div>;

    const selectedTrooper = player.troopers.find(t => t.id === selectedTrooperId);

    return (
        <div className="flex flex-col lg:flex-row min-h-[800px] bg-gray-900 text-white rounded-xl overflow-hidden shadow-2xl border border-gray-800 font-sans w-full max-w-[1600px] mx-auto">
            {/* Sidebar */}
            <div className="w-full lg:w-72 bg-gray-950 flex flex-col border-r border-gray-800 shrink-0">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    {/* Title and Language Switcher */}
                    <div>
                        <h1 className="text-2xl font-black italic tracking-wider text-yellow-500">MINI TROOPERS</h1>
                        <div className="text-xs text-gray-500 tracking-widest">{player.name}</div>
                        <div className="text-yellow-400 font-bold mt-1">{player.gold} 💰</div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => changeLanguage('en')} className={`text-xs px-1 ${lang === 'en' ? 'text-white font-bold' : 'text-gray-600'}`}>EN</button>
                        <span className="text-gray-700">|</span>
                        <button onClick={() => changeLanguage('es')} className={`text-xs px-1 ${lang === 'es' ? 'text-white font-bold' : 'text-gray-600'}`}>ES</button>
                    </div>
                </div>
                
                {/* Navigation */}
                <nav className="flex flex-col p-4 gap-2">
                    <button 
                        onClick={() => setCurrentView('HQ')}
                        className={`px-4 py-3 rounded-lg text-left font-bold transition flex items-center gap-3 ${currentView === 'HQ' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-900 hover:text-white'}`}
                    >
                        <span className="text-xl">🏠</span> {t('hq')}
                    </button>
                    <button 
                        onClick={() => setCurrentView('BATTLE')}
                        className={`px-4 py-3 rounded-lg text-left font-bold transition flex items-center gap-3 ${currentView === 'BATTLE' || currentView === 'SIMULATION' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-900 hover:text-white'}`}
                    >
                        <span className="text-xl">⚔️</span> {t('battle')}
                    </button>
                    <button 
                        onClick={() => setCurrentView('HISTORY')}
                        className={`px-4 py-3 rounded-lg text-left font-bold transition flex items-center gap-3 ${currentView === 'HISTORY' ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-900 hover:text-white'}`}
                    >
                        <span className="text-xl">📜</span> {t('history')}
                    </button>
                </nav>

                {/* Trooper List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div className="text-xs font-bold text-gray-500 px-2 uppercase tracking-wider">{t('my_squad')}</div>
                    {player.troopers.map(trooper => (
                        <TrooperCard 
                            key={trooper.id} 
                            trooper={trooper} 
                            isSelected={selectedTrooperId === trooper.id && currentView === 'HQ'}
                            onClick={() => {
                                setSelectedTrooperId(trooper.id);
                                setCurrentView('HQ');
                            }}
                            t={t}
                        />
                    ))}
                    <button 
                        onClick={handleEnterRecruit}
                        className="w-full py-3 border-2 border-dashed border-gray-800 text-gray-500 rounded-lg hover:border-gray-600 hover:text-gray-300 transition text-sm font-bold"
                    >
                        {t('recruit_trooper')}
                    </button>
                </div>

                {/* Reset Data Button */}
                <div className="p-4 border-t border-gray-800">
                    <button 
                        onClick={handleResetData}
                        className="w-full py-2 bg-red-900/50 text-red-400 hover:bg-red-900 hover:text-white rounded transition text-xs font-bold uppercase tracking-widest"
                    >
                        {t('reset_data') || 'Reset Data'}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-gray-900 p-6 lg:p-8 overflow-y-auto relative flex flex-col">
                 {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                <div className="relative z-10 flex-1">
                    {currentView === 'HQ' && selectedTrooper && (
                        <div className="max-w-5xl mx-auto">
                            <h2 className="text-4xl font-black mb-8 text-white tracking-tight flex items-center gap-4">
                                <span className="text-blue-500">/</span> {t('trooper_profile')}
                            </h2>
                            <TrooperProfile 
                                trooper={selectedTrooper} 
                                gold={player.gold}
                                onUpgrade={(cost) => handleUpgradeTrooper(selectedTrooper.id, cost)}
                                t={t}
                                onUpdateTactics={handleUpdateTactics}
                                onSelectSkill={(skill) => handleSelectSkill(selectedTrooper.id, skill)}
                            />
                        </div>
                    )}
                    
                    {currentView === 'RECRUIT' && (
                        <div className="max-w-5xl mx-auto">
                            <RecruitmentCenter 
                                candidates={recruitCandidates}
                                onRecruit={handleRecruit}
                                recruitCost={50}
                                canAfford={player.gold >= 50}
                                t={t}
                            />
                        </div>
                    )}
                    
                    {currentView === 'BATTLE' && (
                        <div className="max-w-6xl mx-auto">
                             <BattleArena onStartBattle={handleStartBattle} t={t} />
                        </div>
                    )}

                    {currentView === 'SIMULATION' && battleResult && (
                        <div className="flex flex-col gap-4 h-full">
                            <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-gray-700">
                                <h2 className="text-2xl font-bold text-white">{t('battle_simulation') || 'Battle Simulation'}</h2>
                                <div className="flex gap-4 items-center">
                                    <div className={`px-4 py-1 rounded font-bold ${battleResult.winner === 'A' ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100'}`}>
                                        {battleResult.winner === 'A' ? (t('victory') || 'VICTORY') : (t('defeat') || 'DEFEAT')}
                                    </div>
                                    <button 
                                        onClick={() => setCurrentView('BATTLE')}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold transition"
                                    >
                                        {t('back_to_arena') || 'Back to Arena'}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 bg-black rounded-xl overflow-hidden border border-gray-800 shadow-2xl relative">
                                <MiniTroopersGame 
                                    battleResult={battleResult}
                                    mySquad={player.troopers}
                                    opponentSquad={currentOpponent} 
                                />
                            </div>

                            {/* Mini Log */}
                            <div className="h-32 bg-gray-950 rounded-lg p-4 overflow-y-auto font-mono text-xs text-gray-400 border border-gray-800">
                                {battleResult.log.map((entry, idx) => (
                                    <div key={idx} className="mb-1 border-b border-gray-900 pb-1 last:border-0">
                                        <span className="text-yellow-600 mr-2">[{entry.time}]</span>
                                        <span>{entry.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentView === 'HISTORY' && (
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
                                <span className="text-gray-500">📜</span> {t('battle_history') || 'Battle History'}
                            </h2>
                            
                            {player.history && player.history.length > 0 ? (
                                <div className="space-y-4">
                                    {player.history.map(entry => (
                                        <div key={entry.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center hover:bg-gray-750 transition">
                                            <div>
                                                <div className="font-bold text-lg text-white">{entry.opponentName}</div>
                                                <div className="text-xs text-gray-500">{new Date(entry.date).toLocaleString()}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className={`px-3 py-1 rounded font-bold text-sm ${entry.result === 'VICTORY' ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>
                                                    {entry.result}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-xl">
                                    <span className="text-gray-500 text-lg">{t('no_battles_yet') || 'No battles recorded yet.'}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MiniTroopersLayout;
