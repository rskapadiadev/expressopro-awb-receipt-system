import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { ReceiptTable } from '@/components/receipt/ReceiptTable';
import { buttonVariants } from '@/components/ui/button-variants';
import { Card, PageHeader } from '@/components/ui/card';
import { dashboardQuery } from '@/lib/queries';

export function DashboardPage() {
    const { data } = useQuery(dashboardQuery);
    const stats = [
        ['Today', data?.today],
        ['This month', data?.month],
        ['All time', data?.total],
    ] as const;

    return (
        <>
            <PageHeader
                title="Dashboard"
                actions={
                    <Link to="/receipts/new" className={buttonVariants()}>
                        <Plus className="size-4" /> New receipt
                    </Link>
                }
            />
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {stats.map(([label, value]) => (
                    <Card key={label} className="p-5">
                        <div className="text-sm text-slate-500">{label}</div>
                        <div className="mt-1 text-3xl font-semibold">{value ?? '—'}</div>
                    </Card>
                ))}
            </div>
            <Card>
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <h2 className="font-medium">Recent receipts</h2>
                    <Link to="/receipts" className="text-sm text-brand hover:underline">
                        View all
                    </Link>
                </div>
                <ReceiptTable rows={data?.recent ?? []} />
            </Card>
        </>
    );
}
