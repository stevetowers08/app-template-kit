"use client"

import * as React from "react"
import type { ColumnDef, RowData } from "@tanstack/react-table"
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs"

import type { QueryKeys } from "@/lib/data-table-types"
import { getSortingStateParser } from "@/lib/parsers"
import type { DataTableFeatures } from "@/lib/table-features"

type DiceColumn<TData extends RowData> = ColumnDef<
  DataTableFeatures,
  TData,
  unknown
>

/**
 * The in-memory "server" for a Dice UI data table.
 *
 * `useDataTable` runs every table in manual mode (it expects the server to
 * page, sort and filter from the URL), so `data` must arrive already processed.
 * This reads the SAME URL keys with the SAME parsers the hook writes, and does
 * that work on the client. Use it only when every row is already in memory; for
 * a real dataset, run the same query on the server from the same search params.
 */
export function useDiceClientRows<TData extends RowData>(
  data: readonly TData[],
  columns: readonly DiceColumn<TData>[],
  keys: QueryKeys,
  pageSize: number
): { rows: TData[]; pageCount: number; matched: number } {
  const parsers = React.useMemo(() => {
    const ids = new Set(
      columns
        .map((column) => column.id)
        .filter((id): id is string => Boolean(id))
    )
    const filterParsers = Object.fromEntries(
      columns
        .filter((column) => column.enableColumnFilter && column.id)
        .map((column) => [
          column.id as string,
          column.meta?.options
            ? parseAsArrayOf(parseAsString, ",")
            : parseAsString,
        ])
    )
    return {
      ...filterParsers,
      [keys.page]: parseAsInteger.withDefault(1),
      [keys.perPage]: parseAsInteger.withDefault(pageSize),
      [keys.sort]: getSortingStateParser<TData>(ids).withDefault([]),
    }
  }, [columns, keys, pageSize])

  const [state] = useQueryStates(parsers)

  return React.useMemo(() => {
    const byId = new Map(columns.map((column) => [column.id, column]))
    const filtered = data.filter((row) =>
      columns.every((column) => {
        if (!column.enableColumnFilter || !column.id) return true
        // A filter key holds its column's parser value: a string, or string[] for options.
        const wanted = state[column.id] as string | string[] | null
        if (wanted == null || (Array.isArray(wanted) && wanted.length === 0))
          return true
        const value = readValue(column, row)
        if (Array.isArray(wanted)) return wanted.includes(String(value))
        return String(value ?? "")
          .toLowerCase()
          .includes(String(wanted).toLowerCase())
      })
    )
    const sorting = (state[keys.sort] ?? []) as { id: string; desc: boolean }[]
    const sorted = [...filtered].sort((a, b) => {
      for (const { id, desc } of sorting) {
        const column = byId.get(id)
        if (!column) continue
        const order = compareValues(
          readValue(column, a),
          readValue(column, b),
          desc
        )
        if (order !== 0) return order
      }
      return 0
    })
    const perPage = Math.max(1, Number(state[keys.perPage]))
    const page = Math.max(1, Number(state[keys.page]))
    return {
      rows: sorted.slice((page - 1) * perPage, page * perPage),
      pageCount: Math.max(1, Math.ceil(sorted.length / perPage)),
      matched: sorted.length,
    }
  }, [data, columns, state, keys])
}

function readValue<TData extends RowData>(
  column: DiceColumn<TData>,
  row: TData
): unknown {
  if ("accessorFn" in column && column.accessorFn)
    return column.accessorFn(row, 0)
  if ("accessorKey" in column && column.accessorKey != null)
    return (row as Record<string, unknown>)[String(column.accessorKey)]
  return undefined
}

/** Unknown values (null/undefined) sort LAST in both directions: absence is not a small number. */
function compareValues(a: unknown, b: unknown, desc: boolean): number {
  const aMissing = a == null
  const bMissing = b == null
  if (aMissing || bMissing) return aMissing === bMissing ? 0 : aMissing ? 1 : -1
  const order =
    typeof a === "number" && typeof b === "number"
      ? a - b
      : String(a).localeCompare(String(b), "en-AU", {
          numeric: true,
          sensitivity: "base",
        })
  return desc ? -order : order
}
