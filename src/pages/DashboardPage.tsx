import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { can } from '@shared/permissions';
import {
    ArrowRight,
    Building2,
    CalendarDays,
    CalendarRange,
    FileText,
    Layers,
    LayoutTemplate,
    type LucideIcon,
    Plus,
    TrendingUp,
} from 'lucide-react';
import { DailyChart } from '@/components/dashboard/DailyChart';
import { StatCard } from '@/components/dashboard/StatCard';
import { ReceiptTable } from '@/components/receipt/ReceiptTable';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, PageHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardQuery, useMe } from '@/lib/queries';
import { stagger } from '@/lib/utils';

const greeting = () => {
    const hour = Number(
        new Intl.DateTimeFormat('en-IN', {
            hour: 'numeric',
            hourCycle: 'h23',
            timeZone: 'Asia/Kolkata',
        }).format(new Date()),
    );
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
};

interface QuickAction {
    to: string;
    label: string;
    description: string;
    icon: LucideIcon;
    show: boolean;
}

export function DashboardPage() {
    const me = useMe();
    const { data } = useQuery(dashboardQuery);
    const avg = data
        ? Math.round(data.daily.reduce((sum, d) => sum + d.count, 0) / data.daily.length)
        : undefined;

    const actions: QuickAction[] = [
        {
            to: '/receipts/new',
            label: 'Book a consignment',
            description: 'Create and print a new receipt',
            icon: Plus,
            show: true,
        },
        {
            to: '/receipts',
            label: 'Search receipts',
            description: 'Find, reprint or bulk print',
            icon: FileText,
            show: true,
        },
        {
            to: '/admin/templates',
            label: 'Design templates',
            description: 'Layouts, paper sizes and copies',
            icon: LayoutTemplate,
            show: can(me.role, 'templates.manage'),
        },
        {
            to: '/admin/branches',
            label: 'Manage branches',
            description: 'Codes and AWB prefixes',
            icon: Building2,
            show: can(me.role, 'branches.manage'),
        },
    ];

    return (
        <>
            <PageHeader
                title={`${greeting()}, ${me.name.split(' ')[0] ?? me.name}`}
                description="Here's what's happening with your consignments."
            />
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    label="Today"
                    value={data?.today}
                    hint="Receipts booked today"
                    icon={CalendarDays}
                    index={0}
                />
                <StatCard
                    label="This month"
                    value={data?.month}
                    hint="Since the 1st"
                    icon={CalendarRange}
                    index={1}
                />
                <StatCard
                    label="All time"
                    value={data?.total}
                    hint="Total receipts"
                    icon={Layers}
                    index={2}
                />
                <StatCard
                    label="Daily average"
                    value={avg}
                    hint="Over the last 14 days"
                    icon={TrendingUp}
                    index={3}
                />
            </div>
            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <Card className="animate-fade-up lg:col-span-2" style={stagger(4)}>
                    <CardHeader title="Receipts per day" description="Last 14 days" />
                    <div className="p-5">
                        {data ? (
                            <DailyChart data={data.daily} />
                        ) : (
                            <Skeleton className="h-56 w-full" />
                        )}
                    </div>
                </Card>
                <Card className="animate-fade-up" style={stagger(5)}>
                    <CardHeader title="Quick actions" />
                    <ul className="space-y-1 p-2">
                        {actions
                            .filter((a) => a.show)
                            .map((a) => (
                                <li key={a.to}>
                                    <Link
                                        to={a.to}
                                        className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
                                    >
                                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                                            <a.icon className="size-5" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block font-medium">{a.label}</span>
                                            <span className="block truncate text-sm text-muted-foreground">
                                                {a.description}
                                            </span>
                                        </span>
                                        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </li>
                            ))}
                    </ul>
                </Card>
            </div>
            <Card className="animate-fade-up overflow-hidden" style={stagger(6)}>
                <CardHeader
                    title="Recent receipts"
                    description="Your latest 10 bookings"
                    actions={
                        <Button asChild variant="ghost" size="sm">
                            <Link to="/receipts">
                                View all <ArrowRight />
                            </Link>
                        </Button>
                    }
                />
                <ReceiptTable rows={data?.recent ?? []} loading={!data} />
            </Card>
        </>
    );
}
