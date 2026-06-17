// Partner Applications: Pending / Approved / Rejected tabs, each a list of cards
// linking to the full-page review screen.

import React, { useState } from "react";
import { Link } from "react-router-dom";

import { colors } from "../theme";
import { formatDate } from "../lib/format";
import { errorMessage } from "../lib/api";
import { PageHeader, Loading, ErrorState, StatusBadge, EmptyState } from "../components/ui";
import { useApplications, ApplicationRow } from "../hooks/useApplications";

const TABS = ["PENDING", "APPROVED", "REJECTED"];

export default function Applications() {
  const [tab, setTab] = useState("PENDING");
  const { data, isLoading, isError, error, refetch } = useApplications(tab);

  return (
    <div>
      <PageHeader title="Partner Applications" subtitle="Review and decide on partner sign-ups" />

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {TABS.map((t) => (
          <button
            key={t}
            className="btn"
            style={tab === t ? { background: colors.primary, borderColor: colors.primary, color: "#fff" } : {}}
            onClick={() => setTab(t)}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading && <Loading />}
      {isError && <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />}

      {data && data.items.length === 0 && <EmptyState message={`No ${tab.toLowerCase()} applications.`} />}

      {data && data.items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.items.map((a: ApplicationRow) => (
            <div key={a.application_id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <strong style={{ fontSize: 16 }}>{a.business_name}</strong>
                  <StatusBadge status={a.partner_type} />
                  <StatusBadge status={a.status} />
                </div>
                <div style={{ color: colors.textMuted, fontSize: 13 }}>
                  Applicant: <code>{a.user_id.slice(0, 8)}</code> · Submitted {formatDate(a.created_at)}
                </div>
                {a.rejection_reason && (
                  <div style={{ color: colors.danger, fontSize: 13, marginTop: 4 }}>
                    Reason: {a.rejection_reason}
                  </div>
                )}
              </div>
              <Link to={`/applications/${a.application_id}`} className="btn btn-primary">
                Review
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
