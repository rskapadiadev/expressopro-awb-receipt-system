import { useQuery } from '@tanstack/react-query';
import { getRouteApi, Link } from '@tanstack/react-router';
import {
    type ElementKind,
    firstCopy,
    type LayoutElement,
    type TemplateLayout,
} from '@shared/layout';
import { nextSortOrder } from '@shared/fields';
import { can } from '@shared/permissions';
import type { TemplateInput } from '@shared/schemas';
import type { Template } from '@shared/types';
import { ArrowLeft, Minus, Plus, Redo2, Save, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { DesignerCanvas } from '@/components/designer/DesignerCanvas';
import { cloneElement, newElement, reorder, TEXT_KINDS } from '@/components/designer/elements';
import { ElementToolbar } from '@/components/designer/ElementToolbar';
import { Palette } from '@/components/designer/Palette';
import { EditorDialog } from '@/components/EditorDialog';
import { FieldForm } from '@/components/fields/FieldForm';
import {
    CopiesPanel,
    ElementProperties,
    GuidePanel,
    PaperSettings,
    PrintSettingsPanel,
} from '@/components/designer/PropertiesPanel';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox, ErrorBanner, Input, Label } from '@/components/ui/form';
import { historyReducer, initHistory } from '@/lib/history';
import { fieldsQuery, templateQuery, useMe, useSave } from '@/lib/queries';
import { sampleContext } from '@/lib/sample';

const route = getRouteApi('/authed/admin/templates/$id/design');

export function TemplateDesignerPage() {
    const { id } = route.useParams();
    const { data } = useQuery(templateQuery(id));
    // Keyed by id (not version) so undo history survives saving.
    return data ? <Designer key={data.template.id} template={data.template} /> : null;
}

const isTyping = (e: KeyboardEvent) =>
    e.target instanceof HTMLElement && !!e.target.closest('input, textarea, select');

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);
const MOD = isMac ? '⌘' : 'Ctrl+';

// ⌘/Ctrl + B / I / U toggle text styles on the selected element.
const STYLE_KEYS = {
    b: 'bold',
    i: 'italic',
    u: 'underline',
} as const;

const NUDGE_KEYS: Record<string, [dx: number, dy: number]> = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
};

function Designer({ template }: { template: Template }) {
    const { data: fields = [] } = useQuery(fieldsQuery);
    const save = useSave<TemplateInput>('templates', ['templates', 'template']);
    const [name, setName] = useState(template.name);
    const [isActive, setIsActive] = useState(template.isActive);
    const [history, dispatch] = useReducer(
        historyReducer<TemplateLayout>,
        template.layout,
        initHistory,
    );
    const layout = history.present;
    const [guide, setGuide] = useState(template.guide ?? null);
    const [saved, setSaved] = useState(template);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [creatingField, setCreatingField] = useState(false);
    const canManageFields = can(useMe().role, 'fields.manage');
    const clipboard = useRef<LayoutElement | null>(null);
    const dirty =
        layout !== saved.layout ||
        name !== saved.name ||
        isActive !== saved.isActive ||
        guide !== (saved.guide ?? null);

    const copy = firstCopy(layout);
    const ctx = useMemo(
        () => ({
            ...sampleContext(fields),
            copy,
        }),
        [fields, copy],
    );
    const selected = layout.elements.find((el) => el.id === selectedId);
    const placedKeys = useMemo(
        () => new Set(layout.elements.flatMap((el) => (el.fieldKey ? [el.fieldKey] : []))),
        [layout.elements],
    );

    const edit = (next: (prev: TemplateLayout) => TemplateLayout, mergeKey?: string) => {
        dispatch({
            type: 'set',
            next,
            mergeKey,
            now: Date.now(),
        });
    };
    const updateElement = (elId: string, patch: Partial<LayoutElement>, mergeKey?: string) => {
        const current = layout.elements.find((el) => el.id === elId);
        // A plain click ends a zero-distance "drag"; skip it so it isn't an unsaved change or undo step.
        if (
            !current ||
            Object.entries(patch).every(
                ([key, value]) => current[key as keyof LayoutElement] === value,
            )
        ) {
            return;
        }
        edit(
            (prev) => ({
                ...prev,
                elements: prev.elements.map((el) =>
                    el.id === elId
                        ? {
                              ...el,
                              ...patch,
                          }
                        : el,
                ),
            }),
            mergeKey,
        );
    };
    const removeElement = (elId: string) => {
        edit((prev) => ({
            ...prev,
            elements: prev.elements.filter((el) => el.id !== elId),
        }));
        setSelectedId(null);
    };
    const patchLayout = (patch: Partial<TemplateLayout>) => {
        edit(
            (prev) => ({
                ...prev,
                ...patch,
            }),
            `layout:${Object.keys(patch).join()}`,
        );
    };
    const insertElement = (el: LayoutElement) => {
        edit((prev) => ({
            ...prev,
            elements: [...prev.elements, el],
        }));
        setSelectedId(el.id);
    };
    const addElement = (kind: ElementKind, fieldKey?: string) => {
        insertElement(newElement(kind, fieldKey));
    };
    const duplicate = (el: LayoutElement) => {
        insertElement(cloneElement(el, layout));
    };
    const order = (elId: string, toFront: boolean) => {
        edit((prev) => ({
            ...prev,
            elements: reorder(prev.elements, elId, toFront),
        }));
    };
    const styleKey = (key: string) =>
        Object.hasOwn(STYLE_KEYS, key) ? STYLE_KEYS[key as keyof typeof STYLE_KEYS] : undefined;

    // Canvas shortcuts. Ignored while typing so text boxes keep their native behaviour.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (isTyping(e)) {
                return;
            }
            const key = e.key.toLowerCase();
            if (e.metaKey || e.ctrlKey) {
                if (key === 'z' || key === 'y') {
                    e.preventDefault();
                    dispatch({ type: key === 'y' || e.shiftKey ? 'redo' : 'undo' });
                } else if (key === 'c' && selected) {
                    clipboard.current = selected;
                } else if (key === 'v' && clipboard.current) {
                    e.preventDefault();
                    duplicate(clipboard.current);
                } else if (key === 'd' && selected) {
                    e.preventDefault();
                    duplicate(selected);
                } else if (selected && TEXT_KINDS.includes(selected.kind)) {
                    const style = styleKey(key);
                    if (style) {
                        e.preventDefault();
                        updateElement(selected.id, { [style]: !selected[style] });
                    }
                }
                return;
            }
            if (!selected) {
                return;
            }
            if (e.key === 'Escape') {
                setSelectedId(null);
                return;
            }
            const nudge = NUDGE_KEYS[e.key];
            if (nudge) {
                e.preventDefault();
                const step = e.shiftKey ? 5 : 1;
                updateElement(
                    selected.id,
                    {
                        x: Math.max(0, selected.x + nudge[0] * step),
                        y: Math.max(0, selected.y + nudge[1] * step),
                    },
                    `nudge:${selected.id}`,
                );
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                removeElement(selected.id);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
        };
    });

    const onSave = () => {
        const input = {
            name,
            isActive,
            layout,
            guide,
        };
        save.mutate(
            {
                id: template.id,
                input,
            },
            {
                onSuccess: () => {
                    setSaved({
                        ...saved,
                        ...input,
                    });
                },
            },
        );
    };

    return (
        <div className="flex h-screen flex-col">
            <header className="flex flex-wrap items-center gap-3 border-b bg-background/90 px-4 py-2 backdrop-blur">
                <Link
                    to="/admin/templates"
                    className={buttonVariants({
                        variant: 'ghost',
                        size: 'icon',
                    })}
                    aria-label="Back to templates"
                >
                    <ArrowLeft className="size-4" />
                </Link>
                <Input
                    aria-label="Template name"
                    className="h-9 max-w-64"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                    }}
                />
                <Label className="flex items-center gap-2 font-normal">
                    <Checkbox
                        checked={isActive}
                        onChange={(e) => {
                            setIsActive(e.target.checked);
                        }}
                    />
                    Active
                </Label>
                <div className="ml-auto flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Undo"
                        title={`Undo (${MOD}Z)`}
                        disabled={history.past.length === 0}
                        onClick={() => {
                            dispatch({ type: 'undo' });
                        }}
                    >
                        <Undo2 className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Redo"
                        title={`Redo (${isMac ? '⇧⌘Z' : 'Ctrl+Y'})`}
                        disabled={history.future.length === 0}
                        onClick={() => {
                            dispatch({ type: 'redo' });
                        }}
                    >
                        <Redo2 className="size-4" />
                    </Button>
                    <span className="mx-1 h-5 w-px bg-muted" />
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Zoom out"
                        onClick={() => {
                            setZoom((z) => Math.max(0.25, z - 0.25));
                        }}
                    >
                        <Minus className="size-4" />
                    </Button>
                    <span className="w-12 text-center text-sm tabular-nums">
                        {Math.round(zoom * 100)}%
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Zoom in"
                        onClick={() => {
                            setZoom((z) => Math.min(3, z + 0.25));
                        }}
                    >
                        <Plus className="size-4" />
                    </Button>
                </div>
                {dirty && (
                    <span className="inline-flex animate-in items-center gap-1.5 text-xs font-medium text-warning fade-in">
                        <span className="size-1.5 animate-pulse rounded-full bg-current" /> Unsaved
                        changes
                    </span>
                )}
                <Button onClick={onSave} disabled={save.isPending || !dirty}>
                    <Save className="size-4" /> {save.isPending ? 'Saving…' : 'Save'}
                </Button>
            </header>
            {save.error && (
                <div className="px-4 pt-2">
                    <ErrorBanner message={save.error.message} />
                </div>
            )}
            <EditorDialog
                editing={creatingField ? 'new' : null}
                noun="field"
                onClose={() => {
                    setCreatingField(false);
                }}
            >
                {() => (
                    <FieldForm
                        field={null}
                        nextOrder={nextSortOrder(fields)}
                        onDone={(key) => {
                            setCreatingField(false);
                            // A new field is placed on the canvas straight away, ready to position.
                            if (key) {
                                addElement('field', key);
                            }
                        }}
                    />
                )}
            </EditorDialog>
            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
                <aside className="max-h-48 shrink-0 overflow-y-auto border-b bg-sidebar p-2 md:max-h-none md:w-56 md:border-r md:border-b-0">
                    <Palette
                        fields={fields}
                        placedKeys={placedKeys}
                        onAdd={addElement}
                        onLocate={(fieldKey) => {
                            const el = layout.elements.find((e) => e.fieldKey === fieldKey);
                            if (el) {
                                setSelectedId(el.id);
                            }
                        }}
                        onNewField={
                            canManageFields
                                ? () => {
                                      setCreatingField(true);
                                  }
                                : undefined
                        }
                    />
                </aside>
                {/* Clicking the empty area around the paper deselects, bringing back the template settings. */}
                <main
                    className="bg-grid flex-1 overflow-auto bg-muted/60 p-4 md:p-10"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            setSelectedId(null);
                        }
                    }}
                >
                    <DesignerCanvas
                        layout={layout}
                        guide={guide}
                        ctx={ctx}
                        zoom={zoom}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onChange={updateElement}
                        toolbar={
                            selected && (
                                <ElementToolbar
                                    el={selected}
                                    onChange={(patch) => {
                                        updateElement(selected.id, patch, `toolbar:${selected.id}`);
                                    }}
                                    onDuplicate={() => {
                                        duplicate(selected);
                                    }}
                                    onRemove={() => {
                                        removeElement(selected.id);
                                    }}
                                    onOrder={(toFront) => {
                                        order(selected.id, toFront);
                                    }}
                                />
                            )
                        }
                    />
                </main>
                <aside className="shrink-0 space-y-6 overflow-y-auto border-t bg-sidebar p-4 md:w-80 md:border-t-0 md:border-l">
                    <PaperSettings layout={layout} onChange={patchLayout} />
                    {selected ? (
                        <ElementProperties
                            key={selected.id}
                            el={selected}
                            fields={fields}
                            onChange={(patch) => {
                                updateElement(selected.id, patch, `props:${selected.id}`);
                            }}
                            onDuplicate={() => {
                                duplicate(selected);
                            }}
                            onRemove={() => {
                                removeElement(selected.id);
                            }}
                        />
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Add elements from the left, then drag and resize them. Click an
                                element for its toolbar: borders, text style, colours and layering.
                                Edges snap to other elements (hold Alt/Option to place freely).
                                Arrow keys nudge 1 mm (Shift = 5 mm); {MOD}C / {MOD}V copy and
                                paste, {MOD}D duplicates, {MOD}B / {MOD}I / {MOD}U style text, Esc
                                deselects.
                            </p>
                            <CopiesPanel
                                copies={layout.copies ?? []}
                                onChange={(copies) => {
                                    patchLayout({ copies });
                                }}
                            />
                            <PrintSettingsPanel layout={layout} onChange={patchLayout} />
                            <GuidePanel guide={guide} onChange={setGuide} />
                        </>
                    )}
                </aside>
            </div>
        </div>
    );
}
