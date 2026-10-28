import type { FieldDefinition } from '@shared/fields';
import { ELEMENT_KINDS, ELEMENT_LABELS, type ElementKind } from '@shared/layout';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';

interface PaletteProps {
    fields: FieldDefinition[];
    placedKeys: ReadonlySet<string>;
    onAdd: (kind: ElementKind, fieldKey?: string) => void;
}

const STATIC_KINDS = ELEMENT_KINDS.filter((k) => k !== 'field');

export function Palette({ fields, placedKeys, onAdd }: PaletteProps) {
    const [query, setQuery] = useState('');
    const term = query.trim().toLowerCase();
    const matches = (...texts: string[]) => texts.some((t) => t.toLowerCase().includes(term));
    const available = fields.filter(
        (f) => f.isActive && !placedKeys.has(f.key) && matches(f.label, f.key),
    );
    const kinds = STATIC_KINDS.filter((kind) => matches(ELEMENT_LABELS[kind]));
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
            <div className="relative px-1 pt-1">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 mt-0.5 text-muted-foreground" />
                <Input
                    type="search"
                    aria-label="Search fields and elements"
                    placeholder="Search…"
                    className="h-8 pl-8"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                    }}
                />
            </div>
            <section>
                <h3 className="mb-1 px-2 text-xs font-semibold uppercase text-muted-foreground">
                    Fields
                </h3>
                {available.length === 0 ? (
                    <p className="px-2 text-xs text-muted-foreground">
                        {term ? 'No matching fields' : 'All fields placed'}
                    </p>
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
                {kinds.length === 0 && (
                    <p className="px-2 text-xs text-muted-foreground">No matching elements</p>
                )}
                {kinds.map((kind) =>
                    item(kind, ELEMENT_LABELS[kind], () => {
                        onAdd(kind);
                    }),
                )}
            </section>
        </div>
    );
}
