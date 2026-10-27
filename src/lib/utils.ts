import { type ClassValue, clsx } from 'clsx';
import type { CSSProperties } from 'react';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// Stagger index for the animate-fade-up utility (capped so long lists don't lag).
export const stagger = (i: number) => ({ '--i': Math.min(i, 8) }) as CSSProperties;

export const STATUS_LABELS = {
    active: 'Active',
    void: 'Void',
} as const;

export const initials = (name: string) =>
    name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');

export const formatDate = (isoDate: string) =>
    new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-IN', { dateStyle: 'medium' });

export const formatDateTime = (ms: number) =>
    new Date(ms).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });

const IST = 'Asia/Kolkata';

// Formats a booking timestamp for receipts, always in India time.
export function formatReceiptDate(ms: number, format: string) {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-IN', {
            timeZone: IST,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        })
            .formatToParts(ms)
            .map((p) => [p.type, p.value]),
    ) as Record<string, string>;
    const month = new Intl.DateTimeFormat('en-US', {
        timeZone: IST,
        month: 'short',
    }).format(ms);
    return format
        .replace('YYYY', parts.year ?? '')
        .replace('YY', (parts.year ?? '').slice(2))
        .replace('MMM', month)
        .replace('MM', parts.month ?? '')
        .replace('DD', parts.day ?? '')
        .replace('HH', parts.hour ?? '')
        .replace('mm', parts.minute ?? '');
}
