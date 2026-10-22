import {
  columnVisibilityFeature,
  createExpandedRowModel,
  createSortedRowModel,
  metaHelper,
  rowExpandingFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_alphanumericCaseSensitive,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  sortFn_textCaseSensitive,
  tableFeatures,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table"

/**
 * The column contract every own-markup @latent table shares, so swapping one table
 * variant for another keeps the caller's column definitions unchanged.
 *
 * `label` is REQUIRED and is the column's name stated once, as data: the header
 * text, the sort button's accessible name and any column chooser all read it
 * (vault Data Tables & Grids, "the label is data on the column").
 */
export type LatentColumnMeta = {
  readonly label: string
  /**
   * A number compared down the column (money, counts, durations). One flag does
   * both halves: right-aligned AND tabular figures, header and cell together, so
   * neither can be forgotten independently.
   */
  readonly numeric?: boolean
  /** Explicit alignment for non-numeric columns. A centred number is never right. */
  readonly align?: "left" | "center"
  /** Width hint, e.g. "12rem" or "20%". Authoritative only in a table-fixed variant. */
  readonly width?: string
  /** Hide the header text visually (an actions or select column); it stays for readers. */
  readonly srOnlyLabel?: boolean
}

/**
 * TanStack v9 feature bundle for the own-markup variants. Every built-in sort
 * function is registered on purpose: v9 resolves `sortFn: "auto"` only against
 * registered names, and a partial map silently stops ordinary columns sorting.
 * `columnVisibilityFeature` is what `row.getVisibleCells()` needs to exist at all.
 */
export const latentTableFeatures = tableFeatures({
  columnVisibilityFeature,
  rowSortingFeature,
  rowSelectionFeature,
  rowExpandingFeature,
  sortedRowModel: createSortedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    alphanumericCaseSensitive: sortFn_alphanumericCaseSensitive,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
    textCaseSensitive: sortFn_textCaseSensitive,
  },
  columnMeta: metaHelper<LatentColumnMeta>(),
})

export type LatentTableFeatures = typeof latentTableFeatures

/**
 * Sentinel default header. useLatentTable sets it as `defaultColumn.header`, so a
 * column that declares no `header` of its own is recognised by identity and gets
 * the label-driven sort header; a column that declares one (a select-all
 * checkbox) renders exactly what it declared.
 */
export const LATENT_LABEL_HEADER = (): null => null

/**
 * A column definition with its label and id enforced by the type: a column
 * without `meta.label` does not compile, so a header can never fall back to an
 * internal id, and a stable `id` keeps sort state and ARIA references valid.
 */
export type LatentColumnDef<TData extends RowData> = ColumnDef<
  LatentTableFeatures,
  TData,
  unknown
> & {
  readonly id: string
  readonly meta: LatentColumnMeta
}
