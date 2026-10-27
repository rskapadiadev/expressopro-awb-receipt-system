import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { FIELD_REGISTRY, FIELD_TYPES, type FieldDefinition } from '@shared/fields';
import { type FieldInput, fieldInputSchema } from '@shared/schemas';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { type Editing, EditorDialog } from '@/components/EditorDialog';
import { Button } from '@/components/ui/button';
import { Badge, Card, PageHeader } from '@/components/ui/card';
import {
    Checkbox,
    ErrorBanner,
    FormField,
    Input,
    Label,
    Select,
    Textarea,
} from '@/components/ui/form';
import { DataTable } from '@/components/ui/table';
import { applyServerErrors } from '@/lib/api';
import { editColumn } from '@/lib/columns';
import { fieldsQuery, useSave } from '@/lib/queries';

export function FieldsPage() {
    const { data: fields = [], isPending } = useQuery(fieldsQuery);
    const [editing, setEditing] = useState<Editing<FieldDefinition>>(null);

    return (
        <>
            <PageHeader
                title="Field library"
                description="The fields templates can use. Keys are permanent once created."
                actions={
                    <Button
                        onClick={() => {
                            setEditing('new');
                        }}
                    >
                        <Plus className="size-4" /> New field
                    </Button>
                }
            />
            <Card className="overflow-hidden">
                <DataTable
                    loading={isPending}
                    rows={fields}
                    rowKey={(f) => f.id}
                    columns={[
                        {
                            header: 'Label',
                            cell: (f) => (
                                <div className="leading-tight">
                                    <div className="font-medium">{f.label}</div>
                                    <div className="font-mono text-xs text-muted-foreground">
                                        {f.key}
                                    </div>
                                </div>
                            ),
                        },
                        {
                            header: 'Type',
                            cell: (f) => FIELD_REGISTRY[f.type].label,
                        },
                        {
                            header: 'Flags',
                            className: 'hidden sm:table-cell',
                            cell: (f) => (
                                <div className="flex flex-wrap gap-1">
                                    {f.required && <Badge tone="blue">Required</Badge>}
                                    {f.searchable && <Badge>Searchable</Badge>}
                                    {!f.isActive && <Badge tone="red">Inactive</Badge>}
                                </div>
                            ),
                        },
                        editColumn(setEditing),
                    ]}
                />
            </Card>
            <EditorDialog
                editing={editing}
                noun="field"
                onClose={() => {
                    setEditing(null);
                }}
            >
                {(item) => (
                    <FieldForm
                        field={item}
                        nextOrder={(fields.at(-1)?.sortOrder ?? 0) + 10}
                        onDone={() => {
                            setEditing(null);
                        }}
                    />
                )}
            </EditorDialog>
        </>
    );
}

interface FieldFormProps {
    field: FieldDefinition | null;
    nextOrder: number;
    onDone: () => void;
}

function FieldForm({ field, nextOrder, onDone }: FieldFormProps) {
    const save = useSave<FieldInput>('fields', ['fields', 'template']);
    // Raw text kept separately so blank lines survive while typing.
    const [optionsText, setOptionsText] = useState(field?.options.join('\n') ?? '');
    const {
        register,
        handleSubmit,
        setError,
        setValue,
        control,
        formState: { errors, isSubmitting },
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
            onDone();
        } catch (err) {
            applyServerErrors(err, setError);
        }
    });

    return (
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <ErrorBanner message={errors.root?.message} />
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Label" htmlFor="label" error={errors.label?.message}>
                    <Input id="label" {...register('label')} />
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
                <Button variant="outline" onClick={onDone}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    Save
                </Button>
            </div>
        </form>
    );
}
