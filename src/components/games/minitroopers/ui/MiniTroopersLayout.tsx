
import React, { useState, useEffect } from 'react';
import { Sandbox } from './Sandbox';
import TrooperCard from './TrooperCard';
import TrooperProfile from './TrooperProfile';
import BattleArena from './BattleArena';
import RecruitmentCenter from './RecruitmentCenter';
import type { Trooper, BattleResult, Player, BattleHistoryEntry } from '@/logic/minitroopers/types';
import { useTranslation } from '@/logic/minitroopers/i18n';
import { simulateBattle, calculateSquadPower } from '@/logic/minitroopers/combat';
import MiniTroopersGame from '@/components/games/minitroopers/MiniTroopersGame';
import { saveGame, loadGame } from '@/logic/minitroopers/storage';
import { generateRandomTrooper, generateRat, generateSpecificTrooper, recalculateTrooperHp } from '@/logic/minitroopers/generators';
import { getRandomSkill, getSkillsByLevel } from '@/logic/minitroopers/skills';
import { v4 as uuidv4 } from 'uuid';

// MOCK OPPONENTS REMOVED - Using Dynamic Generation


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
                // Migration: Recalculate HP for all troopers to ensure consistency
                savedState.troopers = savedState.troopers.map(t => recalculateTrooperHp(t));
                
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

    const getCampaignOpponent = (stage: number): Trooper[] => {
        // Progression Logic:
        // Tier 1: 1-5 (Rats) - Levels 1-3. Squad size 1->4.
        // Tier 2: 6-10 (Recruits/Soldiers) - Levels 2-4. Squad size 2->5.
        // Tier 3: 11-15 (Specialists) - Levels 4-6. Squad size 4->5.
        // Tier 4: 16-20 (Elites) - Levels 7-12. Squad size 5->8.

        switch (stage) {
            // Tier 1: Rats (Tutorial) - Low Power
            case 1: return [generateRat(1)]; // Power ~20
            case 2: return [generateRat(1), generateRat(1)]; // Power ~40
            case 3: return [generateRat(2), generateRat(1), generateRat(1)]; // Power ~70
            case 4: return [generateRat(2), generateRat(2), generateRat(2)]; // Power ~90
            case 5: return [generateRat(3), generateRat(3), generateRat(2), generateRat(2)]; // Power ~140 (Boss of Tier 1)
            
            // Tier 2: The Army (Recruits) - significantly stronger than Rats
            case 6: return [generateSpecificTrooper('Recruit', 3), generateSpecificTrooper('Recruit', 3)]; // Power ~150 (2 stronger units > 4 weak rats)
            case 7: return [generateSpecificTrooper('Recruit', 4), generateSpecificTrooper('Soldier', 3), generateSpecificTrooper('Recruit', 3)]; // Power ~200
            case 8: return [generateSpecificTrooper('Soldier', 4), generateSpecificTrooper('Soldier', 4), generateSpecificTrooper('Doctor', 3)]; // Power ~250
            case 9: return [generateSpecificTrooper('Soldier', 5), generateSpecificTrooper('Soldier', 5), generateSpecificTrooper('Sniper', 4), generateSpecificTrooper('Recruit', 4)]; // Power ~300
            case 10: return [generateSpecificTrooper('Commando', 5), generateSpecificTrooper('Doctor', 5), generateSpecificTrooper('Soldier', 5), generateSpecificTrooper('Soldier', 5)]; // Power ~350
            
            // Tier 3: Special Forces - High Skill
            case 11: return [generateSpecificTrooper('Soldier', 6), generateSpecificTrooper('Soldier', 6), generateSpecificTrooper('Sniper', 6), generateSpecificTrooper('Doctor', 5)]; // Power ~450
            case 12: return [generateSpecificTrooper('Commando', 6), generateSpecificTrooper('Commando', 6), generateSpecificTrooper('Scout', 6), generateSpecificTrooper('Soldier', 6)]; // Power ~500
            case 13: return [generateSpecificTrooper('Spy', 7), generateSpecificTrooper('Saboteur', 7), generateSpecificTrooper('Soldier', 7), generateSpecificTrooper('Soldier', 7), generateSpecificTrooper('Doctor', 6)]; // Power ~600
            case 14: return [generateSpecificTrooper('Pilot', 7), generateSpecificTrooper('Pilot', 7), generateSpecificTrooper('Pilot', 7), generateSpecificTrooper('Pilot', 7), generateSpecificTrooper('Soldier', 7)]; // Power ~700
            case 15: return [generateSpecificTrooper('Sniper', 8), generateSpecificTrooper('Sniper', 8), generateSpecificTrooper('Soldier', 8), generateSpecificTrooper('Soldier', 8), generateSpecificTrooper('Comms Officer', 8)]; // Power ~800

            // Tier 4: Legends - Impossible?
            case 16: 
                     // Using 'Commando' as tanky proxy since 'Heavy Tank' is not a valid class.
                     return [generateSpecificTrooper('Commando', 9), generateSpecificTrooper('Commando', 9), generateSpecificTrooper('Doctor', 9), generateSpecificTrooper('Comms Officer', 9), generateSpecificTrooper('Soldier', 9)]; 
            case 17: return [generateSpecificTrooper('Commando', 10), generateSpecificTrooper('Commando', 10), generateSpecificTrooper('Commando', 10), generateSpecificTrooper('Spy', 10), generateSpecificTrooper('Spy', 10)]; // Power ~1000
            case 18: return [generateSpecificTrooper('Sniper', 11), generateSpecificTrooper('Sniper', 11), generateSpecificTrooper('Sniper', 11), generateSpecificTrooper('Scout', 11), generateSpecificTrooper('Scout', 11), generateSpecificTrooper('Saboteur', 11)]; // Power ~1200
            case 19: return [generateSpecificTrooper('Soldier', 12), generateSpecificTrooper('Soldier', 12), generateSpecificTrooper('Soldier', 12), generateSpecificTrooper('Doctor', 12), generateSpecificTrooper('Comms Officer', 12), generateSpecificTrooper('Commando', 12)]; // Power ~1400
            case 20: return [generateSpecificTrooper('Soldier', 13), generateSpecificTrooper('Soldier', 13), generateSpecificTrooper('Soldier', 13), generateSpecificTrooper('Soldier', 13), generateSpecificTrooper('Soldier', 13), generateSpecificTrooper('Soldier', 13), generateSpecificTrooper('Soldier', 13), generateSpecificTrooper('Soldier', 13)]; // The Final Stand (Army of 8) ~2000
            
            default: return [generateRat(1)];
        }
    };

    const generateOpponent = (type: string, playerPower: number): Trooper[] => {
        if (type.startsWith('campaign_')) {
            const stage = parseInt(type.split('_')[1]);
            return getCampaignOpponent(stage);
        } else if (type === 'easy_money') {
            // Very weak, high reward
            return [
                { id: 'dummy1', name: 'Training Dummy', class: 'Recruit', team: 'B', isDead: false, skills: [], level: 1, attributes: { hp: 10, maxHp: 10, initiative: 1, range: 1, damage: 0, aim: 0, dodge: 0, armor: 0, critChance: 0, speed: 10 }, ammo: {}, cooldown: 0, disarmed: [] },
                { id: 'dummy2', name: 'Training Dummy', class: 'Recruit', team: 'B', isDead: false, skills: [], level: 1, attributes: { hp: 10, maxHp: 10, initiative: 1, range: 1, damage: 0, aim: 0, dodge: 0, armor: 0, critChance: 0, speed: 10 }, ammo: {}, cooldown: 0, disarmed: [] }
            ];
        } else if (type === 'progressive_rats') {
            // Rats Swarm: 2 Rats + 1 per 50 power
            const count = Math.min(2 + Math.floor(playerPower / 50), 12);
            return Array(count).fill(null).map(() => generateRat(1));
        } else if (type === 'progressive_troopers') {
            // Rival Squad: +20% Power Challenge
            const targetPower = Math.floor(playerPower * 1.2);
            const squadSize = player?.troopers.length || 3;
            const avgLevel = (player?.troopers.reduce((sum, t) => sum + t.level, 0) || 3) / squadSize;
            // Generate roughly matching level, maybe +1
            return Array(squadSize).fill(null).map(() => generateRandomTrooper(Math.max(1, Math.floor(avgLevel * 1.1))));
        }
        return [generateSpecificTrooper('Recruit', 1)];
    };

    const handleStartBattle = (battleType: string) => {
        if (!player) return;
        
        const myPower = calculateSquadPower(player.troopers);
        const opponentSquad = generateOpponent(battleType, myPower);
        
        
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
                    opponentName: battleType, // Use Type as name for now, or map to localised string

                    result: (result.winner === 'A' ? 'VICTORY' : 'DEFEAT') as 'VICTORY' | 'DEFEAT',
                    log: result.log,
                    mySquadSnapshot: mySquad,
                    opponentSquadSnapshot: enemySquad
                },
                ...(prev.history || [])
            ].slice(0, 20); // Keep last 20 battles

            let newGold = prev.gold;
            if (result.winner === 'A') {
            if (result.winner === 'A') {
                let reward = 10;
                if (battleType === 'easy_money') reward = 500;
                else if (battleType === 'progressive_rats') reward = 10 + Math.floor(myPower / 10);
                else if (battleType === 'progressive_troopers') reward = 30 + Math.floor(myPower / 4);
                else if (battleType.startsWith('campaign_')) {
                    const stage = parseInt(battleType.split('_')[1]);
                    reward = stage * 50; // 50, 100, 150...
                }
                newGold += reward;
            }
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

                        let updatedTrooper: Trooper = {
                            ...t,
                            level: t.level + 1,
                            class: newClass,
                            skills: newSkills,
                            ammo: newAmmo,
                            pendingChoices: undefined
                        };

                        // Recalculate HP correctly based on new level and skills
                        return recalculateTrooperHp(updatedTrooper);
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
        const baseCost = 50;
        const count = player.troopers.length;
        // Exponential cost: 50 * (1.5 ^ count)
        const cost = Math.floor(baseCost * Math.pow(1.5, count));
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
                        <div className="text-blue-400 font-bold text-xs mt-1">Power: {calculateSquadPower(player.troopers)} ⚡</div>
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
                                upgradeCostCalculator={(level) => Math.floor(5 * Math.pow(1.3, level))}
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
                                recruitCostCalculator={(count) => Math.floor(50 * Math.pow(1.5, count))}
                                currentCount={player.troopers.length}
                                canAfford={(cost) => player.gold >= cost}
                                t={t}
                            />
                        </div>
                    )}
                    
                    {currentView === 'BATTLE' && (
                        <div className="max-w-6xl mx-auto">
                            <BattleArena 
                                onStartBattle={handleStartBattle}
                                t={t} 
                                playerPower={calculateSquadPower(player.troopers)}
                                getCampaignOpponent={getCampaignOpponent}
                             />
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
                                    mySquad={currentView === 'SIMULATION' && battleResult ? (battleResult as any).mySquadSnapshot || player.troopers : player.troopers}
                                    opponentSquad={currentView === 'SIMULATION' && battleResult ? (battleResult as any).opponentSquadSnapshot || currentOpponent : currentOpponent} 
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
                                                {entry.mySquadSnapshot && entry.opponentSquadSnapshot && (
                                                    <button 
                                                        onClick={() => {
                                                            setBattleResult({
                                                                winner: entry.result === 'VICTORY' ? 'A' : 'B', // Approximate, logic might be needed if draw
                                                                log: entry.log,
                                                                survivorsA: [], // Not needed for replay usually
                                                                survivorsB: [],
                                                                // Attach snapshots to result-like object or handle via separate state?
                                                                // Let's cheat and attach to battleResult state which is passed to game
                                                                ...({ mySquadSnapshot: entry.mySquadSnapshot, opponentSquadSnapshot: entry.opponentSquadSnapshot } as any)
                                                            } as any);
                                                            // We need to set currentOpponent to avoid "opponent not found" errors/mocks if we used them? 
                                                            // Actually MiniTroopersGame uses props. 
                                                            // But we need to ensure the game component receives these.
                                                            // See change above in SIMULATION view for how we pass props.
                                                            setCurrentView('SIMULATION');
                                                        }}
                                                        className="px-3 py-1 bg-blue-900/50 text-blue-400 border border-blue-800 rounded font-bold text-sm hover:bg-blue-800 hover:text-white transition"
                                                    >
                                                        ▶ {t('replay') || 'Replay'}
                                                    </button>
                                                )}
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
