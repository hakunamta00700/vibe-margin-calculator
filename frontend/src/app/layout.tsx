"use client";

import Link from "next/link";
import { Inter } from "next/font/google";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useCallback, useEffect, useState } from "react";
import { SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearAuthToken, getAuthToken, getCurrentUserRoleFromToken } from "@/lib/recipe-api";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const AUTH_EVENT = "vibe_recipe_auth_change";

export default function RootLayout({ children }: Readonly<PropsWithChildren>) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState<"user" | "admin" | null>(null);

  const refreshAuth = useCallback(() => {
    setAuthenticated(Boolean(getAuthToken()));
    setRole(getCurrentUserRoleFromToken());
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
    setRole(null);
    router.push("/login");
  };

  const navigationItems = [
    {
      href: "/",
      label: "원가 계산",
      active: pathname === "/",
    },
    {
      href: authenticated ? "/recipes" : "/login",
      label: authenticated ? "내 레시피" : "로그인",
      active:
        authenticated
          ? pathname === "/recipes" || /^\/recipes\/\d+(\/edit)?$/.test(pathname)
          : pathname === "/login",
    },
    {
      href: "/recipes/new",
      label: "레시피 작성",
      active: pathname === "/recipes/new",
    },
  ];

  if (role === "admin") {
    navigationItems.push({
      href: "/admin/materials",
      label: "재료 관리",
      active: pathname === "/admin/materials",
    });
  }

  return (
    <html lang="ko" className={cn("font-sans", inter.variable)}>
      <body className="text-foreground">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <header className="mb-8">
            <div className="rounded-[30px] border border-white/70 bg-white/78 p-4 shadow-2xl shadow-orange-950/5 backdrop-blur supports-[backdrop-filter]:bg-white/72 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="space-y-1.5">
                  <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight">
                    <span className="grid size-9 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <SparklesIcon className="size-4" />
                    </span>
                    Vibe Margin Lab
                  </Link>
                  <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                    원가 계산기와 레시피 작업실을 한 워크플로로 묶고, 재료 DB는 관리자 페이지에서 직접
                    관리합니다.
                  </p>
                </div>

                <div className="flex flex-1 flex-col gap-3 lg:items-end">
                  <nav className="flex flex-wrap gap-2">
                    {navigationItems.map((item) => (
                      <Button
                        key={item.href}
                        asChild
                        variant={item.active ? "default" : "ghost"}
                        size="sm"
                        className={item.active ? "shadow-sm" : "text-muted-foreground"}
                      >
                        <Link href={item.href}>{item.label}</Link>
                      </Button>
                    ))}
                  </nav>
                  {authenticated && pathname !== "/login" ? (
                    <Button variant="outline" size="sm" onClick={onLogout}>
                      로그아웃
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
