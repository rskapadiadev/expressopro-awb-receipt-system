import type { LucideIcon } from 'lucide-react';
import { FormField } from '@/components/ui/form';
import { cn } from '@/lib/utils';

// Ink colours that print well; these are receipt content, not UI theme colours.
const SWATCHES = ['#000000', '#4b5563', '#dc2626', '#ea580c', '#16a34a', '#2563eb', '#7c3aed'];

interface ColorFieldProps {
    label: string;
    value: string | undefined;
    // Shown in the picker while no colour is set (e.g. black text).
    fallback: string;
    noneLabel?: string;
    onChange: (color: string | undefined) => void;
}

export function ColorField({
    label,
    value,
    fallback,
    noneLabel = 'Default',
    onChange,
}: ColorFieldProps) {
    return (
        <FormField label={label}>
            <div className="flex flex-wrap items-center gap-1.5">
                {SWATCHES.map((c) => (
                    <button
                        key={c}
                        type="button"
                        aria-label={c}
                        aria-pressed={value === c}
                        className={cn(
                            'size-6 rounded-md border border-border transition-transform hover:scale-110',
                            value === c &&
                                'ring-2 ring-primary ring-offset-1 ring-offset-background',
                        )}
                        style={{ backgroundColor: c }}
                        onClick={() => {
                            onChange(c);
                        }}
                    />
                ))}
                <input
                    type="color"
                    aria-label={`Custom ${label.toLowerCase()}`}
                    className="size-6 cursor-pointer rounded-md border border-border bg-transparent"
                    value={value ?? fallback}
                    onChange={(e) => {
                        onChange(e.target.value);
                    }}
                />
                <button
                    type="button"
                    className="ml-auto text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
                    disabled={!value}
                    onClick={() => {
                        onChange(undefined);
                    }}
                >
                    {noneLabel}
                </button>
            </div>
        </FormField>
    );
}

interface ColorButtonProps {
    label: string;
    icon: LucideIcon;
    value: string | undefined;
    fallback: string;
    onChange: (color: string) => void;
}

// Toolbar variant: an icon with a colour bar underneath that opens the native picker.
export function ColorButton({ label, icon: Icon, value, fallback, onChange }: ColorButtonProps) {
    return (
        <label
            title={label}
            className="relative inline-flex size-7 cursor-pointer flex-col items-center justify-center rounded-md hover:bg-accent"
        >
            <Icon className="size-3.5" />
            <span
                className="mt-0.5 h-1 w-4 rounded-full border border-border"
                style={{ backgroundColor: value ?? fallback }}
            />
            <input
                type="color"
                aria-label={label}
                className="absolute inset-0 cursor-pointer opacity-0"
                value={value ?? fallback}
                onChange={(e) => {
                    onChange(e.target.value);
                }}
            />
        </label>
    );
}
