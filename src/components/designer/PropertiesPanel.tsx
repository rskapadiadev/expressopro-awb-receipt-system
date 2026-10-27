import type { FieldDefinition, FieldType } from '@shared/fields';
import {
    BRANCH_DISPLAYS,
    COPY_PLACEHOLDER,
    DATE_FORMATS,
    ELEMENT_LABELS,
    type ElementKind,
    type LayoutElement,
    ORIENTATION_LABELS,
    type Orientation,
    PAPER_LIMITS,
    PAPER_PRESETS,
    printSettingsOf,
    SIDES,
    type Side,
    type TemplateGuide,
    type TemplateLayout,
} from '@shared/layout';
import {
    PRINT_MODE_LABELS,
    PRINT_MODES,
    type PrintMode,
    type PrintSettings,
    sheetGrid,
} from '@shared/print';
import { Copy, Trash2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox, FormField, Input, Label, Select, Textarea } from '@/components/ui/form';
import { readImage } from '@/lib/image';

const NumberInput = ({
    label,
    value,
    onChange,
    min = 0,
    step = 0.5,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    step?: number;
}) => (
    <FormField label={label}>
        <Input
            type="number"
            min={min}
            step={step}
            value={value}
            onChange={(e) => {
                if (e.target.value !== '') {
                    onChange(Number(e.target.value));
                }
            }}
        />
    </FormField>
);

interface SectionProps {
    title: string;
    children: ReactNode;
}

const Section = ({ title, children }: SectionProps) => (
    <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">{title}</h3>
        {children}
    </section>
);

interface Size {
    widthMm: number;
    heightMm: number;
}

interface SizeFieldsProps extends Size {
    onChange: (size: Size) => void;
}

// Preset picker + width/height, shared by the receipt paper and the print sheet.
function SizeFields({ widthMm, heightMm, onChange }: SizeFieldsProps) {
    const preset = PAPER_PRESETS.find((p) => p.widthMm === widthMm && p.heightMm === heightMm);
    return (
        <>
            <FormField label="Preset">
                <Select
                    value={preset?.name ?? ''}
                    onChange={(e) => {
                        const p = PAPER_PRESETS.find((x) => x.name === e.target.value);
                        if (p) {
                            onChange({
                                widthMm: p.widthMm,
                                heightMm: p.heightMm,
                            });
                        }
                    }}
                >
                    <option value="">Custom</option>
                    {PAPER_PRESETS.map((p) => (
                        <option key={p.name} value={p.name}>
                            {p.name}
                        </option>
                    ))}
                </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-2">
                <NumberInput
                    label="Width (mm)"
                    min={PAPER_LIMITS.min}
                    value={widthMm}
                    onChange={(v) => {
                        onChange({
                            widthMm: v,
                            heightMm,
                        });
                    }}
                />
                <NumberInput
                    label="Height (mm)"
                    min={PAPER_LIMITS.min}
                    value={heightMm}
                    onChange={(v) => {
                        onChange({
                            widthMm,
                            heightMm: v,
                        });
                    }}
                />
            </div>
        </>
    );
}

interface PaperProps {
    layout: TemplateLayout;
    onChange: (patch: Partial<TemplateLayout>) => void;
}

export function PaperSettings({ layout, onChange }: PaperProps) {
    return (
        <Section title="Receipt size">
            <SizeFields widthMm={layout.widthMm} heightMm={layout.heightMm} onChange={onChange} />
        </Section>
    );
}

export function PrintSettingsPanel({ layout, onChange }: PaperProps) {
    const print = printSettingsOf(layout);
    const grid = sheetGrid(layout, print);
    const update = (patch: Partial<PrintSettings>) => {
        onChange({
            print: {
                ...print,
                ...patch,
            },
        });
    };

    return (
        <Section title="Printing">
            <FormField
                label="Default print mode"
                hint="Each computer can override this on the print screen"
            >
                <Select
                    value={print.mode}
                    onChange={(e) => {
                        update({ mode: e.target.value as PrintMode });
                    }}
                >
                    {PRINT_MODES.map((m) => (
                        <option key={m} value={m}>
                            {PRINT_MODE_LABELS[m]}
                        </option>
                    ))}
                </Select>
            </FormField>
            <p className="text-xs text-muted-foreground">
                Sheet layout (used in &quot;multiple per sheet&quot; mode):
            </p>
            <SizeFields
                widthMm={print.sheetWidthMm}
                heightMm={print.sheetHeightMm}
                onChange={(size) => {
                    update({
                        sheetWidthMm: size.widthMm,
                        sheetHeightMm: size.heightMm,
                    });
                }}
            />
            <div className="grid grid-cols-2 gap-2">
                <NumberInput
                    label="Margin (mm)"
                    value={print.marginMm}
                    onChange={(marginMm) => {
                        update({ marginMm });
                    }}
                />
                <NumberInput
                    label="Gap (mm)"
                    value={print.gapMm}
                    onChange={(gapMm) => {
                        update({ gapMm });
                    }}
                />
            </div>
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-foreground/80">
                Fits <strong>{grid.perSheet}</strong> per sheet ({grid.cols} × {grid.rows})
            </p>
        </Section>
    );
}

interface SelectFieldProps {
    label: string;
    value: string;
    options: readonly (readonly [value: string, label: string])[];
    onChange: (value: string) => void;
}

const SelectField = ({ label, value, options, onChange }: SelectFieldProps) => (
    <FormField label={label}>
        <Select
            value={value}
            onChange={(e) => {
                onChange(e.target.value);
            }}
        >
            {options.map(([v, l]) => (
                <option key={v} value={v}>
                    {l}
                </option>
            ))}
        </Select>
    </FormField>
);

const pairs = <T extends string>(labels: Record<T, string>) =>
    Object.entries(labels) as [T, string][];

const ALIGNS = [
    ['left', 'Left'],
    ['center', 'Center'],
    ['right', 'Right'],
] as const;
const VALIGN_OPTIONS = [
    ['top', 'Top'],
    ['middle', 'Middle'],
    ['bottom', 'Bottom'],
] as const;
const MARK_SYMBOLS = ['✓', '✔', '✗', 'X', '●', 'Yes'].map((s) => [s, s] as const);
const SIDE_LABELS: Record<Side, string> = {
    top: 'Top',
    right: 'Right',
    bottom: 'Bottom',
    left: 'Left',
};

const BOX_KEYS = ['x', 'y', 'w', 'h'] as const;
const TEXT_KINDS: ElementKind[] = ['field', 'text', 'awb', 'date', 'branch', 'mark'];
const MARK_FIELD_TYPES: FieldType[] = ['select', 'checkbox', 'text'];

interface ElementProps {
    el: LayoutElement;
    fields: FieldDefinition[];
    onChange: (patch: Partial<LayoutElement>) => void;
    onDuplicate: () => void;
    onRemove: () => void;
}

export function ElementProperties({ el, fields, onChange, onDuplicate, onRemove }: ElementProps) {
    const field = fields.find((f) => f.key === el.fieldKey);
    const sides = el.border ?? [];
    const toggleSide = (side: Side) => {
        const border = sides.includes(side) ? sides.filter((x) => x !== side) : [...sides, side];
        onChange({ border });
    };

    const onImage = async (file: File | undefined) => {
        if (!file) {
            return;
        }
        const keepAlpha = file.type === 'image/png';
        onChange({ text: await readImage(file, 800, keepAlpha ? 'image/png' : 'image/jpeg') });
    };

    return (
        <Section title={el.kind === 'field' ? (field?.label ?? 'Field') : ELEMENT_LABELS[el.kind]}>
            <div className="grid grid-cols-2 gap-2">
                {BOX_KEYS.map((key) => (
                    <NumberInput
                        key={key}
                        label={`${key.toUpperCase()} (mm)`}
                        step={0.1}
                        value={el[key]}
                        onChange={(v) => {
                            onChange({ [key]: v });
                        }}
                    />
                ))}
            </div>

            {el.kind === 'text' && (
                <FormField
                    label="Text"
                    hint={`Use ${COPY_PLACEHOLDER} to print the copy name (e.g. SHIPPER COPY)`}
                >
                    <Textarea
                        value={el.text ?? ''}
                        onChange={(e) => {
                            onChange({ text: e.target.value });
                        }}
                    />
                </FormField>
            )}
            {el.kind === 'date' && (
                <SelectField
                    label="Date format"
                    value={el.text ?? DATE_FORMATS[0]}
                    options={DATE_FORMATS.map((f) => [f, f] as const)}
                    onChange={(text) => {
                        onChange({ text });
                    }}
                />
            )}
            {el.kind === 'branch' && (
                <SelectField
                    label="Show"
                    value={el.text ?? 'code'}
                    options={pairs(BRANCH_DISPLAYS)}
                    onChange={(text) => {
                        onChange({ text });
                    }}
                />
            )}
            {el.kind === 'mark' && (
                <>
                    <SelectField
                        label="Field"
                        value={el.fieldKey ?? ''}
                        options={[
                            ['', 'Choose a field…'],
                            ...fields
                                .filter((f) => MARK_FIELD_TYPES.includes(f.type))
                                .map((f) => [f.key, f.label] as const),
                        ]}
                        onChange={(fieldKey) => {
                            onChange({
                                fieldKey: fieldKey || undefined,
                                matchValue: undefined,
                            });
                        }}
                    />
                    {field?.type === 'select' && (
                        <SelectField
                            label="Show mark when value is"
                            value={el.matchValue ?? ''}
                            options={[
                                ['', 'Choose…'],
                                ...field.options.map((o) => [o, o] as const),
                            ]}
                            onChange={(matchValue) => {
                                onChange({ matchValue });
                            }}
                        />
                    )}
                    {field?.type === 'text' && (
                        <FormField label="Show mark when value is">
                            <Input
                                value={el.matchValue ?? ''}
                                onChange={(e) => {
                                    onChange({ matchValue: e.target.value });
                                }}
                            />
                        </FormField>
                    )}
                    {field?.type === 'checkbox' && (
                        <p className="text-xs text-muted-foreground">
                            Shows the mark when the box is ticked.
                        </p>
                    )}
                    <SelectField
                        label="Mark"
                        value={el.text ?? '✓'}
                        options={MARK_SYMBOLS}
                        onChange={(text) => {
                            onChange({ text });
                        }}
                    />
                </>
            )}
            {el.kind === 'image' && (
                <FormField label="Image (PNG/JPG, resized automatically)">
                    <Input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => {
                            void onImage(e.target.files?.[0]);
                        }}
                    />
                </FormField>
            )}

            {TEXT_KINDS.includes(el.kind) && (
                <>
                    <div className="grid grid-cols-2 gap-2">
                        <NumberInput
                            label="Font size (pt)"
                            min={4}
                            step={0.5}
                            value={el.fontSize}
                            onChange={(fontSize) => {
                                onChange({ fontSize });
                            }}
                        />
                        <SelectField
                            label="Align"
                            value={el.align}
                            options={ALIGNS}
                            onChange={(align) => {
                                onChange({ align: align as LayoutElement['align'] });
                            }}
                        />
                    </div>
                    <SelectField
                        label="Text direction"
                        value={el.orientation ?? 'horizontal'}
                        options={pairs(ORIENTATION_LABELS)}
                        onChange={(orientation) => {
                            onChange({ orientation: orientation as Orientation });
                        }}
                    />
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        <Label className="flex items-center gap-2 font-normal">
                            <Checkbox
                                checked={el.bold}
                                onChange={(e) => {
                                    onChange({ bold: e.target.checked });
                                }}
                            />
                            Bold
                        </Label>
                        {el.kind === 'field' && (
                            <Label className="flex items-center gap-2 font-normal">
                                <Checkbox
                                    checked={el.showLabel}
                                    onChange={(e) => {
                                        onChange({ showLabel: e.target.checked });
                                    }}
                                />
                                Show label
                            </Label>
                        )}
                    </div>
                </>
            )}

            <div className="space-y-2 rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                        Cell
                    </span>
                    <div className="flex gap-1">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                                onChange({ border: [...SIDES] });
                            }}
                        >
                            All
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                                onChange({ border: [] });
                            }}
                        >
                            None
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-1">
                    {SIDES.map((side) => (
                        <Button
                            key={side}
                            size="sm"
                            variant={sides.includes(side) ? 'default' : 'outline'}
                            className="h-7 px-1 text-xs"
                            aria-pressed={sides.includes(side)}
                            onClick={() => {
                                toggleSide(side);
                            }}
                        >
                            {SIDE_LABELS[side]}
                        </Button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <NumberInput
                        label="Padding (mm)"
                        value={el.padding ?? 0}
                        onChange={(padding) => {
                            onChange({ padding });
                        }}
                    />
                    <SelectField
                        label="Vertical"
                        value={el.valign ?? 'top'}
                        options={VALIGN_OPTIONS}
                        onChange={(valign) => {
                            onChange({ valign: valign as LayoutElement['valign'] });
                        }}
                    />
                </div>
            </div>

            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onDuplicate}>
                    <Copy className="size-4" /> Duplicate
                </Button>
                <Button variant="destructive" size="sm" onClick={onRemove}>
                    <Trash2 className="size-4" /> Remove
                </Button>
            </div>
        </Section>
    );
}

interface CopiesProps {
    copies: string[];
    onChange: (copies: string[]) => void;
}

export function CopiesPanel({ copies, onChange }: CopiesProps) {
    // Raw text kept separately so blank lines survive while typing.
    const [text, setText] = useState(copies.join('\n'));
    return (
        <Section title="Copies">
            <FormField
                label="Copy names (one per line, max 5)"
                hint={`Each receipt prints once per name. Put ${COPY_PLACEHOLDER} in a static text element to show it.`}
            >
                <Textarea
                    rows={3}
                    placeholder={'SHIPPER COPY\nCONSIGNEE COPY\nOFFICE COPY'}
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        onChange(
                            e.target.value
                                .split('\n')
                                .map((c) => c.trim())
                                .filter(Boolean)
                                .slice(0, 5),
                        );
                    }}
                />
            </FormField>
        </Section>
    );
}

interface GuideProps {
    guide: TemplateGuide | null;
    onChange: (guide: TemplateGuide | null) => void;
}

export function GuidePanel({ guide, onChange }: GuideProps) {
    const [error, setError] = useState<string | null>(null);
    const onFile = async (file: File | undefined) => {
        if (!file) {
            return;
        }
        try {
            setError(null);
            onChange({
                image: await readImage(file, 1600, 'image/jpeg'),
                opacity: guide?.opacity ?? 0.35,
            });
        } catch {
            setError('Could not read that image. Use a PNG or JPG screenshot.');
        }
    };

    return (
        <Section title="Tracing guide">
            <p className="text-xs text-muted-foreground">
                Upload a photo or screenshot of an existing receipt and place fields on top of it.
                It is stretched to the paper size and never printed.
            </p>
            <Input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => {
                    void onFile(e.target.files?.[0]);
                }}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            {guide && (
                <>
                    <FormField label={`Opacity (${Math.round(guide.opacity * 100)}%)`}>
                        <input
                            type="range"
                            min={0.05}
                            max={1}
                            step={0.05}
                            value={guide.opacity}
                            className="w-full accent-primary"
                            onChange={(e) => {
                                onChange({
                                    ...guide,
                                    opacity: Number(e.target.value),
                                });
                            }}
                        />
                    </FormField>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            onChange(null);
                        }}
                    >
                        <Trash2 className="size-4" /> Remove guide
                    </Button>
                </>
            )}
        </Section>
    );
}
