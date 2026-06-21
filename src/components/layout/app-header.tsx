"use client";

import { format } from "date-fns";
import { Menu, Moon, Sun, Download, History, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotesStore } from "@/lib/stores/notes-store";
import { useDailyStats } from "@/lib/hooks/use-notes-selectors";
import { useUIStore } from "@/lib/stores/ui-store";
import { formatNoteDate } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";

export function AppHeader() {
  const selectedDate = useNotesStore((s) => s.selectedDate);
  const stats = useDailyStats();
  const currentTime = useUIStore((s) => s.currentTime);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const setExportOpen = useUIStore((s) => s.setExportOpen);
  const setHistoryOpen = useUIStore((s) => s.setHistoryOpen);
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex items-center justify-between border-b px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{formatNoteDate(selectedDate)}</h1>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {format(selectedDate, "EEEE")} • {format(currentTime, "HH:mm")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
          <span>{stats.noteCount} notes</span>
          <span>{stats.tagCount} tags</span>
          <span>{stats.wordCount} words</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setHistoryOpen(true)}
          aria-label="Version history"
        >
          <History className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExportOpen(true)}
          aria-label="Export notes"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: "/login" })}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
