import React from 'react';
import { useTranslation } from '@/logic/minitroopers/i18n';

interface BattleArenaProps {
    onStartBattle: (opponentName: string) => void;
    t: (key: any) => string;
}

const OpponentCard: React.FC<{ name: string; power: number; onClick: () => void; t: (key: any) => string }> = ({ name, power, onClick, t }) => {
    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-red-500 hover:bg-gray-750 transition cursor-pointer flex justify-between items-center group" onClick={onClick}>
            <div>
                <div className="font-bold text-white group-hover:text-red-400 transition">{name}</div>
                <div className="text-sm text-gray-400">{t('power')}: {power}</div>
            </div>
            <button className="px-4 py-2 bg-red-900 text-red-100 rounded border border-red-700 group-hover:bg-red-600 group-hover:text-white transition">
                {t('attack')}
            </button>
        </div>
    );
};

const BattleArena: React.FC<BattleArenaProps> = ({ onStartBattle, t }) => {
    return (
        <div className="flex flex-col h-full">
            <h2 className="text-4xl font-black text-white mb-8 tracking-tight">{t('battle_arena')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
                {/* PvE Mission */}
                <div className="bg-gradient-to-br from-green-900 to-green-800 p-8 rounded-2xl border border-green-700 shadow-xl relative overflow-hidden group cursor-pointer transition-transform hover:scale-105" onClick={() => onStartBattle('Mission: Infiltration')}>
                    <div className="absolute top-0 right-0 p-4 opacity-20 text-8xl group-hover:scale-110 transition duration-500">🌲</div>
                    <h3 className="text-3xl font-bold text-white mb-3">{t('mission_infiltration')}</h3>
                    <p className="text-green-200 mb-6 text-lg">{t('mission_infiltration_desc')}</p>
                    <div className="inline-block px-4 py-2 bg-black bg-opacity-30 rounded-lg text-green-100 font-bold">{t('reward')}: 10 💰</div>
                </div>

                {/* Raid Mission */}
                <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-8 rounded-2xl border border-purple-700 shadow-xl relative overflow-hidden group cursor-pointer transition-transform hover:scale-105" onClick={() => onStartBattle('Mission: Raid')}>
                     <div className="absolute top-0 right-0 p-4 opacity-20 text-8xl group-hover:scale-110 transition duration-500">🏰</div>
                    <h3 className="text-3xl font-bold text-white mb-3">{t('mission_raid')}</h3>
                    <p className="text-purple-200 mb-6 text-lg">{t('mission_raid_desc')}</p>
                     <div className="inline-block px-4 py-2 bg-black bg-opacity-30 rounded-lg text-purple-100 font-bold">{t('reward')}: 100 💰</div>
                </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-300 mb-6 border-b border-gray-700 pb-2">{t('select_opponent')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <OpponentCard name="Training: Rats" power={5} onClick={() => onStartBattle('Training: Rats')} t={t} />
                <OpponentCard name="Training: Recruits" power={10} onClick={() => onStartBattle('Training: Recruits')} t={t} />
                <OpponentCard name="Army of Darkness" power={45} onClick={() => onStartBattle('Army of Darkness')} t={t} />
                <OpponentCard name="The Peacekeepers" power={52} onClick={() => onStartBattle('The Peacekeepers')} t={t} />
                <OpponentCard name="Random Noobs" power={30} onClick={() => onStartBattle('Random Noobs')} t={t} />
                
                {/* Advanced Opponents */}
                <OpponentCard name="The Elite Guard" power={60} onClick={() => onStartBattle('The Elite Guard')} t={t} />
                <OpponentCard name="Special Forces" power={75} onClick={() => onStartBattle('Special Forces')} t={t} />
                <OpponentCard name="Cyber Command" power={90} onClick={() => onStartBattle('Cyber Command')} t={t} />
                <OpponentCard name="Shadow Ops" power={110} onClick={() => onStartBattle('Shadow Ops')} t={t} />
                <OpponentCard name="The Immortals" power={150} onClick={() => onStartBattle('The Immortals')} t={t} />
            </div>
        </div>
    );
};

export default BattleArena;
