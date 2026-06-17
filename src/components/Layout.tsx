// App shell: sidebar + scrollable content area. Wraps every authenticated page.

import React from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import { colors } from "../theme";

export default function Layout() {
  return (
    <div style={styles.shell}>
      <Sidebar />
      <main style={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { display: "flex", minHeight: "100vh", background: colors.bg },
  content: { flex: 1, minWidth: 0, padding: 28, overflowX: "auto" },
};
