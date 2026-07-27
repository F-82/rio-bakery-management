import { Decimal } from "decimal.js";

const COLOMBO_TZ = "Asia/Colombo";

type MoneyInput = Decimal | number | string;
type QtyInput = Decimal | number | string;

const lkrFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
});

const qtyFormatter = new Intl.NumberFormat("en-LK", {
  maximumFractionDigits: 3,
  minimumFractionDigits: 0,
});

/** Formats a `numeric(12,2)` money value. The only place a money value becomes a display string. */
export function formatLKR(amount: MoneyInput): string {
  const value = amount instanceof Decimal ? amount : new Decimal(amount);
  return lkrFormatter.format(value.toNumber());
}

/** Formats a `numeric(12,3)` quantity. Storage stays in the item's base_unit; no conversion happens here. */
export function formatQty(qty: QtyInput, unit?: string): string {
  const value = qty instanceof Decimal ? qty : new Decimal(qty);
  const formatted = qtyFormatter.format(value.toNumber());
  return unit ? `${formatted} ${unit}` : formatted;
}

export type DateFormatStyle = "date" | "time" | "datetime";

const dateFormatters: Record<DateFormatStyle, Intl.DateTimeFormat> = {
  date: new Intl.DateTimeFormat("en-LK", {
    timeZone: COLOMBO_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }),
  time: new Intl.DateTimeFormat("en-LK", {
    timeZone: COLOMBO_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }),
  datetime: new Intl.DateTimeFormat("en-LK", {
    timeZone: COLOMBO_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }),
};

/** Renders a UTC timestamp in Asia/Colombo. The only place a date becomes a display string. */
export function formatDate(value: Date | string, style: DateFormatStyle = "datetime"): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return dateFormatters[style].format(date);
}

const SL_NATIONAL_NUMBER = /^[1-9]\d{8}$/;

/**
 * Normalises a Sri Lankan phone number to E.164 (+94XXXXXXXXX).
 * Accepts 0771234567, 771234567, 94771234567, +94771234567, with spaces or
 * dashes anywhere. Returns null if the input isn't a valid Sri Lankan number.
 */
export function normalisePhone(input: string): string | null {
  if (typeof input !== "string") return null;

  const trimmed = input.trim();
  const hasLeadingPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[\s-]/g, "").replace(/^\+/, "");

  if (!/^\d+$/.test(digits)) return null;

  let national: string | null = null;
  if (digits.length === 11 && digits.startsWith("94")) {
    national = digits.slice(2);
  } else if (!hasLeadingPlus && digits.length === 10 && digits.startsWith("0")) {
    national = digits.slice(1);
  } else if (!hasLeadingPlus && digits.length === 9) {
    national = digits;
  }

  if (!national || !SL_NATIONAL_NUMBER.test(national)) return null;
  return `+94${national}`;
}
