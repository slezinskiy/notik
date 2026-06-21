"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarWidget } from "./calendar-widget";
import { NotesList } from "./notes-list";
import { useUIStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[320px] flex-col border-r bg-sidebar transition-transform md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              N
            </div>
            <span className="text-lg font-bold">Notik</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CalendarWidget />
        <NotesList />
      </aside>
    </>
  );
}
