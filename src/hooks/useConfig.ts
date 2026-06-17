import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import { useAuthStore } from "../stores/authStore";

const BASE_URL = process.env.REACT_APP_API_URL ?? "http://localhost:8000";

export interface ConfigRow {
  config_key: string;
  config_value: string | null;
  description: string | null;
  updated_at: string | null;
}

export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: async () => unwrap<ConfigRow[]>(await api.get("/admin/config")),
  });
}

export function useUpdateConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { key: string; value: string }) =>
      unwrap<ConfigRow>(
        await api.patch(`/admin/config/${encodeURIComponent(vars.key)}`, {
          config_value: vars.value,
        })
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["config"] }),
  });
}

// Fire a test message at the Trip Planner to preview the current prompt's
// behaviour. POST /chat/message is a Server-Sent-Events stream: it emits
// {type:"delta", text} chunks and a final {type:"done"}. We read the stream and
// concatenate the deltas into the full reply. `onDelta` lets the caller render
// the text as it arrives.
export async function testChatMessage(
  message: string,
  onDelta?: (full: string) => void
): Promise<string> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${BASE_URL}/api/v1/chat/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // session_id is required; a one-off id keeps this test isolated.
    body: JSON.stringify({ message, session_id: "admin-prompt-test" }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Chat request failed (${res.status}).`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // SSE frames are separated by a blank line; each "data:" line holds JSON.
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const line = frame.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      try {
        const evt = JSON.parse(line.slice(5).trim());
        if (evt.type === "delta" && evt.text) {
          full += evt.text;
          onDelta?.(full);
        } else if (evt.type === "error") {
          throw new Error(evt.message || "The AI service is unavailable.");
        }
      } catch {
        /* ignore non-JSON keepalive frames */
      }
    }
  }
  return full;
}
