import type { QueryClient } from '@tanstack/react-query';
import {
    createRootRouteWithContext,
    createRoute,
    createRouter,
    lazyRouteComponent,
    Outlet,
    redirect,
    type RouteComponent,
} from '@tanstack/react-router';
import { can, type Permission } from '@shared/permissions';
import { receiptQuerySchema } from '@shared/schemas';
import type { Me } from '@shared/types';
import { z } from 'zod';
import { AppShell } from './components/AppShell';
import { meQuery } from './lib/queries';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ReceiptDetailPage } from './pages/ReceiptDetailPage';
import { ReceiptNewPage } from './pages/ReceiptNewPage';
import { ReceiptsPage } from './pages/ReceiptsPage';

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({ component: Outlet });

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: LoginPage,
});

const authedRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'authed',
    beforeLoad: async ({ context }) => {
        const me = await context.queryClient
            .query({
                ...meQuery,
                staleTime: 'static',
            })
            .catch(() => null);
        if (!me) {
            // eslint-disable-next-line @typescript-eslint/only-throw-error -- router redirect convention
            throw redirect({ to: '/login' });
        }
        return { me };
    },
    component: Outlet,
});

const shellRoute = createRoute({
    getParentRoute: () => authedRoute,
    id: 'shell',
    component: AppShell,
});

const page = <TPath extends string>(path: TPath, component: RouteComponent) =>
    createRoute({
        getParentRoute: () => shellRoute,
        path,
        component,
    });

// Same permission matrix as the API, so hidden screens are also unreachable by URL.
const guard =
    (permission: Permission) =>
    ({ context }: { context: { me: Me } }) => {
        if (!can(context.me.role, permission)) {
            // eslint-disable-next-line @typescript-eslint/only-throw-error -- router redirect convention
            throw redirect({ to: '/' });
        }
    };

const adminPage = <TPath extends string>(
    path: TPath,
    permission: Permission,
    component: RouteComponent,
) =>
    createRoute({
        getParentRoute: () => shellRoute,
        path,
        beforeLoad: guard(permission),
        component,
    });

const idParams = {
    parse: (p: { id: string }) => ({ id: Number(p.id) }),
    stringify: (p: { id: number }) => ({ id: String(p.id) }),
};

const receiptsRoute = createRoute({
    getParentRoute: () => shellRoute,
    path: '/receipts',
    validateSearch: receiptQuerySchema.partial(),
    component: ReceiptsPage,
});

const receiptDetailRoute = createRoute({
    getParentRoute: () => shellRoute,
    path: '/receipts/$id',
    params: idParams,
    component: ReceiptDetailPage,
});

const printRoute = createRoute({
    getParentRoute: () => authedRoute,
    path: '/print',
    validateSearch: z.object({ ids: z.string().catch('') }),
    component: lazyRouteComponent(() => import('./pages/PrintPage'), 'PrintPage'),
});

const designerRoute = createRoute({
    getParentRoute: () => authedRoute,
    path: '/admin/templates/$id/design',
    params: idParams,
    beforeLoad: guard('templates.manage'),
    component: lazyRouteComponent(
        () => import('./pages/admin/TemplateDesignerPage'),
        'TemplateDesignerPage',
    ),
});

const routeTree = rootRoute.addChildren([
    loginRoute,
    authedRoute.addChildren([
        shellRoute.addChildren([
            page('/', DashboardPage),
            receiptsRoute,
            page('/receipts/new', ReceiptNewPage),
            receiptDetailRoute,
            adminPage(
                '/admin/users',
                'users.manage',
                lazyRouteComponent(() => import('./pages/admin/UsersPage'), 'UsersPage'),
            ),
            adminPage(
                '/admin/branches',
                'branches.manage',
                lazyRouteComponent(() => import('./pages/admin/BranchesPage'), 'BranchesPage'),
            ),
            adminPage(
                '/admin/fields',
                'fields.manage',
                lazyRouteComponent(() => import('./pages/admin/FieldsPage'), 'FieldsPage'),
            ),
            adminPage(
                '/admin/templates',
                'templates.manage',
                lazyRouteComponent(() => import('./pages/admin/TemplatesPage'), 'TemplatesPage'),
            ),
        ]),
        printRoute,
        designerRoute,
    ]),
]);

export const createAppRouter = (queryClient: QueryClient) =>
    createRouter({
        routeTree,
        context: { queryClient },
        defaultPreload: 'intent',
    });

declare module '@tanstack/react-router' {
    interface Register {
        router: ReturnType<typeof createAppRouter>;
    }
}
