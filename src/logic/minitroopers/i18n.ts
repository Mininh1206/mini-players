import { useState, useEffect } from 'react';

type Language = 'en' | 'es';

const translations = {
    en: {
        'hq': 'HQ',
        'battle': 'BATTLE',
        'history': 'HISTORY',
        'my_squad': 'My Squad',
        'recruit_trooper': '+ Recruit Trooper',
        'trooper_profile': 'Trooper Profile',
        'upgrade': 'UPGRADE',
        'combat_stats': 'Combat Stats',
        'hit_points': 'Hit Points',
        'initiative': 'Initiative',
        'damage': 'Damage',
        'range': 'Range',
        'hit_chance': 'Hit Chance',
        'dodge': 'Dodge',
        'armor': 'Armor',
        'crit_chance': 'Crit Chance',
        'skills': 'Skills',
        'no_skills': 'No skills learned',
        'equipment': 'Equipment',
        'battle_arena': 'Battle Arena',
        'mission_infiltration': 'Infiltration Mission',
        'mission_infiltration_desc': 'Defeat the rats invading the base.',
        'mission_raid': 'Epic Raid',
        'mission_raid_desc': 'Challenge a powerful boss army.',
        'select_opponent': 'Select Opponent Army',
        'power': 'Power',
        'attack': 'ATTACK',
        'lvl': 'Lvl',
        'reward': 'Reward',
        'confirm_reset': 'Are you sure you want to delete all data? This cannot be undone.',
        'reset_data': 'Reset Data',
        'battle_history': 'Battle History',
        'tactics': 'Tactics',
        'priority': 'Priority',
        'target_part': 'Target Part',
        'speed': 'Speed',
        'weapon': 'Weapon',
        'skill': 'Skill',
    },
    es: {
        'hq': 'CUARTEL',
        'battle': 'BATALLA',
        'history': 'HISTORIAL',
        'my_squad': 'Mi Escuadrón',
        'recruit_trooper': '+ Reclutar Soldado',
        'trooper_profile': 'Perfil del Soldado',
        'upgrade': 'MEJORAR',
        'combat_stats': 'Estadísticas de Combate',
        'hit_points': 'Puntos de Vida',
        'initiative': 'Iniciativa',
        'damage': 'Daño',
        'range': 'Alcance',
        'hit_chance': 'Puntería',
        'dodge': 'Esquiva',
        'armor': 'Armadura',
        'crit_chance': 'Crítico',
        'skills': 'Habilidades',
        'no_skills': 'Sin habilidades aprendidas',
        'equipment': 'Equipamiento',
        'battle_arena': 'Arena de Batalla',
        'mission_infiltration': 'Misión de Infiltración',
        'mission_infiltration_desc': 'Derrota a las ratas que invaden la base.',
        'mission_raid': 'Incursión Épica',
        'mission_raid_desc': 'Desafía a un ejército jefe poderoso.',
        'select_opponent': 'Seleccionar Ejército Rival',
        'power': 'Poder',
        'attack': 'ATACAR',
        'lvl': 'Nvl',
        'reward': 'Recompensa',
        'confirm_reset': '¿Estás seguro de que quieres borrar todos los datos? Esto no se puede deshacer.',
        'reset_data': 'Borrar Datos',
        'battle_history': 'Historial de Batallas',
        'tactics': 'Tácticas',
        'priority': 'Prioridad',
        'target_part': 'Apuntar a',
        'speed': 'Velocidad',
        'weapon': 'Arma',
        'skill': 'Habilidad',
    }
};

export const useTranslation = () => {
    const [lang, setLang] = useState<Language>('en');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlLang = params.get('lang');
        if (urlLang === 'es' || urlLang === 'en') {
            setLang(urlLang);
        }
    }, []);

    const t = (key: keyof typeof translations['en']) => {
        return translations[lang][key] || key;
    };

    const changeLanguage = (newLang: Language) => {
        const url = new URL(window.location.href);
        url.searchParams.set('lang', newLang);
        window.history.pushState({}, '', url.toString());
        setLang(newLang);
    };

    return { t, lang, changeLanguage };
};
