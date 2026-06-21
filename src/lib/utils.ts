import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, startOfDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNoteDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy");
}

export function formatDayHeader(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "EEEE • HH:mm");
}

export function toDateKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(startOfDay(d), "yyyy-MM-dd");
}

export function toMarkdownFilename(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd_MM_yyyy") + ".md";
}

export function parseMarkdownFilename(filename: string): Date | null {
  const match = filename.match(/^(\d{2})_(\d{2})_(\d{4})\.md$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function countWords(text: string): number {
  const stripped = text.replace(/<[^>]*>/g, " ").trim();
  if (!stripped) return 0;
  return stripped.split(/\s+/).filter(Boolean).length;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
