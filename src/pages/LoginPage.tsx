import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { loginSchema } from '@shared/schemas';
import type { Me } from '@shared/types';
import { LayoutTemplate, Loader2, LogIn, Printer, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { ErrorBanner, FormField, Input } from '@/components/ui/form';
import { api, applyServerErrors } from '@/lib/api';
import { COMPANY_NAME, LOGO_MARK_URL, LOGO_URL } from '@/lib/brand';
import { meQuery } from '@/lib/queries';
import { stagger } from '@/lib/utils';

const HIGHLIGHTS = [
    {
        icon: Zap,
        text: 'Branch-wise AWB numbers, generated instantly',
    },
    {
        icon: LayoutTemplate,
        text: 'Your own receipt templates, pixel-perfect in print',
    },
    {
        icon: Printer,
        text: 'Bulk print to roll, label or A4 printers',
    },
];

export function LoginPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });

    const onSubmit = handleSubmit(async (values) => {
        try {
            queryClient.setQueryData(
                meQuery.queryKey,
                await api<Me>('/auth/login', 'POST', values),
            );
            await navigate({ to: '/' });
        } catch (err) {
            applyServerErrors(err, setError);
        }
    });

    return (
        <div className="grid min-h-dvh lg:grid-cols-2">
            <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
                <div className="bg-grid absolute inset-0 opacity-40" />
                <div className="absolute -top-32 -right-24 size-96 rounded-full bg-white/15 blur-3xl" />
                <div className="absolute -bottom-40 -left-20 size-[28rem] rounded-full bg-black/20 blur-3xl" />
                <div className="relative flex items-center gap-3">
                    <img
                        src={LOGO_MARK_URL}
                        alt=""
                        className="size-10 rounded-xl bg-white p-1 shadow-lg ring-2 ring-white/30"
                    />
                    <span className="text-lg font-bold">{COMPANY_NAME}</span>
                </div>
                <div className="relative max-w-md space-y-6">
                    <h2 className="text-4xl leading-tight font-bold">
                        Book, track and print consignments in seconds.
                    </h2>
                    <ul className="space-y-3 text-primary-foreground/85">
                        {HIGHLIGHTS.map(({ icon: Icon, text }, i) => (
                            <li
                                key={text}
                                className="flex animate-fade-up items-center gap-3"
                                style={stagger(i + 2)}
                            >
                                <span className="grid size-8 place-items-center rounded-lg bg-white/15">
                                    <Icon className="size-4" />
                                </span>
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="relative text-sm text-primary-foreground/70">
                    © {new Date().getFullYear()} {COMPANY_NAME}
                </p>
            </aside>
            <main className="flex items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-sm animate-fade-up space-y-8">
                    <div className="space-y-2">
                        <img
                            src={LOGO_URL}
                            alt={COMPANY_NAME}
                            className="h-10 w-auto rounded-lg lg:hidden dark:bg-white dark:p-1.5"
                        />
                        <h1 className="text-3xl font-bold">Welcome back</h1>
                        <p className="text-muted-foreground">
                            Sign in to your account to continue.
                        </p>
                    </div>
                    <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
                        <ErrorBanner message={errors.root?.message} />
                        <FormField
                            label="Username"
                            htmlFor="username"
                            error={errors.username?.message}
                        >
                            <Input
                                id="username"
                                autoComplete="username"
                                autoFocus
                                className="h-11"
                                {...register('username')}
                            />
                        </FormField>
                        <FormField
                            label="Password"
                            htmlFor="password"
                            error={errors.password?.message}
                        >
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                className="h-11"
                                {...register('password')}
                            />
                        </FormField>
                        <Button
                            type="submit"
                            size="lg"
                            className="h-11 w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <LogIn />}
                            {isSubmitting ? 'Signing in…' : 'Sign in'}
                        </Button>
                    </form>
                </div>
            </main>
        </div>
    );
}
