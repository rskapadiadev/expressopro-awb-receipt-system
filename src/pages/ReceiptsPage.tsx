import { useQuery } from '@tanstack/react-query';
import { getRouteApi, Link } from '@tanstack/react-router';
import { BULK_PRINT_LIMIT } from '@shared/schemas';
import type { ReceiptListItem } from '@shared/types';
import { Plus, Printer } from 'lucide-react';
import { useState } from 'react';
import { ReceiptTable } from '@/components/receipt/ReceiptTable';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { Card, PageHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/form';
import { receiptsQuery } from '@/lib/queries';

const route = getRouteApi('/authed/shell/receipts');

export function ReceiptsPage() {
    const search = route.useSearch();
    const navigate = route.useNavigate();
    const { data, isFetching } = useQuery(receiptsQuery(search));
    // Selection lives here (not in the URL) so it survives paging and filtering.
    const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());

    const setSearch = (patch: Partial<typeof search>) =>
        void navigate({
            search: (prev) => ({
                ...prev,
                ...patch,
                page: patch.page ?? 1,
            }),
        });

    const toggle = (rows: ReceiptListItem[], on: boolean) => {
        setSelected((prev) => {
            const next = new Set(prev);
            rows.forEach((r) => (on ? next.add(r.id) : next.delete(r.id)));
            return next;
        });
    };

    const page = data?.page ?? 1;
    const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
    const tooMany = selected.size > BULK_PRINT_LIMIT;

    return (
        <>
            <PageHeader
                title="Receipts"
                actions={
                    <>
                        {selected.size > 0 && (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setSelected(new Set());
                                    }}
                                >
                                    Clear ({selected.size})
                                </Button>
                                <Link
                                    to="/print"
                                    search={{ ids: [...selected].join(',') }}
                                    target="_blank"
                                    disabled={tooMany}
                                    className={buttonVariants({ variant: 'outline' })}
                                >
                                    <Printer className="size-4" />
                                    {tooMany
                                        ? `Max ${BULK_PRINT_LIMIT} per batch`
                                        : `Print selected (${selected.size})`}
                                </Link>
                            </>
                        )}
                        <Link to="/receipts/new" className={buttonVariants()}>
                            <Plus className="size-4" /> New receipt
                        </Link>
                    </>
                }
            />
            <Card>
                <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-[1fr_auto_auto]">
                    <Input
                        type="search"
                        placeholder="Search AWB number, sender, receiver…"
                        defaultValue={search.q ?? ''}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                setSearch({ q: e.currentTarget.value || undefined });
                            }
                        }}
                        onBlur={(e) => {
                            if (e.target.value !== (search.q ?? '')) {
                                setSearch({ q: e.target.value || undefined });
                            }
                        }}
                    />
                    <Input
                        type="date"
                        aria-label="From date"
                        value={search.from ?? ''}
                        onChange={(e) => {
                            setSearch({ from: e.target.value || undefined });
                        }}
                    />
                    <Input
                        type="date"
                        aria-label="To date"
                        value={search.to ?? ''}
                        onChange={(e) => {
                            setSearch({ to: e.target.value || undefined });
                        }}
                    />
                </div>
                <div className={isFetching ? 'opacity-60' : undefined}>
                    <ReceiptTable
                        rows={data?.items ?? []}
                        selection={{
                            selected,
                            toggle,
                        }}
                    />
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
                    <span className="text-slate-500">{data?.total ?? 0} receipts</span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => {
                                setSearch({ page: page - 1 });
                            }}
                        >
                            Previous
                        </Button>
                        <span>
                            {page} / {pages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= pages}
                            onClick={() => {
                                setSearch({ page: page + 1 });
                            }}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </Card>
        </>
    );
}
