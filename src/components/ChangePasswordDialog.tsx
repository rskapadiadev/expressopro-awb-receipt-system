import { zodResolver } from '@hookform/resolvers/zod';
import { type ChangePasswordInput, changePasswordSchema } from '@shared/schemas';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ErrorBanner, FormField, Input } from '@/components/ui/form';
import { api, applyServerErrors } from '@/lib/api';

const FIELDS = [
    {
        name: 'currentPassword',
        label: 'Current password',
        autoComplete: 'current-password',
    },
    {
        name: 'newPassword',
        label: 'New password',
        autoComplete: 'new-password',
    },
    {
        name: 'confirmPassword',
        label: 'Confirm new password',
        autoComplete: 'new-password',
    },
] as const;

interface ChangePasswordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

    const close = (next: boolean) => {
        if (!next) {
            reset();
        }
        onOpenChange(next);
    };

    const onSubmit = handleSubmit(async (input) => {
        try {
            await api('/auth/password', 'POST', input);
            toast.success('Password changed. Other devices have been signed out.');
            close(false);
        } catch (err) {
            applyServerErrors(err, setError);
        }
    });

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Change password</DialogTitle>
                    <DialogDescription>
                        Use at least 8 characters. You&apos;ll stay signed in here.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
                    <ErrorBanner message={errors.root?.message} />
                    {FIELDS.map((f) => (
                        <FormField
                            key={f.name}
                            label={f.label}
                            htmlFor={f.name}
                            error={errors[f.name]?.message}
                        >
                            <Input
                                id={f.name}
                                type="password"
                                autoComplete={f.autoComplete}
                                {...register(f.name)}
                            />
                        </FormField>
                    ))}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                close(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="animate-spin" />}
                            Update password
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
