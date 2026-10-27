import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { can, manageableRoles, ROLE_LABELS } from '@shared/permissions';
import { type UserInput, userCreateSchema, userUpdateSchema } from '@shared/schemas';
import type { Branch, Template, UserRow } from '@shared/types';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { type Editing, EditorDialog } from '@/components/EditorDialog';
import { Button } from '@/components/ui/button';
import { Badge, Card, PageHeader } from '@/components/ui/card';
import { Checkbox, ErrorBanner, FormField, Input, Label, Select } from '@/components/ui/form';
import { DataTable } from '@/components/ui/table';
import { applyServerErrors } from '@/lib/api';
import { editColumn } from '@/lib/columns';
import { branchesQuery, templatesQuery, useMe, usersQuery, useSave } from '@/lib/queries';

export function UsersPage() {
    const { data: users = [] } = useQuery(usersQuery);
    const { data: templates } = useQuery(templatesQuery(true));
    const { data: branches = [] } = useQuery(branchesQuery);
    const branchCode = (id: number | null) => branches.find((b) => b.id === id)?.code ?? '—';
    const [editing, setEditing] = useState<Editing<UserRow>>(null);
    const templateName = (id: number) =>
        templates?.items.find((t) => t.id === id)?.name ?? `#${id}`;

    return (
        <>
            <PageHeader
                title="Users"
                actions={
                    <Button
                        onClick={() => {
                            setEditing('new');
                        }}
                    >
                        <Plus className="size-4" /> New user
                    </Button>
                }
            />
            <Card>
                <DataTable
                    rows={users}
                    rowKey={(u) => u.id}
                    columns={[
                        {
                            header: 'Name',
                            cell: (u) => (
                                <div className="leading-tight">
                                    <div className="font-medium">{u.name}</div>
                                    <div className="text-xs text-slate-500">{u.username}</div>
                                </div>
                            ),
                        },
                        {
                            header: 'Role',
                            cell: (u) => <Badge tone="blue">{ROLE_LABELS[u.role]}</Badge>,
                        },
                        {
                            header: 'Branch',
                            cell: (u) => (
                                <span className="font-mono">{branchCode(u.branchId)}</span>
                            ),
                        },
                        {
                            header: 'Templates',
                            className: 'hidden md:table-cell',
                            cell: (u) =>
                                u.templateIds
                                    .map((id) =>
                                        id === u.defaultTemplateId
                                            ? `${templateName(id)} ★`
                                            : templateName(id),
                                    )
                                    .join(', ') || '—',
                        },
                        {
                            header: 'Status',
                            cell: (u) => (
                                <Badge tone={u.isActive ? 'green' : 'red'}>
                                    {u.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            ),
                        },
                        editColumn(setEditing),
                    ]}
                />
            </Card>
            <EditorDialog
                editing={editing}
                noun="user"
                onClose={() => {
                    setEditing(null);
                }}
            >
                {(item) => (
                    <UserForm
                        user={item}
                        templates={templates?.items ?? []}
                        branches={branches}
                        onDone={() => {
                            setEditing(null);
                        }}
                    />
                )}
            </EditorDialog>
        </>
    );
}

interface UserFormProps {
    user: UserRow | null;
    templates: Pick<Template, 'id' | 'name'>[];
    branches: Branch[];
    onDone: () => void;
}

function UserForm({ user, templates, branches, onDone }: UserFormProps) {
    const me = useMe();
    const save = useSave<UserInput>('users', ['users']);
    const roles = manageableRoles(me.role);
    const {
        register,
        handleSubmit,
        setError,
        setValue,
        control,
        formState: { errors, isSubmitting },
    } = useForm<UserInput>({
        resolver: zodResolver(user ? userUpdateSchema : userCreateSchema),
        defaultValues: {
            name: user?.name ?? '',
            username: user?.username ?? '',
            password: '',
            role: user?.role ?? roles.at(-1) ?? 'user',
            isActive: user?.isActive ?? true,
            templateIds: user?.templateIds ?? [],
            defaultTemplateId: user?.defaultTemplateId ?? null,
            branchId: user?.branchId ?? null,
        },
    });
    const [assigned, defaultId] = useWatch({
        control,
        name: ['templateIds', 'defaultTemplateId'],
    });

    const toggleTemplate = (id: number, on: boolean) => {
        const next = on ? [...assigned, id] : assigned.filter((t) => t !== id);
        setValue('templateIds', next);
        if (!next.includes(defaultId ?? 0)) {
            setValue('defaultTemplateId', next[0] ?? null);
        }
    };

    const onSubmit = handleSubmit(async (input) => {
        try {
            await save.mutateAsync({
                id: user?.id,
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
                <FormField label="Name" htmlFor="name" error={errors.name?.message}>
                    <Input id="name" {...register('name')} />
                </FormField>
                <FormField label="Username" htmlFor="username" error={errors.username?.message}>
                    <Input id="username" autoComplete="off" {...register('username')} />
                </FormField>
                <FormField
                    label="Password"
                    htmlFor="password"
                    error={errors.password?.message}
                    hint={user ? 'Leave blank to keep the current password' : undefined}
                >
                    <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        {...register('password')}
                    />
                </FormField>
                <FormField label="Role" htmlFor="role" error={errors.role?.message}>
                    <Select id="role" {...register('role')}>
                        {roles.map((r) => (
                            <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                            </option>
                        ))}
                    </Select>
                </FormField>
                <FormField
                    label="Branch"
                    htmlFor="branchId"
                    error={errors.branchId?.message}
                    hint="Required for users; their AWB numbers start with the branch code"
                    className="sm:col-span-2"
                >
                    <Select
                        id="branchId"
                        {...register('branchId', {
                            setValueAs: (v: string | number | null) =>
                                v === '' || v === null ? null : Number(v),
                        })}
                    >
                        <option value="">No branch (admins pick per receipt)</option>
                        {branches
                            .filter((b) => b.isActive || b.id === user?.branchId)
                            .map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.code} – {b.name}
                                </option>
                            ))}
                    </Select>
                </FormField>
            </div>
            <Label className="flex items-center gap-2">
                <Checkbox {...register('isActive')} /> Active (can log in)
            </Label>
            {can(me.role, 'templates.assign') && (
                <fieldset className="space-y-2 rounded-md border border-slate-200 p-3">
                    <legend className="px-1 text-sm font-medium">
                        Assigned templates (★ = default)
                    </legend>
                    {templates.map((t) => (
                        <div key={t.id} className="flex items-center justify-between gap-2 text-sm">
                            <Label className="flex items-center gap-2 font-normal">
                                <Checkbox
                                    checked={assigned.includes(t.id)}
                                    onChange={(e) => {
                                        toggleTemplate(t.id, e.target.checked);
                                    }}
                                />
                                {t.name}
                            </Label>
                            {assigned.includes(t.id) && (
                                <Label className="flex items-center gap-1 text-xs font-normal text-slate-500">
                                    <input
                                        type="radio"
                                        name="defaultTemplateId"
                                        checked={defaultId === t.id}
                                        onChange={() => {
                                            setValue('defaultTemplateId', t.id);
                                        }}
                                    />
                                    Default
                                </Label>
                            )}
                        </div>
                    ))}
                </fieldset>
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
