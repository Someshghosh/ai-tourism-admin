import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import { Paginated } from "./useUsers";

export interface ReviewRow {
  review_id: string;
  user_id: string;
  is_anonymous: boolean;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  moderation_status: string;
  created_at: string | null;
}

// status: "" | PENDING | APPROVED | REJECTED  (FLAGGED is a UI-only concept;
// flagged reviews are stored as PENDING + a flag note, so the Flagged tab also
// queries PENDING.)
export function useReviews(status: string, limit = 100) {
  return useQuery({
    queryKey: ["reviews", status, limit],
    queryFn: async () =>
      unwrap<Paginated<ReviewRow>>(
        await api.get("/admin/reviews", { params: { status: status || undefined, limit } })
      ),
  });
}

export function useModerateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { reviewId: string; status: string; reason?: string }) =>
      unwrap<ReviewRow>(
        await api.patch(`/admin/reviews/${vars.reviewId}/moderate`, {
          status: vars.status,
          reason: vars.reason,
        })
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });
}
