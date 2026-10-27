import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { firstCopy, PAPER_PRESETS } from '@shared/layout';
import type { TemplateInput } from '@shared/schemas';
import { Pencil, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { ReceiptRenderer } from '@/components/receipt/ReceiptRenderer';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { Badge, Card, Empty, PageHeader } from '@/components/ui/card';
import { fieldsQuery, templatesQuery, useSave } from '@/lib/queries';
import { fitZoom } from '@/lib/paper';
import { sampleContext } from '@/lib/sample';

export function TemplatesPage() {
    const { data } = useQuery(templatesQuery(true));
    const { data: fields = [] } = useQuery(fieldsQuery);
    const sample = useMemo(() => sampleContext(fields), [fields]);
    const save = useSave<TemplateInput>('templates', ['templates']);
    const navigate = useNavigate();

    const create = async () => {
        const { name: _, ...paper } = PAPER_PRESETS[1];
        const { id } = await save.mutateAsync({
            input: {
                name: 'Untitled template',
                isActive: true,
                layout: {
                    ...paper,
                    elements: [],
                },
            },
        });
        await navigate({
            to: '/admin/templates/$id/design',
            params: { id },
        });
    };

    return (
        <>
            <PageHeader
                title="Templates"
                actions={
                    <Button onClick={() => void create()} disabled={save.isPending}>
                        <Plus className="size-4" /> New template
                    </Button>
                }
            />
            {data?.items.length === 0 && (
                <Card>
                    <Empty>No templates yet.</Empty>
                </Card>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data?.items.map((t) => (
                    <Card key={t.id} className="flex flex-col overflow-hidden">
                        <div className="flex h-72 items-center justify-center overflow-hidden bg-slate-100 p-3">
                            <ReceiptRenderer
                                layout={t.layout}
                                {...sample}
                                copy={firstCopy(t.layout)}
                                zoom={fitZoom(t.layout, 220, 260)}
                                className="shadow"
                            />
                        </div>
                        <div className="flex flex-1 items-start justify-between gap-2 p-4">
                            <div>
                                <div className="font-medium">{t.name}</div>
                                <div className="text-xs text-slate-500">
                                    {t.layout.widthMm}×{t.layout.heightMm} mm · v{t.version}
                                </div>
                                {!t.isActive && <Badge tone="red">Inactive</Badge>}
                            </div>
                            <Link
                                to="/admin/templates/$id/design"
                                params={{ id: t.id }}
                                className={buttonVariants({
                                    variant: 'outline',
                                    size: 'sm',
                                })}
                            >
                                <Pencil className="size-3.5" /> Design
                            </Link>
                        </div>
                    </Card>
                ))}
            </div>
        </>
    );
}
