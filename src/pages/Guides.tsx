// Guides: list with status filter, approve/suspend, certifications detail modal.

import React, { useState } from "react";

import { colors } from "../theme";
import { formatDate } from "../lib/format";
import { errorMessage } from "../lib/api";
import { PageHeader, Loading, ErrorState, StatusBadge, EmptyState, Modal, DetailRow } from "../components/ui";
import { useGuides, useSetGuideStatus, GuideRow } from "../hooks/useGuides";

const FILTERS = [
  { label: "All", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Pending Review", value: "PENDING" },
  { label: "Suspended", value: "SUSPENDED" },
];

export default function Guides() {
  const [status, setStatus] = useState("");
  const [detail, setDetail] = useState<GuideRow | null>(null);
  const { data, isLoading, isError, error, refetch } = useGuides(status);
  const setGuideStatus = useSetGuideStatus();

  const suspend = (id: string) => {
    const reason = window.prompt("Reason for suspension?");
    if (reason == null) return;
    setGuideStatus.mutate({ guideId: id, status: "SUSPENDED", reason });
  };

  return (
    <div>
      <PageHeader title="Guides" subtitle="Local guides on the platform" />

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button
            key={f.label}
            className="btn"
            style={status === f.value ? { background: colors.primary, borderColor: colors.primary, color: "#fff" } : {}}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <Loading />}
      {isError && <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />}
      {data && data.items.length === 0 && <EmptyState message="No guides found." />}

      {data && data.items.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Display name</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Total Bookings</th>
                <th>Created</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((g: GuideRow) => (
                <tr key={g.guide_id}>
                  <td>
                    <button className="btn btn-sm" onClick={() => setDetail(g)}>{g.display_name}</button>
                  </td>
                  <td><StatusBadge status={g.status} /></td>
                  <td>{g.rating != null ? g.rating.toFixed(1) : "—"}</td>
                  <td>{g.total_bookings}</td>
                  <td>{formatDate(g.created_at)}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {g.status === "PENDING" && (
                      <button
                        className="btn btn-sm btn-primary"
                        disabled={setGuideStatus.isPending}
                        onClick={() => setGuideStatus.mutate({ guideId: g.guide_id, status: "ACTIVE" })}
                      >
                        Approve
                      </button>
                    )}{" "}
                    {g.status === "ACTIVE" && (
                      <button className="btn btn-sm btn-danger" disabled={setGuideStatus.isPending} onClick={() => suspend(g.guide_id)}>
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!detail} title={detail?.display_name || "Guide"} onClose={() => setDetail(null)}>
        {detail && (
          <div>
            <DetailRow label="Guide ID" value={<code>{detail.guide_id}</code>} />
            <DetailRow label="User ID" value={<code>{detail.user_id}</code>} />
            <DetailRow label="Status" value={<StatusBadge status={detail.status} />} />
            <DetailRow label="Rating" value={detail.rating != null ? detail.rating.toFixed(1) : "—"} />
            <DetailRow label="Total reviews" value={detail.total_reviews} />
            <DetailRow label="Total bookings" value={detail.total_bookings} />
            <DetailRow
              label="Certifications"
              value={
                Array.isArray(detail.certifications_json) && detail.certifications_json.length
                  ? (detail.certifications_json as any[]).map((c, i) => (
                      <div key={i}>{typeof c === "string" ? c : JSON.stringify(c)}</div>
                    ))
                  : "None on file"
              }
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
