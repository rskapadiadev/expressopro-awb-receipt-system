import { describe, expect, it } from 'vitest';
import { istDayEnd, istDayStart, istToday } from '../worker/lib/time';

describe('IST date helpers', () => {
    it('starts the day at midnight India time', () => {
        expect(new Date(istDayStart('2026-01-15')).toISOString()).toBe('2026-01-14T18:30:00.000Z');
        expect(istDayEnd('2026-01-15') - istDayStart('2026-01-15')).toBe(86_400_000);
    });

    it('rolls over to the next date at 18:30 UTC', () => {
        expect(istToday(Date.parse('2026-01-15T18:29:00Z'))).toBe('2026-01-15');
        expect(istToday(Date.parse('2026-01-15T18:30:00Z'))).toBe('2026-01-16');
    });
});
