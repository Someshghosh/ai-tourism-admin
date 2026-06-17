// Properties: list with status filter, approve PENDING, suspend ACTIVE (reason).

import React, { useState } from "react";
import { Link } from "react-router-dom";

import { colors } from "../theme";
import { formatDate } from "../lib/format";
import { errorMessage } from "../lib/api";
import { PageHeader, Loading, ErrorState, StatusBadge, EmptyState } from "../components/ui";
import { useProperties, useSetPropertyStatus, PropertyRow } from "../hooks/useProperties";

const FILTERS = [
  { label: "All", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Pending Review", value: "PENDING" },
  { label: "Suspended", value: "SUSPENDED" },
];

export default function Properties() {
  const [status, setStatus] = useState("");
  const { data, isLoading, isError, error, refetch } = useProperties(status);
  const setPropStatus = useSetPropertyStatus();

  const suspend = (id: string) => {
    const reason = window.prompt("Reason for suspension?");
    if (reason == null) return;
    setPropStatus.mutate({ propertyId: id, status: "SUSPENDED", reason });
  };

  return (
    <div>
      <PageHeader title="Properties" subtitle="Homestays, guesthouses & eco-resorts" />

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button
            key={f.label}
            className="btn"
            style={status === f.value ? { background: colors.primary, borderColor: colors.primary, color: "#fff" } : {}}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <Loading />}
      {isError && <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />}
      {data && data.items.length === 0 && <EmptyState message="No properties found." />}

      {data && data.items.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Created</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p: PropertyRow) => (
                <tr key={p.property_id}>
                  <td>{p.name}</td>
                  <td>{p.property_type}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>{p.rating != null ? p.rating.toFixed(1) : "—"}</td>
                  <td>{formatDate(p.created_at)}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {p.status === "PENDING" && (
                      <button
                        className="btn btn-sm btn-primary"
                        disabled={setPropStatus.isPending}
                        onClick={() => setPropStatus.mutate({ propertyId: p.property_id, status: "ACTIVE" })}
                      >
                        Approve
                      </button>
                    )}{" "}
                    {p.status === "ACTIVE" && (
                      <button className="btn btn-sm btn-danger" disabled={setPropStatus.isPending} onClick={() => suspend(p.property_id)}>
                        Suspend
                      </button>
                    )}{" "}
                    <Link to="/bookings" className="btn btn-sm">View Bookings</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
