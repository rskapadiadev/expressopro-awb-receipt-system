import { z } from 'zod';

export const PRINT_MODES = ['single', 'sheet'] as const;
export type PrintMode = (typeof PRINT_MODES)[number];

export const PRINT_MODE_LABELS: Record<PrintMode, string> = {
    single: 'One per page (roll / label printer)',
    sheet: 'Multiple per sheet (A4 / normal printer)',
};

const spacingMm = z.number().min(0).max(50);

export const printSettingsSchema = z.object({
    mode: z.enum(PRINT_MODES),
    sheetWidthMm: z.number().min(20).max(1000),
    sheetHeightMm: z.number().min(20).max(1000),
    marginMm: spacingMm,
    gapMm: spacingMm,
});
export type PrintSettings = z.infer<typeof printSettingsSchema>;

export const DEFAULT_PRINT: PrintSettings = {
    mode: 'single',
    sheetWidthMm: 210,
    sheetHeightMm: 297,
    marginMm: 5,
    gapMm: 3,
};

interface PaperSize {
    widthMm: number;
    heightMm: number;
}

// How many receipts of this size fit on one sheet (always at least 1).
export function sheetGrid(paper: PaperSize, print: PrintSettings) {
    const fit = (sheet: number, item: number) =>
        Math.max(1, Math.floor((sheet - 2 * print.marginMm + print.gapMm) / (item + print.gapMm)));
    const cols = fit(print.sheetWidthMm, paper.widthMm);
    const rows = fit(print.sheetHeightMm, paper.heightMm);
    return {
        cols,
        rows,
        perSheet: cols * rows,
    };
}
