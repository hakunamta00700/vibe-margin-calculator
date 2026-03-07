"use client";

import Link from "next/link";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearAuthToken,
  getAuthEventName,
  getCurrentSession,
  type SessionUser,
} from "@/lib/admin-api";
import { AdminAuthGuard } from "@/components/admin-auth-guard";

const NAV_ITEMS = [
  { href: "/", icon: "fas fa-chart-line", label: "Dashboard" },
  { href: "/users", icon: "fas fa-users-cog", label: "Users" },
  { href: "/recipes", icon: "fas fa-book-open", label: "Recipes" },
  { href: "/materials", icon: "fas fa-box-open", label: "Materials" },
];

function getPageTitle(pathname: string) {
  if (/^\/recipes\/\d+$/.test(pathname)) {
    return "Recipe Detail";
  }

  const matchedItem = NAV_ITEMS.find((item) => pathname === item.href);
  if (matchedItem) {
    return matchedItem.label;
  }

  return "Admin";
}

export function AdminShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);

  useEffect(() => {
    const refreshSession = () => setSession(getCurrentSession());
    refreshSession();
    window.addEventListener("storage", refreshSession);
    window.addEventListener(getAuthEventName(), refreshSession);
    return () => {
      window.removeEventListener("storage", refreshSession);
      window.removeEventListener(getAuthEventName(), refreshSession);
    };
  }, []);

  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

  const onLogout = () => {
    clearAuthToken();
    router.push("/login");
  };

  return (
    <AdminAuthGuard>
      <div className="wrapper">
        <nav className="main-header navbar navbar-expand navbar-white navbar-light border-bottom-0">
          <ul className="navbar-nav">
            <li className="nav-item">
              <button className="nav-link btn btn-link" data-widget="pushmenu" type="button">
                <i className="fas fa-bars" />
              </button>
            </li>
            <li className="nav-item d-none d-sm-inline-block">
              <Link className="nav-link" href="/">
                {pageTitle}
              </Link>
            </li>
          </ul>

          <ul className="navbar-nav ml-auto align-items-center">
            <li className="nav-item d-none d-md-block">
              <span className="nav-link text-muted">{session?.email ?? "Admin"}</span>
            </li>
            <li className="nav-item">
              <button className="btn btn-outline-danger btn-sm ml-2" onClick={onLogout} type="button">
                Sign out
              </button>
            </li>
          </ul>
        </nav>

        <aside className="main-sidebar sidebar-dark-primary elevation-4">
          <Link href="/" className="brand-link">
            <i className="fas fa-shield-alt brand-image img-circle elevation-3 d-flex align-items-center justify-content-center pt-2" />
            <span className="brand-text font-weight-light">Vibe Admin</span>
          </Link>

          <div className="sidebar">
            <div className="user-panel mt-3 pb-3 mb-3 d-flex">
              <div className="image">
                <div className="admin-avatar">{session?.email?.slice(0, 1).toUpperCase() ?? "A"}</div>
              </div>
              <div className="info">
                <span className="d-block text-white font-weight-semibold">{session?.email ?? "admin"}</span>
                <span className="d-block text-sm text-muted">Administrator</span>
              </div>
            </div>

            <nav className="mt-2">
              <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu">
                {NAV_ITEMS.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li className="nav-item" key={item.href}>
                      <Link className={`nav-link${active ? " active" : ""}`} href={item.href}>
                        <i className={`nav-icon ${item.icon}`} />
                        <p>{item.label}</p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </aside>

        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-6">
                  <h1>{pageTitle}</h1>
                </div>
                <div className="col-sm-6">
                  <ol className="breadcrumb float-sm-right">
                    <li className="breadcrumb-item">
                      <Link href="/">Admin</Link>
                    </li>
                    <li className="breadcrumb-item active">{pageTitle}</li>
                  </ol>
                </div>
              </div>
            </div>
          </section>

          <section className="content">
            <div className="container-fluid">{children}</div>
          </section>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
