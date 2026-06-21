import { WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <WifiOff className="mb-4 h-16 w-16 text-muted-foreground" />
      <h1 className="text-2xl font-bold">You&apos;re offline</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Notik works offline. Your notes are saved locally and will sync when you reconnect.
      </p>
      <Link
        href="/app"
        className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Go to Notes
      </Link>
    </div>
  );
}
