import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRouteApi, Link } from '@tanstack/react-router';
import { can } from '@shared/permissions';
import { Ban, Printer } from 'lucide-react';
import { ReceiptRenderer } from '@/components/receipt/ReceiptRenderer';
import { receiptContext } from '@/lib/paper';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { Badge, PageHeader } from '@/components/ui/card';
import { api } from '@/lib/api';
import { receiptQuery, useMe } from '@/lib/queries';
import { formatDateTime } from '@/lib/utils';

const route = getRouteApi('/authed/shell/receipts/$id');

export function ReceiptDetailPage() {
    const { id } = route.useParams();
    const me = useMe();
    const queryClient = useQueryClient();
    const { data: receipt } = useQuery(receiptQuery(id));
    const voidReceipt = useMutation({
        mutationFn: () => api(`/receipts/${id}/void`, 'POST'),
        onSuccess: () => queryClient.invalidateQueries(),
    });

    if (!receipt) {
        return null;
    }
    return (
        <>
            <PageHeader
                title={receipt.awbNumber}
                actions={
                    <>
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
                                <Ban className="size-4" /> Void
                            </Button>
                        )}
                        <Link
                            to="/print"
                            search={{ ids: String(id) }}
                            target="_blank"
                            className={buttonVariants()}
                        >
                            <Printer className="size-4" /> Print
                        </Link>
                    </>
                }
            />
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <Badge tone={receipt.status === 'void' ? 'red' : 'green'}>{receipt.status}</Badge>
                <span>
                    {formatDateTime(receipt.createdAt)} by {receipt.createdBy}
                </span>
            </div>
            <div className="overflow-auto">
                <ReceiptRenderer
                    layout={receipt.layout}
                    {...receiptContext(receipt)}
                    className="border border-slate-200 shadow-sm"
                />
            </div>
        </>
    );
}
