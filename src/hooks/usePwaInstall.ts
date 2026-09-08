import { useEffect, useState, useCallback } from "react";

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isInstalled(): boolean {
  if (typeof window === "undefined") return false;

  // iOS standalone
  if ((window.navigator as unknown as { standalone?: boolean }).standalone) {
    return true;
  }

  // Android/Chrome/Desktop standalone
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }

  // Trusted Web Activity / Android app referrer
  if (document.referrer?.startsWith("android-app://")) {
    return true;
  }

  return false;
}

function wasDismissedRecently(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = parseInt(raw, 10);
  if (Number.isNaN(dismissedAt)) return false;
  return Date.now() - dismissedAt < DISMISS_TTL_MS;
}

function clearDismissal() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DISMISS_KEY);
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentlyInstalled = isInstalled();
    setInstalled(currentlyInstalled);

    if (currentlyInstalled || wasDismissedRecently()) {
      setDismissed(true);
    }

    // Always listen for the install prompt — even after a dismissal — so the
    // persistent install button keeps working if the app was uninstalled.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setDismissed(true);
      setInstalled(true);
    };

    // If the display mode changes (e.g. the PWA was uninstalled while the
    // browser tab was open), re-evaluate and clear any stale dismissal.
    const media = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = () => {
      const nowInstalled = isInstalled();
      setInstalled(nowInstalled);
      if (!nowInstalled) {
        clearDismissal();
        setDismissed(false);
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);
    media.addEventListener("change", onDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
      media.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const prompt = useCallback(async () => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setDismissed(true);
    }

    setDeferredPrompt(null);
    return choice.outcome === "accepted";
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setDismissed(true);
  }, []);

  return {
    /** Banner visibility: prompt available, not dismissed, not installed */
    isInstallable: !!deferredPrompt && !dismissed && !installed,
    /** Native install prompt is available right now (header button) */
    canInstall: !!deferredPrompt && !installed,
    installed,
    prompt,
    dismiss,
  };
}
