import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import { Paginated } from "./useUsers";

export interface ComplianceSummary {
  total_registrations: number;
  pending_cforms: number;
  missing_noc_count: number;
  failed_submissions: number;
}

export interface RegistrationRow {
  registration_id: string;
  booking_id: string;
  property_id: string;
  property_name: string | null;
  full_name: string;
  nationality: string | null;
  is_foreign_national: boolean;
  passport_number: string | null;
  aadhaar_last4: string | null;
  checkin_date: string | null;
  state_submission_status: string;
  cform_required: boolean;
  cform_checkin_status: string | null;
  submission_failed: boolean;
  created_at: string | null;
}

export interface PropertyComplianceRow {
  prop_reg_id: string;
  property_id: string;
  property_name: string | null;
  owner_id: string | null;
  compliance_status: string;
  has_noc: boolean;
  noc_district_admin: boolean;
  noc_district_police: boolean;
  tourism_reg_number: string | null;
  frro_registered: boolean;
}

export function useComplianceSummary() {
  return useQuery({
    queryKey: ["compliance", "summary"],
    queryFn: async () => unwrap<ComplianceSummary>(await api.get("/admin/compliance/summary")),
  });
}

export function useRegistrations(params: { foreignOnly?: boolean; failedOnly?: boolean }) {
  const { foreignOnly, failedOnly } = params;
  return useQuery({
    queryKey: ["compliance", "registrations", foreignOnly, failedOnly],
    queryFn: async () =>
      unwrap<Paginated<RegistrationRow>>(
        await api.get("/admin/compliance/registrations", {
          params: {
            foreign_only: foreignOnly || undefined,
            failed_only: failedOnly || undefined,
            limit: 100,
          },
        })
      ),
  });
}

export function useComplianceProperties() {
  return useQuery({
    queryKey: ["compliance", "properties"],
    queryFn: async () =>
      unwrap<Paginated<PropertyComplianceRow>>(
        await api.get("/admin/compliance/properties", { params: { limit: 100 } })
      ),
  });
}

export function useRetrySubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (registrationId: string) =>
      unwrap(await api.post(`/admin/compliance/registrations/${registrationId}/retry`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compliance"] }),
  });
}
