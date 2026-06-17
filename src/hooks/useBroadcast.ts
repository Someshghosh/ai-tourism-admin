import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

export interface BroadcastHistoryRow {
  broadcast_id: string;
  title: string;
  sent_at: string | null;
  recipient_count: number;
}

export interface SendBroadcastBody {
  title: string;
  body: string;
  audience: "ALL" | "PARTNERS" | "TRAVELERS" | "DESTINATION";
  destination_id?: string;
  channels: string[];
  schedule_at?: string | null;
}

export function useBroadcastHistory() {
  return useQuery({
    queryKey: ["broadcast", "history"],
    queryFn: async () => unwrap<BroadcastHistoryRow[]>(await api.get("/admin/broadcast")),
  });
}

export function useSendBroadcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: SendBroadcastBody) =>
      unwrap<{ broadcast_id: string; recipient_count: number }>(
        await api.post("/admin/broadcast", body)
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broadcast"] }),
  });
}
