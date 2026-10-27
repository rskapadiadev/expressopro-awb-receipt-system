import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { loginSchema } from '@shared/schemas';
import type { Me } from '@shared/types';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBanner, FormField, Input } from '@/components/ui/form';
import { api, applyServerErrors } from '@/lib/api';
import { COMPANY_NAME, LOGO_URL } from '@/lib/brand';
import { meQuery } from '@/lib/queries';

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
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-sm p-6">
                <img src={LOGO_URL} alt={COMPANY_NAME} className="mb-4 h-12 w-auto" />
                <h1 className="text-xl font-semibold">AWB Receipts</h1>
                <p className="mb-6 text-sm text-slate-500">Sign in to continue</p>
                <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
                    <ErrorBanner message={errors.root?.message} />
                    <FormField label="Username" htmlFor="username" error={errors.username?.message}>
                        <Input
                            id="username"
                            autoComplete="username"
                            autoFocus
                            {...register('username')}
                        />
                    </FormField>
                    <FormField label="Password" htmlFor="password" error={errors.password?.message}>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            {...register('password')}
                        />
                    </FormField>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Signing in…' : 'Sign in'}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
