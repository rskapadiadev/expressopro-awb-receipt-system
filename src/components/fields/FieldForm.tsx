import { zodResolver } from '@hookform/resolvers/zod';
import { FIELD_REGISTRY, FIELD_TYPES, type FieldDefinition } from '@shared/fields';
import { type FieldInput, fieldInputSchema } from '@shared/schemas';
import { type ChangeEvent, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
    Checkbox,
    ErrorBanner,
    FormField,
    Input,
    Label,
    Select,
    Textarea,
} from '@/components/ui/form';
import { applyServerErrors } from '@/lib/api';
import { useSave } from '@/lib/queries';

interface FieldFormProps {
    field: FieldDefinition | null;
    nextOrder: number;
    // Receives the saved field's key, or nothing when cancelled.
    onDone: (key?: string) => void;
}

// Snake-case key suggested from the label while creating (e.g. "Fast Track" → fast_track).
const keyFromLabel = (label: string) =>
    label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 60);

export function FieldForm({ field, nextOrder, onDone }: FieldFormProps) {
    const save = useSave<FieldInput>('fields', ['fields', 'template']);
    // Raw text kept separately so blank lines survive while typing.
    const [optionsText, setOptionsText] = useState(field?.options.join('\n') ?? '');
    const {
        register,
        handleSubmit,
        setError,
        setValue,
        control,
        formState: { errors, isSubmitting, dirtyFields },
    } = useForm<FieldInput>({
        resolver: zodResolver(fieldInputSchema),
        defaultValues: {
            key: field?.key ?? '',
            label: field?.label ?? '',
            type: field?.type ?? 'text',
            required: field?.required ?? false,
            options: field?.options ?? [],
            searchable: field?.searchable ?? false,
            sortOrder: field?.sortOrder ?? nextOrder,
            isActive: field?.isActive ?? true,
        },
    });

    const type = useWatch({
        control,
        name: 'type',
    });

    const onSubmit = handleSubmit(async (input) => {
        try {
            await save.mutateAsync({
                id: field?.id,
                input,
            });
            onDone(input.key);
        } catch (err) {
            applyServerErrors(err, setError);
        }
    });

    return (
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <ErrorBanner message={errors.root?.message} />
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Label" htmlFor="label" error={errors.label?.message}>
                    <Input
                        id="label"
                        autoFocus
                        {...register('label', {
                            onChange: (e: ChangeEvent<HTMLInputElement>) => {
                                if (!field && !dirtyFields.key) {
                                    setValue('key', keyFromLabel(e.target.value));
                                }
                            },
                        })}
                    />
                </FormField>
                <FormField
                    label="Key"
                    htmlFor="key"
                    error={errors.key?.message}
                    hint={field ? 'Key cannot change once created' : 'e.g. sender_name'}
                >
                    <Input id="key" className="font-mono" readOnly={!!field} {...register('key')} />
                </FormField>
                <FormField label="Type" htmlFor="type" error={errors.type?.message}>
                    <Select id="type" {...register('type')}>
                        {FIELD_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {FIELD_REGISTRY[t].label}
                            </option>
                        ))}
                    </Select>
                </FormField>
                <FormField label="Sort order" htmlFor="sortOrder" error={errors.sortOrder?.message}>
                    <Input
                        id="sortOrder"
                        type="number"
                        {...register('sortOrder', { valueAsNumber: true })}
                    />
                </FormField>
            </div>
            {type === 'select' && (
                <FormField
                    label="Options (one per line)"
                    htmlFor="options"
                    error={errors.options?.message ?? errors.options?.root?.message}
                >
                    <Textarea
                        id="options"
                        value={optionsText}
                        onChange={(e) => {
                            setOptionsText(e.target.value);
                            setValue(
                                'options',
                                e.target.value
                                    .split('\n')
                                    .map((o) => o.trim())
                                    .filter(Boolean),
                            );
                        }}
                    />
                </FormField>
            )}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Label className="flex items-center gap-2 font-normal">
                    <Checkbox {...register('required')} /> Required
                </Label>
                <Label className="flex items-center gap-2 font-normal">
                    <Checkbox {...register('searchable')} /> Searchable in receipt list
                </Label>
                <Label className="flex items-center gap-2 font-normal">
                    <Checkbox {...register('isActive')} /> Active
                </Label>
            </div>
            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={() => {
                        onDone();
                    }}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    Save
                </Button>
            </div>
        </form>
    );
}
