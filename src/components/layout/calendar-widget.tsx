"use client";

import { useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, toDateKey } from "@/lib/utils";
import { useNotesStore } from "@/lib/stores/notes-store";
import { useCalendarNoteCounts } from "@/lib/hooks/use-notes-selectors";
import { useTranslation } from "@/lib/i18n/use-translation";
import { getDateLocale } from "@/lib/i18n/date-locale";

const WEEKDAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAYS_UK = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export function CalendarWidget() {
  const { t, locale } = useTranslation();
  const weekdays = locale === "uk" ? WEEKDAYS_UK : WEEKDAYS_EN;
  const dateLocale = getDateLocale(locale);
  const selectedDate = useNotesStore((s) => s.selectedDate);
  const setSelectedDate = useNotesStore((s) => s.setSelectedDate);
  const calendarNotes = useCalendarNoteCounts();

  const days = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [selectedDate]);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{format(selectedDate, "MMMM yyyy", { locale: dateLocale })}</h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
            aria-label={t("calendar.prevMonth")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
            aria-label={t("calendar.nextMonth")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map((day) => (
          <div key={day} className="py-1 text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const key = toDateKey(day);
          const noteCount = calendarNotes.get(key) ?? 0;
          const isSelected = isSameDay(day, selectedDate);
          const inMonth = isSameMonth(day, selectedDate);

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate(day)}
              className={cn(
                "relative flex h-9 w-full flex-col items-center justify-center rounded-lg text-sm transition-colors",
                !inMonth && "text-muted-foreground/40",
                isSelected && "bg-primary text-primary-foreground font-semibold",
                !isSelected && isToday(day) && "ring-2 ring-primary/50",
                !isSelected && inMonth && "hover:bg-accent"
              )}
              aria-label={format(day, "MMMM d, yyyy")}
              aria-pressed={isSelected}
            >
              {format(day, "d")}
              {noteCount > 0 && (
                <span className="absolute bottom-0.5 flex gap-0.5">
                  {Array.from({ length: Math.min(noteCount, 3) }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1 w-1 rounded-full",
                        isSelected ? "bg-primary-foreground" : "bg-primary"
                      )}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
