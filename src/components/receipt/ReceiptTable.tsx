import { Link } from '@tanstack/react-router';
import type { ReceiptListItem } from '@shared/types';
import { Badge } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/form';
import { type Column, DataTable } from '@/components/ui/table';
import { formatDateTime, STATUS_LABELS } from '@/lib/utils';

interface Selection {
    selected: ReadonlySet<number>;
    toggle: (rows: ReceiptListItem[], on: boolean) => void;
}

const BASE_COLUMNS: Column<ReceiptListItem>[] = [
    {
        header: 'AWB',
        cell: (r) => (
            <div className="leading-tight">
                <Link
                    to="/receipts/$id"
                    params={{ id: r.id }}
                    className="font-mono font-semibold text-primary underline-offset-4 hover:underline"
                >
                    {r.awbNumber}
                </Link>
                {r.receiptNo !== null && (
                    <div className="text-xs text-muted-foreground tabular-nums">
                        No. {r.receiptNo}
                    </div>
                )}
            </div>
        ),
    },
    {
        header: 'Details',
        cell: (r) => (
            <span className="line-clamp-2 max-w-xs text-muted-foreground md:line-clamp-1">
                {r.summary}
            </span>
        ),
    },
    {
        header: 'Template',
        className: 'hidden md:table-cell',
        cell: (r) => (
            <div className="leading-tight">
                <div>{r.templateName}</div>
                <div className="text-xs text-muted-foreground">{r.paper}</div>
            </div>
        ),
    },
    {
        header: 'Created',
        className: 'hidden sm:table-cell',
        cell: (r) => (
            <div className="leading-tight">
                <div>{formatDateTime(r.createdAt)}</div>
                <div className="text-xs text-muted-foreground">
                    {r.createdBy}
                    {r.branchCode && ` · ${r.branchCode}`}
                </div>
            </div>
        ),
    },
    {
        header: 'Status',
        cell: (r) => (
            <Badge dot tone={r.status === 'void' ? 'red' : 'green'}>
                {STATUS_LABELS[r.status]}
            </Badge>
        ),
    },
];

interface ReceiptTableProps {
    rows: ReceiptListItem[];
    selection?: Selection;
    loading?: boolean;
}

export function ReceiptTable({ rows, selection, loading }: ReceiptTableProps) {
    const columns = selection ? [selectColumn(rows, selection), ...BASE_COLUMNS] : BASE_COLUMNS;
    return (
        <DataTable
            rows={rows}
            columns={columns}
            rowKey={(r) => r.id}
            loading={loading}
            empty="No receipts found. Try a different search or date range."
        />
    );
}

function selectColumn(
    rows: ReceiptListItem[],
    { selected, toggle }: Selection,
): Column<ReceiptListItem> {
    const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));
    return {
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
}
