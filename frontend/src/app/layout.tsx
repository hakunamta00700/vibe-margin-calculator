"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useCallback, useEffect, useState } from "react";
import { clearAuthToken, getAuthToken } from "@/lib/recipe-api";
import "./globals.css";

const AUTH_EVENT = "vibe_recipe_auth_change";

export default function RootLayout({ children }: Readonly<PropsWithChildren>) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);

  const refreshAuth = useCallback(() => {
    setAuthenticated(Boolean(getAuthToken()));
  }, []);

  useEffect(() => {
    refreshAuth();
    const handleAuthChange = () => refreshAuth();
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener(AUTH_EVENT, handleAuthChange);
    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener(AUTH_EVENT, handleAuthChange);
    };
  }, [refreshAuth]);

  const onLogout = () => {
    clearAuthToken();
    setAuthenticated(false);
    router.push("/login");
  };

  const publicMenu = (
    <>
      <Link href="/">공개 레시피</Link>
      {!authenticated && <Link href="/login">로그인</Link>}
      {authenticated && <Link href="/recipes">내 레시피</Link>}
      <Link href="/recipes/new">새 레시피</Link>
    </>
  );

  return (
    <html lang="ko">
      <body>
        <div className="site-shell">
          <header className="topbar">
            <Link href="/" className="brand">
              Vibe Recipe
            </Link>
            <nav className="menu">{publicMenu}</nav>
            {authenticated && pathname !== "/login" && <button onClick={onLogout}>로그아웃</button>}
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
