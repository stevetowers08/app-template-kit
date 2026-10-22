import type { Demo } from "@/lib/gallery/types"

import type { ListVariantName } from "./meta"
import { ListApprovalQueueDemo } from "./demos/list-approval-queue"
import { ListExpandableRunsDemo } from "./demos/list-expandable-runs"
import { ListGlyphCardDemo } from "./demos/list-glyph-card"
import { ListGroupedFeedDemo } from "./demos/list-grouped-feed"
import { ListHoverRowsDemo } from "./demos/list-hover-rows"
import { ListItemOutlineDemo } from "./demos/list-item-outline"
import { ListMiniRowsDemo } from "./demos/list-mini-rows"
import { ListRecordRowsDemo } from "./demos/list-record-rows"
import { ListSettingRowsDemo } from "./demos/list-setting-rows"
import { ListTaskRowsDemo } from "./demos/list-task-rows"
import { ListTimelineFeedDemo } from "./demos/list-timeline-feed"

/** One demo per variant, rendered with sample data in the gallery. */
export const listDemos = {
  "list-item-outline": ListItemOutlineDemo,
  "list-hover-rows": ListHoverRowsDemo,
  "list-record-rows": ListRecordRowsDemo,
  "list-glyph-card": ListGlyphCardDemo,
  "list-setting-rows": ListSettingRowsDemo,
  "list-task-rows": ListTaskRowsDemo,
  "list-mini-rows": ListMiniRowsDemo,
  "list-timeline-feed": ListTimelineFeedDemo,
  "list-grouped-feed": ListGroupedFeedDemo,
  "list-expandable-runs": ListExpandableRunsDemo,
  "list-approval-queue": ListApprovalQueueDemo,
} satisfies Record<ListVariantName, Demo>
