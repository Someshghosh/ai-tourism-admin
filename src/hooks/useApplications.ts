import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import { Paginated } from "./useUsers";

export interface ApplicationRow {
  application_id: string;
  user_id: string;
  partner_type: string;
  business_name: string;
  status: string;
  rejection_reason: string | null;
  created_at: string | null;
}

export function useApplications(status?: string, limit = 100) {
  return useQuery({
    queryKey: ["applications", status, limit],
    queryFn: async () =>
      unwrap<Paginated<ApplicationRow>>(
        await api.get("/admin/partner-applications", {
          params: { status: status || undefined, limit },
        })
      ),
  });
}

// Reject an application (approval flips role via the promote endpoint instead).
export function useRejectApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { applicationId: string; reason: string }) =>
      unwrap<ApplicationRow>(
        await api.patch(`/admin/partner-applications/${vars.applicationId}`, {
          action: "reject",
          rejection_reason: vars.reason,
        })
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });
}
