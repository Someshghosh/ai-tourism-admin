import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import { Paginated } from "./useUsers";

export interface BookingRow {
  booking_id: string;
  user_id: string;
  partner_id: string | null;
  booking_type: string;
  reference_id: string;
  amount: number; // paisa
  status: string;
  checkin_date: string | null;
  checkout_date: string | null;
  cancellation_reason: string | null;
  created_at: string | null;
}

export function useBookings(params: { status?: string; bookingType?: string; limit?: number }) {
  const { status, bookingType, limit = 100 } = params;
  return useQuery({
    queryKey: ["bookings", status, bookingType, limit],
    queryFn: async () =>
      unwrap<Paginated<BookingRow>>(
        await api.get("/admin/bookings", {
          params: {
            status: status || undefined,
            booking_type: bookingType || undefined,
            limit,
          },
        })
      ),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { bookingId: string; reason: string }) =>
      unwrap<BookingRow>(
        await api.post(`/admin/bookings/${vars.bookingId}/cancel`, { reason: vars.reason })
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}
