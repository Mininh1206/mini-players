import { calculateSquadPower } from '@/logic/minitroopers/combat';
import type { Trooper } from '@/logic/minitroopers/types';

interface BattleArenaProps {
    onStartBattle: (opponentName: string) => void;
    t: (key: any) => string;
    playerPower?: number;
    getCampaignOpponent?: (stage: number) => Trooper[];
}

const BattleArena: React.FC<BattleArenaProps> = ({ onStartBattle, t, playerPower = 0, getCampaignOpponent }) => {
    return (
        <div className="flex flex-col h-full gap-8">
            <h2 className="text-4xl font-black text-white px-2 tracking-tight">{t('battle_arena')}</h2>
            
            {/* Special Ops Section */}
            <div>
                <h3 className="text-2xl font-bold text-blue-400 mb-4 px-2 uppercase tracking-widest border-b border-blue-900/50 pb-2">{t('special_ops')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Easy Money */}
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-yellow-500 transition cursor-pointer group relative overflow-hidden" onClick={() => onStartBattle('easy_money')}>
                        <div className="absolute -right-4 -top-4 text-8xl opacity-10 group-hover:scale-110 transition duration-500 text-yellow-500">💰</div>
                        <h4 className="text-xl font-bold text-white mb-2">{t('battle_training_dummy')}</h4>
                        <p className="text-gray-400 text-sm mb-4 relative z-10">{t('battle_training_dummy_desc')}</p>
                        <div className="flex justify-between items-center text-xs font-bold">
                             <span className="text-gray-500">{t('power')}: 1</span>
                             <span className="text-yellow-400">{t('reward')}: 500 💰</span>
                        </div>
                    </div>

                    {/* Rats Swarm */}
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-green-500 transition cursor-pointer group relative overflow-hidden" onClick={() => onStartBattle('progressive_rats')}>
                        <div className="absolute -right-4 -top-4 text-8xl opacity-10 group-hover:scale-110 transition duration-500 text-green-500">🐀</div>
                        <h4 className="text-xl font-bold text-white mb-2">{t('battle_rats_swarm')}</h4>
                        <p className="text-gray-400 text-sm mb-4 relative z-10">{t('battle_rats_swarm_desc')}</p>
                         <div className="flex justify-between items-center text-xs font-bold">
                             <span className="text-gray-500">{t('power')}: ~{Math.floor(playerPower * 0.5)}</span>
                             <span className="text-green-400">{t('reward')}: Scale 💰</span>
                        </div>
                    </div>

                    {/* Rival Squad */}
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-red-500 transition cursor-pointer group relative overflow-hidden" onClick={() => onStartBattle('progressive_troopers')}>
                        <div className="absolute -right-4 -top-4 text-8xl opacity-10 group-hover:scale-110 transition duration-500 text-red-500">⚔️</div>
                        <h4 className="text-xl font-bold text-white mb-2">{t('battle_progressive_squad')}</h4>
                        <p className="text-gray-400 text-sm mb-4 relative z-10">{t('battle_progressive_squad_desc')}</p>
                         <div className="flex justify-between items-center text-xs font-bold">
                             <span className="text-red-400">{t('challenge')} ({t('power')}: ~{Math.floor(playerPower * 1.2)})</span>
                             <span className="text-blue-400">{t('reward')}: High 💰</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Campaign Section */}
            <div className="flex-1">
                <h3 className="text-2xl font-bold text-purple-400 mb-4 px-2 uppercase tracking-widest border-b border-purple-900/50 pb-2">{t('campaign')}</h3>
                <p className="text-gray-400 px-2 mb-6">{t('campaign_desc')}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array(20).fill(null).map((_, idx) => {
                        const stage = idx + 1;
                        const opponent = getCampaignOpponent ? getCampaignOpponent(stage) : [];
                        const power = calculateSquadPower(opponent);
                        
                        return (
                            <div 
                                key={stage}
                                onClick={() => onStartBattle(`campaign_${stage}`)}
                                className="bg-gray-900 p-4 rounded-lg border border-gray-800 hover:border-purple-500 hover:bg-gray-800 transition cursor-pointer flex flex-col justify-between"
                            >
                                <div>
                                    <div className="text-xs text-purple-500 font-bold mb-1">STAGE {stage}</div>
                                    <div className="font-bold text-white text-sm mb-2">{t(`mission_${stage}`)}</div>
                                    <div className="text-xs text-gray-500 mb-3 leading-tight">{t(`mission_${stage}_desc`)}</div>
                                </div>
                                
                                <div className="mt-auto pt-2 border-t border-gray-800 flex justify-between items-end">
                                    <div className="text-xs text-gray-400">
                                        ⚡ {power}
                                    </div>
                                    <div className="text-xs font-bold text-yellow-500">
                                        {stage * 50} 💰
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BattleArena;
