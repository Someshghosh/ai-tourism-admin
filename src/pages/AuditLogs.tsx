// Audit Logs — filterable table of admin actions; click a row to expand its
// payload (old/new values).

import React, { useState } from "react";

import { colors } from "../theme";
import { formatDateTime } from "../lib/format";
import { errorMessage } from "../lib/api";
import { PageHeader, Loading, ErrorState, EmptyState } from "../components/ui";
import { useAuditLogs, useAuditActions, AuditLogRow } from "../hooks/useAudit";

export default function AuditLogs() {
  const [q, setQ] = useState("");
  const [committedQ, setCommittedQ] = useState("");
  const [action, setAction] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const actions = useAuditActions();
  const { data, isLoading, isError, error, refetch } = useAuditLogs({
    action, q: committedQ, start, end,
  });

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Every admin action, recorded" />

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <label style={lbl}>User (name / phone)</label>
          <input
            className="field"
            style={{ maxWidth: 220 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setCommittedQ(q.trim())}
            placeholder="Search & Enter"
          />
        </div>
        <div>
          <label style={lbl}>Action</label>
          <select className="field" style={{ maxWidth: 220 }} value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">All actions</option>
            {(actions.data ?? []).map((a: string) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={lbl}>From</label>
          <input type="date" className="field" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label style={lbl}>To</label>
          <input type="date" className="field" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <button className="btn" onClick={() => { setCommittedQ(q.trim()); refetch(); }}>Apply</button>
      </div>

      {isLoading && <Loading />}
      {isError && <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />}
      {data && data.items.length === 0 && <EmptyState message="No audit entries match." />}

      {data && data.items.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>IP</th><th></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((log: AuditLogRow) => (
                <React.Fragment key={log.log_id}>
                  <tr style={{ cursor: "pointer" }} onClick={() => setExpanded(expanded === log.log_id ? null : log.log_id)}>
                    <td>{formatDateTime(log.created_at)}</td>
                    <td>{log.user_name || "—"}{log.user_phone ? ` (${log.user_phone})` : ""}</td>
                    <td><code>{log.action}</code></td>
                    <td>{log.entity_type ? `${log.entity_type} ${log.entity_id ? log.entity_id.slice(0, 8) : ""}` : "—"}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{log.ip_address || "—"}</td>
                    <td style={{ textAlign: "right", color: colors.textMuted }}>{expanded === log.log_id ? "▲" : "▼"}</td>
                  </tr>
                  {expanded === log.log_id && (
                    <tr>
                      <td colSpan={6} style={{ background: colors.surface }}>
                        <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap", color: colors.text }}>
                          {log.payload_json ? JSON.stringify(log.payload_json, null, 2) : "No payload."}
                        </pre>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = { display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 4 };
