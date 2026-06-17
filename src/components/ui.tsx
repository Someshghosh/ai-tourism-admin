// Small shared UI primitives used across pages.

import React from "react";
import { colors, statusColor } from "../theme";

// --- Page header ---
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, color: colors.text }}>{title}</h1>
        {subtitle && <p style={{ margin: "4px 0 0", color: colors.textMuted, fontSize: 14 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 10 }}>{actions}</div>}
    </div>
  );
}

// --- Status badge ---
export function StatusBadge({ status }: { status: string }) {
  const { fg, bg } = statusColor(status);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: fg,
        background: bg,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

// --- Loading / empty / error states ---
export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 40, color: colors.textMuted }}>
      <span className="spinner" />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{ padding: 24, background: colors.dangerLight, color: colors.danger, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <span>{message}</span>
      {onRetry && (
        <button className="btn btn-sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: 48, textAlign: "center", color: colors.textMuted, border: `1px dashed ${colors.border}`, borderRadius: 12 }}>
      {message}
    </div>
  );
}

// --- Modal ---
export function Modal({
  open,
  title,
  onClose,
  children,
  width = 560,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "60px 16px",
        zIndex: 100,
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 14, width, maxWidth: "100%", boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${colors.border}` }}>
          <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>{title}</h2>
          <button className="btn btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

// --- Key/value detail row ---
export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", padding: "8px 0", borderBottom: `1px solid ${colors.surface}`, gap: 16 }}>
      <div style={{ width: 160, color: colors.textMuted, fontSize: 13, flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 14, color: colors.text, wordBreak: "break-word" }}>{value ?? "—"}</div>
    </div>
  );
}
