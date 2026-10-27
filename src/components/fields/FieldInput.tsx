import type { FieldDefinition, FieldType } from '@shared/fields';
import type { InputHTMLAttributes, ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Checkbox, Input, Select, Textarea } from '@/components/ui/form';

type Renderer = (field: FieldDefinition, reg: UseFormRegisterReturn, id: string) => ReactNode;

const input =
    (props: InputHTMLAttributes<HTMLInputElement>): Renderer =>
    (_, reg, id) => <Input id={id} {...props} {...reg} />;

// UI half of the field registry: one input per field type (validation lives in shared/fields).
const INPUTS: Record<FieldType, Renderer> = {
    text: input({ type: 'text' }),
    number: input({
        type: 'number',
        step: 'any',
    }),
    phone: input({
        type: 'tel',
        inputMode: 'tel',
    }),
    email: input({ type: 'email' }),
    date: input({ type: 'date' }),
    textarea: (_, reg, id) => <Textarea id={id} rows={3} {...reg} />,
    select: (field, reg, id) => (
        <Select id={id} {...reg}>
            <option value="">Select…</option>
            {field.options.map((o) => (
                <option key={o} value={o}>
                    {o}
                </option>
            ))}
        </Select>
    ),
    checkbox: (_, reg, id) => <Checkbox id={id} {...reg} />,
};

export const FieldInput = ({
    field,
    registration,
}: {
    field: FieldDefinition;
    registration: UseFormRegisterReturn;
}) => INPUTS[field.type](field, registration, `field-${field.key}`);
