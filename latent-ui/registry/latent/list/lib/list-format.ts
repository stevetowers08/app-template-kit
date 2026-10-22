/**
 * Null-safe date formatting shared by the list/feed variants. Every function
 * takes `now` explicitly (an ISO string) - never `Date.now()` - so a server
 * and a client render identically, and a demo can pin it to SAMPLE_NOW.
 *
 * Calendar-day math (`formatDuePhrase`, `isPastDue`, `formatCompactDate`)
 * reads the Y-M-D digits straight out of the ISO string instead of calling
 * `Date#getFullYear`/`getMonth`/`getDate`, which read the RUNTIME's local
 * timezone and would silently disagree between a UTC server and a
 * Sydney-local browser. Elapsed-time math (`formatElapsed`) is safe with
 * `Date#getTime()` because that is an absolute instant, not a local field.
 */

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000
const MINUTE_MS = 60_000

function dateOnlyParts(isoLike: string): { readonly y: number; readonly m: number; readonly d: number } {
  const [y, m, d] = isoLike.slice(0, 10).split("-").map(Number)
  return { y: y ?? 1970, m: (m ?? 1) - 1, d: d ?? 1 }
}

/** Calendar-day difference (due minus now), by the date each ISO string names. */
function dayDiff(dueIso: string, nowIso: string): number {
  const due = dateOnlyParts(dueIso)
  const now = dateOnlyParts(nowIso)
  return Math.round((Date.UTC(due.y, due.m, due.d) - Date.UTC(now.y, now.m, now.d)) / DAY_MS)
}

/** "No due date" | "Due today" | "Due <Weekday>" | "Due <Weekday>, N days late". */
export function formatDuePhrase(due: string | null, now: string): string {
  if (due === null) return "No due date"
  const diff = dayDiff(due, now)
  if (diff === 0) return "Due today"
  const { y, m, d } = dateOnlyParts(due)
  const weekday = new Date(Date.UTC(y, m, d)).toLocaleDateString("en-AU", {
    weekday: "long",
    timeZone: "UTC",
  })
  if (diff > 0) return `Due ${weekday}`
  const daysLate = Math.abs(diff)
  return `Due ${weekday}, ${daysLate} day${daysLate === 1 ? "" : "s"} late`
}

export function isPastDue(due: string | null, now: string): boolean {
  return due !== null && dayDiff(due, now) < 0
}

/** Compact date for dense rows, e.g. "25 Sep". `null` when there is no due date. */
export function formatCompactDate(due: string | null): string | null {
  if (due === null) return null
  const { y, m, d } = dateOnlyParts(due)
  return new Date(Date.UTC(y, m, d)).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  })
}

/** "3m ago" / "2h ago" / "4d ago", relative to `now`. */
export function formatElapsed(iso: string, now: string): string {
  const diffMs = Math.max(0, new Date(now).getTime() - new Date(iso).getTime())
  if (diffMs < MINUTE_MS) return "just now"
  if (diffMs < HOUR_MS) return `${Math.round(diffMs / MINUTE_MS)}m ago`
  if (diffMs < DAY_MS) return `${Math.round(diffMs / HOUR_MS)}h ago`
  return `${Math.round(diffMs / DAY_MS)}d ago`
}

/** Absolute time for a `title` attribute, fixed locale and timezone so it never hydration-mismatches. */
export function formatAbsolute(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Sydney",
  }).format(new Date(iso))
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
}
