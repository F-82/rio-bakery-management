"use client";

import { currentTaxPeriodValue, type TaxGranularity } from "@/lib/tax";
import { useUrlFilters } from "@/lib/hooks/use-url-filters";
import { useTranslation } from "react-i18next";

const YEARS_BACK = 5;
const QUARTER_VALUE = /^(\d{4})-Q([1-4])$/;

const SELECT_CLASS = "h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink";

/** Same fixed UTC+05:30 offset technique used throughout lib/tax.ts and lib/dashboard.ts. */
function currentYear(): number {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).getUTCFullYear();
}

/**
 * Renders a different control per granularity — a native month input, or a
 * year + quarter pair, or a year select. No custom calendar component
 * exists anywhere in this app yet (OrdersFilters uses plain `<input
 * type="date">`); this follows the same restraint.
 */
export function PeriodPicker({ granularity }: { granularity: TaxGranularity }) {
    const { t } = useTranslation();
  const { isPending, commit, searchParams } = useUrlFilters();
  const period = searchParams.get("period") || currentTaxPeriodValue(granularity);
  const dimClass = `transition-opacity ${isPending ? "pointer-events-none opacity-60" : ""}`;

  function setPeriod(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    commit(params);
  }

  const thisYear = currentYear();
  const years = Array.from({ length: YEARS_BACK + 1 }, (_, index) => thisYear - index);

  if (granularity === "monthly") {
    return (
      <input
        type="month"
        value={period}
        onChange={(event) => event.target.value && setPeriod(event.target.value)}
        className={`${SELECT_CLASS} ${dimClass}`}
        aria-label="Month"
      />
    );
  }

  if (granularity === "quarterly") {
    const match = QUARTER_VALUE.exec(period);
    const [periodYear, quarter] = match ? [match[1], match[2]] : [String(thisYear), "1"];
    return (
      <div className={`flex gap-2 ${dimClass}`}>
        <select
          value={periodYear}
          onChange={(event) => setPeriod(`${event.target.value}-Q${quarter}`)}
          className={SELECT_CLASS}
          aria-label="Year"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <select
          value={quarter}
          onChange={(event) => setPeriod(`${periodYear}-Q${event.target.value}`)}
          className={SELECT_CLASS}
          aria-label="Quarter"
        >
          {["1", "2", "3", "4"].map((q) => (
            <option key={q} value={q}>
              {t("Q")}{q}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <select value={period} onChange={(event) => setPeriod(event.target.value)} className={`${SELECT_CLASS} ${dimClass}`} aria-label="Year">
      {years.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  );
}
