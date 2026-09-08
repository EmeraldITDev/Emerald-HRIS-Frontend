import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePwaInstall } from "@/hooks/usePwaInstall";

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/**
 * Small, persistent header button that lets users install the PWA at any time.
 * Uses the native install prompt when available; otherwise shows short
 * per-browser instructions (covers iOS and browsers where the prompt event
 * is not currently firing, e.g. right after an uninstall).
 */
export function PwaInstallButton() {
  const { installed, canInstall, prompt } = usePwaInstall();
  const [showHelp, setShowHelp] = useState(false);

  if (installed) return null;

  const handleClick = async () => {
    if (canInstall) {
      await prompt();
    } else {
      setShowHelp(true);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="h-8 px-2 text-muted-foreground hover:text-foreground"
        aria-label="Install Emerald HRIS app"
        title="Install app"
      >
        <Download className="h-4 w-4" />
        <span className="hidden lg:inline text-xs ml-1">Install app</span>
      </Button>

      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Install Emerald HRIS</DialogTitle>
            <DialogDescription>
              Your browser isn't offering a direct install prompt right now. You
              can still add the app manually:
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-foreground space-y-3">
            {isIos() ? (
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Tap the <strong>Share</strong> button in Safari.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong>.</li>
              </ol>
            ) : (
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Open the browser menu (<strong>⋮</strong> on mobile, or the address-bar icon on desktop).</li>
                <li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                <li>Confirm the install.</li>
              </ol>
            )}
            <p className="text-xs text-muted-foreground">
              If you recently uninstalled the app, the browser may take a little
              while before offering the automatic install prompt again.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
