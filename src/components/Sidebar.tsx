// Persistent left navigation, present on every page after login.
// Collapses to icons-only on narrow screens (CSS media query in App.css-less
// inline styles via a `collapsed` class toggled by viewport width).

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { colors } from "../theme";
import { useAuthStore } from "../stores/authStore";
import { deleteRefreshToken } from "../lib/tokenStorage";
import {
  GridIcon, PeopleIcon, BadgeIcon, HomeIcon, MapPinIcon, CalendarIcon,
  StarIcon, BarChartIcon, CpuIcon, ShieldIcon, BellIcon, ListIcon,
  SettingsIcon, LogoutIcon,
} from "./icons";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <GridIcon /> },
  { to: "/users", label: "Users", icon: <PeopleIcon /> },
  { to: "/applications", label: "Partner Applications", icon: <BadgeIcon /> },
  { to: "/properties", label: "Properties", icon: <HomeIcon /> },
  { to: "/guides", label: "Guides", icon: <MapPinIcon /> },
  { to: "/bookings", label: "Bookings", icon: <CalendarIcon /> },
  { to: "/reviews", label: "Reviews Queue", icon: <StarIcon /> },
  { to: "/financials", label: "Financial Reports", icon: <BarChartIcon /> },
  { to: "/ai-config", label: "AI Configuration", icon: <CpuIcon /> },
  { to: "/compliance", label: "Compliance", icon: <ShieldIcon /> },
  { to: "/broadcast", label: "Broadcast", icon: <BellIcon /> },
  { to: "/audit-logs", label: "Audit Logs", icon: <ListIcon /> },
  { to: "/platform-config", label: "Platform Config", icon: <SettingsIcon /> },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    deleteRefreshToken();
    logout();
    navigate("/");
  };

  return (
    <nav style={styles.sidebar} className="admin-sidebar">
      <div style={styles.brand}>
        <span style={styles.brandMark}>AT</span>
        <span style={styles.brandText} className="sidebar-label">
          AI Tourism OS
        </span>
      </div>

      <div style={styles.items}>
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              ...styles.item,
              ...(isActive ? styles.itemActive : {}),
            })}
          >
            <span style={styles.itemIcon}>{item.icon}</span>
            <span className="sidebar-label" style={styles.itemLabel}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>

      <div style={styles.footer}>
        <div style={styles.userBlock} className="sidebar-label">
          <div style={styles.userName}>{user?.name || "Admin"}</div>
          <div style={styles.userRole}>{user?.role}</div>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout} title="Logout">
          <LogoutIcon size={18} />
          <span className="sidebar-label">Logout</span>
        </button>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 230,
    minWidth: 230,
    height: "100vh",
    background: colors.surface,
    borderRight: `1px solid ${colors.border}`,
    display: "flex",
    flexDirection: "column",
    position: "sticky",
    top: 0,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "18px 16px",
    borderBottom: `1px solid ${colors.border}`,
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: colors.primary,
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { fontWeight: 700, color: colors.text, fontSize: 15 },
  items: { flex: 1, overflowY: "auto", padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "9px 12px",
    borderRadius: 8,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: 500,
  },
  itemActive: { background: colors.primaryLight, color: colors.primary, fontWeight: 600 },
  itemIcon: { display: "flex", flexShrink: 0 },
  itemLabel: { whiteSpace: "nowrap" },
  footer: { borderTop: `1px solid ${colors.border}`, padding: 12 },
  userBlock: { marginBottom: 8 },
  userName: { fontWeight: 600, fontSize: 14, color: colors.text },
  userRole: { fontSize: 12, color: colors.textMuted },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px 10px",
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    background: "#fff",
    color: colors.danger,
    fontSize: 14,
    fontWeight: 600,
  },
};
