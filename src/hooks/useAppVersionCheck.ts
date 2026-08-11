import { useEffect, useState } from "react";

// Build id baked into the bundle at build time (see vite.config.ts `define`).
declare const __BUILD_ID__: string;

const POLL_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

async function fetchDeployedVersion(): Promise<string | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { buildId?: string };
    return data?.buildId ?? null;
  } catch {
    return null;
  }
}

/**
 * Polls /version.json and reports whether the deployed build differs from the
 * build currently running in this tab. No-op in development.
 */
export function useAppVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) return;

    const currentBuildId =
      typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : null;
    if (!currentBuildId) return;

    let cancelled = false;

    const check = async () => {
      const deployed = await fetchDeployedVersion();
      if (cancelled || !deployed) return;
      if (deployed !== currentBuildId) setUpdateAvailable(true);
    };

    check();
    const interval = window.setInterval(check, POLL_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return updateAvailable;
}