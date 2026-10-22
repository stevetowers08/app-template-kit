"use client"

import * as React from "react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

/**
 * Gallery-only switch that renders a demo in its data, loading or empty state,
 * so each table's states are visible without three copies on the page.
 */
export type DemoState = "data" | "loading" | "empty"

const STATES: readonly { value: DemoState; label: string }[] = [
  { value: "data", label: "Data" },
  { value: "loading", label: "Loading" },
  { value: "empty", label: "Empty" },
]

export function useDemoState(initial: DemoState = "data") {
  return React.useState<DemoState>(initial)
}

export function DemoStateToggle({
  value,
  onChange,
}: {
  value: DemoState
  onChange: (value: DemoState) => void
}) {
  return (
    <ToggleGroup
      aria-label="Demo state"
      variant="outline"
      size="sm"
      spacing={0}
      value={[value]}
      onValueChange={(next: unknown[]) => {
        const picked = STATES.find((state) => next.includes(state.value))
        if (picked) onChange(picked.value)
      }}
      className="mb-3"
    >
      {STATES.map((state) => (
        <ToggleGroupItem key={state.value} value={state.value}>
          {state.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/** The rows a demo passes for a state: none while loading or empty. */
export function rowsFor<T>(state: DemoState, rows: readonly T[]): readonly T[] {
  return state === "data" ? rows : EMPTY
}

const EMPTY: readonly never[] = []
