// Bookings: full platform table with status + type filters, detail modal,
// cancel-with-reason, and CSV export of the visible rows.

import React, { useState } from "react";

import { colors } from "../theme";
import { formatINR, formatDate } from "../lib/format";
import { errorMessage } from "../lib/api";
import { PageHeader, Loading, ErrorState, StatusBadge, EmptyState, Modal, DetailRow } from "../components/ui";
import { useBookings, useCancelBooking, BookingRow } from "../hooks/useBookings";

const STATUSES = [
  "", "PENDING", "AWAITING_PAYMENT", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT",
  "COMPLETED", "CANCELLED", "REFUNDED",
];
const TYPES = ["", "PROPERTY", "GUIDE", "EXPERIENCE"];

function toCsv(rows: BookingRow[]): string {
  const header = ["Booking ID", "Guest", "Partner", "Type", "Check-in", "Amount (INR)", "Status"];
  const lines = rows.map((b) =>
    [
      b.booking_id,
      b.user_id,
      b.partner_id ?? "",
      b.booking_type,
      b.checkin_date ?? "",
      (b.amount / 100).toFixed(2),
      b.status,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

export default function Bookings() {
  const [status, setStatus] = useState("");
  const [bookingType, setBookingType] = useState("");
  const [detail, setDetail] = useState<BookingRow | null>(null);

  const { data, isLoading, isError, error, refetch } = useBookings({ status, bookingType });
  const cancel = useCancelBooking();

  const handleCancel = (b: BookingRow) => {
    const reason = window.prompt("Reason for cancellation?");
    if (!reason) return;
    cancel.mutate({ bookingId: b.booking_id, reason });
  };

  const exportCsv = () => {
    if (!data) return;
    const blob = new Blob([toCsv(data.items)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookings.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const cancellable = (s: string) => !["CANCELLED", "REFUNDED", "COMPLETED"].includes(s);

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="All platform bookings"
        actions={<button className="btn" onClick={exportCsv} disabled={!data?.items.length}>Export CSV</button>}
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <select className="field" style={{ maxWidth: 220 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || "All statuses"}</option>
          ))}
        </select>
        <select className="field" style={{ maxWidth: 200 }} value={bookingType} onChange={(e) => setBookingType(e.target.value)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t || "All types"}</option>
          ))}
        </select>
      </div>

      {isLoading && <Loading />}
      {isError && <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />}
      {data && data.items.length === 0 && <EmptyState message="No bookings match." />}

      {data && data.items.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Guest</th>
                <th>Partner</th>
                <th>Type</th>
                <th>Check-in</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((b: BookingRow) => (
                <tr key={b.booking_id}>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{b.booking_id.slice(0, 8)}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{b.user_id.slice(0, 8)}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{b.partner_id ? b.partner_id.slice(0, 8) : "—"}</td>
                  <td>{b.booking_type}</td>
                  <td>{formatDate(b.checkin_date)}</td>
                  <td>{formatINR(b.amount)}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn btn-sm" onClick={() => setDetail(b)}>View</button>{" "}
                    {cancellable(b.status) && (
                      <button className="btn btn-sm btn-danger" disabled={cancel.isPending} onClick={() => handleCancel(b)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!detail} title="Booking Detail" onClose={() => setDetail(null)}>
        {detail && (
          <div>
            <DetailRow label="Booking ID" value={<code>{detail.booking_id}</code>} />
            <DetailRow label="Guest" value={<code>{detail.user_id}</code>} />
            <DetailRow label="Partner" value={detail.partner_id ? <code>{detail.partner_id}</code> : "—"} />
            <DetailRow label="Type" value={detail.booking_type} />
            <DetailRow label="Reference" value={<code>{detail.reference_id}</code>} />
            <DetailRow label="Amount" value={formatINR(detail.amount)} />
            <DetailRow label="Status" value={<StatusBadge status={detail.status} />} />
            <DetailRow label="Check-in" value={formatDate(detail.checkin_date)} />
            <DetailRow label="Check-out" value={formatDate(detail.checkout_date)} />
            <DetailRow label="Created" value={formatDate(detail.created_at)} />
            {detail.cancellation_reason && (
              <DetailRow label="Cancellation reason" value={<span style={{ color: colors.danger }}>{detail.cancellation_reason}</span>} />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
