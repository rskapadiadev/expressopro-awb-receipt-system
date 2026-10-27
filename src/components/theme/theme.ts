import { createContext, useContext } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export const THEME_KEY = 'awb.theme';

export interface ThemeState {
    theme: Theme;
    resolved: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeState | null>(null);

export function useTheme() {
    const state = useContext(ThemeContext);
    if (!state) {
        throw new Error('useTheme must be used inside ThemeProvider');
    }
    return state;
}

export function readTheme(): Theme {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        return saved === 'light' || saved === 'dark' ? saved : 'system';
    } catch {
        return 'system';
    }
}
