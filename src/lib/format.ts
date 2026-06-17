// Formatting helpers. Money rule (CLAUDE.md #4): all currency in INR using the
// Indian number format (1,00,000 — not 100,000). Backend amounts are in PAISA.

import dayjs from "dayjs";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

// Convert paisa (integer) to a "₹1,00,000" string with Indian grouping.
export function formatINR(paisa: number | null | undefined): string {
  if (paisa == null) return "—";
  return inr.format(Math.round(paisa) / 100);
}

// "10 Jun 2026" — short human date.
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return dayjs(value).format("DD MMM YYYY");
}

// "10 Jun 2026, 7:01 PM" — date + time.
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return dayjs(value).format("DD MMM YYYY, h:mm A");
}

// First and last day of the current month as YYYY-MM-DD (default report range).
export function currentMonthRange(): { start: string; end: string } {
  const now = dayjs();
  return {
    start: now.startOf("month").format("YYYY-MM-DD"),
    end: now.endOf("month").format("YYYY-MM-DD"),
  };
}

