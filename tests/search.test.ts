import { describe, expect, it } from 'vitest';
import { searchPlan } from '../worker/lib/search';
import { shiftDays } from '../worker/lib/time';

const TODAY = '2026-10-28';

describe('searchPlan', () => {
    it('uses the AWB index for full or partial AWB numbers, in any case', () => {
        expect(searchPlan('surt8978467', undefined, TODAY)).toEqual({
            mode: 'awb',
            prefix: 'SURT8978467',
            from: undefined,
        });
        expect(searchPlan(' DEM1 0597 ', undefined, TODAY)).toMatchObject({
            mode: 'awb',
            prefix: 'DEM10597',
        });
    });

    it('limits name searches to the last 90 days unless a From date is given', () => {
        expect(searchPlan('Ketan', undefined, TODAY)).toEqual({
            mode: 'text',
            like: '%Ketan%',
            from: '2026-07-30',
            windowed: true,
        });
        expect(searchPlan('Ketan', '2024-01-01', TODAY)).toMatchObject({
            from: '2024-01-01',
            windowed: false,
        });
    });

    it('treats words without digits (even 4 letters) as text, and empty as no search', () => {
        expect(searchPlan('Ravi', undefined, TODAY).mode).toBe('text');
        expect(searchPlan('   ', '2026-01-01', TODAY)).toEqual({
            mode: 'none',
            from: '2026-01-01',
        });
    });
});

describe('shiftDays', () => {
    it('crosses month and year boundaries', () => {
        expect(shiftDays('2026-03-01', -1)).toBe('2026-02-28');
        expect(shiftDays('2026-12-31', 1)).toBe('2027-01-01');
    });
});
