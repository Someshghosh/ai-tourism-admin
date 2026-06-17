// Dashboard: 4 KPI cards, a pending-applications alert, and recent bookings.

import React from "react";
import { Link } from "react-router-dom";

import { colors } from "../theme";
import { formatINR, formatDate } from "../lib/format";
import { errorMessage } from "../lib/api";
import { PageHeader, Loading, ErrorState, StatusBadge } from "../components/ui";
import { useDashboard } from "../hooks/useDashboard";
import { useApplications } from "../hooks/useApplications";
import { useBookings, BookingRow } from "../hooks/useBookings";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 180 }}>
      <div style={{ color: colors.textMuted, fontSize: 13, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const dash = useDashboard();
  const pending = useApplications("PENDING", 1);
  const recent = useBookings({ limit: 10 });

  const pendingCount = pending.data?.pagination.total ?? 0;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Platform overview" />

      {dash.isLoading && <Loading />}
      {dash.isError && <ErrorState message={errorMessage(dash.error)} onRetry={() => dash.refetch()} />}

      {dash.data && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <StatCard label="Total Users" value={dash.data.total_users.toLocaleString("en-IN")} />
          <StatCard label="Active Partners" value={dash.data.total_partners.toLocaleString("en-IN")} />
          <StatCard label="Total Bookings" value={dash.data.total_bookings.toLocaleString("en-IN")} />
          <StatCard label="GMV" value={formatINR(dash.data.gmv)} />
        </div>
      )}

      {pendingCount > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 18px",
            background: colors.warningLight,
            border: `1px solid ${colors.warning}`,
            borderRadius: 12,
            marginBottom: 20,
            gap: 12,
          }}
        >
          <span style={{ color: colors.warning, fontWeight: 600 }}>
            {pendingCount} partner application{pendingCount === 1 ? "" : "s"} awaiting review
          </span>
          <Link to="/applications" className="btn btn-sm">
            Review Now →
          </Link>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <Link to="/applications" className="btn">
          Pending Applications ({pendingCount})
        </Link>
        <Link to="/reviews" className="btn">
          Pending Reviews
        </Link>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Recent Bookings</h2>
        {recent.isLoading && <Loading />}
        {recent.isError && <ErrorState message={errorMessage(recent.error)} onRetry={() => recent.refetch()} />}
        {recent.data && (
          <table className="tbl">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Guest</th>
                <th>Type</th>
                <th>Check-in</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.data.items.map((b: BookingRow) => (
                <tr key={b.booking_id}>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{b.booking_id.slice(0, 8)}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{b.user_id.slice(0, 8)}</td>
                  <td>{b.booking_type}</td>
                  <td>{formatDate(b.checkin_date)}</td>
                  <td>{formatINR(b.amount)}</td>
                  <td><StatusBadge status={b.status} /></td>
                </tr>
              ))}
              {recent.data.items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: colors.textMuted, padding: 24 }}>
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
