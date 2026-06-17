// Refresh-token persistence for the web admin panel.
//
// The browser has no SecureStore; for an internal localhost tool, localStorage
// is the pragmatic equivalent. The access token is NEVER stored here — it lives
// only in the in-memory Zustand store.

const REFRESH_KEY = "admin_refresh_token";

export function getRefreshToken(): string | null {
  try {
    return window.localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string): void {
  try {
    window.localStorage.setItem(REFRESH_KEY, token);
  } catch {
    /* storage unavailable — ignore */
  }
}

export function deleteRefreshToken(): void {
  try {
    window.localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}
