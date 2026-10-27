import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

export type Editing<T> = T | 'new' | null;

interface EditorDialogProps<T> {
    editing: Editing<T>;
    noun: string;
    onClose: () => void;
    children: (item: T | null) => ReactNode;
}

// Create/edit dialog shared by the admin CRUD screens; children get null when creating.
export function EditorDialog<T>({ editing, noun, onClose, children }: EditorDialogProps<T>) {
    const isNew = editing === 'new';
    return (
        <Dialog
            open={editing !== null}
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
        >
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{isNew ? `New ${noun}` : `Edit ${noun}`}</DialogTitle>
                    <DialogDescription>
                        {isNew
                            ? `Fill in the details to create a ${noun}.`
                            : `Update this ${noun}.`}
                    </DialogDescription>
                </DialogHeader>
                {editing !== null && children(isNew ? null : editing)}
            </DialogContent>
        </Dialog>
    );
}
