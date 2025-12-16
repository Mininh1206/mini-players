import type { Trooper, BattleLogEntry, BattleResult } from '../types';
import type { Weapon } from '../classes/Skill';

export interface BattleContext {
    time: number; // Global tick
    turn: number; // Deprecated alias for time
    log: BattleLogEntry[];
    allTroopers: Trooper[];
    deployedA: Trooper[];
    deployedB: Trooper[];
    reserveA: Trooper[];
    reserveB: Trooper[];
    jammedWeapons: Map<string, string[]>; // TrooperID -> WeaponIDs
}

export interface SkillImplementation {
    id: string;
    /**
     * Called at the start of battle to modify base stats.
     */
    modifyStats?: (trooper: Trooper) => void;

    /**
     * Called at the start of the turn. Can return an action to perform, overriding default behavior.
     */
    onTurnStart?: (trooper: Trooper, context: BattleContext) => boolean; // Return true if action taken

    /**
     * Called before an attack is calculated. Can modify hit chance, damage, etc.
     */
    onBeforeAttack?: (attacker: Trooper, target: Trooper, weapon: Weapon) => void;

    /**
     * Called when an attack hits.
     */
    onHit?: (attacker: Trooper, target: Trooper, damage: number, context: BattleContext) => void;

    /**
     * Called when a trooper takes damage.
     */
    onDamageTaken?: (victim: Trooper, attacker: Trooper | undefined, damage: number, context: BattleContext) => void;

    /**
     * Called during the action phase if no primary action (shooting) was taken.
     * Return true if an action was performed.
     */
    onTurnAction?: (trooper: Trooper, context: BattleContext) => boolean;

    /**
     * Called when a trooper is deployed.
     */
    onDeploy?: (trooper: Trooper, context: BattleContext) => void;

    /**
     * Called at the start of the battle (before deployment).
     */
    onBattleStart?: (trooper: Trooper, context: BattleContext) => void;

    /**
     * Called at the end of the turn.
     */
    onTurnEnd?: (trooper: Trooper, context: BattleContext) => void;
}

class SkillManager {
    private skills: Map<string, SkillImplementation> = new Map();

    register(skill: SkillImplementation) {
        this.skills.set(skill.id, skill);
    }

    get(id: string): SkillImplementation | undefined {
        return this.skills.get(id);
    }

    // Hook Executors
    applyStatModifiers(trooper: Trooper) {
        trooper.skills.forEach(skill => {
            const impl = this.get(skill.id);
            if (impl?.modifyStats) {
                impl.modifyStats(trooper);
            }
        });
    }

    executeOnBattleStart(trooper: Trooper, context: BattleContext) {
        trooper.skills.forEach(skill => {
            const impl = this.get(skill.id);
            if (impl?.onBattleStart) {
                impl.onBattleStart(trooper, context);
            }
        });
    }

    executeOnDeploy(trooper: Trooper, context: BattleContext) {
        trooper.skills.forEach(skill => {
            const impl = this.get(skill.id);
            if (impl?.onDeploy) {
                impl.onDeploy(trooper, context);
            }
        });
    }

    executeTurnStart(trooper: Trooper, context: BattleContext): boolean {
        for (const skill of trooper.skills) {
            const impl = this.get(skill.id);
            if (impl?.onTurnStart) {
                if (impl.onTurnStart(trooper, context)) return true;
            }
        }
        return false;
    }

    executeTurnAction(trooper: Trooper, context: BattleContext): boolean {
        for (const skill of trooper.skills) {
            const impl = this.get(skill.id);
            if (impl?.onTurnAction) {
                if (impl.onTurnAction(trooper, context)) return true;
            }
        }
        return false;
    }

    executeOnTurnEnd(trooper: Trooper, context: BattleContext) {
        trooper.skills.forEach(skill => {
            const impl = this.get(skill.id);
            if (impl?.onTurnEnd) {
                impl.onTurnEnd(trooper, context);
            }
        });
    }
}

export const skillManager = new SkillManager();
