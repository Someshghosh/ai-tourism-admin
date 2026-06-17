// Axios API client for the admin panel — a web port of the mobile services/api.ts.
//
// Responsibilities:
//   1. Point at the backend (REACT_APP_API_URL + /api/v1).
//   2. Attach the in-memory access token to every request.
//   3. On a 401, transparently refresh the token (using the localStorage refresh
//      token) and retry the request once. If refresh fails, log out and bounce
//      to the login screen.
//
// The backend wraps every response as { data, error }, so callers read
// `res.data.data` (the `unwrap` helper below does that).

import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from "axios";

import { useAuthStore, AdminUser } from "../stores/authStore";
import { getRefreshToken, setRefreshToken, deleteRefreshToken } from "./tokenStorage";

const BASE_URL = process.env.REACT_APP_API_URL ?? "http://localhost:8000";

// All endpoints live under /api/v1.
export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

// Pull the `data` field out of the standard { data, error } envelope.
export function unwrap<T = any>(res: { data?: { data?: T } }): T {
  return res.data?.data as T;
}

// --- Request interceptor: attach the bearer token ---
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

// One refresh in flight at a time; concurrent 401s share it.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available.");
  }
  // Bare axios (not `api`) so this call is not itself intercepted.
  const response = await axios.post(
    `${BASE_URL}/api/v1/auth/refresh`,
    {},
    { headers: { Authorization: `Bearer ${refreshToken}` } }
  );
  const data = response.data?.data;
  if (!data?.access_token || !data?.refresh_token) {
    throw new Error("Malformed refresh response.");
  }
  // Refresh tokens rotate on every use — persist the new one.
  setRefreshToken(data.refresh_token);
  useAuthStore.getState().setAccessToken(data.access_token);
  return data.access_token;
}

// Clear the session and bounce to login. Used when a token dies mid-session.
function forceLogout(): void {
  deleteRefreshToken();
  useAuthStore.getState().logout();
  if (window.location.pathname !== "/") {
    window.location.assign("/");
  }
}

// --- Response interceptor: refresh-and-retry on 401 ---
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const isRefreshCall = original?.url?.includes("/auth/refresh");

    if (status === 401 && original && !original._retry && !isRefreshCall) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        const headers = AxiosHeaders.from(original.headers);
        headers.set("Authorization", `Bearer ${newToken}`);
        original.headers = headers;
        return api(original);
      } catch {
        forceLogout();
      }
    }
    return Promise.reject(error);
  }
);

// Attempt a silent login on page load: if a refresh token exists, swap it for a
// fresh access token and load the current user into the store. Returns true if
// the user ends up logged in. Safe to call with no refresh token (returns false).
export async function attemptSilentLogin(): Promise<boolean> {
  if (!getRefreshToken()) return false;
  try {
    await refreshAccessToken();
    const me = await api.get("/users/me");
    const u = me.data?.data;
    const user: AdminUser = {
      user_id: String(u.user_id),
      name: u.name,
      role: u.role,
      phone: u.phone,
    };
    useAuthStore.getState().setSession(
      useAuthStore.getState().accessToken as string,
      user
    );
    return true;
  } catch {
    deleteRefreshToken();
    useAuthStore.getState().logout();
    return false;
  }
}

// Pull a human-readable message out of a backend error envelope.
export function errorMessage(err: unknown): string {
  const e = err as AxiosError<{ error?: { message?: string } }>;
  return (
    e?.response?.data?.error?.message ??
    e?.message ??
    "Something went wrong. Please try again."
  );
}
