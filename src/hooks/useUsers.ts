import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

export interface AdminUserRow {
  user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string | null;
}

export interface Paginated<T> {
  items: T[];
  pagination: { total: number; limit: number; offset: number };
}

export function useUsers(q: string, limit = 50) {
  return useQuery({
    queryKey: ["users", q, limit],
    queryFn: async () =>
      unwrap<Paginated<AdminUserRow>>(
        await api.get("/admin/users", { params: { q: q || undefined, limit } })
      ),
  });
}

export function useSetUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { userId: string; isActive: boolean }) =>
      unwrap<AdminUserRow>(
        await api.patch(`/admin/users/${vars.userId}/status`, { is_active: vars.isActive })
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function usePromoteToPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) =>
      unwrap<AdminUserRow>(await api.post(`/admin/promote-to-partner/${userId}`)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}
