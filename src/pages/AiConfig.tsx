// AI Configuration: edit platform config rows (AI system prompts live here).
// The trip planner prompt is pinned to the top with a "Test Prompt" side panel
// that streams a live reply from /chat/message so changes can be verified.

import React, { useEffect, useState } from "react";

import { colors } from "../theme";
import { formatDateTime } from "../lib/format";
import { errorMessage } from "../lib/api";
import { PageHeader, Loading, ErrorState } from "../components/ui";
import { useConfig, useUpdateConfig, testChatMessage, ConfigRow } from "../hooks/useConfig";

const TRIP_PLANNER_KEY = "trip_planner_prompt";

function ConfigCard({
  row,
  highlight,
  onTest,
}: {
  row: ConfigRow;
  highlight?: boolean;
  onTest?: () => void;
}) {
  const update = useUpdateConfig();
  const [value, setValue] = useState(row.config_value ?? "");
  const [saved, setSaved] = useState(false);

  // Keep the textarea in sync if the row refetches.
  useEffect(() => setValue(row.config_value ?? ""), [row.config_value]);

  const dirty = value !== (row.config_value ?? "");

  const save = async () => {
    setSaved(false);
    await update.mutateAsync({ key: row.config_key, value });
    setSaved(true);
  };

  return (
    <div
      className="card"
      style={{
        marginBottom: 16,
        borderColor: highlight ? colors.primary : colors.border,
        borderWidth: highlight ? 2 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16 }}>
            {highlight && "⭐ "}
            <code>{row.config_key}</code>
          </h3>
          {row.description && <p style={{ margin: "4px 0 0", color: colors.textMuted, fontSize: 13 }}>{row.description}</p>}
        </div>
        {onTest && (
          <button className="btn" onClick={onTest}>Test Prompt</button>
        )}
      </div>

      <textarea
        className="field"
        style={{ marginTop: 12, minHeight: highlight ? 200 : 120, fontFamily: "inherit" }}
        value={value}
        onChange={(e) => { setValue(e.target.value); setSaved(false); }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
        <button className="btn btn-primary" disabled={!dirty || update.isPending} onClick={save}>
          {update.isPending ? "Saving…" : "Save"}
        </button>
        <span style={{ fontSize: 12, color: colors.textMuted }}>
          Last updated {formatDateTime(row.updated_at)}
        </span>
        {saved && !dirty && <span style={{ fontSize: 13, color: colors.success, fontWeight: 600 }}>Saved ✓</span>}
        {update.isError && <span style={{ fontSize: 13, color: colors.danger }}>{errorMessage(update.error)}</span>}
      </div>
    </div>
  );
}

function TestPanel({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState("Plan me a 3-day trip to Meghalaya.");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    setErr(null);
    setReply("");
    setBusy(true);
    try {
      await testChatMessage(message, (full) => setReply(full));
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={panel.overlay} onClick={onClose}>
      <div style={panel.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={panel.header}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Test Trip Planner Prompt</h2>
          <button className="btn btn-sm" onClick={onClose}>Close</button>
        </div>
        <div style={{ padding: 18, overflowY: "auto", flex: 1 }}>
          <label style={{ fontWeight: 600, fontSize: 13 }}>Test message</label>
          <textarea className="field" rows={3} style={{ margin: "6px 0 12px" }} value={message} onChange={(e) => setMessage(e.target.value)} />
          <button className="btn btn-primary" onClick={run} disabled={busy || !message.trim()}>
            {busy ? "Running…" : "Send"}
          </button>
          {err && <div style={{ marginTop: 14 }}><ErrorState message={err} /></div>}
          {(reply || busy) && (
            <div style={{ marginTop: 16, padding: 14, background: colors.surface, borderRadius: 10, whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.5 }}>
              {reply || "…"}
            </div>
          )}
          <p style={{ color: colors.textMuted, fontSize: 12, marginTop: 12 }}>
            Tip: save the prompt above first, then test to confirm the new behaviour.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AiConfig() {
  const { data, isLoading, isError, error, refetch } = useConfig();
  const [testing, setTesting] = useState(false);

  const tripPlanner = data?.find((c: ConfigRow) => c.config_key === TRIP_PLANNER_KEY);
  const others = data?.filter((c: ConfigRow) => c.config_key !== TRIP_PLANNER_KEY) ?? [];

  return (
    <div style={{ maxWidth: 820 }}>
      <PageHeader title="AI Configuration" subtitle="Platform settings & AI system prompts" />

      {isLoading && <Loading />}
      {isError && <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />}

      {tripPlanner && (
        <ConfigCard row={tripPlanner} highlight onTest={() => setTesting(true)} />
      )}
      {others.map((row: ConfigRow) => (
        <ConfigCard key={row.config_key} row={row} />
      ))}

      {data && data.length === 0 && (
        <ErrorState message="No config keys found." />
      )}

      {testing && <TestPanel onClose={() => setTesting(false)} />}
    </div>
  );
}

const panel: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "flex-end", zIndex: 100 },
  sheet: { width: 480, maxWidth: "100%", background: "#fff", height: "100vh", display: "flex", flexDirection: "column", boxShadow: "-8px 0 30px rgba(0,0,0,0.15)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: `1px solid ${colors.border}` },
};
