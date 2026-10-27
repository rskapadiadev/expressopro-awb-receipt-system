import { useQuery } from '@tanstack/react-query';
import { getRouteApi, Link } from '@tanstack/react-router';
import { BULK_PRINT_LIMIT } from '@shared/schemas';
import type { ReceiptListItem } from '@shared/types';
import { ChevronLeft, ChevronRight, Plus, Printer, Search, X } from 'lucide-react';
import { useState } from 'react';
import { ReceiptTable } from '@/components/receipt/ReceiptTable';
import { Button } from '@/components/ui/button';
import { Card, PageHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/form';
import { receiptsQuery } from '@/lib/queries';
import { cn } from '@/lib/utils';

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

    const clearFilters = () => {
        void navigate({ search: { page: 1 } });
    };
    const filtered = Boolean(search.q || search.from || search.to);

    return (
        <>
            <PageHeader
                title="Receipts"
                description="Search, reprint and bulk print your consignments."
                actions={
                    <Button asChild>
                        <Link to="/receipts/new">
                            <Plus /> New receipt
                        </Link>
                    </Button>
                }
            />
            <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search AWB number, sender, receiver…"
                            className="pl-9"
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
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                        <Input
                            type="date"
                            aria-label="From date"
                            className="sm:w-40"
                            value={search.from ?? ''}
                            onChange={(e) => {
                                setSearch({ from: e.target.value || undefined });
                            }}
                        />
                        <Input
                            type="date"
                            aria-label="To date"
                            className="sm:w-40"
                            value={search.to ?? ''}
                            onChange={(e) => {
                                setSearch({ to: e.target.value || undefined });
                            }}
                        />
                        {filtered && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="col-span-2"
                                onClick={clearFilters}
                            >
                                <X /> Clear filters
                            </Button>
                        )}
                    </div>
                </div>
                <div className={cn('transition-opacity', isFetching && data && 'opacity-60')}>
                    <ReceiptTable
                        rows={data?.items ?? []}
                        loading={!data}
                        selection={{
                            selected,
                            toggle,
                        }}
                    />
                </div>
                <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm">
                    <span className="text-muted-foreground">
                        {(data?.total ?? 0).toLocaleString('en-IN')} receipts
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label="Previous page"
                            disabled={page <= 1}
                            onClick={() => {
                                setSearch({ page: page - 1 });
                            }}
                        >
                            <ChevronLeft />
                        </Button>
                        <span className="min-w-16 text-center tabular-nums">
                            {page} / {pages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label="Next page"
                            disabled={page >= pages}
                            onClick={() => {
                                setSearch({ page: page + 1 });
                            }}
                        >
                            <ChevronRight />
                        </Button>
                    </div>
                </div>
            </Card>
            {selected.size > 0 && (
                <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
                    <div className="flex animate-in items-center gap-2 rounded-full border bg-popover/95 py-2 pr-2 pl-4 text-sm shadow-xl backdrop-blur fade-in slide-in-from-bottom-4">
                        <span className="font-medium tabular-nums">{selected.size} selected</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full"
                            onClick={() => {
                                setSelected(new Set());
                            }}
                        >
                            Clear
                        </Button>
                        <Button asChild size="sm" className="rounded-full" disabled={tooMany}>
                            <Link
                                to="/print"
                                search={{ ids: [...selected].join(',') }}
                                target="_blank"
                                disabled={tooMany}
                            >
                                <Printer />
                                {tooMany ? `Max ${BULK_PRINT_LIMIT}` : 'Print'}
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
