import { type FieldSnapshot, formatFieldValue, type ReceiptData } from '@shared/fields';
import {
    type BranchSnapshot,
    COPY_PLACEHOLDER,
    type LayoutElement,
    type TemplateLayout,
} from '@shared/layout';
import { COMPANY_NAME, LOGO_URL } from '@/lib/brand';
import { cn, formatReceiptDate } from '@/lib/utils';
import { Barcode } from './Barcode';
import { boxStyle, contentStyle } from './elementStyle';

export interface RenderContext {
    fields: Record<string, FieldSnapshot>;
    data: ReceiptData;
    awbNumber: string;
    createdAt: number;
    copy?: string;
    branch?: BranchSnapshot;
    // Designer/template previews show every tick mark so they can be positioned.
    preview?: boolean;
}

interface ElementContentProps {
    el: LayoutElement;
    ctx: RenderContext;
}

const isMarked = (el: LayoutElement, ctx: RenderContext) => {
    const field = el.fieldKey ? ctx.fields[el.fieldKey] : undefined;
    const value = field ? ctx.data[field.key] : undefined;
    if (ctx.preview) {
        return true;
    }
    if (field?.type === 'checkbox' || !el.matchValue) {
        return value === true;
    }
    return String(value ?? '').toLowerCase() === el.matchValue.toLowerCase();
};

const fill = 'h-full w-full object-contain';

export function ElementContent({ el, ctx }: ElementContentProps) {
    switch (el.kind) {
        case 'field': {
            const field = el.fieldKey ? ctx.fields[el.fieldKey] : undefined;
            if (!field) {
                return null;
            }
            return (
                <>
                    {el.showLabel && (
                        <div className="text-[0.7em] font-normal uppercase tracking-wide text-muted-foreground">
                            {field.label}
                        </div>
                    )}
                    <div className="whitespace-pre-wrap break-words">
                        {formatFieldValue(field.type, ctx.data[field.key])}
                    </div>
                </>
            );
        }
        case 'text':
            return (
                <div className="whitespace-pre-wrap break-words">
                    {el.text?.replaceAll(COPY_PLACEHOLDER, ctx.copy ?? '')}
                </div>
            );
        case 'awb':
            return <div>{ctx.awbNumber}</div>;
        case 'date':
            return <div>{formatReceiptDate(ctx.createdAt, el.text ?? 'DD-MM-YY')}</div>;
        case 'branch': {
            const { code = '', name = '' } = ctx.branch ?? {};
            const display = {
                code,
                name,
                both: `${code} – ${name}`,
            };
            const show = el.text === 'name' || el.text === 'both' ? el.text : 'code';
            return <div>{display[show]}</div>;
        }
        case 'mark':
            return <div>{isMarked(el, ctx) ? el.text || '✓' : ''}</div>;
        case 'barcode':
            return <Barcode value={ctx.awbNumber} />;
        case 'logo':
            return <img src={LOGO_URL} alt={COMPANY_NAME} className={fill} />;
        case 'image':
            return el.text ? <img src={el.text} alt="" className={fill} /> : null;
        case 'line':
            return <div className="h-full w-full bg-black" />;
        case 'box':
            return <div className="h-full w-full border-[0.3mm] border-black" />;
    }
}

interface ElementBodyProps extends ElementContentProps {
    className?: string;
}

// One element's cell (borders, padding, alignment) and content; shared by designer and print.
export function ElementBody({ el, ctx, className }: ElementBodyProps) {
    return (
        <div className={cn('h-full w-full overflow-hidden', className)} style={boxStyle(el)}>
            <div style={contentStyle(el)}>
                <ElementContent el={el} ctx={ctx} />
            </div>
        </div>
    );
}

interface ReceiptRendererProps extends RenderContext {
    layout: TemplateLayout;
    zoom?: number;
    className?: string;
}

// Positions are stored in mm and rendered in mm, so screen preview and print match exactly.
export function ReceiptRenderer({ layout, zoom = 1, className, ...ctx }: ReceiptRendererProps) {
    return (
        <div
            className={cn('relative overflow-hidden bg-white text-black', className)}
            style={{
                width: `${layout.widthMm}mm`,
                height: `${layout.heightMm}mm`,
                zoom,
            }}
        >
            {layout.elements.map((el) => (
                <div
                    key={el.id}
                    className="absolute"
                    style={{
                        left: `${el.x}mm`,
                        top: `${el.y}mm`,
                        width: `${el.w}mm`,
                        height: `${el.h}mm`,
                    }}
                >
                    <ElementBody el={el} ctx={ctx} />
                </div>
            ))}
        </div>
    );
}
