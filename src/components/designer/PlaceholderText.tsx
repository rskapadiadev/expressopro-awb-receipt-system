import type { FieldDefinition } from '@shared/fields';
import { AUTO_TOKENS, placeholder } from '@shared/placeholders';
import { useRef } from 'react';
import { FormField, Select, Textarea } from '@/components/ui/form';

interface PlaceholderTextProps {
    value: string;
    fields: FieldDefinition[];
    onChange: (text: string) => void;
}

const AUTO_OPTIONS = Object.entries(AUTO_TOKENS);

// Static text editor with an "Insert a value" menu that drops {token} at the cursor.
export function PlaceholderText({ value, fields, onChange }: PlaceholderTextProps) {
    const ref = useRef<HTMLTextAreaElement>(null);

    const insert = (token: string) => {
        const box = ref.current;
        const at = box?.selectionStart ?? value.length;
        const end = box?.selectionEnd ?? at;
        const text = placeholder(token);
        onChange(value.slice(0, at) + text + value.slice(end));
        // Put the cursor after the inserted value once React has re-rendered the text.
        requestAnimationFrame(() => {
            box?.focus();
            box?.setSelectionRange(at + text.length, at + text.length);
        });
    };

    return (
        <FormField
            label="Text"
            hint="Values in {braces} are filled in when printing; fields used here are added to the booking form."
        >
            <Textarea
                ref={ref}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                }}
            />
            <Select
                aria-label="Insert a value"
                className="h-8 text-sm"
                value=""
                onChange={(e) => {
                    if (e.target.value) {
                        insert(e.target.value);
                    }
                }}
            >
                <option value="">+ Insert a value…</option>
                <optgroup label="Fields (typed in on the booking form)">
                    {fields
                        .filter((f) => f.isActive)
                        .map((f) => (
                            <option key={f.key} value={f.key}>
                                {f.label}
                            </option>
                        ))}
                </optgroup>
                <optgroup label="Automatic">
                    {AUTO_OPTIONS.map(([token, label]) => (
                        <option key={token} value={token}>
                            {label}
                        </option>
                    ))}
                </optgroup>
            </Select>
        </FormField>
    );
}
