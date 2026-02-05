import type { TrooperData, BattleResult, BattleLogEntry, BattleContext } from './types';
import { Trooper } from './classes/Trooper';
import { getDeploymentLimit, getDeploymentCost } from './deployment';
import { skillManager } from './systems/SkillSystem';
import { registerCoreSkills } from './skills/implementations';
import { AISystem } from './systems/AISystem';
import { TrooperStateSystem } from './systems/TrooperStateSystem';
import { CombatSystem } from './systems/CombatSystem';

// Initialize Skills
registerCoreSkills();

export const SKILLS = {
    TRIGGER_HAPPY: 'trigger_happy',
    SNIPER: 'sniper',
    DOCTOR: 'doctor',
    SPRINTER: 'sprinter',
    HARDY: 'hardy',
    TANK: 'tank',
    DODGE_MASTER: 'dodge_master',
    EAGLE_EYE: 'eagle_eye',
    COMMANDO: 'commando',
    SMART: 'smart',
    SNIPER_TRAINING: 'sniper_training',
    SPEEDY: 'speedy',
    TWINOID: 'twinoid',
};

export const calculateSquadPower = (squad: Trooper[]): number => {
    return squad.reduce((total, t) => total + t.getPower(), 0);
};

export function simulateBattle(teamA: Trooper[], teamB: Trooper[]): BattleResult {
    const reserveA = teamA.map(t => t.clone());
    const reserveB = teamB.map(t => t.clone());

    const jammedWeapons = new Map<string, string[]>();
    const log: BattleLogEntry[] = [];
    
    // Systems
    const aiSystem = new AISystem();
    const stateSystem = new TrooperStateSystem();
    const combatSystem = new CombatSystem();

    const initialContext: BattleContext = {
        time: 0,
        turn: 0,
        log,
        allTroopers: [...reserveA, ...reserveB],
        deployedA: [], 
        deployedB: [],
        reserveA: reserveA,
        reserveB: reserveB,
        jammedWeapons
    };
    
    reserveA.forEach(t => {
        t.recalculateStats();
        skillManager.applyStatModifiers(t);
        skillManager.executeOnBattleStart(t, initialContext as any);
    });
    reserveB.forEach(t => {
        t.recalculateStats();
        skillManager.applyStatModifiers(t);
        skillManager.executeOnBattleStart(t, initialContext as any);
    });

    const deployedA: Trooper[] = [];
    const deployedB: Trooper[] = [];
    const limitA = getDeploymentLimit(teamA);
    const limitB = getDeploymentLimit(teamB);

    const deploy = (reserve: Trooper[], deployed: Trooper[], limit: number, log: BattleLogEntry[], time: number, team: 'A' | 'B') => {
        let currentCost = deployed.filter(t => !t.isDead).reduce((sum, t) => sum + getDeploymentCost(t), 0);
        while (reserve.length > 0) {
            const nextTrooper = reserve[0];
            const cost = getDeploymentCost(nextTrooper);
            if (currentCost + cost <= limit) {
                const trooper = reserve.shift()!;
                const isSpy = trooper.skills.some(s => s.id === 'spy');
                const isTeamA = (team === 'A');
                const deployOnA = isSpy ? !isTeamA : isTeamA;

                if (!trooper.position) {
                    trooper.position = {
                        x: deployOnA ? Math.floor(Math.random() * 200) : 800 + Math.floor(Math.random() * 200),
                        y: 50 + Math.floor(Math.random() * 300)
                    };
                }
                
                trooper.recoveryTime = 0;
                trooper.actionTimer = Math.floor(Math.random() * 500);
                trooper.ammo = {};
                trooper.state = { type: 'IDLE' }; // Initialize State
                trooper.skills.forEach(s => {
                    if ((s as any).capacity) trooper.ammo![s.id] = (s as any).capacity;
                });

                deployed.push(trooper);
                currentCost += cost;

                skillManager.executeOnDeploy(trooper, { 
                    ...initialContext, 
                    time, 
                    turn: time, 
                    allTroopers: [...deployedA, ...deployedB],
                    deployedA,
                    deployedB
                });

                let msg = `${trooper.name} enters the battlefield!`;
                if (trooper.vehicle) msg = `${trooper.name} rolls out in a ${trooper.vehicle.name}!`;
                
                log.push({
                    time, actorId: trooper.id, actorName: trooper.name, action: 'deploy', message: msg,
                    targetPosition: { ...trooper.position },
                    data: { 
                        attributes: { ...trooper.attributes },
                        maxHp: trooper.attributes.maxHp, 
                        hp: trooper.attributes.hp,
                        vehicle: trooper.vehicle ? { ...trooper.vehicle } : undefined
                    }
                });
            } else {
                break;
            }
        }
    };
    
    let time = 0;
    const maxTime = 10000;

    [...reserveA, ...reserveB].forEach(t => t.currentWeaponId = undefined);

    deploy(reserveA, deployedA, limitA, log, 0, 'A');
    deploy(reserveB, deployedB, limitB, log, 0, 'B');

    [...deployedA, ...deployedB].forEach(t => {
        t.actionTimer = Math.floor(Math.random() * 500);
        t.recoveryTime = 0;
    });

    // --- MAIN LOOP ---
    while ((deployedA.length > 0 || reserveA.length > 0) && (deployedB.length > 0 || reserveB.length > 0) && time <= maxTime) {
        time++;
        
        deploy(reserveA, deployedA, limitA, log, time, 'A');
        deploy(reserveB, deployedB, limitB, log, time, 'B');

        const allTroopers = [...deployedA, ...deployedB].filter(t => !t.isDead);
        if (allTroopers.length === 0) break;

        const context: BattleContext = {
            time,
            turn: time,
            log,
            allTroopers,
            deployedA,
            deployedB,
            reserveA,
            reserveB,
            jammedWeapons
        };

        for (const actor of allTroopers) {
            if (actor.isDead) continue;

            if (actor.recoveryTime && actor.recoveryTime > 0) {
                 actor.recoveryTime--;
                 continue;
            }

            // Systems
            stateSystem.update(actor, context);
            combatSystem.update(actor, context);
            
            // Turn Progression
            const speed = (actor.attributes.speed || 100) + (actor.attributes.initiative || 0);
            actor.actionTimer = (actor.actionTimer || 0) + speed;

            if (actor.state?.type === 'IDLE' && actor.actionTimer >= 1000) {
                 actor.actionTimer -= 1000;
                 
                 aiSystem.evaluateTurn(actor, context);
                 
                 skillManager.executeOnTurnEnd(actor, context);
            }
        }

        // Cleanup
        for (let i = deployedA.length - 1; i >= 0; i--) {
            if (deployedA[i].isDead) deployedA.splice(i, 1);
        }
        for (let i = deployedB.length - 1; i >= 0; i--) {
            if (deployedB[i].isDead) deployedB.splice(i, 1);
        }
        
        const aliveA = deployedA.length + reserveA.length;
        const aliveB = deployedB.length + reserveB.length;
        if (aliveA === 0 || aliveB === 0) break;
    }

    const survivorsA = [...deployedA, ...reserveA].filter(t => !t.isDead);
    const survivorsB = [...deployedB, ...reserveB].filter(t => !t.isDead);
    const winner = survivorsA.length > 0 ? 'A' : (survivorsB.length > 0 ? 'B' : 'Draw');

    return { winner, log, survivorsA, survivorsB };
}
