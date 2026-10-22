/**
 * Totals arithmetic that keeps absence absent (ported from the tours analytics app `totals`).
 *
 * `rows.reduce((s, r) => s + (r.x ?? 0), 0)` is the shape this replaces: it turns
 * a column nobody measured into a measured zero, and in a totals row a bold "0"
 * under a column of blanks reads as a fact.
 */

/** Sum of the observed values; null when none were observed. */
export function sumObserved(
  values: Iterable<number | null | undefined>
): number | null {
  let total = 0
  let seen = false
  for (const value of values) {
    if (value == null || Number.isNaN(value)) continue
    total += value
    seen = true
  }
  return seen ? total : null
}

/** How many values were observed (non-null, non-NaN). Pair with sumObserved for "n of m". */
export function countObserved(
  values: Iterable<number | null | undefined>
): number {
  let count = 0
  for (const value of values)
    if (value != null && !Number.isNaN(value)) count += 1
  return count
}
