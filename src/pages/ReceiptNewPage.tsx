import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { buildDataSchema, type ReceiptData } from '@shared/fields';
import { firstCopy } from '@shared/layout';
import type { Branch, TemplateWithFields } from '@shared/types';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { FieldInput } from '@/components/fields/FieldInput';
import { ReceiptRenderer } from '@/components/receipt/ReceiptRenderer';
import { Button } from '@/components/ui/button';
import { Card, Empty, PageHeader } from '@/components/ui/card';
import { ErrorBanner, FormField, Select } from '@/components/ui/form';
import { fieldMap, fitZoom } from '@/lib/paper';
import { api, applyServerErrors } from '@/lib/api';
import { branchesQuery, templateQuery, templatesQuery, useMe } from '@/lib/queries';

export function ReceiptNewPage() {
    const { data: available } = useQuery(templatesQuery());
    const [picked, setPicked] = useState<number | null>(null);
    const templateId = picked ?? available?.defaultId ?? null;
    const { data } = useQuery({
        ...templateQuery(templateId ?? 0),
        enabled: templateId !== null,
    });
    // Users always book under their own branch; admins without one pick it per receipt.
    const me = useMe();
    const { data: branches = [] } = useQuery(branchesQuery);
    const activeBranches = branches.filter((b) => b.isActive);
    const [branchId, setBranchId] = useState<number | null>(null);
    const branch = activeBranches.find(
        (b) => b.id === (me.branchId ?? branchId ?? activeBranches[0]?.id),
    );

    return (
        <>
            <PageHeader title="New receipt" />
            {available?.items.length === 0 ? (
                <Card>
                    <Empty>No templates are assigned to you yet. Ask your administrator.</Empty>
                </Card>
            ) : (
                <>
                    <div className="mb-4 flex flex-wrap gap-4">
                        {me.branchId === null && (
                            <FormField label="Branch" htmlFor="branch" className="w-full max-w-xs">
                                <Select
                                    id="branch"
                                    value={branch?.id ?? ''}
                                    onChange={(e) => {
                                        setBranchId(Number(e.target.value));
                                    }}
                                >
                                    {activeBranches.length === 0 && (
                                        <option value="">No active branches</option>
                                    )}
                                    {activeBranches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.code} – {b.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormField>
                        )}
                        {available && available.items.length > 1 && (
                            <FormField
                                label="Template"
                                htmlFor="template"
                                className="w-full max-w-sm"
                            >
                                <Select
                                    id="template"
                                    value={templateId ?? ''}
                                    onChange={(e) => {
                                        setPicked(Number(e.target.value));
                                    }}
                                >
                                    {available.items.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.layout.widthMm}×{t.layout.heightMm} mm)
                                        </option>
                                    ))}
                                </Select>
                            </FormField>
                        )}
                    </div>
                    {/* Keyed by template so the form and its validator reset when the template changes. */}
                    {data && <ReceiptForm key={data.template.id} {...data} branch={branch} />}
                </>
            )}
        </>
    );
}

interface ReceiptFormProps extends TemplateWithFields {
    // Booking branch: the user's own, or the one an admin picked (the server enforces this).
    branch?: Branch;
}

function ReceiptForm({ template, fields, branch }: ReceiptFormProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const schema = useMemo(() => buildDataSchema(fields), [fields]);
    const {
        register,
        handleSubmit,
        setError,
        control,
        formState: { errors, isSubmitting },
    } = useForm<Record<string, unknown>, unknown, ReceiptData>({ resolver: zodResolver(schema) });
    const values = useWatch({ control });
    const [now] = useState(Date.now);

    const onSubmit = handleSubmit(async (data) => {
        try {
            const created = await api<{ id: number }>('/receipts', 'POST', {
                templateId: template.id,
                branchId: branch?.id,
                data,
            });
            await queryClient.invalidateQueries({ queryKey: ['receipts'] });
            void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            await navigate({
                to: '/receipts/$id',
                params: { id: created.id },
            });
        } catch (err) {
            applyServerErrors(err, setError);
        }
    });

    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
            <Card className="p-5">
                <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
                    <ErrorBanner message={errors.root?.message} />
                    <div className="grid gap-4 sm:grid-cols-2">
                        {fields.map((field) => (
                            <FormField
                                key={field.key}
                                label={field.required ? `${field.label} *` : field.label}
                                htmlFor={`field-${field.key}`}
                                error={errors[field.key]?.message}
                                className={field.type === 'textarea' ? 'sm:col-span-2' : undefined}
                            >
                                <FieldInput field={field} registration={register(field.key)} />
                            </FormField>
                        ))}
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving…' : 'Create receipt'}
                    </Button>
                </form>
            </Card>
            <div className="hidden lg:block">
                <p className="mb-2 text-sm text-slate-500">Live preview</p>
                <div className="overflow-auto rounded-lg border border-slate-200 shadow-sm">
                    <ReceiptRenderer
                        layout={template.layout}
                        fields={fieldMap(fields)}
                        data={values as ReceiptData}
                        awbNumber={`${branch?.code ?? 'XXXX'}0000000`}
                        createdAt={now}
                        branch={branch}
                        copy={firstCopy(template.layout)}
                        zoom={fitZoom(template.layout, 380)}
                    />
                </div>
            </div>
        </div>
    );
}
