import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

export interface FinancialReport {
  start_date: string;
  end_date: string;
  totals: { gmv: number; commission: number; payouts: number; net_revenue: number };
  daily: { date: string; gmv: number }[];
  by_type: { type: string; amount: number; count: number }[];
  top_partners: { partner_id: string; amount: number; count: number }[];
}

export function useFinancialReport(start: string, end: string) {
  return useQuery({
    queryKey: ["report", "financial", start, end],
    queryFn: async () =>
      unwrap<FinancialReport>(
        await api.get("/admin/reports/financial", {
          params: { start_date: start, end_date: end },
        })
      ),
    enabled: !!start && !!end,
  });
}
