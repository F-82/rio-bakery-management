import { formatDate, formatLKR } from "@/lib/format";
import type { RevenueByDay } from "@/lib/finance";

type RevenueByDayChartProps = {
  data: RevenueByDay[];
};

const PLOT_HEIGHT_PX = 160;
const MIN_BAR_HEIGHT_PX = 2;

/**
 * Single-series magnitude chart — one hue (--accent), no legend needed
 * (the section label already names what's plotted), hover/focus tooltip on
 * each bar carries the exact value so nothing is gated behind a mouse.
 * Built as plain HTML/CSS rather than a charting library: one bar chart,
 * no second use case yet to justify the dependency.
 */
export function RevenueByDayChart({ data }: RevenueByDayChartProps) {
  const max = Math.max(...data.map((point) => point.revenue), 0);
  // Spaces labels so they don't collide — at least every 3rd bar, more if
  // there are enough days that a tighter spacing would overlap text.
  const labelEvery = Math.max(3, Math.ceil(data.length / 6));

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <div
          className="flex min-w-fit items-end justify-center gap-0.5 border-b border-line"
          style={{ height: PLOT_HEIGHT_PX }}
        >
          {data.map((point) => {
            const height =
              max === 0 ? MIN_BAR_HEIGHT_PX : Math.max(MIN_BAR_HEIGHT_PX, Math.round((point.revenue / max) * PLOT_HEIGHT_PX));
            return (
              <div
                key={point.date}
                className="group relative flex w-6 shrink-0 flex-col items-center justify-end"
                style={{ height: PLOT_HEIGHT_PX }}
              >
                <div
                  role="img"
                  aria-label={`${formatDate(point.date, "date")}: ${formatLKR(point.revenue)}`}
                  tabIndex={0}
                  className="w-full rounded-t-[4px] bg-accent outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  style={{ height }}
                />
                <div className="pointer-events-none absolute bottom-full z-10 mb-2 hidden flex-col items-center rounded-tile bg-ink px-2 py-1 whitespace-nowrap group-hover:flex group-focus-within:flex">
                  <span className="text-micro text-on-black">{formatDate(point.date, "date")}</span>
                  <span className="text-body-sm text-on-black">{formatLKR(point.revenue)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex min-w-fit justify-center gap-0.5">
        {data.map((point, index) => (
          <div key={point.date} className="w-6 shrink-0 text-center">
            {index % labelEvery === 0 && (
              <span className="text-micro whitespace-nowrap text-ink-3">{formatDate(point.date, "date")}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
