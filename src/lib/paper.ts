import type { FieldSnapshot } from '@shared/fields';
import { firstCopy, type TemplateLayout } from '@shared/layout';
import type { Receipt } from '@shared/types';
import type { RenderContext } from '@/components/receipt/ReceiptRenderer';

export const PX_PER_MM = 96 / 25.4;

// Zoom factor that fits a paper size into a box on screen, never enlarging past 100%.
export const fitZoom = (
    paper: Pick<TemplateLayout, 'widthMm' | 'heightMm'>,
    maxWidthPx: number,
    maxHeightPx = Infinity,
) =>
    Math.min(
        1,
        maxWidthPx / (paper.widthMm * PX_PER_MM),
        maxHeightPx / (paper.heightMm * PX_PER_MM),
    );

export const fieldMap = (fields: FieldSnapshot[]) =>
    Object.fromEntries(fields.map((f) => [f.key, f]));

export const receiptContext = (
    receipt: Receipt,
    copy = firstCopy(receipt.layout),
): RenderContext => ({
    fields: fieldMap(receipt.layout.fields),
    data: receipt.data,
    awbNumber: receipt.awbNumber,
    receiptNo: receipt.receiptNo,
    createdAt: receipt.createdAt,
    branch: receipt.layout.branch,
    copy,
});
