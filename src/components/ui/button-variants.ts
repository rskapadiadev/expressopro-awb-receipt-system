import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    {
        variants: {
            variant: {
                primary: 'bg-brand text-brand-fg hover:bg-brand/90',
                outline: 'border border-slate-300 bg-white hover:bg-slate-100',
                ghost: 'hover:bg-slate-100',
                danger: 'bg-red-600 text-white hover:bg-red-700',
            },
            size: {
                sm: 'h-8 px-3',
                md: 'h-10 px-4',
                icon: 'h-9 w-9',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    },
);
