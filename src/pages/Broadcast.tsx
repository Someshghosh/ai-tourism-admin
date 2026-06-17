// Broadcast Notifications — compose & send an announcement to a target
// audience, with a sent-history table below.

import React, { useEffect, useState } from "react";

import { colors } from "../theme";
import { formatDateTime } from "../lib/format";
import { api, errorMessage, unwrap } from "../lib/api";
import { PageHeader, Loading, ErrorState, EmptyState } from "../components/ui";
import { useBroadcastHistory, useSendBroadcast, BroadcastHistoryRow } from "../hooks/useBroadcast";

const MAX_BODY = 200;

type Destination = { destination_id: string; name: string };

export default function Broadcast() {
  const history = useBroadcastHistory();
  const send = useSendBroadcast();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"ALL" | "PARTNERS" | "TRAVELERS" | "DESTINATION">("ALL");
  const [destinationId, setDestinationId] = useState("");
  const [channels, setChannels] = useState<string[]>(["in_app"]);
  const [scheduleLater, setScheduleLater] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Load destinations for the destination-target dropdown (public endpoint).
  useEffect(() => {
    api.get("/destinations", { params: { limit: 100 } })
      .then((res) => {
        const data = unwrap<any>(res);
        const items = Array.isArray(data) ? data : data?.items ?? [];
        setDestinations(items.map((d: any) => ({ destination_id: d.destination_id, name: d.name })));
      })
      .catch(() => setDestinations([]));
  }, []);

  const toggleChannel = (c: string) =>
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const submit = async () => {
    setFormError(null);
    setBanner(null);
    if (!title.trim() || !body.trim()) {
      setFormError("Title and message are required.");
      return;
    }
    if (audience === "DESTINATION" && !destinationId) {
      setFormError("Please choose a destination.");
      return;
    }
    if (channels.length === 0) {
      setFormError("Pick at least one channel.");
      return;
    }
    try {
      const res = await send.mutateAsync({
        title: title.trim(),
        body: body.trim(),
        audience,
        destination_id: audience === "DESTINATION" ? destinationId : undefined,
        channels,
        schedule_at: scheduleLater && scheduleAt ? scheduleAt : null,
      });
      setBanner(`Sent to ${res.recipient_count} recipient(s).`);
      setTitle("");
      setBody("");
    } catch (e) {
      setFormError(errorMessage(e));
    }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <PageHeader title="Broadcast" subtitle="Send announcements to users" />

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Send Announcement</h2>

        {banner && (
          <div style={{ padding: 12, background: colors.successLight, color: colors.success, borderRadius: 8, marginBottom: 14, fontWeight: 600 }}>
            {banner}
          </div>
        )}

        <label style={lbl}>Title</label>
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" />

        <label style={{ ...lbl, marginTop: 14 }}>Message ({body.length}/{MAX_BODY})</label>
        <textarea
          className="field"
          rows={3}
          maxLength={MAX_BODY}
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
          placeholder="Your message to travelers / partners"
        />

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 14 }}>
          <div>
            <label style={lbl}>Target audience</label>
            <select className="field" value={audience} onChange={(e) => setAudience(e.target.value as any)}>
              <option value="ALL">All Users</option>
              <option value="PARTNERS">All Partners</option>
              <option value="TRAVELERS">All Travelers</option>
              <option value="DESTINATION">Specific Destination travelers</option>
            </select>
          </div>
          {audience === "DESTINATION" && (
            <div>
              <label style={lbl}>Destination</label>
              <select className="field" value={destinationId} onChange={(e) => setDestinationId(e.target.value)}>
                <option value="">Select…</option>
                {destinations.map((d) => (
                  <option key={d.destination_id} value={d.destination_id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label style={lbl}>Channels</label>
            <div style={{ display: "flex", gap: 14, paddingTop: 8 }}>
              <label style={{ fontSize: 14 }}>
                <input type="checkbox" checked={channels.includes("push")} onChange={() => toggleChannel("push")} /> Push
              </label>
              <label style={{ fontSize: 14 }}>
                <input type="checkbox" checked={channels.includes("in_app")} onChange={() => toggleChannel("in_app")} /> In-App
              </label>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ fontSize: 14 }}>
            <input type="checkbox" checked={scheduleLater} onChange={(e) => setScheduleLater(e.target.checked)} /> Schedule for later
          </label>
          {scheduleLater && (
            <input
              type="datetime-local"
              className="field"
              style={{ maxWidth: 260, marginTop: 8 }}
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
            />
          )}
        </div>

        {formError && <div style={{ color: colors.danger, marginTop: 12, fontSize: 14 }}>{formError}</div>}

        <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={submit} disabled={send.isPending}>
          {send.isPending ? "Sending…" : scheduleLater ? "Schedule" : "Send Now"}
        </button>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Sent Broadcasts</h2>
        {history.isLoading && <Loading />}
        {history.isError && <ErrorState message={errorMessage(history.error)} onRetry={() => history.refetch()} />}
        {history.data && history.data.length === 0 && <EmptyState message="No broadcasts sent yet." />}
        {history.data && history.data.length > 0 && (
          <table className="tbl">
            <thead>
              <tr><th>Title</th><th>Sent</th><th>Recipients</th></tr>
            </thead>
            <tbody>
              {history.data.map((b: BroadcastHistoryRow) => (
                <tr key={b.broadcast_id}>
                  <td>{b.title}</td>
                  <td>{formatDateTime(b.sent_at)}</td>
                  <td>{b.recipient_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 6 };
