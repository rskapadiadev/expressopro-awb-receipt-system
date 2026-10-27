import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn('rounded-lg border border-slate-200 bg-white shadow-xs', className)}
        {...props}
    />
);

interface PageHeaderProps {
    title: string;
    actions?: ReactNode;
}

export function PageHeader({ title, actions }: PageHeaderProps) {
    return (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
    );
}

const badgeTones = {
    green: 'bg-emerald-100 text-emerald-800',
    red: 'bg-red-100 text-red-800',
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-100 text-blue-800',
};

export const Badge = ({
    tone = 'slate',
    children,
}: {
    tone?: keyof typeof badgeTones;
    children: ReactNode;
}) => (
    <span
        className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', badgeTones[tone])}
    >
        {children}
    </span>
);

export const Empty = ({ children }: { children: ReactNode }) => (
    <p className="py-10 text-center text-sm text-slate-500">{children}</p>
);
