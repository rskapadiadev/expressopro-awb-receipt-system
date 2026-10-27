import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { readTheme, type Theme, THEME_KEY, ThemeContext } from './theme';

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(readTheme);
    const [systemDark, setSystemDark] = useState(() => darkQuery().matches);
    const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

    useEffect(() => {
        const query = darkQuery();
        const onChange = () => {
            setSystemDark(query.matches);
        };
        query.addEventListener('change', onChange);
        return () => {
            query.removeEventListener('change', onChange);
        };
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', resolved === 'dark');
    }, [resolved]);

    const value = useMemo(
        () => ({
            theme,
            resolved,
            setTheme: (next: Theme) => {
                setThemeState(next);
                try {
                    localStorage.setItem(THEME_KEY, next);
                } catch {
                    // Storage blocked: theme still applies for this visit.
                }
            },
        }),
        [theme, resolved],
    );

    return <ThemeContext value={value}>{children}</ThemeContext>;
}
