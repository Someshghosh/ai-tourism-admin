// Users: search, role/status filter, view profile, suspend/reactivate, promote.

import React, { useMemo, useState } from "react";

import { colors } from "../theme";
import { formatDate } from "../lib/format";
import { errorMessage } from "../lib/api";
import { PageHeader, Loading, ErrorState, StatusBadge, Modal, DetailRow } from "../components/ui";
import {
  useUsers, useSetUserStatus, usePromoteToPartner, AdminUserRow,
} from "../hooks/useUsers";

const FILTERS = ["All", "TRAVELER", "PARTNER", "ADMIN", "Suspended"];

export default function Users() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(""); // committed search term
  const [filter, setFilter] = useState("All");
  const [profile, setProfile] = useState<AdminUserRow | null>(null);

  const { data, isLoading, isError, error, refetch } = useUsers(query);
  const setStatus = useSetUserStatus();
  const promote = usePromoteToPartner();

  const rows = useMemo(() => {
    const items = data?.items ?? [];
    if (filter === "All") return items;
    if (filter === "Suspended") return items.filter((u: AdminUserRow) => !u.is_active);
    return items.filter((u: AdminUserRow) => u.role === filter);
  }, [data, filter]);

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage platform accounts" />

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          className="field"
          style={{ maxWidth: 320 }}
          placeholder="Search by name, phone, or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setQuery(search.trim())}
        />
        <button className="btn" onClick={() => setQuery(search.trim())}>
          Search
        </button>
        <select className="field" style={{ maxWidth: 180 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          {FILTERS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {isLoading && <Loading />}
      {isError && <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />}

      {data && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u: AdminUserRow) => (
                <tr key={u.user_id}>
                  <td>{u.name || "—"}</td>
                  <td>{u.phone || "—"}</td>
                  <td><StatusBadge status={u.role} /></td>
                  <td><StatusBadge status={u.is_active ? "ACTIVE" : "SUSPENDED"} /></td>
                  <td>{formatDate(u.created_at)}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn btn-sm" onClick={() => setProfile(u)}>View</button>{" "}
                    {u.is_active ? (
                      <button
                        className="btn btn-sm btn-danger"
                        disabled={setStatus.isPending}
                        onClick={() => setStatus.mutate({ userId: u.user_id, isActive: false })}
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-primary"
                        disabled={setStatus.isPending}
                        onClick={() => setStatus.mutate({ userId: u.user_id, isActive: true })}
                      >
                        Reactivate
                      </button>
                    )}{" "}
                    {u.role === "TRAVELER" && (
                      <button
                        className="btn btn-sm"
                        disabled={promote.isPending}
                        onClick={() => {
                          if (window.confirm(`Promote ${u.name || "this user"} to PARTNER?`)) {
                            promote.mutate(u.user_id);
                          }
                        }}
                      >
                        Promote
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: colors.textMuted, padding: 24 }}>
                    No users match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!profile} title="User Profile" onClose={() => setProfile(null)}>
        {profile && (
          <div>
            <DetailRow label="User ID" value={<code>{profile.user_id}</code>} />
            <DetailRow label="Name" value={profile.name} />
            <DetailRow label="Phone" value={profile.phone} />
            <DetailRow label="Email" value={profile.email} />
            <DetailRow label="Role" value={<StatusBadge status={profile.role} />} />
            <DetailRow label="Status" value={<StatusBadge status={profile.is_active ? "ACTIVE" : "SUSPENDED"} />} />
            <DetailRow label="Joined" value={formatDate(profile.created_at)} />
          </div>
        )}
      </Modal>
    </div>
  );
}
