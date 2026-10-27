import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

export class ApiError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly issues: Record<string, string> = {},
    ) {
        super(message);
    }
}

interface ErrorBody {
    error?: string;
    issues?: Record<string, string>;
}

export async function api<T>(path: string, method = 'GET', payload?: unknown): Promise<T> {
    const res = await fetch(`/api${path}`, {
        method,
        headers: payload === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: payload === undefined ? undefined : JSON.stringify(payload),
        credentials: 'same-origin',
    });
    const json = (await res.json().catch(() => ({}))) as ErrorBody;
    if (!res.ok) {
        throw new ApiError(json.error ?? res.statusText, res.status, json.issues);
    }
    return json as T;
}

// Maps server-side zod issues onto react-hook-form fields so both sides share one error UX.
export function applyServerErrors<T extends FieldValues>(
    err: unknown,
    setError: UseFormSetError<T>,
) {
    const message = err instanceof Error ? err.message : 'Something went wrong';
    if (err instanceof ApiError) {
        for (const [path, msg] of Object.entries(err.issues)) {
            setError(path as Path<T>, { message: msg });
        }
    }
    setError('root', { message });
}
