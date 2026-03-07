"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthToken, getAuthEventName, getCurrentSession } from "@/lib/admin-api";

export function AdminAuthGuard({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getCurrentSession();
    if (!session || session.role !== "admin") {
      clearAuthToken();
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  useEffect(() => {
    const handleAuthChange = () => {
      const session = getCurrentSession();
      if (!session || session.role !== "admin") {
        setReady(false);
        router.replace("/login");
        return;
      }
      setReady(true);
    };

    window.addEventListener("storage", handleAuthChange);
    window.addEventListener(getAuthEventName(), handleAuthChange);
    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener(getAuthEventName(), handleAuthChange);
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="content-wrapper admin-loading-screen">
        <section className="content">
          <div className="container-fluid">
            <div className="d-flex min-vh-50 flex-column align-items-center justify-content-center">
              <div className="spinner-border text-primary" role="status" />
              <p className="mt-3 text-muted">Checking your admin session...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return <>{children}</>;
}
