// Auth state for the admin panel (Zustand).
//
// Mirrors the mobile app's strategy: the ACCESS token lives in memory only
// (this store) and is never persisted. The REFRESH token is kept in
// localStorage (see lib/tokenStorage.ts) — the web equivalent of the mobile
// SecureStore — so a page reload can silently re-mint an access token.

import { create } from "zustand";

export interface AdminUser {
  user_id: string;
  name: string;
  role: string; // TRAVELER | PARTNER | ADMIN | SUPER_ADMIN
  phone?: string;
}

interface AuthState {
  accessToken: string | null;
  user: AdminUser | null;
  isAuthenticated: boolean;
  setAccessToken: (token: string | null) => void;
  setSession: (token: string, user: AdminUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setAccessToken: (token) => set({ accessToken: token }),
  setSession: (token, user) =>
    set({ accessToken: token, user, isAuthenticated: true }),
  logout: () => set({ accessToken: null, user: null, isAuthenticated: false }),
}));

// Only these roles may use the admin panel.
export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export function isAdminRole(role?: string | null): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}
