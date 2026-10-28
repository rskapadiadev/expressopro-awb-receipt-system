import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { secureHeaders } from 'hono/secure-headers';
import { createDb } from './db';
import type { AppEnv } from './env';
import { requireAuth } from './middleware/auth';
import { authRoutes } from './routes/auth';
import { branchRoutes } from './routes/branches';
import { companyRoutes } from './routes/company';
import { dashboardRoutes } from './routes/dashboard';
import { fieldRoutes } from './routes/fields';
import { receiptRoutes } from './routes/receipts';
import { templateRoutes } from './routes/templates';
import { userRoutes } from './routes/users';

const app = new Hono<AppEnv>().basePath('/api');

app.use(secureHeaders());
app.use(async (c, next) => {
    c.set('db', createDb(c.env.DB));
    await next();
});
// Plain cookie auth: reject cross-site writes instead of relying on SameSite alone.
app.use(async (c, next) => {
    const origin = c.req.header('origin');
    if (c.req.method !== 'GET' && origin && new URL(origin).host !== new URL(c.req.url).host) {
        return c.json({ error: 'Cross-origin request blocked' }, 403);
    }
    await next();
});

app.route('/auth', authRoutes);
app.use('*', requireAuth);
app.route('/users', userRoutes);
app.route('/branches', branchRoutes);
app.route('/company', companyRoutes);
app.route('/fields', fieldRoutes);
app.route('/templates', templateRoutes);
app.route('/receipts', receiptRoutes);
app.route('/dashboard', dashboardRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return err.res ?? c.json({ error: err.message }, err.status);
    }
    console.error(err);
    return c.json({ error: 'Something went wrong' }, 500);
});

export default app;
