import { z } from 'zod';

export const FIELD_TYPES = [
    'text',
    'textarea',
    'number',
    'phone',
    'email',
    'date',
    'select',
    'checkbox',
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export interface FieldDefinition {
    id: number;
    key: string;
    label: string;
    type: FieldType;
    required: boolean;
    options: string[];
    searchable: boolean;
    sortOrder: number;
    isActive: boolean;
}

// Minimal field info frozen into a receipt so later label edits don't change old prints.
export type FieldSnapshot = Pick<FieldDefinition, 'key' | 'label' | 'type'>;

export type FieldValue = string | number | boolean | null;
export type ReceiptData = Record<string, FieldValue>;

interface FieldTypeSpec {
    label: string;
    schema: (field: FieldDefinition) => z.ZodType<FieldValue>;
    format: (value: FieldValue) => string;
    sample: string;
}

const text = (max: number) => z.string().trim().max(max);
const asText = (value: FieldValue) => (value === null ? '' : String(value));

export const FIELD_REGISTRY: Record<FieldType, FieldTypeSpec> = {
    text: {
        label: 'Text',
        schema: () => text(200),
        format: asText,
        sample: 'Sample text',
    },
    textarea: {
        label: 'Multi-line text',
        schema: () => text(1000),
        format: asText,
        sample: 'Line one\nLine two',
    },
    number: {
        label: 'Number',
        schema: () => z.coerce.number({ error: 'Enter a number' }),
        format: asText,
        sample: '12.5',
    },
    phone: {
        label: 'Phone',
        schema: () =>
            z
                .string()
                .trim()
                .regex(/^[+\d][\d\s-]{5,19}$/, 'Invalid phone number'),
        format: asText,
        sample: '+91 98765 43210',
    },
    email: {
        label: 'Email',
        schema: () => z.email(),
        format: asText,
        sample: 'name@example.com',
    },
    date: {
        label: 'Date',
        schema: () => z.iso.date(),
        format: (value) => (value ? new Date(String(value)).toLocaleDateString('en-IN') : ''),
        sample: '2026-01-01',
    },
    select: {
        label: 'Dropdown',
        schema: (field) => z.enum(field.options as [string, ...string[]]),
        format: asText,
        sample: 'Option',
    },
    checkbox: {
        label: 'Checkbox',
        schema: () => z.boolean(),
        format: (value) => (value ? 'Yes' : 'No'),
        sample: 'Yes',
    },
};

const isEmpty = (value: unknown) => value === undefined || value === null || value === '';
const present = z.custom((v) => !isEmpty(v), 'Required');

// Builds the receipt data validator from whichever fields a template uses.
export function buildDataSchema(fields: FieldDefinition[]) {
    const shape: Record<string, z.ZodType<FieldValue>> = {};
    for (const field of fields) {
        const base = FIELD_REGISTRY[field.type].schema(field);
        shape[field.key] =
            field.required && field.type !== 'checkbox'
                ? present.pipe(base)
                : z.preprocess((v) => (isEmpty(v) ? null : v), base.nullable());
    }
    return z.object(shape);
}

export function formatFieldValue(type: FieldType, value: FieldValue | undefined): string {
    return value === undefined ? '' : FIELD_REGISTRY[type].format(value);
}

// New fields go to the end of the entry form.
export const nextSortOrder = (fields: FieldDefinition[]) =>
    Math.max(0, ...fields.map((f) => f.sortOrder)) + 10;
