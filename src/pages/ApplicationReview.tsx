// Full-page application review. The backend has no GET-by-id endpoint, so we
// locate the application within the (unfiltered) list the admin already has
// access to. Approve flips the user's role via the promote endpoint; reject
// records a reason.

import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { colors } from "../theme";
import { formatDate } from "../lib/format";
import { errorMessage } from "../lib/api";
import { PageHeader, Loading, ErrorState, StatusBadge, DetailRow } from "../components/ui";
import { useApplications, useRejectApplication, ApplicationRow } from "../hooks/useApplications";
import { usePromoteToPartner } from "../hooks/useUsers";

export default function ApplicationReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Pull the full list (all statuses) and find this application.
  const { data, isLoading, isError, error, refetch } = useApplications(undefined, 100);
  const app = useMemo(
    () => data?.items.find((a: ApplicationRow) => a.application_id === id),
    [data, id]
  );

  const promote = usePromoteToPartner();
  const reject = useRejectApplication();

  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [banner, setBanner] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!app) return;
    if (!window.confirm("This will change the user's role to PARTNER. Proceed?")) return;
    setActionError(null);
    try {
      await promote.mutateAsync(app.user_id);
      setBanner("Application approved — partner is now active.");
    } catch (e) {
      setActionError(errorMessage(e));
    }
  };

  const handleReject = async () => {
    if (!app || !reason.trim()) return;
    setActionError(null);
    try {
      await reject.mutateAsync({ applicationId: app.application_id, reason: reason.trim() });
      navigate("/applications", { replace: true });
    } catch (e) {
      setActionError(errorMessage(e));
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;
  if (!app) return <ErrorState message="Application not found." onRetry={() => navigate("/applications")} />;

  const decided = app.status !== "PENDING";

  return (
    <div style={{ maxWidth: 720 }}>
      <PageHeader
        title="Application Review"
        subtitle={app.business_name}
        actions={<button className="btn" onClick={() => navigate("/applications")}>← Back</button>}
      />

      {banner && (
        <div style={{ padding: 14, background: colors.successLight, color: colors.success, border: `1px solid ${colors.success}`, borderRadius: 10, marginBottom: 18, fontWeight: 600 }}>
          {banner}
        </div>
      )}

      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>Business details</h3>
        <DetailRow label="Business name" value={app.business_name} />
        <DetailRow label="Partner type" value={<StatusBadge status={app.partner_type} />} />
        <DetailRow label="Status" value={<StatusBadge status={app.status} />} />
        <DetailRow label="Applicant ID" value={<code>{app.user_id}</code>} />
        <DetailRow label="Submitted" value={formatDate(app.created_at)} />
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>Identity & bank (dev)</h3>
        <DetailRow label="Identity document" value="Document on file" />
        <DetailRow label="Bank account" value="Account on file (masked)" />
        <p style={{ color: colors.textMuted, fontSize: 13, margin: "8px 0 0" }}>
          Full documents are not surfaced in the dev admin panel.
        </p>
      </div>

      {actionError && <ErrorState message={actionError} />}

      {!decided && !banner && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Decision</h3>
          {!rejecting ? (
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-primary" disabled={promote.isPending} onClick={handleApprove}>
                {promote.isPending ? "Approving…" : "APPROVE"}
              </button>
              <button className="btn btn-danger" onClick={() => setRejecting(true)}>
                REJECT
              </button>
            </div>
          ) : (
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Rejection reason</label>
              <textarea
                className="field"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter rejection reason"
                autoFocus
              />
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button className="btn btn-danger" disabled={!reason.trim() || reject.isPending} onClick={handleReject}>
                  {reject.isPending ? "Submitting…" : "Submit rejection"}
                </button>
                <button className="btn" onClick={() => { setRejecting(false); setReason(""); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
