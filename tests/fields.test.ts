import { describe, expect, it } from 'vitest';
import { buildDataSchema, type FieldDefinition, formatFieldValue } from '../shared/fields';

const field = (overrides: Partial<FieldDefinition>): FieldDefinition => ({
    id: 1,
    key: 'f',
    label: 'F',
    type: 'text',
    required: false,
    options: [],
    searchable: false,
    sortOrder: 0,
    isActive: true,
    ...overrides,
});

describe('buildDataSchema', () => {
    const schema = buildDataSchema([
        field({
            key: 'name',
            required: true,
        }),
        field({
            key: 'pieces',
            type: 'number',
        }),
        field({
            key: 'mode',
            type: 'select',
            options: ['Paid', 'To Pay'],
        }),
        field({
            key: 'phone',
            type: 'phone',
        }),
        field({
            key: 'fragile',
            type: 'checkbox',
        }),
    ]);

    it('accepts valid data and coerces numbers', () => {
        const result = schema.parse({
            name: 'Ravi',
            pieces: '3',
            mode: 'Paid',
            phone: '+91 98765 43210',
            fragile: true,
        });
        expect(result.pieces).toBe(3);
    });

    it('turns empty optional values into null', () => {
        const result = schema.parse({
            name: 'Ravi',
            pieces: '',
            mode: '',
            phone: '',
            fragile: false,
        });
        expect(result.pieces).toBeNull();
        expect(result.mode).toBeNull();
    });

    it('rejects missing required fields, bad options and unknown keys are dropped', () => {
        expect(schema.safeParse({ name: '' }).success).toBe(false);
        expect(
            schema.safeParse({
                name: 'A',
                mode: 'Cash',
            }).success,
        ).toBe(false);
        const parsed = schema.parse({
            name: 'A',
            injected: 'x',
        });
        expect(parsed).not.toHaveProperty('injected');
    });
});

describe('formatFieldValue', () => {
    it('formats checkbox and empty values', () => {
        expect(formatFieldValue('checkbox', true)).toBe('Yes');
        expect(formatFieldValue('text', null)).toBe('');
        expect(formatFieldValue('text', undefined)).toBe('');
    });
});
