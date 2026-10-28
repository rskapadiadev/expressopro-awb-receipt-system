import { z } from 'zod';
import type { CompanyProfile } from './company';
import type { FieldSnapshot } from './fields';
import { fieldTokensIn } from './placeholders';
import { DEFAULT_PRINT, type PrintSettings, printSettingsSchema } from './print';

export const ELEMENT_KINDS = [
    'field',
    'text',
    'awb',
    'receiptNo',
    'date',
    'branch',
    'company',
    'copy',
    'barcode',
    'mark',
    'logo',
    'image',
    'line',
    'box',
] as const;
export type ElementKind = (typeof ELEMENT_KINDS)[number];

export const ELEMENT_LABELS: Record<ElementKind, string> = {
    field: 'Field',
    text: 'Static text',
    awb: 'AWB number',
    receiptNo: 'Receipt number',
    date: 'Booking date',
    branch: 'Branch',
    company: 'Company details',
    copy: 'Copy name',
    barcode: 'Barcode',
    mark: 'Tick mark',
    logo: 'Company logo',
    image: 'Custom image',
    line: 'Line',
    box: 'Box',
};

// Where an element's printed value comes from, so the designer can say so.
export type ElementSource = 'form' | 'auto' | 'static';
export const ELEMENT_SOURCE: Record<ElementKind, ElementSource> = {
    field: 'form',
    mark: 'form',
    awb: 'auto',
    receiptNo: 'auto',
    date: 'auto',
    branch: 'auto',
    company: 'auto',
    copy: 'auto',
    barcode: 'auto',
    text: 'static',
    logo: 'static',
    image: 'static',
    line: 'static',
    box: 'static',
};
export const SOURCE_LABELS: Record<ElementSource, string> = {
    form: 'Form field',
    auto: 'Automatic',
    static: 'Static',
};
export const ELEMENT_HINTS: Record<ElementKind, string> = {
    field: 'Typed in on the booking form; changes on every receipt.',
    mark: 'Prints the mark when the chosen form field has the matching value.',
    awb: 'Generated when the receipt is booked: branch code + 7 random digits.',
    receiptNo: "Next number in the branch's receipt sequence, assigned when booked.",
    date: 'The date the receipt is booked.',
    branch: 'The branch the receipt is booked under.',
    copy: "The copy being printed (e.g. SHIPPER COPY), from the template's copy names.",
    company: 'From the company profile (Company page), as it was when the receipt was booked.',
    barcode: "Code 128 barcode of the receipt's AWB number.",
    text: 'Printed exactly as typed on every receipt.',
    logo: 'The company logo.',
    image: 'An image you upload; the same on every receipt.',
    line: 'A drawn line.',
    box: 'A drawn box.',
};

const mm = z.number().min(0).max(2000);

export const SIDES = ['top', 'right', 'bottom', 'left'] as const;
export type Side = (typeof SIDES)[number];

export const VALIGNS = ['top', 'middle', 'bottom'] as const;

export const ORIENTATIONS = ['horizontal', 'down', 'up', 'stacked'] as const;
export type Orientation = (typeof ORIENTATIONS)[number];
export const ORIENTATION_LABELS: Record<Orientation, string> = {
    horizontal: 'Horizontal',
    down: 'Vertical (top to bottom)',
    up: 'Vertical (bottom to top)',
    stacked: 'Stacked letters',
};

export const BORDER_STYLES = ['solid', 'dashed', 'dotted'] as const;
export type BorderStyle = (typeof BORDER_STYLES)[number];

// Defaults used when an element has no styling of its own (also how older templates render).
export const DEFAULT_STYLE = {
    color: '#000000',
    borderColor: '#000000',
    borderWidth: 0.25,
    borderStyle: 'solid',
} as const;

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i);

export const DATE_FORMATS = ['DD-MM-YY', 'DD/MM/YYYY', 'DD MMM YYYY', 'DD-MM-YYYY HH:mm'] as const;
export type DateFormat = (typeof DATE_FORMATS)[number];

export const layoutElementSchema = z.object({
    id: z.string().min(1).max(40),
    kind: z.enum(ELEMENT_KINDS),
    x: mm,
    y: mm,
    w: mm,
    h: mm,
    fontSize: z.number().min(4).max(72),
    bold: z.boolean(),
    align: z.enum(['left', 'center', 'right']),
    showLabel: z.boolean(),
    fieldKey: z.string().max(60).optional(),
    text: z.string().max(300_000).optional(),
    // Table-cell styling; all optional so older templates stay valid.
    border: z.array(z.enum(SIDES)).max(4).optional(),
    padding: z.number().min(0).max(20).optional(),
    valign: z.enum(VALIGNS).optional(),
    orientation: z.enum(ORIENTATIONS).optional(),
    matchValue: z.string().max(80).optional(),
    italic: z.boolean().optional(),
    underline: z.boolean().optional(),
    color: hexColor.optional(),
    background: hexColor.optional(),
    borderColor: hexColor.optional(),
    borderWidth: z.number().min(0.1).max(3).optional(),
    borderStyle: z.enum(BORDER_STYLES).optional(),
});
export type LayoutElement = z.infer<typeof layoutElementSchema>;

export const PAPER_LIMITS = {
    min: 20,
    max: 1000,
};
const paperMm = z.number().min(PAPER_LIMITS.min).max(PAPER_LIMITS.max);

export const templateLayoutSchema = z.object({
    widthMm: paperMm,
    heightMm: paperMm,
    elements: z.array(layoutElementSchema).max(200),
    // Optional so templates and receipts saved before print settings existed still load.
    print: printSettingsSchema.optional(),
    copies: z.array(z.string().trim().min(1).max(40)).max(5).optional(),
});
export type TemplateLayout = z.infer<typeof templateLayoutSchema>;

export const firstCopy = (layout: TemplateLayout) => layout.copies?.[0];

export const templateGuideSchema = z.object({
    image: z.string().startsWith('data:image/').max(1_500_000),
    opacity: z.number().min(0.05).max(1),
});
export type TemplateGuide = z.infer<typeof templateGuideSchema>;

export const printSettingsOf = (layout: TemplateLayout): PrintSettings =>
    layout.print ?? DEFAULT_PRINT;

export interface BranchSnapshot {
    code: string;
    name: string;
}

export const BRANCH_DISPLAYS = {
    code: 'Code',
    name: 'Name',
    both: 'Code – Name',
} as const;

// Frozen copy stored on each receipt: layout plus the field labels and branch at booking time.
export interface LayoutSnapshot extends TemplateLayout {
    fields: FieldSnapshot[];
    branch?: BranchSnapshot;
    // Optional because receipts booked before company profiles existed don't have one.
    company?: CompanyProfile;
}

export const PAPER_PRESETS = [
    {
        name: 'A4',
        widthMm: 210,
        heightMm: 297,
    },
    {
        name: 'A5',
        widthMm: 148,
        heightMm: 210,
    },
    {
        name: '4 × 6 in',
        widthMm: 101.6,
        heightMm: 152.4,
    },
    {
        name: '100 × 150 mm',
        widthMm: 100,
        heightMm: 150,
    },
    {
        name: '80 mm thermal',
        widthMm: 80,
        heightMm: 120,
    },
] as const;

// Fields a template collects: placed fields, those that only drive a tick mark (e.g. AIR/SRF),
// and those written into static text as {key}.
const INPUT_KINDS: ElementKind[] = ['field', 'mark'];
const fieldKeysIn = (el: LayoutElement) => {
    if (INPUT_KINDS.includes(el.kind)) {
        return el.fieldKey ? [el.fieldKey] : [];
    }
    return el.kind === 'text' && el.text ? fieldTokensIn(el.text) : [];
};
export const fieldKeysOf = (layout: TemplateLayout) => [
    ...new Set(layout.elements.flatMap(fieldKeysIn)),
];

// Names of the templates that collect a field; a field in use by any of them can't be deleted.
export const templatesUsing = (
    templates: readonly {
        name: string;
        layout: TemplateLayout;
    }[],
    fieldKey: string,
) => templates.filter((t) => fieldKeysOf(t.layout).includes(fieldKey)).map((t) => t.name);

export const paperKey = (layout: Pick<TemplateLayout, 'widthMm' | 'heightMm'>) =>
    `${layout.widthMm}×${layout.heightMm} mm`;
