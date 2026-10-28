import type { FieldDefinition } from '@shared/fields';
import { ELEMENT_KINDS, ELEMENT_LABELS, ELEMENT_SOURCE, type ElementKind } from '@shared/layout';
import { LocateFixed, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';

interface PaletteProps {
    fields: FieldDefinition[];
    placedKeys: ReadonlySet<string>;
    onAdd: (kind: ElementKind, fieldKey?: string) => void;
    // Selects the canvas element already showing this field.
    onLocate: (fieldKey: string) => void;
    // Shown only to roles that can edit the field library.
    onNewField?: () => void;
}

// Library fields are listed separately; the rest are split by where their value comes from.
const GROUPS = [
    {
        title: 'Automatic',
        kinds: ELEMENT_KINDS.filter((k) => ELEMENT_SOURCE[k] === 'auto'),
    },
    {
        title: 'Design',
        kinds: ELEMENT_KINDS.filter((k) => k !== 'field' && ELEMENT_SOURCE[k] !== 'auto'),
    },
];

export function Palette({ fields, placedKeys, onAdd, onLocate, onNewField }: PaletteProps) {
    const [query, setQuery] = useState('');
    const term = query.trim().toLowerCase();
    const matches = (...texts: string[]) => texts.some((t) => t.toLowerCase().includes(term));
    const found = fields.filter((f) => f.isActive && matches(f.label, f.key));
    // Unplaced fields first; placed ones stay listed (and searchable) so they can be found on the canvas.
    const available = found.filter((f) => !placedKeys.has(f.key));
    const placed = found.filter((f) => placedKeys.has(f.key));
    const groups = GROUPS.map((g) => ({
        ...g,
        kinds: g.kinds.filter((kind) => matches(ELEMENT_LABELS[kind])),
    }));
    const noElements = groups.every((g) => g.kinds.length === 0);
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
                <div className="mb-1 flex items-center justify-between px-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                        Fields
                    </h3>
                    {onNewField && (
                        <Button
                            variant="ghost"
                            size="xs"
                            className="text-primary"
                            onClick={onNewField}
                        >
                            <Plus /> New field
                        </Button>
                    )}
                </div>
                {found.length === 0 && (
                    <p className="px-2 text-xs text-muted-foreground">
                        {term ? 'No matching fields' : 'No fields yet'}
                    </p>
                )}
                {available.map((f) =>
                    item(f.key, f.label, () => {
                        onAdd('field', f.key);
                    }),
                )}
                {placed.map((f) => (
                    <Button
                        key={f.key}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-muted-foreground"
                        title="Already on the template: click to select it"
                        onClick={() => {
                            onLocate(f.key);
                        }}
                    >
                        <LocateFixed className="size-3.5" />
                        <span className="truncate">{f.label}</span>
                        <span className="ml-auto text-[10px] uppercase tracking-wide">Placed</span>
                    </Button>
                ))}
            </section>
            {noElements && (
                <p className="px-2 text-xs text-muted-foreground">No matching elements</p>
            )}
            {groups.map(
                (g) =>
                    g.kinds.length > 0 && (
                        <section key={g.title}>
                            <h3 className="mb-1 px-2 text-xs font-semibold uppercase text-muted-foreground">
                                {g.title}
                            </h3>
                            {g.kinds.map((kind) =>
                                item(kind, ELEMENT_LABELS[kind], () => {
                                    onAdd(kind);
                                }),
                            )}
                        </section>
                    ),
            )}
        </div>
    );
}
