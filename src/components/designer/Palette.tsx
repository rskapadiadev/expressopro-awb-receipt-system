import { COMPANY_LABELS, COMPANY_PROPS } from '@shared/company';
import type { FieldDefinition } from '@shared/fields';
import {
    ELEMENT_KINDS,
    ELEMENT_LABELS,
    ELEMENT_SOURCE,
    type ElementKind,
    type LayoutElement,
} from '@shared/layout';
import { ChevronDown, LocateFixed, Plus, Search } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { cn } from '@/lib/utils';

interface PaletteProps {
    fields: FieldDefinition[];
    placedKeys: ReadonlySet<string>;
    onAdd: (kind: ElementKind, preset?: Partial<LayoutElement>) => void;
    // Selects the canvas element already showing this field.
    onLocate: (fieldKey: string) => void;
    // Shown only to roles that can edit the field library.
    onNewField?: () => void;
}

interface PaletteItem {
    key: string;
    label: string;
    kind: ElementKind;
    preset?: Partial<LayoutElement>;
}

const kindItem = (kind: ElementKind): PaletteItem => ({
    key: kind,
    label: ELEMENT_LABELS[kind],
    kind,
});

// Each company detail is its own entry, so "GSTIN" etc. can be found and added directly.
const AUTOMATIC: PaletteItem[] = [
    ...ELEMENT_KINDS.filter((k) => ELEMENT_SOURCE[k] === 'auto' && k !== 'company').map(kindItem),
    ...COMPANY_PROPS.map((prop) => ({
        key: `company:${prop}`,
        label: COMPANY_LABELS[prop],
        kind: 'company' as const,
        preset: { text: prop },
    })),
];
const DESIGN: PaletteItem[] = ELEMENT_KINDS.filter(
    (k) => k !== 'field' && ELEMENT_SOURCE[k] !== 'auto',
).map(kindItem);

type SectionId = 'fields' | 'automatic' | 'design';

interface SectionProps {
    title: string;
    count: number;
    open: boolean;
    onToggle: () => void;
    action?: ReactNode;
    children: ReactNode;
}

// Collapsible group; the grid-rows trick animates height without measuring it.
function Section({ title, count, open, onToggle, action, children }: SectionProps) {
    return (
        <section>
            <div className="flex items-center gap-1 px-1">
                <button
                    type="button"
                    aria-expanded={open}
                    className="flex flex-1 items-center gap-1.5 rounded-md px-1 py-1.5 text-xs font-semibold uppercase text-muted-foreground transition-colors hover:text-foreground"
                    onClick={onToggle}
                >
                    <ChevronDown
                        className={cn('size-3.5 transition-transform', !open && '-rotate-90')}
                    />
                    {title}
                    <span className="font-normal tabular-nums">{count}</span>
                </button>
                {action}
            </div>
            <div
                className={cn(
                    'grid transition-[grid-template-rows] duration-200',
                    open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
            >
                <div className="overflow-hidden" inert={!open}>
                    {children}
                </div>
            </div>
        </section>
    );
}

export function Palette({ fields, placedKeys, onAdd, onLocate, onNewField }: PaletteProps) {
    const [query, setQuery] = useState('');
    // One section open at a time; Fields starts open.
    const [openId, setOpenId] = useState<SectionId | null>('fields');
    const term = query.trim().toLowerCase();
    const searching = term !== '';
    const matches = (...texts: string[]) => texts.some((t) => t.toLowerCase().includes(term));

    const found = fields.filter((f) => f.isActive && matches(f.label, f.key));
    // Unplaced fields first; placed ones stay listed (and searchable) so they can be found on the canvas.
    const available = found.filter((f) => !placedKeys.has(f.key));
    const placed = found.filter((f) => placedKeys.has(f.key));
    const automatic = AUTOMATIC.filter((i) => matches(i.label));
    const design = DESIGN.filter((i) => matches(i.label));

    // While searching, every section with matches is expanded and empty ones are hidden.
    const sectionProps = (id: SectionId, count: number) => ({
        count,
        open: searching || openId === id,
        onToggle: () => {
            setOpenId((current) => (current === id ? null : id));
        },
    });
    const visible = (count: number) => !searching || count > 0;

    const addButton = (item: PaletteItem) => (
        <Button
            key={item.key}
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
                onAdd(item.kind, item.preset);
            }}
        >
            <Plus className="size-3.5" /> {item.label}
        </Button>
    );

    return (
        <div className="space-y-2">
            <div className="relative px-1 pt-1 pb-1">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
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
            {searching && found.length + automatic.length + design.length === 0 && (
                <p className="px-2 text-xs text-muted-foreground">Nothing matches “{query}”</p>
            )}
            {visible(found.length) && (
                <Section
                    title="Fields"
                    {...sectionProps('fields', found.length)}
                    action={
                        onNewField && (
                            <Button
                                variant="ghost"
                                size="xs"
                                className="text-primary"
                                onClick={onNewField}
                            >
                                <Plus /> New field
                            </Button>
                        )
                    }
                >
                    {found.length === 0 && (
                        <p className="px-2 pb-1 text-xs text-muted-foreground">No fields yet</p>
                    )}
                    {available.map((f) =>
                        addButton({
                            key: f.key,
                            label: f.label,
                            kind: 'field',
                            preset: { fieldKey: f.key },
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
                            <span className="ml-auto text-[10px] uppercase tracking-wide">
                                Placed
                            </span>
                        </Button>
                    ))}
                </Section>
            )}
            {visible(automatic.length) && (
                <Section title="Automatic" {...sectionProps('automatic', automatic.length)}>
                    {automatic.map(addButton)}
                </Section>
            )}
            {visible(design.length) && (
                <Section title="Design" {...sectionProps('design', design.length)}>
                    {design.map(addButton)}
                </Section>
            )}
        </div>
    );
}
