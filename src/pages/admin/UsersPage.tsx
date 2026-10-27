import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { manageableRoles, ROLE_LABELS } from '@shared/permissions';
import { type UserInput, userCreateSchema, userUpdateSchema } from '@shared/schemas';
import type { Branch, UserRow } from '@shared/types';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { type Editing, EditorDialog } from '@/components/EditorDialog';
import { Button } from '@/components/ui/button';
import { Badge, Card, PageHeader } from '@/components/ui/card';
import { Checkbox, ErrorBanner, FormField, Input, Label, Select } from '@/components/ui/form';
import { DataTable } from '@/components/ui/table';
import { applyServerErrors } from '@/lib/api';
import { editColumn } from '@/lib/columns';
import { initials } from '@/lib/utils';
import { branchesQuery, useMe, usersQuery, useSave } from '@/lib/queries';

export function UsersPage() {
    const { data: users = [], isPending } = useQuery(usersQuery);
    const { data: branches = [] } = useQuery(branchesQuery);
    const branchCode = (id: number | null) => branches.find((b) => b.id === id)?.code ?? '—';
    const [editing, setEditing] = useState<Editing<UserRow>>(null);

    return (
        <>
            <PageHeader
                title="Users"
                description="Admins and franchise logins, their role and branch."
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
            <Card className="overflow-hidden">
                <DataTable
                    loading={isPending}
                    rows={users}
                    rowKey={(u) => u.id}
                    columns={[
                        {
                            header: 'Name',
                            cell: (u) => (
                                <div className="flex items-center gap-3">
                                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                        {initials(u.name)}
                                    </span>
                                    <div className="min-w-0 leading-tight">
                                        <div className="truncate font-medium">{u.name}</div>
                                        <div className="truncate text-xs text-muted-foreground">
                                            @{u.username}
                                        </div>
                                    </div>
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
                            header: 'Status',
                            cell: (u) => (
                                <Badge dot tone={u.isActive ? 'green' : 'red'}>
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
    branches: Branch[];
    onDone: () => void;
}

function UserForm({ user, branches, onDone }: UserFormProps) {
    const me = useMe();
    const save = useSave<UserInput>('users', ['users']);
    const roles = manageableRoles(me.role);
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<UserInput>({
        resolver: zodResolver(user ? userUpdateSchema : userCreateSchema),
        defaultValues: {
            name: user?.name ?? '',
            username: user?.username ?? '',
            password: '',
            role: user?.role ?? roles.at(-1) ?? 'user',
            isActive: user?.isActive ?? true,
            branchId: user?.branchId ?? null,
        },
    });
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
                    hint="Required for users: their templates and AWB prefix come from this branch"
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
