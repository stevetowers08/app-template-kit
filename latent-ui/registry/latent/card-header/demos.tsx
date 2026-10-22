import type { Demo } from "@/lib/gallery/types"

import type { CardHeaderVariantName } from "./meta"
import { CardHeaderBarInfotipDemo } from "./demos/bar-infotip"
import { CardHeaderCapsLabelDemo } from "./demos/caps-label"
import { CardHeaderCardActionDemo } from "./demos/card-action"
import { CardHeaderDropdownActionsDemo } from "./demos/dropdown-actions"
import { CardHeaderHairlineRuleDemo } from "./demos/hairline-rule"
import { CardHeaderIconCapsMetaDemo } from "./demos/icon-caps-meta"
import { CardHeaderInlineDotDemo } from "./demos/inline-dot"
import { CardHeaderOutsideIconDemo } from "./demos/outside-icon"

/** One demo per variant, rendered with sample data in the gallery. */
export const cardHeaderDemos = {
  "card-header-caps-label": CardHeaderCapsLabelDemo,
  "card-header-icon-caps-meta": CardHeaderIconCapsMetaDemo,
  "card-header-bar-infotip": CardHeaderBarInfotipDemo,
  "card-header-card-action": CardHeaderCardActionDemo,
  "card-header-hairline-rule": CardHeaderHairlineRuleDemo,
  "card-header-outside-icon": CardHeaderOutsideIconDemo,
  "card-header-inline-dot": CardHeaderInlineDotDemo,
  "card-header-dropdown-actions": CardHeaderDropdownActionsDemo,
} satisfies Record<CardHeaderVariantName, Demo>
