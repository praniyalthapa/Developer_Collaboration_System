import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAppSelector } from "../app/hooks";
import {
  deleteUser,
  getAdminStats,
  getAdminUsers,
  updateUserRole,
} from "../api/admin.api";
import { getErrorMessage } from "../lib/apiClient";
import { Avatar } from "../components/Avatar";
import { PageHeader } from "../components/PageHeader";
import { Icon, type IconName } from "../components/icons";
import { InlineLoader } from "../components/ui/Loader";
import type { AdminStats, AdminUser } from "../types/models";

const StatTile = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: IconName;
}) => (
  <div className="stat-tile">
    <div className="relative flex items-center justify-between">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-base-content/55">
          {label}
        </p>
        <p className="mt-1 text-3xl font-extrabold">{value}</p>
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
        <Icon name={icon} className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const PAGE_SIZE = 20;

const AdminDashboard = () => {
  const currentUser = useAppSelector((state) => state.user);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async (pageNumber: number, query: string) => {
    const result = await getAdminUsers(pageNumber, PAGE_SIZE, query || undefined);
    setUsers(result.users);
    setTotalPages(result.totalPages);
    setPage(result.page);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsResult] = await Promise.all([getAdminStats(), loadUsers(1, search)]);
      setStats(statsResult);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [loadUsers, search]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleToggleRole = async (target: AdminUser) => {
    try {
      await updateUserRole(target._id, target.role === "admin" ? "user" : "admin");
      await loadUsers(page, search);
    } catch (roleError) {
      setError(getErrorMessage(roleError));
    }
  };

  const handleDelete = async (target: AdminUser) => {
    if (!window.confirm(`Delete ${target.emailId}? This cannot be undone.`)) return;
    try {
      await deleteUser(target._id);
      await refresh();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    }
  };

  return (
    <>
      <PageHeader
        icon="shield"
        eyebrow="Control center"
        title="Admin dashboard"
        description="Platform overview and user management."
      />

      {error ? (
        <div className="alert alert-error mb-6 text-sm">
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <InlineLoader label="Loading dashboard..." />
      ) : (
        <div className="space-y-8">
          {stats ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile label="Total users" value={stats.totalUsers} icon="users" />
                <StatTile label="Admins" value={stats.admins} icon="shield" />
                <StatTile label="Connections" value={stats.acceptedConnections} icon="activity" />
                <StatTile label="Pending requests" value={stats.pendingRequests} icon="inbox" />
                <StatTile label="Conversations" value={stats.activeChats} icon="message" />
                <StatTile label="Code sessions" value={stats.codeSessions} icon="code" />
              </div>
            </>
          ) : null}

          <div className="surface gradient-border p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Users</h2>
              <form onSubmit={handleSearch} className="join">
                <div className="join-item flex items-center bg-base-100/60 px-3">
                  <Icon name="search" className="h-4 w-4 text-base-content/50" />
                </div>
                <input
                  className="input input-bordered input-sm join-item w-48"
                  placeholder="Search name or email"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
                <button type="submit" className="btn btn-sm btn-brand join-item">
                  Search
                </button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="font-mono text-xs uppercase tracking-wider text-base-content/50">
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((target) => {
                    const isSelf = currentUser?._id === target._id;
                    return (
                      <tr key={target._id} className="hover:bg-base-content/5">
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar
                              firstName={target.firstName}
                              lastName={target.lastName}
                              size="w-9 h-9"
                              textSize="text-xs"
                            />
                            <div>
                              <p className="font-medium">
                                {target.firstName} {target.lastName}
                              </p>
                              <p className="font-mono text-xs text-base-content/50">
                                {target.emailId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge badge-sm ${
                              target.role === "admin" ? "badge-primary" : "badge-ghost"
                            }`}
                          >
                            {target.role}
                          </span>
                        </td>
                        <td className="font-mono text-xs text-base-content/60">
                          {target.authProvider}
                          {target.isSeed ? " · demo" : ""}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost border border-base-content/15"
                              disabled={isSelf}
                              onClick={() => handleToggleRole(target)}
                            >
                              {target.role === "admin" ? "Make user" : "Make admin"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost border border-base-content/15 hover:border-error hover:text-error"
                              disabled={isSelf}
                              onClick={() => handleDelete(target)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  disabled={page <= 1}
                  onClick={() => loadUsers(page - 1, search)}
                >
                  Previous
                </button>
                <span className="font-mono text-sm text-base-content/60">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  disabled={page >= totalPages}
                  onClick={() => loadUsers(page + 1, search)}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
