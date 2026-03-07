"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminApiError,
  clearAuthToken,
  getCurrentSession,
  setAuthToken,
  signIn,
} from "@/lib/admin-api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin12345!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectToAdmin = useCallback(
    (path: string) => {
      if (typeof window !== "undefined") {
        window.location.assign(path);
        return;
      }
      router.replace(path);
    },
    [router],
  );

  useEffect(() => {
    const session = getCurrentSession();
    if (session?.role === "admin") {
      redirectToAdmin("/");
    }
  }, [redirectToAdmin]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await signIn(email, password);
      if (!response.user || response.user.role !== "admin") {
        clearAuthToken();
        setError("This account is not an admin.");
        setLoading(false);
        return;
      }

      setAuthToken(response.access_token);
      redirectToAdmin("/");
    } catch (requestError) {
      if (requestError instanceof AdminApiError) {
        setError(requestError.message);
      } else {
        setError("Unable to sign in.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-auth-screen">
      <div className="card card-outline card-primary admin-auth-card">
        <div className="card-header text-center">
          <span className="h1">
            <b>Vibe</b>Admin
          </span>
        </div>
        <div className="card-body">
          <p className="login-box-msg">
            Sign in with an administrator account to manage users and recipes.
          </p>

          {error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div className="input-group mb-3">
              <input
                className="form-control"
                type="email"
                placeholder="Admin email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <div className="input-group-append">
                <div className="input-group-text">
                  <span className="fas fa-envelope" />
                </div>
              </div>
            </div>

            <div className="input-group mb-3">
              <input
                className="form-control"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <div className="input-group-append">
                <div className="input-group-text">
                  <span className="fas fa-lock" />
                </div>
              </div>
            </div>

            <button className="btn btn-primary btn-block" disabled={loading} type="submit">
              {loading ? "Signing in..." : "Sign in to admin"}
            </button>
          </form>

          <hr />

          <p className="mb-0 text-muted text-sm">
            This frontend expects the backend admin bootstrap variables to be set:
            <code className="ml-1">ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code>.
          </p>
        </div>
      </div>
    </main>
  );
}
