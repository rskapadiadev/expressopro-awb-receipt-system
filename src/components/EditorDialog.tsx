import type { ReactNode } from 'react';
import { Dialog } from './ui/dialog';

export type Editing<T> = T | 'new' | null;

interface EditorDialogProps<T> {
    editing: Editing<T>;
    noun: string;
    onClose: () => void;
    children: (item: T | null) => ReactNode;
}

// Create/edit dialog shared by the admin CRUD screens; children get null when creating.
export function EditorDialog<T>({ editing, noun, onClose, children }: EditorDialogProps<T>) {
    return (
        <Dialog
            open={editing !== null}
            title={editing === 'new' ? `New ${noun}` : `Edit ${noun}`}
            onClose={onClose}
        >
            {editing !== null && children(editing === 'new' ? null : editing)}
        </Dialog>
    );
}
