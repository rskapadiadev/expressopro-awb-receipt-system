import { useQueryClient } from '@tanstack/react-query';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { can, type Permission, ROLE_LABELS } from '@shared/permissions';
import {
    Building2,
    ChevronsUpDown,
    FileText,
    KeyRound,
    LayoutDashboard,
    LayoutTemplate,
    ListChecks,
    LogOut,
    type LucideIcon,
    Monitor,
    Moon,
    Plus,
    Sun,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';
import { type Theme, useTheme } from '@/components/theme/theme';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';
import { api } from '@/lib/api';
import { COMPANY_NAME, LOGO_MARK_URL } from '@/lib/brand';
import { useMe } from '@/lib/queries';
import { initials } from '@/lib/utils';

interface NavItem {
    to: string;
    label: string;
    icon: LucideIcon;
    permission?: Permission;
}

const WORKSPACE: NavItem[] = [
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
];

const ADMIN: NavItem[] = [
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

interface ThemeOption {
    value: Theme;
    label: string;
    icon: LucideIcon;
}

const THEMES: ThemeOption[] = [
    {
        value: 'light',
        label: 'Light',
        icon: Sun,
    },
    {
        value: 'dark',
        label: 'Dark',
        icon: Moon,
    },
    {
        value: 'system',
        label: 'System',
        icon: Monitor,
    },
];

const ALL_NAV = [...WORKSPACE, ...ADMIN];

// Longest matching path wins, so /receipts/42 highlights "Receipts" but /receipts/new its own item.
function activeItem(pathname: string) {
    return ALL_NAV.filter(
        (n) => n.to === pathname || (n.to !== '/' && pathname.startsWith(`${n.to}/`)),
    )
        .sort((a, b) => b.to.length - a.to.length)
        .find((n) => n.to !== '/receipts/new' || pathname === '/receipts/new');
}

interface NavGroupProps {
    label: string;
    items: NavItem[];
    active?: NavItem;
}

function NavGroup({ label, items, active }: NavGroupProps) {
    const { isMobile, setOpenMobile } = useSidebar();
    if (items.length === 0) {
        return null;
    }
    return (
        <SidebarGroup>
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.to}>
                            <SidebarMenuButton
                                asChild
                                isActive={item === active}
                                tooltip={item.label}
                            >
                                <Link
                                    to={item.to}
                                    onClick={() => {
                                        if (isMobile) {
                                            setOpenMobile(false);
                                        }
                                    }}
                                >
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}

function UserMenu() {
    const me = useMe();
    const { theme, setTheme } = useTheme();
    const { isMobile } = useSidebar();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [passwordOpen, setPasswordOpen] = useState(false);

    const logout = async () => {
        await api('/auth/logout', 'POST');
        queryClient.clear();
        await navigate({ to: '/login' });
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                {/* Non-modal so the password dialog can take focus cleanly after the menu closes. */}
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="size-8 rounded-lg">
                                <AvatarFallback className="rounded-lg bg-primary/15 font-semibold text-primary">
                                    {initials(me.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{me.name}</span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {ROLE_LABELS[me.role]}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? 'bottom' : 'right'}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="font-normal">
                            <div className="text-sm font-semibold">{me.name}</div>
                            <div className="text-xs text-muted-foreground">@{me.username}</div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Theme
                        </DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                            value={theme}
                            onValueChange={(v) => {
                                setTheme(v as Theme);
                            }}
                        >
                            {THEMES.map((t) => (
                                <DropdownMenuRadioItem key={t.value} value={t.value}>
                                    <t.icon className="size-4" /> {t.label}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={() => {
                                setPasswordOpen(true);
                            }}
                        >
                            <KeyRound /> Change password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => {
                                void logout();
                            }}
                        >
                            <LogOut /> Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

function ThemeToggle() {
    const { resolved, setTheme } = useTheme();
    return (
        <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle dark mode"
            onClick={() => {
                setTheme(resolved === 'dark' ? 'light' : 'dark');
            }}
        >
            <Sun className="scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
        </Button>
    );
}

export function AppShell() {
    const me = useMe();
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const active = activeItem(pathname);
    const allowed = (n: NavItem) => !n.permission || can(me.role, n.permission);

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon" variant="inset" className="no-print">
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                                <Link to="/">
                                    <img
                                        src={LOGO_MARK_URL}
                                        alt=""
                                        className="size-8 rounded-lg shadow-sm"
                                    />
                                    <div className="grid flex-1 text-left leading-tight">
                                        <span className="truncate font-bold">{COMPANY_NAME}</span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            AWB Receipts
                                        </span>
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>
                <SidebarContent>
                    <NavGroup label="Workspace" items={WORKSPACE} active={active} />
                    <NavGroup
                        label="Administration"
                        items={ADMIN.filter(allowed)}
                        active={active}
                    />
                </SidebarContent>
                <SidebarFooter>
                    <UserMenu />
                </SidebarFooter>
                <SidebarRail />
            </Sidebar>
            <SidebarInset className="min-w-0">
                <header className="no-print sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 rounded-t-xl border-b bg-background/80 px-4 backdrop-blur-md">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-1 data-[orientation=vertical]:h-4"
                    />
                    <span className="truncate text-sm font-medium">
                        {active?.label ?? 'ExpressoPro'}
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                        {pathname !== '/receipts/new' && (
                            <Button asChild size="sm" aria-label="New receipt">
                                <Link to="/receipts/new">
                                    <Plus /> <span className="hidden sm:inline">New receipt</span>
                                </Link>
                            </Button>
                        )}
                        <ThemeToggle />
                    </div>
                </header>
                {/* Keyed by path so every navigation replays the entrance animation. */}
                <main key={pathname} className="w-full animate-fade-up p-4 md:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl">
                        <Outlet />
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
