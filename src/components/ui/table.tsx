import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Empty } from './card';

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
}

// Single table used by every list screen so styling and empty states stay consistent.
export function DataTable<T>({
    rows,
    columns,
    rowKey,
    empty = 'Nothing here yet',
}: DataTableProps<T>) {
    if (rows.length === 0) {
        return <Empty>{empty}</Empty>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                        {columns.map((col, i) => (
                            <th key={i} className={cn('px-4 py-3 font-medium', col.className)}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => (
                        <tr key={rowKey(row)} className="hover:bg-slate-50">
                            {columns.map((col, i) => (
                                <td key={i} className={cn('px-4 py-3 align-middle', col.className)}>
                                    {col.cell(row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
