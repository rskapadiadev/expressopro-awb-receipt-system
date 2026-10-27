import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { type BranchInput, branchInputSchema } from '@shared/schemas';
import type { Branch } from '@shared/types';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { type Editing, EditorDialog } from '@/components/EditorDialog';
import { Button } from '@/components/ui/button';
import { Badge, Card, PageHeader } from '@/components/ui/card';
import { Checkbox, ErrorBanner, FormField, Input, Label, Textarea } from '@/components/ui/form';
import { DataTable } from '@/components/ui/table';
import { applyServerErrors } from '@/lib/api';
import { editColumn } from '@/lib/columns';
import { branchesQuery, useSave } from '@/lib/queries';

export function BranchesPage() {
    const { data: branches = [] } = useQuery(branchesQuery);
    const [editing, setEditing] = useState<Editing<Branch>>(null);

    return (
        <>
            <PageHeader
                title="Branches"
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
            <Card>
                <DataTable
                    rows={branches}
                    rowKey={(b) => b.id}
                    empty="No branches yet. Add one before creating franchise users."
                    columns={[
                        {
                            header: 'Code',
                            cell: (b) => <span className="font-mono font-medium">{b.code}</span>,
                        },
                        {
                            header: 'Name',
                            cell: (b) => (
                                <div className="leading-tight">
                                    <div className="font-medium">{b.name}</div>
                                    <div className="text-xs text-slate-500">{b.city}</div>
                                </div>
                            ),
                        },
                        {
                            header: 'Phone',
                            className: 'hidden sm:table-cell',
                            cell: (b) => b.phone || '—',
                        },
                        {
                            header: 'Status',
                            cell: (b) => (
                                <Badge tone={b.isActive ? 'green' : 'red'}>
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
    onDone: () => void;
}

function BranchForm({ branch, onDone }: BranchFormProps) {
    const save = useSave<BranchInput>('branches', ['branches']);
    const {
        register,
        handleSubmit,
        setError,
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
        },
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
                <p className="text-xs text-amber-700">
                    Changing the code only affects new receipts; existing AWB numbers stay as they
                    are.
                </p>
            )}
            <Label className="flex items-center gap-2 font-normal">
                <Checkbox {...register('isActive')} /> Active (can book receipts)
            </Label>
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
