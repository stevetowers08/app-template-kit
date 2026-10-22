import type { Demo } from "@/lib/gallery/types"

import { DenseDividersDemo } from "./demos/dense-dividers-demo"
import { DiceFacetedDemo } from "./demos/dice-faceted-demo"
import { EditableGridDemo } from "./demos/editable-grid-demo"
import { FixedRowsDemo } from "./demos/fixed-rows-demo"
import { FlushToolbarDemo } from "./demos/flush-toolbar-demo"
import { FramedBulkActionsDemo } from "./demos/framed-bulk-actions-demo"
import { ReuiGridDemo } from "./demos/reui-grid-demo"
import { StripeFlushDemo } from "./demos/stripe-flush-demo"
import { TitledCardDemo } from "./demos/titled-card-demo"
import { TreeGutterDemo } from "./demos/tree-gutter-demo"
import type { TableVariantName } from "./meta"

/** One demo per variant, rendered with sample data in the gallery. */
export const tableDemos = {
  "table-flush-toolbar": FlushToolbarDemo,
  "table-dense-dividers": DenseDividersDemo,
  "table-framed-bulk-actions": FramedBulkActionsDemo,
  "table-fixed-rows": FixedRowsDemo,
  "table-titled-card": TitledCardDemo,
  "table-stripe-flush": StripeFlushDemo,
  "table-tree-gutter": TreeGutterDemo,
  "table-reui-grid": ReuiGridDemo,
  "table-dice-faceted": DiceFacetedDemo,
  "table-editable-grid": EditableGridDemo,
} satisfies Record<TableVariantName, Demo>
