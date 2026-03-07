"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminApiError,
  getCurrentSession,
  listUsers,
  updateUserRole,
  type Role,
  type UserRecord,
} from "@/lib/admin-api";

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const currentSession = getCurrentSession();

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      setError(null);

      try {
        const response = await listUsers();
        setUsers(response);
      } catch (requestError) {
        if (requestError instanceof AdminApiError) {
          setError(requestError.message);
        } else {
          setError("Failed to load users.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();
    if (!loweredQuery) {
      return users;
    }
    return users.filter((user) => user.email.toLowerCase().includes(loweredQuery));
  }, [query, users]);

  async function handleRoleChange(user: UserRecord, role: Role) {
    setPendingUserId(user.id);
    setError(null);
    setSuccess(null);

    try {
      const updatedUser = await updateUserRole(user.id, role);
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) => (currentUser.id === updatedUser.id ? updatedUser : currentUser)),
      );
      setSuccess(`Updated ${updatedUser.email} to ${updatedUser.role}.`);
    } catch (requestError) {
      if (requestError instanceof AdminApiError) {
        setError(requestError.message);
      } else {
        setError("Failed to update the user role.");
      }
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <div className="row">
      <div className="col-12">
        {error ? <div className="alert alert-danger">{error}</div> : null}
        {success ? <div className="alert alert-success">{success}</div> : null}
      </div>

      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">User management</h3>
            <div className="card-tools">
              <div className="input-group input-group-sm" style={{ width: 240 }}>
                <input
                  className="form-control float-right"
                  type="search"
                  placeholder="Search by email"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="card-body table-responsive p-0">
            {loading ? (
              <div className="admin-empty-state">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="admin-empty-state">No users matched your filter.</div>
            ) : (
              <table className="table table-hover text-nowrap mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isPending = pendingUserId === user.id;
                    const isCurrentUser = currentSession?.id === user.id;

                    return (
                      <tr key={user.id}>
                        <td>#{user.id}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge ${user.role === "admin" ? "badge-danger" : "badge-secondary"}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{user.created_at ? new Date(user.created_at).toLocaleString() : "-"}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className={`btn ${user.role === "user" ? "btn-primary" : "btn-default"}`}
                              disabled={isPending || user.role === "user"}
                              onClick={() => handleRoleChange(user, "user")}
                              type="button"
                            >
                              Demote
                            </button>
                            <button
                              className={`btn ${user.role === "admin" ? "btn-danger" : "btn-default"}`}
                              disabled={isPending || user.role === "admin"}
                              onClick={() => handleRoleChange(user, "admin")}
                              type="button"
                            >
                              Promote
                            </button>
                          </div>
                          {isCurrentUser ? <span className="badge badge-info ml-2">you</span> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
