import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCountUp } from '@/hooks/use-count-up';
import { stagger } from '@/lib/utils';

interface StatCardProps {
    label: string;
    value: number | undefined;
    hint: string;
    icon: LucideIcon;
    index: number;
}

export function StatCard({ label, value, hint, icon: Icon, index }: StatCardProps) {
    const shown = useCountUp(value ?? 0);
    return (
        <Card
            className="group relative animate-fade-up overflow-hidden p-5 transition-shadow hover:shadow-md"
            style={stagger(index)}
        >
            <div className="absolute -top-8 -right-8 size-24 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" />
            <div className="relative flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    {value === undefined ? (
                        <Skeleton className="h-9 w-16" />
                    ) : (
                        <p className="text-3xl font-bold tabular-nums">
                            {shown.toLocaleString('en-IN')}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                </div>
            </div>
        </Card>
    );
}
