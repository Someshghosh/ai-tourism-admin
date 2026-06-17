// Auth API calls (OTP login). Uses the shared axios client.

import { api, unwrap } from "./api";
import { AdminUser } from "../stores/authStore";

export interface VerifyResult {
  access_token: string;
  refresh_token: string;
  user: AdminUser;
}

// Request an OTP for a phone number (E.164, e.g. "+919999999999").
export async function sendOtp(phone: string): Promise<{ expires_in: number }> {
  const res = await api.post("/auth/send-otp", { phone });
  return unwrap(res);
}

// Verify an OTP and receive a token pair + the user.
export async function verifyOtp(phone: string, otp: string): Promise<VerifyResult> {
  const res = await api.post("/auth/verify-otp", { phone, otp });
  return unwrap(res);
}
