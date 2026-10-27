import type { LayoutElement, TemplateGuide, TemplateLayout } from '@shared/layout';
import { Rnd } from 'react-rnd';
import { ElementBody, type RenderContext } from '@/components/receipt/ReceiptRenderer';
import { PX_PER_MM } from '@/lib/paper';
import { cn } from '@/lib/utils';
import { clampMm, snapPosition, snapSize } from './elements';

interface DesignerCanvasProps {
    layout: TemplateLayout;
    guide: TemplateGuide | null;
    ctx: RenderContext;
    zoom: number;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onChange: (id: string, patch: Partial<LayoutElement>) => void;
}

const toMm = (px: number) => px / PX_PER_MM;

// Holding Alt/Option while dragging turns snapping off for fine placement.
const snapEnabled = (e: unknown) => !(e instanceof MouseEvent && e.altKey);

export function DesignerCanvas({
    layout,
    guide,
    ctx,
    zoom,
    selectedId,
    onSelect,
    onChange,
}: DesignerCanvasProps) {
    const widthPx = layout.widthMm * PX_PER_MM;
    const heightPx = layout.heightMm * PX_PER_MM;
    const othersThan = (id: string) => layout.elements.filter((o) => o.id !== id);

    return (
        <div
            style={{
                width: widthPx * zoom,
                height: heightPx * zoom,
            }}
        >
            <div
                role="presentation"
                className="relative origin-top-left bg-white text-black shadow-lg"
                style={{
                    width: widthPx,
                    height: heightPx,
                    transform: `scale(${zoom})`,
                    backgroundImage:
                        'linear-gradient(to right, rgb(0 0 0 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgb(0 0 0 / 0.04) 1px, transparent 1px)',
                    backgroundSize: `${PX_PER_MM * 5}px ${PX_PER_MM * 5}px`,
                }}
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                        onSelect(null);
                    }
                }}
            >
                {guide && (
                    <img
                        src={guide.image}
                        alt=""
                        className="pointer-events-none absolute inset-0 h-full w-full object-fill"
                        style={{ opacity: guide.opacity }}
                    />
                )}
                {layout.elements.map((el) => (
                    <Rnd
                        key={el.id}
                        bounds="parent"
                        scale={zoom}
                        dragGrid={[PX_PER_MM / 2, PX_PER_MM / 2]}
                        resizeGrid={[PX_PER_MM / 2, PX_PER_MM / 2]}
                        minWidth={PX_PER_MM}
                        minHeight={PX_PER_MM * 0.2}
                        position={{
                            x: el.x * PX_PER_MM,
                            y: el.y * PX_PER_MM,
                        }}
                        size={{
                            width: el.w * PX_PER_MM,
                            height: el.h * PX_PER_MM,
                        }}
                        onMouseDown={() => {
                            onSelect(el.id);
                        }}
                        onDragStop={(e, d) => {
                            const raw = {
                                ...el,
                                x: toMm(d.x),
                                y: toMm(d.y),
                            };
                            const pos = snapEnabled(e)
                                ? snapPosition(raw, othersThan(el.id), layout)
                                : raw;
                            onChange(el.id, {
                                x: clampMm(pos.x, layout.widthMm - el.w),
                                y: clampMm(pos.y, layout.heightMm - el.h),
                            });
                        }}
                        onResizeStop={(e, __, ref, ___, pos) => {
                            const raw = {
                                x: toMm(pos.x),
                                y: toMm(pos.y),
                                w: toMm(ref.offsetWidth),
                                h: toMm(ref.offsetHeight),
                            };
                            const size = snapEnabled(e)
                                ? snapSize(raw, othersThan(el.id), layout)
                                : raw;
                            onChange(el.id, {
                                x: clampMm(raw.x, layout.widthMm),
                                y: clampMm(raw.y, layout.heightMm),
                                w: clampMm(size.w, layout.widthMm),
                                h: clampMm(size.h, layout.heightMm),
                            });
                        }}
                        className={cn(
                            'outline-dashed outline-1 outline-slate-300 hover:outline-brand',
                            selectedId === el.id && 'z-10 outline-2 outline-solid outline-brand',
                        )}
                    >
                        <ElementBody el={el} ctx={ctx} className="cursor-move" />
                    </Rnd>
                ))}
            </div>
        </div>
    );
}
