import type { LucideIcon } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            'rounded-xl border bg-card text-card-foreground shadow-xs shadow-black/[0.03]',
            className,
        )}
        {...props}
    />
);

interface CardHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
}

export const CardHeader = ({ title, description, actions }: CardHeaderProps) => (
    <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
        <div className="min-w-0">
            <h2 className="font-semibold">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
    </div>
);

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
                <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
                {description && <p className="mt-1 text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
    );
}

const badgeTones = {
    green: 'bg-success/12 text-success ring-success/25',
    red: 'bg-destructive/10 text-destructive ring-destructive/25',
    slate: 'bg-muted text-muted-foreground ring-border',
    blue: 'bg-primary/10 text-primary ring-primary/25',
    amber: 'bg-warning/15 text-warning ring-warning/30',
};

interface BadgeProps {
    tone?: keyof typeof badgeTones;
    dot?: boolean;
    children: ReactNode;
}

export const Badge = ({ tone = 'slate', dot = false, children }: BadgeProps) => (
    <span
        className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
            badgeTones[tone],
        )}
    >
        {dot && <span className="size-1.5 rounded-full bg-current" />}
        {children}
    </span>
);

interface EmptyProps {
    icon?: LucideIcon;
    title?: string;
    children: ReactNode;
    action?: ReactNode;
}

export const Empty = ({ icon: Icon, title, children, action }: EmptyProps) => (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
        {Icon && (
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-6" />
            </div>
        )}
        <div className="space-y-1">
            {title && <p className="font-semibold">{title}</p>}
            <p className="max-w-sm text-sm text-muted-foreground">{children}</p>
        </div>
        {action}
    </div>
);
