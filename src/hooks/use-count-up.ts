import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 700;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Animates a number from its previous value to the new one; instant when motion is reduced.
export function useCountUp(target: number) {
    const [value, setValue] = useState(0);
    const current = useRef(0);
    const [skip] = useState(reducedMotion);

    useEffect(() => {
        if (skip) {
            return;
        }
        let frame = 0;
        const from = current.current;
        const start = performance.now();
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / DURATION_MS);
            current.current = Math.round(from + (target - from) * (1 - (1 - t) ** 3));
            setValue(current.current);
            if (t < 1) {
                frame = requestAnimationFrame(tick);
            }
        };
        frame = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(frame);
        };
    }, [target, skip]);

    return skip ? target : value;
}
