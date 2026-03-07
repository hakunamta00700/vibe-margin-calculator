import type { Metadata } from "next";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "admin-lte/dist/css/adminlte.min.css";
import "@/app/globals.css";
import { AdminBootstrap } from "@/components/admin-bootstrap";

export const metadata: Metadata = {
  title: "Vibe Admin",
  description: "Admin frontend for the Vibe Recipe backend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="hold-transition sidebar-mini layout-fixed layout-navbar-fixed">
        <AdminBootstrap />
        {children}
      </body>
    </html>
  );
}
