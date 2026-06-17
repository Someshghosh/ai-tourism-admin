// Financial Reports — date range, summary cards, daily GMV line chart,
// breakdown tables (by type, top partners), and a CSV export of bookings.

import React, { useState } from "react";
import {
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";

import { colors } from "../theme";
import { formatINR, formatDate, currentMonthRange } from "../lib/format";
import { api, errorMessage } from "../lib/api";
import { PageHeader, Loading, ErrorState } from "../components/ui";
import { useFinancialReport } from "../hooks/useReports";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 170 }}>
      <div style={{ color: colors.textMuted, fontSize: 13, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>{value}</div>
    </div>
  );
}

// ₹ tick/tooltip formatter — values come in paisa.
const rupees = (paisa: number) => formatINR(paisa);

export default function Reports() {
  const initial = currentMonthRange();
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);

  const { data, isLoading, isError, error, refetch } = useFinancialReport(start, end);
  const [exporting, setExporting] = useState(false);

  // Export all bookings in the range to CSV (fetched from the bookings endpoint).
  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get("/admin/bookings", { params: { limit: 100 } });
      const items: any[] = res.data?.data?.items ?? [];
      const inRange = items.filter((b) => {
        const d = (b.created_at ?? "").slice(0, 10);
        return d >= start && d <= end;
      });
      const header = ["Booking ID", "Guest", "Partner", "Type", "Amount (INR)", "Status", "Created"];
      const lines = inRange.map((b) =>
        [b.booking_id, b.user_id, b.partner_id ?? "", b.booking_type, (b.amount / 100).toFixed(2), b.status, b.created_at ?? ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      );
      const csv = [header.join(","), ...lines].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bookings_${start}_${end}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Financial Reports"
        subtitle="Revenue, commission and payouts over a period"
        actions={
          <button className="btn" onClick={exportCsv} disabled={exporting}>
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        }
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "flex-end", flexWrap: "wrap" }}>
        <label style={{ fontSize: 13, color: colors.textMuted }}>
          Start<br />
          <input type="date" className="field" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label style={{ fontSize: 13, color: colors.textMuted }}>
          End<br />
          <input type="date" className="field" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>

      {isLoading && <Loading />}
      {isError && <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />}

      {data && (
        <>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <StatCard label="Total GMV" value={formatINR(data.totals.gmv)} />
            <StatCard label="Total Commission" value={formatINR(data.totals.commission)} />
            <StatCard label="Total Payouts" value={formatINR(data.totals.payouts)} />
            <StatCard label="Net Revenue" value={formatINR(data.totals.net_revenue)} />
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <h2 style={{ marginTop: 0, fontSize: 16 }}>Daily GMV</h2>
            {data.daily.length === 0 ? (
              <div style={{ color: colors.textMuted, padding: 24 }}>No bookings in this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.daily} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: colors.textMuted }} />
                  <YAxis tickFormatter={rupees} width={90} tick={{ fontSize: 12, fill: colors.textMuted }} />
                  <Tooltip formatter={(v) => rupees(Number(v))} />
                  <Line type="monotone" dataKey="gmv" stroke={colors.primary} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div className="card" style={{ flex: 1, minWidth: 300 }}>
              <h2 style={{ marginTop: 0, fontSize: 16 }}>By Booking Type</h2>
              <table className="tbl">
                <thead>
                  <tr><th>Type</th><th>Amount</th><th>Count</th></tr>
                </thead>
                <tbody>
                  {data.by_type.map((r: { type: string; amount: number; count: number }) => (
                    <tr key={r.type}>
                      <td>{r.type}</td>
                      <td>{formatINR(r.amount)}</td>
                      <td>{r.count}</td>
                    </tr>
                  ))}
                  {data.by_type.length === 0 && (
                    <tr><td colSpan={3} style={{ color: colors.textMuted }}>No data.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="card" style={{ flex: 1, minWidth: 300 }}>
              <h2 style={{ marginTop: 0, fontSize: 16 }}>Top 10 Partners</h2>
              <table className="tbl">
                <thead>
                  <tr><th>Partner</th><th>Revenue</th><th>Bookings</th></tr>
                </thead>
                <tbody>
                  {data.top_partners.map((r: { partner_id: string; amount: number; count: number }) => (
                    <tr key={r.partner_id}>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{r.partner_id.slice(0, 8)}</td>
                      <td>{formatINR(r.amount)}</td>
                      <td>{r.count}</td>
                    </tr>
                  ))}
                  {data.top_partners.length === 0 && (
                    <tr><td colSpan={3} style={{ color: colors.textMuted }}>No data.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p style={{ color: colors.textMuted, fontSize: 12, marginTop: 16 }}>
            Period: {formatDate(data.start_date)} – {formatDate(data.end_date)}
          </p>
        </>
      )}
    </div>
  );
}
