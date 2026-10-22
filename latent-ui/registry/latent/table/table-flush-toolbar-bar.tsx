"use client"

import type * as React from "react"
import { SearchIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/** One toolbar filter: a single-choice select whose `test` decides row membership. */
export type FlushToolbarFilter<TData> = {
  readonly id: string
  /** Accessible name and the "everything" option, e.g. "All statuses". */
  readonly allLabel: string
  readonly options: readonly {
    readonly label: string
    readonly value: string
  }[]
  readonly test: (row: TData, value: string) => boolean
}

const ALL = "__all__"

/**
 * The single toolbar line above the flush table: search, filters, clear, the
 * "n of m" count, then actions. It sits ON the page, never inside a box
 * (vault Layout - Page Gutters, "the toolbar sits above the table").
 */
export function FlushToolbarBar<TData>({
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  filterValues,
  onFilterChange,
  onClear,
  shown,
  total,
  actions,
}: {
  search: string | null
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  filters: readonly FlushToolbarFilter<TData>[]
  filterValues: Readonly<Record<string, string>>
  onFilterChange: (id: string, value: string | null) => void
  onClear: () => void
  /** Null while loading: a count over rows that have not arrived is not a count. */
  shown: number | null
  total: number | null
  actions?: React.ReactNode
}) {
  const isFiltered = Boolean(search) || Object.keys(filterValues).length > 0

  return (
    <div
      role="toolbar"
      aria-label="Table controls"
      className="flex flex-wrap items-center gap-2 pb-3"
    >
      {search !== null ? (
        <InputGroup className="h-7 w-full max-w-60">
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-7 text-xs"
          />
        </InputGroup>
      ) : null}
      {filters.map((filter) => (
        <Select
          key={filter.id}
          items={[{ label: filter.allLabel, value: ALL }, ...filter.options]}
          value={filterValues[filter.id] ?? ALL}
          onValueChange={(value) =>
            onFilterChange(
              filter.id,
              value === ALL || value === null ? null : String(value)
            )
          }
        >
          <SelectTrigger
            size="sm"
            aria-label={filter.allLabel}
            className="text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{filter.allLabel}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {isFiltered ? (
        <Button variant="ghost" size="sm" onClick={onClear} className="text-xs">
          <XIcon data-icon="inline-start" aria-hidden="true" />
          Clear
        </Button>
      ) : null}
      <div className="ml-auto flex items-center gap-3">
        {shown !== null && total !== null ? (
          <span
            aria-live="polite"
            className="text-xs text-muted-foreground tabular-nums"
          >
            {shown === total ? total : `${shown} of ${total}`}
          </span>
        ) : null}
        {actions}
      </div>
    </div>
  )
}
