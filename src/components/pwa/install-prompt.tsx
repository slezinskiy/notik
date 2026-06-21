"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border bg-background p-4 shadow-lg md:bottom-8 md:left-auto md:right-8">
      <Download className="h-5 w-5 shrink-0 text-primary" />
      <div className="flex-1">
        <p className="text-sm font-medium">Install Notik</p>
        <p className="text-xs text-muted-foreground">Add to your home screen for offline access</p>
      </div>
      <Button size="sm" onClick={handleInstall}>
        Install
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDismissed(true)}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
