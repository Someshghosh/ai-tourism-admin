import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import { Paginated } from "./useUsers";

export interface AuditLogRow {
  log_id: string;
  user_id: string | null;
  user_name: string | null;
  user_phone: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  payload_json: any | null;
  created_at: string | null;
}

export function useAuditLogs(params: { action?: string; q?: string; start?: string; end?: string }) {
  const { action, q, start, end } = params;
  return useQuery({
    queryKey: ["audit", action, q, start, end],
    queryFn: async () =>
      unwrap<Paginated<AuditLogRow>>(
        await api.get("/admin/audit-logs", {
          params: {
            action: action || undefined,
            q: q || undefined,
            start_date: start || undefined,
            end_date: end || undefined,
            limit: 100,
          },
        })
      ),
  });
}

export function useAuditActions() {
  return useQuery({
    queryKey: ["audit", "actions"],
    queryFn: async () => unwrap<string[]>(await api.get("/admin/audit-logs/actions")),
  });
}
