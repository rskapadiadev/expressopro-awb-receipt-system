import { Link } from '@tanstack/react-router';
import type { ReceiptListItem } from '@shared/types';
import { Badge } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/form';
import { type Column, DataTable } from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';

interface Selection {
    selected: ReadonlySet<number>;
    toggle: (rows: ReceiptListItem[], on: boolean) => void;
}

const BASE_COLUMNS: Column<ReceiptListItem>[] = [
    {
        header: 'AWB',
        cell: (r) => (
            <Link
                to="/receipts/$id"
                params={{ id: r.id }}
                className="font-mono font-medium text-brand hover:underline"
            >
                {r.awbNumber}
            </Link>
        ),
    },
    {
        header: 'Details',
        cell: (r) => <span className="line-clamp-1 max-w-xs text-slate-600">{r.summary}</span>,
    },
    {
        header: 'Template',
        className: 'hidden md:table-cell',
        cell: (r) => (
            <div className="leading-tight">
                <div>{r.templateName}</div>
                <div className="text-xs text-slate-500">{r.paper}</div>
            </div>
        ),
    },
    {
        header: 'Created',
        className: 'hidden sm:table-cell',
        cell: (r) => (
            <div className="leading-tight">
                <div>{formatDateTime(r.createdAt)}</div>
                <div className="text-xs text-slate-500">
                    {r.createdBy}
                    {r.branchCode && ` · ${r.branchCode}`}
                </div>
            </div>
        ),
    },
    {
        header: 'Status',
        cell: (r) => <Badge tone={r.status === 'void' ? 'red' : 'green'}>{r.status}</Badge>,
    },
];

export function ReceiptTable({
    rows,
    selection,
}: {
    rows: ReceiptListItem[];
    selection?: Selection;
}) {
    if (!selection) {
        return (
            <DataTable
                rows={rows}
                columns={BASE_COLUMNS}
                rowKey={(r) => r.id}
                empty="No receipts found"
            />
        );
    }
    const { selected, toggle } = selection;
    const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));
    const selectColumn: Column<ReceiptListItem> = {
        header: (
            <Checkbox
                aria-label="Select all on this page"
                checked={allOnPage}
                onChange={(e) => {
                    toggle(rows, e.target.checked);
                }}
            />
        ),
        className: 'w-10',
        cell: (r) => (
            <Checkbox
                aria-label={`Select ${r.awbNumber}`}
                checked={selected.has(r.id)}
                onChange={(e) => {
                    toggle([r], e.target.checked);
                }}
            />
        ),
    };
    return (
        <DataTable
            rows={rows}
            columns={[selectColumn, ...BASE_COLUMNS]}
            rowKey={(r) => r.id}
            empty="No receipts found"
        />
    );
}
