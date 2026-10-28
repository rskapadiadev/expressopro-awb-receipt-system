import { DEFAULT_STYLE, type LayoutElement, SIDES, type Side } from '@shared/layout';
import {
    AArrowDown,
    AArrowUp,
    AlignCenter,
    AlignLeft,
    AlignRight,
    Baseline,
    Bold,
    BringToFront,
    Copy,
    Italic,
    type LucideIcon,
    PaintBucket,
    PanelBottom,
    PanelLeft,
    PanelRight,
    PanelTop,
    SendToBack,
    Square,
    SquareDashed,
    Trash2,
    Underline,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ColorButton } from './ColorPicker';
import { TEXT_KINDS, toggleBorder } from './elements';

const SIDE_ICONS: Record<Side, LucideIcon> = {
    top: PanelTop,
    right: PanelRight,
    bottom: PanelBottom,
    left: PanelLeft,
};
const ALIGN_ICONS = {
    left: AlignLeft,
    center: AlignCenter,
    right: AlignRight,
} as const;
const FONT_STEP = 0.5;

interface ToolProps {
    label: string;
    icon: LucideIcon;
    active?: boolean;
    destructive?: boolean;
    onClick: () => void;
}

function Tool({ label, icon: Icon, active = false, destructive = false, onClick }: ToolProps) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            className={cn(
                'inline-flex size-7 items-center justify-center rounded-md transition-colors hover:bg-accent',
                active && 'bg-primary text-primary-foreground hover:bg-primary/90',
                destructive && 'text-destructive hover:bg-destructive/10',
            )}
            onClick={onClick}
        >
            <Icon className="size-3.5" />
        </button>
    );
}

const Divider = () => <span className="mx-0.5 h-5 w-px shrink-0 bg-border" />;

const Group = ({ children }: { children: ReactNode }) => (
    <div className="flex items-center gap-0.5">{children}</div>
);

export interface ElementToolbarProps {
    el: LayoutElement;
    onChange: (patch: Partial<LayoutElement>) => void;
    onDuplicate: () => void;
    onRemove: () => void;
    onOrder: (toFront: boolean) => void;
}

// Quick formatting right on the canvas: cell borders, text style, colours and layering.
export function ElementToolbar({
    el,
    onChange,
    onDuplicate,
    onRemove,
    onOrder,
}: ElementToolbarProps) {
    const sides = el.border ?? [];
    const isText = TEXT_KINDS.includes(el.kind);
    const fontSize = (delta: number) => {
        onChange({ fontSize: Math.min(72, Math.max(4, el.fontSize + delta)) });
    };

    return (
        <div
            role="toolbar"
            aria-label="Element formatting"
            className="flex w-max animate-in items-center gap-0.5 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg fade-in"
            onMouseDown={(e) => {
                e.stopPropagation();
            }}
        >
            <Group>
                {SIDES.map((side) => (
                    <Tool
                        key={side}
                        label={`${side[0]?.toUpperCase() ?? ''}${side.slice(1)} border`}
                        icon={SIDE_ICONS[side]}
                        active={sides.includes(side)}
                        onClick={() => {
                            onChange({ border: toggleBorder(el, side) });
                        }}
                    />
                ))}
                <Tool
                    label="All borders"
                    icon={Square}
                    active={sides.length === SIDES.length}
                    onClick={() => {
                        onChange({ border: [...SIDES] });
                    }}
                />
                <Tool
                    label="No border"
                    icon={SquareDashed}
                    onClick={() => {
                        onChange({ border: [] });
                    }}
                />
                <ColorButton
                    label="Border colour"
                    icon={Square}
                    value={el.borderColor}
                    fallback={DEFAULT_STYLE.borderColor}
                    onChange={(borderColor) => {
                        onChange({ borderColor });
                    }}
                />
            </Group>
            <Divider />
            {isText && (
                <>
                    <Group>
                        <Tool
                            label="Smaller text"
                            icon={AArrowDown}
                            onClick={() => {
                                fontSize(-FONT_STEP);
                            }}
                        />
                        <span className="w-8 text-center text-xs tabular-nums">{el.fontSize}</span>
                        <Tool
                            label="Larger text"
                            icon={AArrowUp}
                            onClick={() => {
                                fontSize(FONT_STEP);
                            }}
                        />
                        <Tool
                            label="Bold"
                            icon={Bold}
                            active={el.bold}
                            onClick={() => {
                                onChange({ bold: !el.bold });
                            }}
                        />
                        <Tool
                            label="Italic"
                            icon={Italic}
                            active={el.italic}
                            onClick={() => {
                                onChange({ italic: !el.italic });
                            }}
                        />
                        <Tool
                            label="Underline"
                            icon={Underline}
                            active={el.underline}
                            onClick={() => {
                                onChange({ underline: !el.underline });
                            }}
                        />
                    </Group>
                    <Divider />
                    <Group>
                        {(['left', 'center', 'right'] as const).map((align) => (
                            <Tool
                                key={align}
                                label={`Align ${align}`}
                                icon={ALIGN_ICONS[align]}
                                active={el.align === align}
                                onClick={() => {
                                    onChange({ align });
                                }}
                            />
                        ))}
                    </Group>
                    <Divider />
                </>
            )}
            <Group>
                <ColorButton
                    label={isText ? 'Text colour' : 'Colour'}
                    icon={Baseline}
                    value={el.color}
                    fallback={DEFAULT_STYLE.color}
                    onChange={(color) => {
                        onChange({ color });
                    }}
                />
                <ColorButton
                    label="Fill colour"
                    icon={PaintBucket}
                    value={el.background}
                    fallback="#ffffff"
                    onChange={(background) => {
                        onChange({ background });
                    }}
                />
            </Group>
            <Divider />
            <Group>
                <Tool
                    label="Bring to front"
                    icon={BringToFront}
                    onClick={() => {
                        onOrder(true);
                    }}
                />
                <Tool
                    label="Send to back"
                    icon={SendToBack}
                    onClick={() => {
                        onOrder(false);
                    }}
                />
                <Tool label="Duplicate" icon={Copy} onClick={onDuplicate} />
                <Tool label="Remove" icon={Trash2} destructive onClick={onRemove} />
            </Group>
        </div>
    );
}
