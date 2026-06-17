// Platform Config — table of all PlatformConfig keys with inline edit. The five
// operational keys (commission, cancellation tiers, otp expiry) are pinned on top.
// Changes take effect immediately (config is read per-request on the backend).

import React, { useState } from "react";

import { colors } from "../theme";
import { formatDateTime } from "../lib/format";
import { errorMessage } from "../lib/api";
import { PageHeader, Loading, ErrorState } from "../components/ui";
import { useConfig, useUpdateConfig, ConfigRow } from "../hooks/useConfig";

// Pin these operational keys to the top of the table.
const PINNED = [
  "platform_commission_pct",
  "cancellation_72h_refund_pct",
  "cancellation_24h_refund_pct",
  "cancellation_0h_refund_pct",
  "otp_expiry_seconds",
];

function ConfigRowItem({ row }: { row: ConfigRow }) {
  const update = useUpdateConfig();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(row.config_value ?? "");
  const pinned = PINNED.includes(row.config_key);

  const save = async () => {
    await update.mutateAsync({ key: row.config_key, value });
    setEditing(false);
  };

  return (
    <tr>
      <td style={{ fontWeight: pinned ? 700 : 400 }}>
        {pinned && "⭐ "}
        <code>{row.config_key}</code>
        {row.description && (
          <div style={{ color: colors.textMuted, fontSize: 12, fontWeight: 400, marginTop: 2 }}>{row.description}</div>
        )}
      </td>
      <td style={{ minWidth: 240 }}>
        {editing ? (
          <textarea className="field" rows={value.length > 60 ? 4 : 1} value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
        ) : (
          <span style={{ wordBreak: "break-word" }}>{row.config_value ?? "—"}</span>
        )}
      </td>
      <td style={{ color: colors.textMuted, fontSize: 12, whiteSpace: "nowrap" }}>{formatDateTime(row.updated_at)}</td>
      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        {editing ? (
          <>
            <button className="btn btn-sm btn-primary" onClick={save} disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save"}
            </button>{" "}
            <button className="btn btn-sm" onClick={() => { setValue(row.config_value ?? ""); setEditing(false); }}>Cancel</button>
          </>
        ) : (
          <button className="btn btn-sm" onClick={() => setEditing(true)}>Edit</button>
        )}
      </td>
    </tr>
  );
}

export default function PlatformConfig() {
  const { data, isLoading, isError, error, refetch } = useConfig();

  const sorted = [...(data ?? [])].sort((a, b) => {
    const ai = PINNED.indexOf(a.config_key);
    const bi = PINNED.indexOf(b.config_key);
    if (ai !== -1 || bi !== -1) {
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    }
    return a.config_key.localeCompare(b.config_key);
  });

  return (
    <div>
      <PageHeader title="Platform Config" subtitle="Operational settings — changes apply immediately" />

      {isLoading && <Loading />}
      {isError && <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />}

      {data && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr><th>Key</th><th>Value</th><th>Last Updated</th><th></th></tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <ConfigRowItem key={row.config_key} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
