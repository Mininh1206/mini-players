import React, { useEffect, useState } from 'react';
import type { TrooperData, Skill } from '@/logic/minitroopers/types';
import SkillTooltip from './SkillTooltip';
import { Weapon, Grenade, Equipment } from '@/logic/minitroopers/classes/Skill';
import { getSkillDefinition } from '@/logic/minitroopers/utils';
import { AssetPath, SvgIcon, GetWeaponIcon, GetSkillIcon } from './VectorAssets';

interface BattleInspectorProps {
    trooper: TrooperData;
    onClose: () => void;
    t: (key: string) => string;
    scene: Phaser.Scene;
}

// Live Polling Hook
const useLiveTrooperData = (scene: Phaser.Scene, initialData: TrooperData) => {
    const [data, setData] = useState(initialData);

    useEffect(() => {
        setData(initialData);
    }, [initialData.id]);

    useEffect(() => {
        const fetch = () => {
            const battleScene = scene as any;
            if (battleScene.getTrooperData) {
                const current = battleScene.getTrooperData(data.id);
                if (current) {
                    setData(prev => ({
                        ...prev,
                        ...current,
                        name: prev.name || current.name,
                        skills: prev.skills
                    }));
                }
            }
        };

        const interval = setInterval(fetch, 100);
        return () => clearInterval(interval);
    }, [scene, data.id]);

    return data;
};

// Check if weapon is melee (infinite/no ammo)
const isMeleeWeapon = (w: Weapon): boolean => {
    const id = w.id?.toLowerCase() || '';
    return id === 'fists' || id.includes('knife') || id.includes('sword') ||
        w.capacity === Infinity || !isFinite(w.capacity || 0) || w.capacity === 0;
};

const AmmoBar = ({ current, capacity, reserve, isEquipped, isSabotaged }: { current: number, capacity: number, reserve?: number, isEquipped: boolean, isSabotaged?: boolean }) => {
    const safeCapacity = (!isFinite(capacity) || capacity < 0 || capacity > 100) ? 0 : Math.floor(capacity);
    const safeCurrent = Math.min(Math.max(0, current || 0), safeCapacity);
    const safeReserve = Math.max(0, reserve || 0);

    if (safeCapacity === 0) return null;

    return (
        <div className={`flex items-center gap-0.5 p-1 rounded border w-full h-full relative overflow-hidden transition-all
            ${isEquipped ? 'bg-gradient-to-r from-[#3a4a6c] to-[#4a5a7c] border-yellow-500/60 shadow-[0_0_8px_rgba(234,179,8,0.3)]' : 'bg-[#3a4568] border-white/10'}
            ${isSabotaged ? 'border-red-500/70 bg-red-900/30' : ''}
        `}>
            <div className="flex gap-[1px] items-center min-w-[40px] h-full">
                {Array.from({ length: safeCapacity }).map((_, i) => (
                    <div
                        key={`mag-${i}`}
                        className={`flex-1 h-4 rounded-[2px] border border-black/40
                            ${i < safeCurrent ? 'bg-gradient-to-b from-yellow-300 to-yellow-500 shadow-[0_0_3px_#fbbf24]' : 'bg-gray-700/60'}
                        `}
                        style={{ maxWidth: '7px' }}
                    />
                ))}
            </div>

            {isSabotaged && (
                <span className="text-[10px] font-black text-red-400 bg-red-900/80 px-1 py-0.5 rounded animate-pulse absolute right-0.5 top-1/2 -translate-y-1/2 z-10 border border-red-500/50">
                    SAB!
                </span>
            )}

            {safeReserve > 0 && (
                <div className="flex flex-wrap gap-[1px] ml-0.5 opacity-70 flex-1 h-full items-center border-l border-white/10 pl-1">
                    {Array.from({ length: Math.min(15, Math.ceil(safeReserve / Math.max(1, safeCapacity / 3))) }).map((_, i) => (
                        <div key={`res-${i}`} className="w-[3px] h-[5px] bg-yellow-700/80 rounded-[1px] border border-black/20" />
                    ))}
                    {safeReserve > 15 && <span className="text-[8px] text-yellow-600 ml-0.5 font-bold">+{safeReserve}</span>}
                </div>
            )}
        </div>
    );
};

const MeleeDisplay = ({ isEquipped, isSabotaged }: { isEquipped: boolean, isSabotaged?: boolean }) => (
    <div className={`flex items-center justify-center p-1 rounded border w-full h-full transition-all text-[10px] font-bold text-white/60
        ${isEquipped ? 'bg-gradient-to-r from-[#3a4a6c] to-[#4a5a7c] border-yellow-500/60' : 'bg-[#3a4568] border-white/10'}
        ${isSabotaged ? 'border-red-500/70 bg-red-900/30' : ''}
    `}>
        MELEE
        {isSabotaged && <span className="ml-1 text-red-400 animate-pulse">SAB!</span>}
    </div>
);

const BattleInspector: React.FC<BattleInspectorProps> = ({ trooper: initialTrooper, onClose, t, scene }) => {
    const trooper = useLiveTrooperData(scene, initialTrooper);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    // Categorize skills
    const weapons: Weapon[] = [];
    const consumables: (Grenade | Equipment)[] = [];
    const passiveSkills: Skill[] = [];

    trooper.skills.forEach(s => {
        if (s.id === 'fists') return; // Fists is innate, never show
        const def = getSkillDefinition(s.id);
        const full = def ? { ...def, ...s } : s;

        if (def instanceof Weapon) {
            weapons.push(full as Weapon);
        } else if (def instanceof Grenade || def instanceof Equipment) {
            consumables.push(full as Grenade | Equipment);
        } else {
            passiveSkills.push(full);
        }
    });

    // Sort weapons - equipped first
    weapons.sort((a, b) => {
        if (a.id === trooper.currentWeaponId) return -1;
        if (b.id === trooper.currentWeaponId) return 1;
        return 0;
    });

    // Bottom grid: ALL skills (passives + weapons + consumables) - everything appears here
    const allSkillsForGrid: Skill[] = [...passiveSkills, ...weapons, ...consumables];

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <div
                className={`
                    bg-gradient-to-b from-[#7090b8] to-[#5a7a9c] border-[3px] border-[#8aa0c0] rounded-xl w-[450px] shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_0_1px_rgba(0,0,0,0.3)] 
                    relative pointer-events-auto transition-all duration-300 transform font-sans flex flex-col overflow-hidden
                    ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                `}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#4a5b7c] to-[#5a6b8c] px-3 py-2 border-b-2 border-black/20 flex justify-between items-center h-10 shadow-lg">
                    <span className="font-bold text-white text-sm drop-shadow-md flex items-center gap-2">
                        <span className="text-[#b0c0d8] text-[10px] uppercase tracking-wider font-bold bg-black/20 px-1.5 py-0.5 rounded">{trooper.class}</span>
                        <span className="text-shadow-lg">{trooper.name || 'Unknown'}</span>
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-[#fbbf24] font-black text-xs drop-shadow-md bg-black/30 px-2 py-1 rounded border border-yellow-500/30">
                            niv.{trooper.level}
                        </span>
                        <button
                            onClick={onClose}
                            className="w-6 h-6 bg-gradient-to-b from-[#c23b3b] to-[#a02020] text-white rounded shadow-md hover:from-red-500 hover:to-red-600 text-sm font-bold leading-none flex items-center justify-center border border-white/20 transition-all"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-2 flex flex-col gap-2">

                    {/* Consumables Row (Top) - with quantity */}
                    {consumables.length > 0 && (
                        <div className="flex gap-1 flex-wrap bg-[#5a7098]/50 rounded p-1.5 border border-black/10">
                            {consumables.map((c, i) => {
                                const isGrenade = c instanceof Grenade || (c as any).damage !== undefined;
                                const quantity = (c as any).capacity || (c as any).count || 1;
                                return (
                                    <SkillTooltip key={`cons-${i}`} skill={c} t={t}>
                                        <div className={`w-9 h-9 rounded border flex items-center justify-center cursor-help transition-all hover:scale-110 hover:z-10 relative
                                            ${isGrenade
                                                ? 'bg-gradient-to-b from-[#8b4513] to-[#654321] border-orange-600/50'
                                                : 'bg-gradient-to-b from-[#2d5a27] to-[#1a3a15] border-green-600/50'
                                            }
                                        `}>
                                            <div className="text-white drop-shadow-md">
                                                {GetSkillIcon(c.id, 20)}
                                            </div>
                                            {quantity > 1 && (
                                                <div className="absolute -bottom-1 -right-1 text-[9px] bg-black/80 text-white px-1 rounded font-bold border border-white/20">
                                                    x{quantity}
                                                </div>
                                            )}
                                        </div>
                                    </SkillTooltip>
                                );
                            })}
                        </div>
                    )}

                    {/* Weapons List */}
                    {weapons.length > 0 && (
                        <div className="flex flex-col gap-1 bg-[#5a7098]/50 rounded p-1.5 border border-black/10">
                            {weapons.map(w => {
                                const isEquipped = trooper.currentWeaponId === w.id;
                                const isSabotaged = trooper.sabotagedWeapons?.includes(w.id);
                                const isMelee = isMeleeWeapon(w);

                                return (
                                    <SkillTooltip key={w.id} skill={w} t={t} weaponStatus={isSabotaged ? 'sabotaged' : undefined}>
                                        <div className={`
                                            flex items-center gap-2 p-1 rounded border-2 transition-all h-10
                                            ${isEquipped ? 'bg-gradient-to-r from-[#4a5b7c] to-[#5a6b8c] border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-[#4a5568]/60 border-transparent hover:border-white/20'}
                                            ${isSabotaged ? 'border-red-500 bg-red-900/30' : ''}
                                        `}>
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-sm
                                                ${isEquipped ? 'text-yellow-300 bg-black/30' : 'text-white/80 bg-black/20'}
                                            `}>
                                                {GetWeaponIcon(w.id, 20)}
                                            </div>
                                            <div className="flex-1 h-8">
                                                {isMelee ? (
                                                    <MeleeDisplay isEquipped={isEquipped} isSabotaged={isSabotaged} />
                                                ) : (
                                                    <AmmoBar
                                                        current={trooper.ammo?.[w.id] ?? w.capacity ?? 0}
                                                        capacity={w.capacity || 1}
                                                        reserve={trooper.reserves?.[w.id]}
                                                        isEquipped={isEquipped}
                                                        isSabotaged={isSabotaged}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </SkillTooltip>
                                );
                            })}
                        </div>
                    )}

                    {/* Bottom: Body Status + ALL Skills BENTO Grid */}
                    <div className="bg-[#5a7098]/50 rounded p-1.5 border border-black/10">
                        <div
                            className="grid gap-1"
                            style={{
                                gridTemplateColumns: 'repeat(8, 1fr)',
                                gridAutoRows: '36px'
                            }}
                        >
                            {/* Body Status Panel (2x2) */}
                            <div
                                className="bg-gradient-to-b from-[#4a5a7c] to-[#3a4a6c] rounded border border-white/10 relative flex flex-col shadow-inner"
                                style={{ gridColumn: 'span 2', gridRow: 'span 2' }}
                            >
                                <div className="absolute left-1.5 top-1.5 bottom-1.5 w-3 bg-[#1d2632] rounded-sm overflow-hidden border border-white/10 shadow-inner">
                                    <div
                                        className="w-full absolute bottom-0 bg-gradient-to-t from-[#c23b3b] via-[#eab308] to-[#22c55e] transition-all duration-300"
                                        style={{ height: `${Math.min(100, (trooper.attributes.hp / trooper.attributes.maxHp) * 100)}%` }}
                                    />
                                </div>

                                <div className="flex-1 flex items-center justify-center ml-4 relative">
                                    <div className={`text-[#1d2632]/60 drop-shadow-sm transition-colors ${trooper.wounds?.chest || trooper.wounds?.head ? 'text-red-500/40' : ''}`}>
                                        <SvgIcon path={AssetPath.Silhouette} size={44} />
                                    </div>
                                </div>

                                <div className="absolute bottom-1 right-1.5 text-[10px] font-black text-white/90 leading-tight text-right drop-shadow-md">
                                    {Math.ceil(trooper.attributes.hp)}
                                    <span className="text-white/50 text-[9px]">/{trooper.attributes.maxHp}</span>
                                </div>
                            </div>

                            {/* ALL Skills Grid - passives, weapons, consumables appear here */}
                            {allSkillsForGrid.map((s, i) => {
                                const def = getSkillDefinition(s.id);
                                const isWeapon = def instanceof Weapon;
                                const isConsumable = def instanceof Grenade || def instanceof Equipment;
                                const levelOrQty = isConsumable ? ((s as any).capacity || 1) : (s.level || 0);

                                return (
                                    <SkillTooltip key={`grid-${i}`} skill={s} t={t}>
                                        <div className={`w-full h-full border border-white/10 rounded flex items-center justify-center hover:border-yellow-400 hover:z-10 cursor-help transition-all group relative overflow-hidden shadow-sm
                                            ${isWeapon
                                                ? 'bg-gradient-to-b from-[#5a4a6c] to-[#4a3a5c]'
                                                : isConsumable
                                                    ? 'bg-gradient-to-b from-[#6a5532] to-[#4a3a22]'
                                                    : 'bg-gradient-to-b from-[#4a5a7c] to-[#3a4a6c]'
                                            }
                                            hover:from-[#5a6a8c] hover:to-[#4a5a7c]
                                        `}>
                                            <div className="text-white/90 group-hover:text-yellow-300 transition-colors drop-shadow-sm">
                                                {GetSkillIcon(s.id, 20)}
                                            </div>
                                            {levelOrQty > 1 && (
                                                <div className="absolute top-0 right-0 text-[7px] bg-black/70 text-white px-0.5 leading-tight rounded-bl font-bold">
                                                    {isConsumable ? `x${levelOrQty}` : levelOrQty}
                                                </div>
                                            )}
                                        </div>
                                    </SkillTooltip>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BattleInspector;
