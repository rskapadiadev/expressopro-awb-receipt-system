import { describe, expect, it } from 'vitest';
import { consignmentNote } from '../scripts/consignment-note';
import {
    fieldKeysOf,
    layoutElementSchema,
    type LayoutElement,
    templatesUsing,
} from '../shared/layout';

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

describe('element styling', () => {
    it('keeps older elements valid and accepts colours and border styles', () => {
        expect(layoutElementSchema.safeParse(el('a', 'text')).success).toBe(true);
        const styled = {
            ...el('b', 'mark', 'mot'),
            text: 'FAST',
            color: '#dc2626',
            background: '#ffffff',
            borderColor: '#2563eb',
            borderWidth: 0.5,
            borderStyle: 'dashed',
            italic: true,
            underline: true,
        };
        expect(layoutElementSchema.safeParse(styled).success).toBe(true);
    });

    it('rejects colours that are not hex', () => {
        const bad = {
            ...el('c', 'text'),
            color: 'red',
        };
        expect(layoutElementSchema.safeParse(bad).success).toBe(false);
    });
});

describe('seeded consignment note', () => {
    it('collects fast track service and weight', () => {
        const keys = fieldKeysOf(consignmentNote.layout);
        expect(keys).toContain('fasttrack_service');
        expect(keys).toContain('weight_kg');
        expect(keys).toContain('no_of_box');
    });
});

describe('templatesUsing', () => {
    it('lists templates that collect a field, including via tick marks', () => {
        const paper = {
            widthMm: 100,
            heightMm: 50,
        };
        const templates = [
            {
                name: 'A',
                layout: {
                    ...paper,
                    elements: [el('a', 'field', 'sender_name')],
                },
            },
            {
                name: 'B',
                layout: {
                    ...paper,
                    elements: [el('b', 'mark', 'mot')],
                },
            },
        ];
        expect(templatesUsing(templates, 'mot')).toEqual(['B']);
        expect(templatesUsing(templates, 'remarks')).toEqual([]);
    });
});
