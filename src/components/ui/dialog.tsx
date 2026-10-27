import { X } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';
import { Button } from './button';

interface DialogProps {
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
}

export function Dialog({ open, title, onClose, children }: DialogProps) {
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (open && !el?.open) {
            el?.showModal();
        } else if (!open && el?.open) {
            el.close();
        }
    }, [open]);

    return (
        <dialog
            ref={ref}
            onClose={onClose}
            className="m-auto w-[min(36rem,calc(100vw-2rem))] rounded-lg p-0 shadow-xl backdrop:bg-slate-900/40"
        >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <h2 className="font-semibold">{title}</h2>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                    <X className="size-4" />
                </Button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto p-5">{open && children}</div>
        </dialog>
    );
}
