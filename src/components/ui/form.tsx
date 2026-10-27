import type {
    InputHTMLAttributes,
    LabelHTMLAttributes,
    ReactNode,
    SelectHTMLAttributes,
    TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

const control =
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-slate-100';

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
    <input className={cn(control, 'h-10', className)} {...props} />
);

export const Textarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea className={cn(control, 'min-h-20', className)} {...props} />
);

export const Select = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
    <select className={cn(control, 'h-10', className)} {...props} />
);

export const Label = ({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
    <label className={cn('text-sm font-medium text-slate-700', className)} {...props} />
);

export const Checkbox = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
    <input type="checkbox" className={cn('size-4 accent-brand', className)} {...props} />
);

interface FieldProps {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    className?: string;
    children: ReactNode;
}

export function FormField({ label, htmlFor, error, hint, className, children }: FieldProps) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {error ? (
                <p className="text-xs text-red-600">{error}</p>
            ) : (
                hint && <p className="text-xs text-slate-500">{hint}</p>
            )}
        </div>
    );
}

export const ErrorBanner = ({ message }: { message?: string }) =>
    message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
        </p>
    ) : null;
