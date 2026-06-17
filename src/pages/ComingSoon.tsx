// Placeholder for sidebar sections whose backend isn't built yet.

import React from "react";
import { PageHeader } from "../components/ui";
import { colors } from "../theme";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <div
        style={{
          padding: 64,
          textAlign: "center",
          border: `1px dashed ${colors.border}`,
          borderRadius: 14,
          color: colors.textMuted,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 8 }}>
          Coming soon
        </div>
        <div>This section is planned for a future session.</div>
      </div>
    </div>
  );
}
