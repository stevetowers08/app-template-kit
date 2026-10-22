# Latent UI - components

Search here before building anything. Do not hand-roll a primitive; the global
UI-primitives hook blocks it.

| Layer | Where | Source |
|---|---|---|
| Primitives | `components/ui/` | shadcn base-nova, plus Dice UI `stat`, `status`, `timeline`, `key-value`, `avatar-group`, `badge-overflow`, `relative-time-card` |
| ReUI | `components/reui/` | badge, frame, icon-tile, timeline, sortable, filters, data-grid |
| Dice UI tables | `components/data-table/`, `components/data-grid/` | tablecn data table (nuqs URL state) and editable data grid, Base UI builds |
| Layout | `registry/latent/layout/` | ours: AppShell, Page, PageHeader, Stack, Inline |
| Surface variants | `registry/latent/<surface>/` | ours; the list of variants is each surface's `meta.ts` and the gallery itself |

The variant inventory is not repeated here: it is `registry/latent/*/meta.ts`, rendered at
http://localhost:3210.

Not installed on purpose: Dice UI `action-bar` (type errors against base-nova's Button at
install time, 2026-09-25) and `listbox` (install failed). Re-check before relying on them.
