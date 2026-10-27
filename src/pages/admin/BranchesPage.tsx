import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { type BranchInput, branchInputSchema } from '@shared/schemas';
import { can } from '@shared/permissions';
import type { Branch, Template } from '@shared/types';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { type Editing, EditorDialog } from '@/components/EditorDialog';
import { TemplatePicker } from '@/components/TemplatePicker';
import { Button } from '@/components/ui/button';
import { Badge, Card, PageHeader } from '@/components/ui/card';
import { Checkbox, ErrorBanner, FormField, Input, Label, Textarea } from '@/components/ui/form';
import { DataTable } from '@/components/ui/table';
import { applyServerErrors } from '@/lib/api';
import { editColumn } from '@/lib/columns';
import { branchesQuery, templatesQuery, useMe, useSave } from '@/lib/queries';

export function BranchesPage() {
    const { data: branches = [], isPending } = useQuery(branchesQuery);
    const { data: templates } = useQuery(templatesQuery(true));
    const [editing, setEditing] = useState<Editing<Branch>>(null);
    const templateName = (id: number) =>
        templates?.items.find((t) => t.id === id)?.name ?? `#${id}`;

    return (
        <>
            <PageHeader
                title="Branches"
                description="Branch codes prefix AWB numbers. A branch's templates are what its users can book with."
                actions={
                    <Button
                        onClick={() => {
                            setEditing('new');
                        }}
                    >
                        <Plus className="size-4" /> New branch
                    </Button>
                }
            />
            <Card className="overflow-hidden">
                <DataTable
                    loading={isPending}
                    rows={branches}
                    rowKey={(b) => b.id}
                    empty="No branches yet. Add one before creating franchise users."
                    columns={[
                        {
                            header: 'Code',
                            cell: (b) => (
                                <span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-xs font-semibold text-primary">
                                    {b.code}
                                </span>
                            ),
                        },
                        {
                            header: 'Name',
                            cell: (b) => (
                                <div className="leading-tight">
                                    <div className="font-medium">{b.name}</div>
                                    <div className="text-xs text-muted-foreground">{b.city}</div>
                                </div>
                            ),
                        },
                        {
                            header: 'Templates',
                            className: 'hidden md:table-cell',
                            cell: (b) =>
                                b.templateIds.length ? (
                                    <div className="flex flex-wrap gap-1">
                                        {b.templateIds.map((id) => (
                                            <Badge
                                                key={id}
                                                tone={id === b.defaultTemplateId ? 'blue' : 'slate'}
                                            >
                                                {templateName(id)}
                                                {id === b.defaultTemplateId && ' ★'}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">None assigned</span>
                                ),
                        },
                        {
                            header: 'Phone',
                            className: 'hidden lg:table-cell',
                            cell: (b) => b.phone || '—',
                        },
                        {
                            header: 'Status',
                            cell: (b) => (
                                <Badge dot tone={b.isActive ? 'green' : 'red'}>
                                    {b.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            ),
                        },
                        editColumn(setEditing),
                    ]}
                />
            </Card>
            <EditorDialog
                editing={editing}
                noun="branch"
                onClose={() => {
                    setEditing(null);
                }}
            >
                {(item) => (
                    <BranchForm
                        branch={item}
                        templates={templates?.items ?? []}
                        onDone={() => {
                            setEditing(null);
                        }}
                    />
                )}
            </EditorDialog>
        </>
    );
}

interface BranchFormProps {
    branch: Branch | null;
    templates: Template[];
    onDone: () => void;
}

function BranchForm({ branch, templates, onDone }: BranchFormProps) {
    const me = useMe();
    const save = useSave<BranchInput>('branches', ['branches']);
    const {
        register,
        handleSubmit,
        setError,
        setValue,
        control,
        formState: { errors, isSubmitting },
    } = useForm<BranchInput>({
        resolver: zodResolver(branchInputSchema),
        defaultValues: {
            code: branch?.code ?? '',
            name: branch?.name ?? '',
            city: branch?.city ?? '',
            phone: branch?.phone ?? '',
            address: branch?.address ?? '',
            isActive: branch?.isActive ?? true,
            templateIds: branch?.templateIds ?? [],
            defaultTemplateId: branch?.defaultTemplateId ?? null,
        },
    });
    const [templateIds, defaultTemplateId] = useWatch({
        control,
        name: ['templateIds', 'defaultTemplateId'],
    });

    const onSubmit = handleSubmit(async (input) => {
        try {
            await save.mutateAsync({
                id: branch?.id,
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
                <FormField
                    label="Code"
                    htmlFor="code"
                    error={errors.code?.message}
                    hint="4 letters/digits; every AWB number starts with this, e.g. SURT0482917"
                >
                    <Input
                        id="code"
                        maxLength={4}
                        className="font-mono uppercase"
                        {...register('code')}
                    />
                </FormField>
                <FormField label="Name" htmlFor="name" error={errors.name?.message}>
                    <Input id="name" {...register('name')} />
                </FormField>
                <FormField label="City" htmlFor="city" error={errors.city?.message}>
                    <Input id="city" {...register('city')} />
                </FormField>
                <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
                    <Input id="phone" type="tel" {...register('phone')} />
                </FormField>
                <FormField
                    label="Address"
                    htmlFor="address"
                    error={errors.address?.message}
                    className="sm:col-span-2"
                >
                    <Textarea id="address" rows={2} {...register('address')} />
                </FormField>
            </div>
            {branch && (
                <p className="text-xs text-warning">
                    Changing the code only affects new receipts; existing AWB numbers stay as they
                    are.
                </p>
            )}
            <Label className="flex items-center gap-2 font-normal">
                <Checkbox {...register('isActive')} /> Active (can book receipts)
            </Label>
            {can(me.role, 'templates.assign') && (
                <TemplatePicker
                    templates={templates}
                    templateIds={templateIds}
                    defaultTemplateId={defaultTemplateId}
                    onChange={(next) => {
                        setValue('templateIds', next.templateIds);
                        setValue('defaultTemplateId', next.defaultTemplateId);
                    }}
                />
            )}
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
