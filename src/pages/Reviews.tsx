// Review Moderation Queue — tabs, review cards with approve/reject/flag,
// a rejection-reason modal, and bulk approve/reject of selected reviews.

import React, { useState } from "react";

import { colors } from "../theme";
import { formatDate } from "../lib/format";
import { errorMessage } from "../lib/api";
import { PageHeader, Loading, ErrorState, EmptyState, StatusBadge, Modal } from "../components/ui";
import { useReviews, useModerateReview, ReviewRow } from "../hooks/useReviews";

// UI tab -> backend status filter. "Flagged" reuses PENDING (flagged reviews
// are stored as PENDING + a flag note on the backend).
const TABS: { key: string; label: string; status: string }[] = [
  { key: "PENDING", label: "Pending Review", status: "PENDING" },
  { key: "FLAGGED", label: "Flagged", status: "PENDING" },
  { key: "APPROVED", label: "Approved", status: "APPROVED" },
  { key: "REJECTED", label: "Rejected", status: "REJECTED" },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#E0A100", letterSpacing: 1 }}>
      {"★".repeat(rating)}
      <span style={{ color: colors.border }}>{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function Reviews() {
  const [tab, setTab] = useState(TABS[0]);
  const { data, isLoading, isError, error, refetch } = useReviews(tab.status);
  const moderate = useModerateReview();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectTarget, setRejectTarget] = useState<ReviewRow | "BULK" | null>(null);
  const [reason, setReason] = useState("");

  const items = data?.items ?? [];

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const clearSelection = () => setSelected(new Set());

  const approve = (r: ReviewRow) => moderate.mutate({ reviewId: r.review_id, status: "APPROVED" });
  const flag = (r: ReviewRow) =>
    moderate.mutate({ reviewId: r.review_id, status: "FLAGGED", reason: "Flagged for escalation" });

  const submitReject = async () => {
    if (rejectTarget === "BULK") {
      for (const id of Array.from(selected)) {
        await moderate.mutateAsync({ reviewId: id, status: "REJECTED", reason: reason || undefined });
      }
      clearSelection();
    } else if (rejectTarget) {
      await moderate.mutateAsync({ reviewId: rejectTarget.review_id, status: "REJECTED", reason: reason || undefined });
    }
    setRejectTarget(null);
    setReason("");
  };

  const bulkApprove = async () => {
    for (const id of Array.from(selected)) {
      await moderate.mutateAsync({ reviewId: id, status: "APPROVED" });
    }
    clearSelection();
  };

  return (
    <div>
      <PageHeader title="Review Moderation" subtitle="Approve, reject, or flag user reviews" />

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className="btn"
            style={tab.key === t.key ? { background: colors.primary, borderColor: colors.primary, color: "#fff" } : {}}
            onClick={() => { setTab(t); clearSelection(); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, padding: "10px 14px", background: colors.primaryLight, borderRadius: 10 }}>
          <span style={{ fontWeight: 600, color: colors.primary }}>{selected.size} selected</span>
          <button className="btn btn-sm btn-primary" onClick={bulkApprove} disabled={moderate.isPending}>Approve all</button>
          <button className="btn btn-sm btn-danger" onClick={() => { setRejectTarget("BULK"); setReason(""); }} disabled={moderate.isPending}>Reject all</button>
          <button className="btn btn-sm" onClick={clearSelection}>Clear</button>
        </div>
      )}

      {isLoading && <Loading />}
      {isError && <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />}
      {data && items.length === 0 && <EmptyState message="No reviews in this queue." />}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((r: ReviewRow) => (
          <div key={r.review_id} className="card" style={{ display: "flex", gap: 14 }}>
            <input
              type="checkbox"
              checked={selected.has(r.review_id)}
              onChange={() => toggle(r.review_id)}
              style={{ marginTop: 4 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <strong>{r.entity_name || `${r.entity_type} ${r.entity_id.slice(0, 8)}`}</strong>
                <StatusBadge status={r.entity_type} />
                <Stars rating={r.rating} />
                <StatusBadge status={r.moderation_status} />
              </div>
              {r.title && <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.title}</div>}
              {r.comment && <div style={{ color: colors.text, marginBottom: 8 }}>{r.comment}</div>}
              <div style={{ color: colors.textMuted, fontSize: 13 }}>
                {r.is_anonymous ? "Anonymous" : `User ${r.user_id.slice(0, 8)}`} · {formatDate(r.created_at)}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button className="btn btn-sm btn-primary" onClick={() => approve(r)} disabled={moderate.isPending}>Approve ✓</button>
              <button className="btn btn-sm btn-danger" onClick={() => { setRejectTarget(r); setReason(""); }} disabled={moderate.isPending}>Reject ✗</button>
              <button className="btn btn-sm" onClick={() => flag(r)} disabled={moderate.isPending}>Flag ⚑</button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={rejectTarget !== null}
        title={rejectTarget === "BULK" ? `Reject ${selected.size} reviews` : "Reject review"}
        onClose={() => setRejectTarget(null)}
      >
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Rejection reason</label>
        <textarea className="field" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this review being rejected?" autoFocus />
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button className="btn btn-danger" onClick={submitReject} disabled={moderate.isPending}>
            {moderate.isPending ? "Submitting…" : "Confirm rejection"}
          </button>
          <button className="btn" onClick={() => setRejectTarget(null)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
