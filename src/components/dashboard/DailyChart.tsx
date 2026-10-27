import type { DailyCount } from '@shared/types';
import { cn } from '@/lib/utils';

const GRID_STEPS = 4;

// Rounds the axis top up to a tidy number so gridlines land on readable values.
function niceMax(max: number) {
    if (max <= GRID_STEPS) {
        return GRID_STEPS;
    }
    const step = 10 ** Math.floor(Math.log10(max / GRID_STEPS));
    const unit =
        [1, 2, 3, 5, 10].map((m) => m * step).find((u) => u * GRID_STEPS >= max) ?? step * 10;
    return unit * GRID_STEPS;
}

const dayLabel = (iso: string, options: Intl.DateTimeFormatOptions) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', options);

// Single-series bar chart of receipts per day; the card title names the series, so no legend.
export function DailyChart({ data }: { data: DailyCount[] }) {
    const top = niceMax(Math.max(0, ...data.map((d) => d.count)));
    const ticks = Array.from(
        { length: GRID_STEPS + 1 },
        (_, i) => (top / GRID_STEPS) * (GRID_STEPS - i),
    );
    const last = data.length - 1;

    return (
        <figure className="space-y-2">
            <div className="flex h-56 gap-3">
                <div className="flex flex-col justify-between pb-6 text-right text-[11px] text-muted-foreground tabular-nums">
                    {ticks.map((t) => (
                        <span
                            key={t}
                            className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0"
                        >
                            {t}
                        </span>
                    ))}
                </div>
                <div className="relative flex-1">
                    <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
                        {ticks.map((t) => (
                            <div key={t} className="border-t border-dashed border-border/70" />
                        ))}
                    </div>
                    <div className="absolute inset-x-0 top-0 bottom-0 flex items-end gap-[2px] sm:gap-1">
                        {data.map((d, i) => {
                            const pct = (d.count / top) * 100;
                            return (
                                <div
                                    key={d.date}
                                    className="group relative flex h-full flex-1 flex-col justify-end"
                                >
                                    <div className="relative mb-6 flex h-full flex-col justify-end">
                                        {i === last && d.count > 0 && (
                                            <span className="mb-1 text-center text-[11px] font-semibold tabular-nums">
                                                {d.count}
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            aria-label={`${dayLabel(d.date, {
                                                day: 'numeric',
                                                month: 'short',
                                            })}: ${d.count} receipts`}
                                            className={cn(
                                                'w-full origin-bottom animate-[grow_0.6s_cubic-bezier(0.2,0.7,0.2,1)_both] rounded-t-[4px] bg-chart-1 transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                i !== last && 'opacity-70 group-hover:opacity-100',
                                            )}
                                            style={{
                                                height: `max(${pct}%, ${d.count ? '4px' : '1px'})`,
                                                animationDelay: `${i * 30}ms`,
                                            }}
                                        />
                                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground opacity-0 shadow-md transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                                            <span className="font-semibold tabular-nums">
                                                {d.count}
                                            </span>{' '}
                                            <span className="text-muted-foreground">
                                                {dayLabel(d.date, {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <span
                                        className={cn(
                                            'absolute inset-x-0 bottom-0 text-center text-[11px] text-muted-foreground tabular-nums',
                                            i % 2 === 1 && i !== last && 'hidden sm:block',
                                            i === last && 'font-semibold text-foreground',
                                        )}
                                    >
                                        {dayLabel(d.date, { day: 'numeric' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <table className="sr-only">
                <caption>Receipts per day, last {data.length} days</caption>
                <tbody>
                    {data.map((d) => (
                        <tr key={d.date}>
                            <th scope="row">{d.date}</th>
                            <td>{d.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
}
