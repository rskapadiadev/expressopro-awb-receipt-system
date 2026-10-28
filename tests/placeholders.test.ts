import { describe, expect, it } from 'vitest';
import { fieldKeysOf, type LayoutElement } from '../shared/layout';
import { fieldTokensIn, fillTokens, isAutoToken } from '../shared/placeholders';

const text = (id: string, value: string): LayoutElement => ({
    id,
    kind: 'text',
    x: 0,
    y: 0,
    w: 10,
    h: 5,
    fontSize: 8,
    bold: false,
    align: 'left',
    showLabel: false,
    text: value,
});

describe('static text placeholders', () => {
    it('separates field keys from automatic values', () => {
        expect(fieldTokensIn('{sender_name} / {awb_number} / {tracking_link} / {copy}')).toEqual([
            'sender_name',
        ]);
        expect(isAutoToken('gstin')).toBe(true);
        expect(isAutoToken('weight_kg')).toBe(false);
    });

    it('fills known tokens and leaves unknown ones as typed', () => {
        const values: Record<string, string> = { weight_kg: '12.5' };
        expect(fillTokens('Weight: {weight_kg} kg {typo}', (t) => values[t])).toBe(
            'Weight: 12.5 kg {typo}',
        );
    });

    it('adds fields used only in text to the booking form', () => {
        const keys = fieldKeysOf({
            widthMm: 100,
            heightMm: 50,
            elements: [text('a', 'Weight: {weight_kg} kg, track on {tracking_link}')],
        });
        expect(keys).toEqual(['weight_kg']);
    });
});
