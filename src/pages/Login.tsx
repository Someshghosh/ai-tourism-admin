// Admin login — phone OTP. After verify we check the user's role: only ADMIN /
// SUPER_ADMIN may proceed; anyone else sees "Access denied" and is logged out.

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { colors } from "../theme";
import { sendOtp, verifyOtp } from "../lib/auth";
import { errorMessage } from "../lib/api";
import { setRefreshToken, deleteRefreshToken } from "../lib/tokenStorage";
import { useAuthStore, isAdminRole } from "../stores/authStore";

export default function Login() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already logged in (e.g. silent login on reload) → go to dashboard.
  useEffect(() => {
    if (isAuthenticated && isAdminRole(role)) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleSendOtp = async () => {
    setError(null);
    setBusy(true);
    try {
      await sendOtp(phone.trim());
      setStep("otp");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await verifyOtp(phone.trim(), otp.trim());
      // Gate on role BEFORE storing a usable session.
      if (!isAdminRole(result.user.role)) {
        deleteRefreshToken();
        useAuthStore.getState().logout();
        setError("Access denied — Admin accounts only.");
        setBusy(false);
        return;
      }
      setRefreshToken(result.refresh_token);
      useAuthStore.getState().setSession(result.access_token, result.user);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.brandMark}>AT</div>
        <h1 style={styles.title}>AI Tourism OS — Admin</h1>
        <p style={styles.subtitle}>Internal platform management</p>

        {step === "phone" ? (
          <>
            <label style={styles.label}>Phone number</label>
            <input
              className="field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919999999999"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
            />
            <button className="btn btn-primary" style={styles.action} onClick={handleSendOtp} disabled={busy}>
              {busy ? "Sending…" : "Send OTP"}
            </button>
          </>
        ) : (
          <>
            <label style={styles.label}>Enter OTP sent to {phone}</label>
            <input
              className="field"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
            <button className="btn btn-primary" style={styles.action} onClick={handleVerify} disabled={busy}>
              {busy ? "Verifying…" : "Verify & Sign In"}
            </button>
            <button
              className="btn"
              style={{ ...styles.action, marginTop: 8 }}
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError(null);
              }}
              disabled={busy}
            >
              Change number
            </button>
          </>
        )}

        {error && <div style={styles.error}>{error}</div>}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.surface, padding: 16 },
  card: { width: 380, maxWidth: "100%", background: "#fff", border: `1px solid ${colors.border}`, borderRadius: 16, padding: 32, boxShadow: "0 8px 30px rgba(0,0,0,0.06)" },
  brandMark: { width: 44, height: 44, borderRadius: 12, background: colors.primary, color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { margin: 0, fontSize: 22, color: colors.text },
  subtitle: { margin: "6px 0 24px", color: colors.textMuted, fontSize: 14 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 6 },
  action: { width: "100%", marginTop: 14 },
  error: { marginTop: 16, padding: 12, background: colors.dangerLight, color: colors.danger, borderRadius: 8, fontSize: 14 },
};
