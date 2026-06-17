// Admin panel routing + auth gate.
//
// On first load we attempt a silent login (refresh token in localStorage). All
// authed routes are wrapped in <RequireAdmin>, which redirects to the login
// page if the user isn't an ADMIN/SUPER_ADMIN.

import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import "./App.css";
import { attemptSilentLogin } from "./lib/api";
import { useAuthStore, isAdminRole } from "./stores/authStore";
import { Loading } from "./components/ui";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Applications from "./pages/Applications";
import ApplicationReview from "./pages/ApplicationReview";
import Properties from "./pages/Properties";
import Guides from "./pages/Guides";
import Bookings from "./pages/Bookings";
import AiConfig from "./pages/AiConfig";
import Reports from "./pages/Reports";
import Reviews from "./pages/Reviews";
import Compliance from "./pages/Compliance";
import Broadcast from "./pages/Broadcast";
import AuditLogs from "./pages/AuditLogs";
import PlatformConfig from "./pages/PlatformConfig";

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  if (!isAuthenticated || !isAdminRole(role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    attemptSilentLogin().finally(() => setBooting(false));
  }, []);

  if (booting) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <Loading label="Starting…" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        element={
          <RequireAdmin>
            <Layout />
          </RequireAdmin>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/applications/:id" element={<ApplicationReview />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/guides" element={<Guides />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/ai-config" element={<AiConfig />} />
        <Route path="/financials" element={<Reports />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/broadcast" element={<Broadcast />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/platform-config" element={<PlatformConfig />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
