import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { firstCopy, PAPER_PRESETS } from '@shared/layout';
import type { TemplateInput } from '@shared/schemas';
import { LayoutTemplate, Pencil, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { ReceiptRenderer } from '@/components/receipt/ReceiptRenderer';
import { Button } from '@/components/ui/button';
import { Badge, Card, Empty, PageHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fieldsQuery, templatesQuery, useSave } from '@/lib/queries';
import { fitZoom } from '@/lib/paper';
import { sampleContext } from '@/lib/sample';
import { stagger } from '@/lib/utils';

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
                description="Receipt layouts, paper sizes, copies and print modes."
                actions={
                    <Button onClick={() => void create()} disabled={save.isPending}>
                        <Plus /> New template
                    </Button>
                }
            />
            {data?.items.length === 0 && (
                <Card>
                    <Empty icon={LayoutTemplate} title="No templates yet">
                        Create your first receipt layout to start booking consignments.
                    </Empty>
                </Card>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {!data &&
                    Array.from({ length: 4 }, (_, i) => (
                        <Skeleton key={i} className="h-96 rounded-xl" />
                    ))}
                {data?.items.map((t, i) => (
                    <Card
                        key={t.id}
                        className="group flex animate-fade-up flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg"
                        style={stagger(i)}
                    >
                        <Link
                            to="/admin/templates/$id/design"
                            params={{ id: t.id }}
                            className="bg-grid relative flex h-72 items-center justify-center overflow-hidden bg-muted/50 p-4"
                        >
                            <ReceiptRenderer
                                layout={t.layout}
                                {...sample}
                                copy={firstCopy(t.layout)}
                                zoom={fitZoom(t.layout, 220, 250)}
                                className="rounded-sm shadow-lg ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-[1.03]"
                            />
                            <span className="absolute inset-0 grid place-items-center bg-primary/0 opacity-0 transition-all group-hover:bg-primary/10 group-hover:opacity-100">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-sm font-medium shadow-md">
                                    <Pencil className="size-3.5" /> Open designer
                                </span>
                            </span>
                        </Link>
                        <div className="flex flex-1 items-start justify-between gap-2 border-t p-4">
                            <div className="min-w-0 space-y-1">
                                <div className="truncate font-semibold">{t.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    {t.layout.widthMm}×{t.layout.heightMm} mm · v{t.version}
                                    {t.layout.copies?.length
                                        ? ` · ${t.layout.copies.length} copies`
                                        : ''}
                                </div>
                            </div>
                            <Badge dot tone={t.isActive ? 'green' : 'red'}>
                                {t.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                    </Card>
                ))}
            </div>
        </>
    );
}
