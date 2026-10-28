import type {
    InputHTMLAttributes,
    LabelHTMLAttributes,
    ReactNode,
    SelectHTMLAttributes,
    TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

// Matches shadcn's Input so native selects and textareas look like the same family.
const control =
    'w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1.5 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm dark:bg-input/30';

export { Input } from './input';

export const Textarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea className={cn(control, 'min-h-20 py-2', className)} {...props} />
);

export const Select = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
    <select
        className={cn(control, 'h-9 cursor-pointer pr-8 dark:[&>option]:bg-popover', className)}
        {...props}
    />
);

export const Label = ({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
    <label className={cn('text-sm leading-none font-medium select-none', className)} {...props} />
);

export const Checkbox = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
    <input
        type="checkbox"
        className={cn('size-4 shrink-0 cursor-pointer rounded accent-primary', className)}
        {...props}
    />
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
        <div className={cn('grid content-start gap-2', className)}>
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {error ? (
                <p className="text-xs font-medium text-destructive">{error}</p>
            ) : (
                hint && <p className="text-xs text-muted-foreground">{hint}</p>
            )}
        </div>
    );
}

export const ErrorBanner = ({ message }: { message?: string }) =>
    message ? (
        <p
            role="alert"
            className="animate-fade-up rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
            {message}
        </p>
    ) : null;
