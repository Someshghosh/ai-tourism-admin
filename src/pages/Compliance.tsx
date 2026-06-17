// Compliance Dashboard — summary cards, guest registration table with filters
// and retry, and a property NOC status table.

import React, { useState } from "react";

import { colors } from "../theme";
import { formatDate } from "../lib/format";
import { errorMessage } from "../lib/api";
import { PageHeader, Loading, ErrorState, EmptyState, StatusBadge } from "../components/ui";
import {
  useComplianceSummary, useRegistrations, useComplianceProperties, useRetrySubmission,
  RegistrationRow, PropertyComplianceRow,
} from "../hooks/useCompliance";

function StatCard({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 180 }}>
      <div style={{ color: colors.textMuted, fontSize: 13, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: warn && value > 0 ? colors.danger : colors.text }}>
        {value.toLocaleString("en-IN")}
      </div>
    </div>
  );
}

function idDoc(r: RegistrationRow): string {
  if (r.is_foreign_national) return r.passport_number ? `Passport ${r.passport_number}` : "Passport —";
  return r.aadhaar_last4 ? `Aadhaar ••••${r.aadhaar_last4}` : "Aadhaar —";
}

export default function Compliance() {
  const [foreignOnly, setForeignOnly] = useState(false);
  const [failedOnly, setFailedOnly] = useState(false);

  const summary = useComplianceSummary();
  const regs = useRegistrations({ foreignOnly, failedOnly });
  const props = useComplianceProperties();
  const retry = useRetrySubmission();

  return (
    <div>
      <PageHeader title="Compliance" subtitle="Guest registrations, C-Forms & property NOC status" />

      {summary.isLoading && <Loading />}
      {summary.isError && <ErrorState message={errorMessage(summary.error)} onRetry={() => summary.refetch()} />}
      {summary.data && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
          <StatCard label="Registrations This Month" value={summary.data.total_registrations} />
          <StatCard label="Pending C-Forms" value={summary.data.pending_cforms} warn />
          <StatCard label="Properties Missing NOC" value={summary.data.missing_noc_count} warn />
          <StatCard label="Submissions Failed" value={summary.data.failed_submissions} warn />
        </div>
      )}

      {/* Guest registrations */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Guest Registration Status</h2>
          <div style={{ display: "flex", gap: 16 }}>
            <label style={{ fontSize: 13 }}>
              <input type="checkbox" checked={foreignOnly} onChange={(e) => setForeignOnly(e.target.checked)} /> Foreign nationals only
            </label>
            <label style={{ fontSize: 13 }}>
              <input type="checkbox" checked={failedOnly} onChange={(e) => setFailedOnly(e.target.checked)} /> Failed submissions only
            </label>
          </div>
        </div>

        {regs.isLoading && <Loading />}
        {regs.isError && <ErrorState message={errorMessage(regs.error)} onRetry={() => regs.refetch()} />}
        {regs.data && regs.data.items.length === 0 && <EmptyState message="No registrations match." />}
        {regs.data && regs.data.items.length > 0 && (
          <table className="tbl">
            <thead>
              <tr>
                <th>Booking</th><th>Property</th><th>Guest</th><th>Check-in</th>
                <th>Nationality</th><th>ID</th><th>Submission</th><th>C-Form</th><th></th>
              </tr>
            </thead>
            <tbody>
              {regs.data.items.map((r: RegistrationRow) => (
                <tr key={r.registration_id}>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{r.booking_id.slice(0, 8)}</td>
                  <td>{r.property_name || "—"}</td>
                  <td>{r.full_name}</td>
                  <td>{formatDate(r.checkin_date)}</td>
                  <td>{r.nationality || "—"}{r.is_foreign_national ? " 🌐" : ""}</td>
                  <td>{idDoc(r)}</td>
                  <td><StatusBadge status={r.submission_failed ? "FAILED" : r.state_submission_status} /></td>
                  <td>{r.cform_required ? "Yes" : "No"}</td>
                  <td style={{ textAlign: "right" }}>
                    {r.submission_failed && (
                      <button className="btn btn-sm" disabled={retry.isPending} onClick={() => retry.mutate(r.registration_id)}>
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Property NOC */}
      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Property NOC Status</h2>
        {props.isLoading && <Loading />}
        {props.isError && <ErrorState message={errorMessage(props.error)} onRetry={() => props.refetch()} />}
        {props.data && props.data.items.length === 0 && (
          <EmptyState message="No property government registrations on file yet." />
        )}
        {props.data && props.data.items.length > 0 && (
          <table className="tbl">
            <thead>
              <tr><th>Property</th><th>Owner</th><th>Status</th><th>NOC</th><th>Tourism Reg.</th></tr>
            </thead>
            <tbody>
              {props.data.items.map((p: PropertyComplianceRow) => (
                <tr key={p.prop_reg_id}>
                  <td>{p.property_name || "—"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{p.owner_id ? p.owner_id.slice(0, 8) : "—"}</td>
                  <td><StatusBadge status={p.compliance_status} /></td>
                  <td>{p.has_noc ? "Issued" : <StatusBadge status="REQUIRES NOC" />}</td>
                  <td>{p.tourism_reg_number || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
