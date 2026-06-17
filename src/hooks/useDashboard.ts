import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

export interface DashboardStats {
  total_bookings: number;
  total_users: number;
  total_partners: number;
  gmv: number; // paisa
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => unwrap<DashboardStats>(await api.get("/admin/dashboard")),
  });
}
