import { Button } from '@/components/ui/button';
import type { Column } from '@/components/ui/table';

export const editColumn = <T,>(onEdit: (row: T) => void): Column<T> => ({
    header: '',
    className: 'text-right',
    cell: (row) => (
        <Button
            variant="outline"
            size="sm"
            onClick={() => {
                onEdit(row);
            }}
        >
            Edit
        </Button>
    ),
});
