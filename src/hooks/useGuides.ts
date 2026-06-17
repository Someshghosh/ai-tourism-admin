import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import { Paginated } from "./useUsers";

export interface GuideRow {
  guide_id: string;
  user_id: string;
  display_name: string;
  destination_id: string | null;
  status: string;
  rating: number | null;
  total_bookings: number;
  total_reviews: number;
  certifications_json: any;
  created_at: string | null;
}

export function useGuides(status: string, limit = 100) {
  return useQuery({
    queryKey: ["guides", status, limit],
    queryFn: async () =>
      unwrap<Paginated<GuideRow>>(
        await api.get("/admin/guides", { params: { status: status || undefined, limit } })
      ),
  });
}

export function useSetGuideStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { guideId: string; status: string; reason?: string }) =>
      unwrap<GuideRow>(
        await api.patch(`/admin/guides/${vars.guideId}/status`, {
          status: vars.status,
          reason: vars.reason,
        })
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guides"] }),
  });
}
