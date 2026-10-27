import type { FieldDefinition } from '@shared/fields';
import { ELEMENT_KINDS, ELEMENT_LABELS, type ElementKind } from '@shared/layout';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaletteProps {
    fields: FieldDefinition[];
    placedKeys: ReadonlySet<string>;
    onAdd: (kind: ElementKind, fieldKey?: string) => void;
}

const STATIC_KINDS = ELEMENT_KINDS.filter((k) => k !== 'field');

export function Palette({ fields, placedKeys, onAdd }: PaletteProps) {
    const available = fields.filter((f) => f.isActive && !placedKeys.has(f.key));
    const item = (key: string, label: string, onClick: () => void) => (
        <Button
            key={key}
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onClick}
        >
            <Plus className="size-3.5" /> {label}
        </Button>
    );

    return (
        <div className="space-y-4">
            <section>
                <h3 className="mb-1 px-2 text-xs font-semibold uppercase text-muted-foreground">
                    Fields
                </h3>
                {available.length === 0 ? (
                    <p className="px-2 text-xs text-muted-foreground">All fields placed</p>
                ) : (
                    available.map((f) =>
                        item(f.key, f.label, () => {
                            onAdd('field', f.key);
                        }),
                    )
                )}
            </section>
            <section>
                <h3 className="mb-1 px-2 text-xs font-semibold uppercase text-muted-foreground">
                    Elements
                </h3>
                {STATIC_KINDS.map((kind) =>
                    item(kind, ELEMENT_LABELS[kind], () => {
                        onAdd(kind);
                    }),
                )}
            </section>
        </div>
    );
}
