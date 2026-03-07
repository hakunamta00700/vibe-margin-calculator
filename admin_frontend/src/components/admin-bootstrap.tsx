"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    $?: unknown;
    jQuery?: unknown;
  }
}

export function AdminBootstrap() {
  useEffect(() => {
    let cancelled = false;

    async function loadScripts() {
      const jqueryModule = await import("jquery");
      const jquery = jqueryModule.default;

      if (cancelled) {
        return;
      }

      window.$ = jquery;
      window.jQuery = jquery;

      await import("bootstrap/dist/js/bootstrap.bundle.min.js");
      await import("admin-lte/dist/js/adminlte.min.js");
    }

    loadScripts().catch((error) => {
      console.error("Failed to initialize AdminLTE.", error);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
