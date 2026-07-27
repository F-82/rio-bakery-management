import { describe, expect, it } from "vitest";
import { Decimal } from "decimal.js";
import { formatLKR, formatQty, formatDate, normalisePhone } from "@/lib/format";

// Intl's LKR currency format uses a non-breaking space (U+00A0) between the
// currency code and the amount, not a regular space.
const NBSP = " ";

describe("formatLKR", () => {
  it("formats a positive amount with two decimals and thousands separators", () => {
    expect(formatLKR(1234.5)).toBe(`LKR${NBSP}1,234.50`);
  });

  it("formats zero", () => {
    expect(formatLKR(0)).toBe(`LKR${NBSP}0.00`);
  });

  it("formats a negative amount", () => {
    expect(formatLKR(-45)).toBe(`-LKR${NBSP}45.00`);
  });

  it("accepts a Decimal instance", () => {
    expect(formatLKR(new Decimal("199.999"))).toBe(formatLKR(new Decimal("199.999").toNumber()));
  });

  it("accepts a numeric string straight from the db", () => {
    expect(formatLKR("2500.00")).toBe(`LKR${NBSP}2,500.00`);
  });
});

describe("formatQty", () => {
  it("trims trailing zeros", () => {
    expect(formatQty(2.5)).toBe("2.5");
    expect(formatQty(0)).toBe("0");
  });

  it("caps at 3 decimal places", () => {
    expect(formatQty(1234.567)).toBe("1,234.567");
  });

  it("appends a unit verbatim without converting it", () => {
    expect(formatQty(250, "g")).toBe("250 g");
  });

  it("accepts a Decimal instance", () => {
    expect(formatQty(new Decimal("0.250"), "kg")).toBe("0.25 kg");
  });
});

describe("formatDate", () => {
  // 2026-07-27T20:30:00Z is 2026-07-28 02:00 in Asia/Colombo (UTC+5:30)
  const utc = "2026-07-27T20:30:00Z";

  it("renders the Colombo-local date", () => {
    expect(formatDate(utc, "date")).toBe("Jul 28, 2026");
  });

  it("renders the Colombo-local time", () => {
    expect(formatDate(utc, "time")).toBe("2:00 AM");
  });

  it("defaults to datetime", () => {
    expect(formatDate(utc)).toBe("Jul 28, 2026, 2:00 AM");
    expect(formatDate(utc)).toBe(formatDate(utc, "datetime"));
  });

  it("accepts a Date instance", () => {
    expect(formatDate(new Date(utc), "date")).toBe("Jul 28, 2026");
  });
});

describe("normalisePhone", () => {
  it("normalises all four equivalent formats to the same E.164 number", () => {
    const expected = "+94771234567";
    expect(normalisePhone("0771234567")).toBe(expected);
    expect(normalisePhone("+94771234567")).toBe(expected);
    expect(normalisePhone("771234567")).toBe(expected);
    expect(normalisePhone("94771234567")).toBe(expected);
  });

  it("strips spaces and dashes in any position", () => {
    const expected = "+94771234567";
    expect(normalisePhone("077 123 4567")).toBe(expected);
    expect(normalisePhone("077-123-4567")).toBe(expected);
    expect(normalisePhone("+94 77 123 4567")).toBe(expected);
    expect(normalisePhone("+94-77-123-4567")).toBe(expected);
    expect(normalisePhone("0 77 - 123 - 4567")).toBe(expected);
  });

  it("accepts a landline-shaped national number", () => {
    expect(normalisePhone("0112233445")).toBe("+94112233445");
  });

  it("rejects a local number with a doubled leading zero", () => {
    expect(normalisePhone("0071234567")).toBeNull();
  });

  it("rejects numbers that are too short or too long", () => {
    expect(normalisePhone("12345")).toBeNull();
    expect(normalisePhone("0771234567890")).toBeNull();
  });

  it("rejects a non Sri Lankan country code", () => {
    expect(normalisePhone("+1234567890123")).toBeNull();
  });

  it("rejects non-numeric input", () => {
    expect(normalisePhone("abc1234567")).toBeNull();
    expect(normalisePhone("")).toBeNull();
  });
});
