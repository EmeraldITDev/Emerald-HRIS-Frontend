import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppVersionCheck } from "@/hooks/useAppVersionCheck";

/**
 * Global, non-intrusive "new deployment available" banner.
 * Mounted once at the app root.
 */
export function UpdateAvailableBanner() {
  const { updateAvailable, signal } = useAppVersionCheck();
  const [dismissedSignal, setDismissedSignal] = useState<number | null>(null);

  useEffect(() => {
    if (dismissedSignal !== null && signal > dismissedSignal) {
      setDismissedSignal(null);
    }
  }, [signal, dismissedSignal]);

  if (!updateAvailable || dismissedSignal !== null) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border bg-card px-3 py-2 shadow-lg">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
        >
          <RefreshCw className="h-4 w-4 text-primary" />
          A new update is available — click to refresh
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          aria-label="Dismiss update notice"
          onClick={() => setDismissedSignal(signal)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}