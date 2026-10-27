import { describe, expect, it } from 'vitest';
import { fieldKeysOf, type LayoutElement } from '../shared/layout';

const el = (id: string, kind: LayoutElement['kind'], fieldKey?: string): LayoutElement => ({
    id,
    kind,
    x: 0,
    y: 0,
    w: 10,
    h: 5,
    fontSize: 8,
    bold: false,
    align: 'left',
    showLabel: false,
    fieldKey,
});

describe('fieldKeysOf', () => {
    it('includes fields used only by tick marks, without duplicates', () => {
        const keys = fieldKeysOf({
            widthMm: 100,
            heightMm: 50,
            elements: [
                el('a', 'field', 'sender_name'),
                el('b', 'mark', 'mot'),
                el('c', 'mark', 'mot'),
                el('d', 'text'),
            ],
        });
        expect(keys).toEqual(['sender_name', 'mot']);
    });
});
