import type { Metadata } from "next";
import Link from "next/link";
import "./styles.css";

export const metadata: Metadata = {
  title: "Vibe Recipe",
  description: "Save your recipes with Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <header style={{ padding: 16, borderBottom: "1px solid #ddd" }}>
          <nav style={{ display: "flex", gap: 12 }}>
            <Link href="/">홈</Link>
            <Link href="/login">로그인</Link>
            <Link href="/recipes">내 레시피</Link>
            <Link href="/recipes/new">레시피 등록</Link>
          </nav>
        </header>
        <main style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>{children}</main>
      </body>
    </html>
  );
}
