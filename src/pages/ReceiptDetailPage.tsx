import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRouteApi, Link } from '@tanstack/react-router';
import { can } from '@shared/permissions';
import { ArrowLeft, Ban, Building2, CalendarDays, Copy, Printer, UserRound } from 'lucide-react';
import { ReceiptRenderer } from '@/components/receipt/ReceiptRenderer';
import { receiptContext } from '@/lib/paper';
import { Button } from '@/components/ui/button';
import { Badge, Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { receiptQuery, useMe } from '@/lib/queries';
import { formatDateTime, STATUS_LABELS } from '@/lib/utils';

const route = getRouteApi('/authed/shell/receipts/$id');

export function ReceiptDetailPage() {
    const { id } = route.useParams();
    const me = useMe();
    const queryClient = useQueryClient();
    const { data: receipt } = useQuery(receiptQuery(id));
    const voidReceipt = useMutation({
        mutationFn: () => api(`/receipts/${id}/void`, 'POST'),
        onSuccess: () => {
            toast.success('Receipt voided');
            return queryClient.invalidateQueries();
        },
    });

    if (!receipt) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-6 w-96 max-w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }
    const copies = receipt.layout.copies?.length ?? 0;
    const meta = [
        {
            icon: CalendarDays,
            text: formatDateTime(receipt.createdAt),
        },
        {
            icon: UserRound,
            text: receipt.createdBy,
        },
        ...(receipt.layout.branch
            ? [
                  {
                      icon: Building2,
                      text: `${receipt.layout.branch.code} – ${receipt.layout.branch.name}`,
                  },
              ]
            : []),
        ...(copies > 1
            ? [
                  {
                      icon: Copy,
                      text: `Prints ${copies} copies`,
                  },
              ]
            : []),
    ];

    return (
        <>
            <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground">
                <Link to="/receipts">
                    <ArrowLeft /> All receipts
                </Link>
            </Button>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="font-mono text-2xl font-bold sm:text-3xl">
                            {receipt.awbNumber}
                        </h1>
                        <Badge dot tone={receipt.status === 'void' ? 'red' : 'green'}>
                            {STATUS_LABELS[receipt.status]}
                        </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {meta.map(({ icon: Icon, text }) => (
                            <span
                                key={text}
                                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground"
                            >
                                <Icon className="size-3.5" /> {text}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    {can(me.role, 'receipts.void') && receipt.status === 'active' && (
                        <Button
                            variant="outline"
                            disabled={voidReceipt.isPending}
                            onClick={() => {
                                if (
                                    confirm(
                                        'Void this receipt? It will stay in history marked as void.',
                                    )
                                ) {
                                    voidReceipt.mutate();
                                }
                            }}
                        >
                            <Ban /> Void
                        </Button>
                    )}
                    <Button asChild>
                        <Link to="/print" search={{ ids: String(id) }} target="_blank">
                            <Printer /> Print
                        </Link>
                    </Button>
                </div>
            </div>
            <Card className="bg-grid overflow-auto bg-muted/40 p-4 sm:p-8">
                <div className="mx-auto w-fit">
                    <ReceiptRenderer
                        layout={receipt.layout}
                        {...receiptContext(receipt)}
                        className="rounded-sm shadow-xl ring-1 ring-black/5"
                    />
                </div>
            </Card>
        </>
    );
}
