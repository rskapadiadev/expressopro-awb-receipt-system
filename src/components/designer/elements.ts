import type { ElementKind, LayoutElement, Side, TemplateLayout } from '@shared/layout';

const DEFAULT_SIZE: Record<ElementKind, [w: number, h: number]> = {
    field: [60, 10],
    text: [50, 8],
    awb: [50, 6],
    receiptNo: [30, 6],
    date: [25, 6],
    branch: [30, 6],
    barcode: [60, 15],
    mark: [6, 6],
    logo: [40, 14],
    image: [30, 15],
    line: [60, 0.4],
    box: [60, 30],
};

const DEFAULT_TEXT: Partial<Record<ElementKind, string>> = {
    text: 'Text',
    date: 'DD-MM-YY',
    branch: 'code',
    mark: '✓',
};

// Elements that print text, so they get font, colour and text-direction controls.
export const TEXT_KINDS: ElementKind[] = [
    'field',
    'text',
    'awb',
    'receiptNo',
    'date',
    'branch',
    'mark',
];

export const toggleBorder = (el: LayoutElement, side: Side) => {
    const sides = el.border ?? [];
    return sides.includes(side) ? sides.filter((s) => s !== side) : [...sides, side];
};

// Moves an element to the end (drawn on top) or the start (drawn underneath) of the layout.
export function reorder(elements: LayoutElement[], id: string, toFront: boolean) {
    const el = elements.find((e) => e.id === id);
    if (!el) {
        return elements;
    }
    const rest = elements.filter((e) => e.id !== id);
    return toFront ? [...rest, el] : [el, ...rest];
}

const newId = () => crypto.randomUUID().slice(0, 8);

export function newElement(kind: ElementKind, fieldKey?: string): LayoutElement {
    const [w, h] = DEFAULT_SIZE[kind];
    return {
        id: newId(),
        kind,
        x: 5,
        y: 5,
        w,
        h,
        fontSize: 10,
        bold: kind === 'awb',
        align: kind === 'mark' ? 'center' : 'left',
        showLabel: kind === 'field',
        fieldKey,
        text: DEFAULT_TEXT[kind],
    };
}

// Keeps positions tidy (0.1 mm) and inside the paper.
export const clampMm = (value: number, max: number) =>
    Math.round(Math.min(Math.max(value, 0), max) * 10) / 10;

// Pasted/duplicated copies land slightly offset so they're visibly separate.
export const cloneElement = (el: LayoutElement, paper: TemplateLayout): LayoutElement => ({
    ...el,
    id: newId(),
    x: clampMm(el.x + 3, paper.widthMm - el.w),
    y: clampMm(el.y + 3, paper.heightMm - el.h),
});

export const SNAP_MM = 1.5;

interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}

const nearest = (value: number, targets: number[]) =>
    targets.reduce(
        (best, t) => (Math.abs(t - value) < Math.abs(best - value) ? t : best),
        Infinity,
    );

function edgeTargets(others: Box[], paper: TemplateLayout) {
    return {
        xs: [0, paper.widthMm, ...others.flatMap((o) => [o.x, o.x + o.w])],
        ys: [0, paper.heightMm, ...others.flatMap((o) => [o.y, o.y + o.h])],
    };
}

// Moves a box so its nearer edge lines up with another element's edge (or the paper's).
function snapAxis(start: number, size: number, targets: number[]) {
    const a = nearest(start, targets);
    const b = nearest(start + size, targets);
    const da = Math.abs(a - start);
    const db = Math.abs(b - (start + size));
    if (Math.min(da, db) > SNAP_MM) {
        return start;
    }
    return da <= db ? a : b - size;
}

export function snapPosition(box: Box, others: Box[], paper: TemplateLayout) {
    const { xs, ys } = edgeTargets(others, paper);
    return {
        x: snapAxis(box.x, box.w, xs),
        y: snapAxis(box.y, box.h, ys),
    };
}

// Resizing snaps the right and bottom edges, which is how table cells are usually stretched.
export function snapSize(box: Box, others: Box[], paper: TemplateLayout) {
    const { xs, ys } = edgeTargets(others, paper);
    const right = nearest(box.x + box.w, xs);
    const bottom = nearest(box.y + box.h, ys);
    return {
        w: Math.abs(right - (box.x + box.w)) <= SNAP_MM ? right - box.x : box.w,
        h: Math.abs(bottom - (box.y + box.h)) <= SNAP_MM ? bottom - box.y : box.h,
    };
}
