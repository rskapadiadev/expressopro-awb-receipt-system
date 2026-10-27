import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn, stagger } from '@/lib/utils';
import { Empty } from './card';
import { Skeleton } from './skeleton';

export interface Column<T> {
    header: ReactNode;
    cell: (row: T) => ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    rows: T[];
    columns: Column<T>[];
    rowKey: (row: T) => string | number;
    empty?: string;
    loading?: boolean;
}

const SKELETON_ROWS = 5;

// Phones get stacked cards: text headers become labels, others (checkboxes, actions) sit inline.
function MobileCards<T>({ rows, columns, rowKey }: DataTableProps<T>) {
    const labelled = columns.filter((c) => typeof c.header === 'string' && c.header !== '');
    const [title, ...details] = labelled;
    const extras = columns.filter((c) => !labelled.includes(c));
    return (
        <ul className="divide-y md:hidden">
            {rows.map((row, i) => (
                <li
                    key={rowKey(row)}
                    className="animate-fade-up space-y-3 px-4 py-4"
                    style={stagger(i)}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 font-medium">{title?.cell(row)}</div>
                        <div className="flex shrink-0 items-center gap-2">
                            {extras.map((c, ci) => (
                                <span key={ci}>{c.cell(row)}</span>
                            ))}
                        </div>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {details.map((c, ci) => (
                            <div key={ci} className={cn('min-w-0', ci === 0 && 'col-span-2')}>
                                <dt className="text-xs text-muted-foreground">{c.header}</dt>
                                <dd className="break-words">{c.cell(row)}</dd>
                            </div>
                        ))}
                    </dl>
                </li>
            ))}
        </ul>
    );
}

// Single table used by every list screen so styling, loading and empty states stay consistent.
export function DataTable<T>(props: DataTableProps<T>) {
    const { rows, columns, rowKey, empty = 'Nothing here yet', loading = false } = props;
    if (loading) {
        return (
            <div className="space-y-3 p-4">
                {Array.from({ length: SKELETON_ROWS }, (_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                ))}
            </div>
        );
    }
    if (rows.length === 0) {
        return <Empty icon={Inbox}>{empty}</Empty>;
    }
    return (
        <>
            <MobileCards {...props} />
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/40 text-xs text-muted-foreground uppercase">
                        <tr>
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    className={cn(
                                        'px-4 py-3 font-medium tracking-wide',
                                        col.className,
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {rows.map((row, i) => (
                            <tr
                                key={rowKey(row)}
                                className="animate-fade-up transition-colors hover:bg-muted/40"
                                style={stagger(i)}
                            >
                                {columns.map((col, ci) => (
                                    <td
                                        key={ci}
                                        className={cn('px-4 py-3 align-middle', col.className)}
                                    >
                                        {col.cell(row)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
