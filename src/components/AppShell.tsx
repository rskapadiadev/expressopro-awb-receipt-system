import { useQueryClient } from '@tanstack/react-query';
import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { can, type Permission, ROLE_LABELS } from '@shared/permissions';
import {
    Building2,
    FileText,
    LayoutDashboard,
    LayoutTemplate,
    ListChecks,
    LogOut,
    Plus,
    Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { COMPANY_NAME, LOGO_URL } from '@/lib/brand';
import { useMe } from '@/lib/queries';
import { Button } from './ui/button';

interface NavItem {
    to: string;
    label: string;
    icon: typeof FileText;
    permission?: Permission;
}

const NAV: NavItem[] = [
    {
        to: '/',
        label: 'Dashboard',
        icon: LayoutDashboard,
    },
    {
        to: '/receipts',
        label: 'Receipts',
        icon: FileText,
    },
    {
        to: '/receipts/new',
        label: 'New receipt',
        icon: Plus,
    },
    {
        to: '/admin/users',
        label: 'Users',
        icon: Users,
        permission: 'users.manage',
    },
    {
        to: '/admin/branches',
        label: 'Branches',
        icon: Building2,
        permission: 'branches.manage',
    },
    {
        to: '/admin/fields',
        label: 'Fields',
        icon: ListChecks,
        permission: 'fields.manage',
    },
    {
        to: '/admin/templates',
        label: 'Templates',
        icon: LayoutTemplate,
        permission: 'templates.manage',
    },
];

export function AppShell() {
    const me = useMe();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const logout = async () => {
        await api('/auth/logout', 'POST');
        queryClient.clear();
        await navigate({ to: '/login' });
    };

    return (
        <div className="min-h-screen">
            <header className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
                    <Link to="/" className="shrink-0">
                        <img src={LOGO_URL} alt={COMPANY_NAME} className="h-8 w-auto" />
                    </Link>
                    <nav className="flex flex-1 gap-1 overflow-x-auto">
                        {NAV.filter((n) => !n.permission || can(me.role, n.permission)).map(
                            ({ to, label, icon: Icon }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    activeOptions={{ exact: true }}
                                    className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 data-[status=active]:bg-brand/10 data-[status=active]:text-brand"
                                >
                                    <Icon className="size-4" />
                                    <span className="hidden sm:inline">{label}</span>
                                </Link>
                            ),
                        )}
                    </nav>
                    <div className="hidden text-right text-xs leading-tight md:block">
                        <div className="font-medium">{me.name}</div>
                        <div className="text-slate-500">{ROLE_LABELS[me.role]}</div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void logout()}
                        aria-label="Log out"
                    >
                        <LogOut className="size-4" />
                    </Button>
                </div>
            </header>
            <main className="mx-auto max-w-7xl px-4 py-6">
                <Outlet />
            </main>
        </div>
    );
}
