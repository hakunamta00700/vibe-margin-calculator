"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminApiError, listAllRecipes, listUsers, type Recipe, type UserRecord } from "@/lib/admin-api";

type DashboardState = {
  users: UserRecord[];
  recipes: Recipe[];
};

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>({ users: [], recipes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const [users, recipes] = await Promise.all([listUsers(), listAllRecipes({ sort: "updated_at" })]);
        if (!active) {
          return;
        }
        setState({ users, recipes });
      } catch (requestError) {
        if (!active) {
          return;
        }
        if (requestError instanceof AdminApiError) {
          setError(requestError.message);
        } else {
          setError("Failed to load dashboard data.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const adminCount = state.users.filter((user) => user.role === "admin").length;
    const publicRecipes = state.recipes.filter((recipe) => recipe.is_public).length;
    const privateRecipes = state.recipes.length - publicRecipes;

    return {
      userCount: state.users.length,
      adminCount,
      recipeCount: state.recipes.length,
      privateRecipes,
      publicRecipes,
    };
  }, [state.recipes, state.users]);

  const recentUsers = [...state.users]
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, 5);
  const recentRecipes = [...state.recipes]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5);

  return (
    <div className="row">
      {error ? (
        <div className="col-12">
          <div className="alert alert-danger">{error}</div>
        </div>
      ) : null}

      <div className="col-lg-3 col-6">
        <div className="small-box bg-info metric-box">
          <div className="inner">
            <h3>{loading ? "..." : stats.userCount}</h3>
            <p>Total users</p>
          </div>
          <div className="icon">
            <i className="fas fa-users" />
          </div>
          <Link className="small-box-footer" href="/users">
            Manage users <i className="fas fa-arrow-circle-right" />
          </Link>
        </div>
      </div>

      <div className="col-lg-3 col-6">
        <div className="small-box bg-success metric-box">
          <div className="inner">
            <h3>{loading ? "..." : stats.adminCount}</h3>
            <p>Administrators</p>
          </div>
          <div className="icon">
            <i className="fas fa-user-shield" />
          </div>
          <Link className="small-box-footer" href="/users">
            Review roles <i className="fas fa-arrow-circle-right" />
          </Link>
        </div>
      </div>

      <div className="col-lg-3 col-6">
        <div className="small-box bg-warning metric-box">
          <div className="inner">
            <h3>{loading ? "..." : stats.recipeCount}</h3>
            <p>Total recipes</p>
          </div>
          <div className="icon">
            <i className="fas fa-book" />
          </div>
          <Link className="small-box-footer" href="/recipes">
            Review recipes <i className="fas fa-arrow-circle-right" />
          </Link>
        </div>
      </div>

      <div className="col-lg-3 col-6">
        <div className="small-box bg-danger metric-box">
          <div className="inner">
            <h3>{loading ? "..." : stats.privateRecipes}</h3>
            <p>Private recipes</p>
          </div>
          <div className="icon">
            <i className="fas fa-lock" />
          </div>
          <Link className="small-box-footer" href="/recipes">
            Audit visibility <i className="fas fa-arrow-circle-right" />
          </Link>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Latest users</h3>
          </div>
          <div className="card-body p-0">
            {recentUsers.length === 0 ? (
              <div className="admin-empty-state">No users have been registered yet.</div>
            ) : (
              <table className="table table-striped mb-0">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${user.role === "admin" ? "badge-danger" : "badge-secondary"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{user.created_at ? new Date(user.created_at).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Latest recipe updates</h3>
          </div>
          <div className="card-body p-0">
            {recentRecipes.length === 0 ? (
              <div className="admin-empty-state">No recipes are available yet.</div>
            ) : (
              <table className="table table-striped mb-0">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Owner</th>
                    <th>Visibility</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecipes.map((recipe) => (
                    <tr key={recipe.id}>
                      <td>
                        <Link href={`/recipes/${recipe.id}`}>{recipe.title}</Link>
                      </td>
                      <td>#{recipe.user_id}</td>
                      <td>
                        <span className={`badge ${recipe.is_public ? "badge-success" : "badge-warning"}`}>
                          {recipe.is_public ? "public" : "private"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
