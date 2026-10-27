import { describe, expect, it } from 'vitest';
import { DEFAULT_PRINT, sheetGrid } from '../shared/print';

describe('sheetGrid', () => {
    it('tiles small receipts on an A4 sheet', () => {
        const grid = sheetGrid(
            {
                widthMm: 95,
                heightMm: 65,
            },
            DEFAULT_PRINT,
        );
        expect(grid).toEqual({
            cols: 2,
            rows: 4,
            perSheet: 8,
        });
    });

    it('fits two A5 receipts on A4 with no margin or gap', () => {
        const grid = sheetGrid(
            {
                widthMm: 210,
                heightMm: 148.5,
            },
            {
                ...DEFAULT_PRINT,
                marginMm: 0,
                gapMm: 0,
            },
        );
        expect(grid.perSheet).toBe(2);
    });

    it('never returns less than one per sheet', () => {
        const grid = sheetGrid(
            {
                widthMm: 300,
                heightMm: 400,
            },
            DEFAULT_PRINT,
        );
        expect(grid.perSheet).toBe(1);
    });
});
