import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";

/**
 * Global PWA install banner.
 * Only appears on browsers that support beforeinstallprompt and when the user
 * has not already installed the app or dismissed the prompt recently.
 */
export function PwaInstallPrompt() {
  const { isInstallable, prompt, dismiss } = usePwaInstall();

  if (!isInstallable) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border bg-card px-4 py-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              Install Emerald HRIS
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              Add this app to your home screen for quick access, offline
              convenience, and a full-screen experience.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" onClick={prompt} className="text-xs h-8">
                Install app
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={dismiss}
                className="text-xs h-8 text-muted-foreground hover:text-foreground"
              >
                Not now
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 shrink-0 -mr-1 -mt-1"
            aria-label="Dismiss install prompt"
            onClick={dismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
