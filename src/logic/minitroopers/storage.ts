import type { Player } from './types';

const STORAGE_KEY = 'minitroopers_save_v2';

export const saveGame = (state: Player) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save game:', e);
    }
};

export const loadGame = (): Player | null => {
    if (typeof window === 'undefined') return null;
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load game:', e);
    }
    return null;
};

export const clearSave = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
};

