// Central colour + spacing tokens for the admin panel.
// Brand rule (CLAUDE.md): white background, green #1A6B4A primary, no frills.

export const colors = {
  primary: "#1A6B4A",
  primaryDark: "#145239",
  primaryLight: "#E6F2EC",
  bg: "#FFFFFF",
  surface: "#F7F9F8",
  border: "#E2E8E6",
  text: "#1A2421",
  textMuted: "#6B7B76",
  textInverse: "#FFFFFF",
  danger: "#C0392B",
  dangerLight: "#FBE9E7",
  warning: "#B7791F",
  warningLight: "#FEF5E7",
  success: "#1A6B4A",
  successLight: "#E6F2EC",
  info: "#2B6CB0",
  infoLight: "#EBF4FB",
};

// Status badge colour mapping (covers property/guide/booking/application/user states).
export function statusColor(status: string): { fg: string; bg: string } {
  const s = status.toUpperCase();
  if (["ACTIVE", "APPROVED", "CONFIRMED", "COMPLETED", "SUCCESS", "CHECKED_IN", "CHECKED_OUT"].includes(s)) {
    return { fg: colors.success, bg: colors.successLight };
  }
  if (["PENDING", "AWAITING_PAYMENT", "CANCELLATION_REQUESTED", "REFUND_PENDING"].includes(s)) {
    return { fg: colors.warning, bg: colors.warningLight };
  }
  if (["SUSPENDED", "REJECTED", "CANCELLED", "FAILED", "REFUNDED"].includes(s)) {
    return { fg: colors.danger, bg: colors.dangerLight };
  }
  return { fg: colors.textMuted, bg: colors.surface };
}
