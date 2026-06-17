import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import { Paginated } from "./useUsers";

export interface PropertyRow {
  property_id: string;
  owner_id: string;
  destination_id: string | null;
  name: string;
  property_type: string;
  status: string;
  rating: number | null;
  address: string | null;
  photo_urls: string[];
  created_at: string | null;
}

export function useProperties(status: string, limit = 100) {
  return useQuery({
    queryKey: ["properties", status, limit],
    queryFn: async () =>
      unwrap<Paginated<PropertyRow>>(
        await api.get("/admin/properties", { params: { status: status || undefined, limit } })
      ),
  });
}

export function useSetPropertyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { propertyId: string; status: string; reason?: string }) =>
      unwrap<PropertyRow>(
        await api.patch(`/admin/properties/${vars.propertyId}/status`, {
          status: vars.status,
          reason: vars.reason,
        })
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}
