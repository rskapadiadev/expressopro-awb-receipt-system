import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import type { CompanyProfile } from '@shared/company';
import type { FieldDefinition } from '@shared/fields';
import type {
    Branch,
    DashboardStats,
    Me,
    Page,
    Receipt,
    ReceiptListItem,
    Template,
    TemplateWithFields,
    UserRow,
} from '@shared/types';
import type { ReceiptQuery } from '@shared/schemas';
import { toast } from 'sonner';
import { api } from './api';

const toQueryString = (params: Record<string, string | number | undefined>) => {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
    return entries.length
        ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}`
        : '';
};

export const meQuery = queryOptions({
    queryKey: ['me'],
    queryFn: () => api<Me>('/auth/me'),
    retry: false,
    staleTime: Infinity,
});

export const fieldsQuery = queryOptions({
    queryKey: ['fields'],
    queryFn: () => api<FieldDefinition[]>('/fields'),
});

export const templatesQuery = (all = false) =>
    queryOptions({
        queryKey: ['templates', all],
        queryFn: () =>
            api<{
                items: Template[];
                defaultId: number | null;
            }>(`/templates${all ? '?all=1' : ''}`),
    });

export const templateQuery = (id: number) =>
    queryOptions({
        queryKey: ['template', id],
        queryFn: () => api<TemplateWithFields>(`/templates/${id}`),
    });

export const companyQuery = queryOptions({
    queryKey: ['company'],
    queryFn: () => api<CompanyProfile>('/company'),
});

export const branchesQuery = queryOptions({
    queryKey: ['branches'],
    queryFn: () => api<Branch[]>('/branches'),
});

export const usersQuery = queryOptions({
    queryKey: ['users'],
    queryFn: () => api<UserRow[]>('/users'),
});

export const receiptsQuery = (search: Partial<ReceiptQuery>) =>
    queryOptions({
        queryKey: ['receipts', search],
        queryFn: () => api<Page<ReceiptListItem>>(`/receipts${toQueryString(search)}`),
        placeholderData: (prev) => prev,
    });

export const receiptQuery = (id: number) =>
    queryOptions({
        queryKey: ['receipt', id],
        queryFn: () => api<Receipt>(`/receipts/${id}`),
    });

export const printQuery = (ids: number[]) =>
    queryOptions({
        queryKey: ['print', ids],
        queryFn: () => api<Receipt[]>(`/receipts/print?ids=${ids.join(',')}`),
    });

export const dashboardQuery = queryOptions({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardStats>('/dashboard'),
});

// Shared create/update mutation: POST without id, PUT with id, then refresh the listed caches.
interface SaveArgs<TInput> {
    id?: number;
    input: TInput;
}

export function useSave<TInput>(resource: string, invalidate: string[]) {
    const client = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: SaveArgs<TInput>) =>
            api<{ id: number }>(
                id ? `/${resource}/${id}` : `/${resource}`,
                id ? 'PUT' : 'POST',
                input,
            ),
        onSuccess: () => {
            toast.success('Saved');
            return Promise.all(
                invalidate.map((key) => client.invalidateQueries({ queryKey: [key] })),
            );
        },
    });
}

// Shared delete mutation, the counterpart of useSave.
export function useRemove(resource: string, invalidate: string[]) {
    const client = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api<{ id: number }>(`/${resource}/${id}`, 'DELETE'),
        onSuccess: () => {
            toast.success('Deleted');
            return Promise.all(
                invalidate.map((key) => client.invalidateQueries({ queryKey: [key] })),
            );
        },
    });
}

// The authed route guarantees `me` is cached, so this never actually suspends.
export const useMe = () => useSuspenseQuery(meQuery).data;
