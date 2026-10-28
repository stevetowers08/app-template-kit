---
name: audit-loading-animations
description: "Audit (and fix) loading animations - skeletons and spinners - across a project's data-fetching pages and components. Decide skeleton vs spinner, detect FOEC (Flash of Empty Content) from auth hydration races, verify existing skeletons match the real layout, and fix mismatches. Use when adding, auditing, or fixing loading states, or as the loading dimension of a full app audit."
disable-model-invocation: true
last_verified: 2026-10-21
---

# Loading Animations Skill

Audit and implement the correct loading animation for every data-fetching page and component. This skill handles both **skeletons** (content placeholders) and **spinners** (blocking-action indicators), decides which is appropriate, verifies existing ones match reality, and fixes mismatches.

## When to Use

- "add loading states", "add skeletons", "fix loading flash", "add loading animation"
- Page shows empty state then reloads with real data (FOEC / auth flash)
- Skeleton exists but doesn't match the actual page layout
- New page created without a loading state
- Want to audit all pages for correct and consistent loading behaviour

**This skill OWNS auth flash / double-flash / FOEC** (the login-then-flash, empty-then-data problem).
`audit-performance` and `audit-console-logs` deliberately defer the loading-sequence verdict here —
if either points you to this skill, run it; the FOEC detection in Phase 2 is the authoritative check.

## When NOT to Use

- The component already has a correct, layout-matched skeleton — do not touch it
- The loading is <100ms and perceived as instant — no animation needed
- Pure client-side state transitions with no async data fetch

---

## Phase 1 — Decide: Skeleton or Spinner?

Apply this decision tree before writing any code.

### Decision Tree

```
What is loading?
├── Page-level content (table, list, dashboard, cards)
│     └── Use SKELETON
├── Section of a page that loads after the rest renders
│     └── Use SKELETON
├── Form submission / save / delete
│     └── Use SPINNER on the button (disabled state)
├── Route navigation (page transition)
│     └── Use SKELETON via loading.tsx (Next.js) or route suspense
├── File or image upload
│     └── Use PROGRESS BAR
├── AI / async long-running job
│     └── Use ANIMATED DOTS or PROGRESS with estimated time
└── Background sync / polling
      └── No visual indicator (silent) or subtle status badge
```

### Skeleton vs Spinner — Quick Reference

| Use SKELETON when | Use SPINNER when |
|------------------|-----------------|
| Loading page-level content | Form is submitting |
| Data fetch expected >300ms | Delete / destructive action in progress |
| Layout shape is known in advance | Navigating between routes (button-triggered) |
| Multiple content blocks load together | Real-time status check |
| Initial page load | Background auto-save |
| List, table, or card grid | Inline action (e.g., toggling a status) |

### Spinner placement rules

- Always on the **triggering element** (button, icon), not the whole page
- Disable the button while spinning to prevent double-submit
- Show spinner **inside** the button, replacing or alongside the label
- Return to normal state on success or error — never leave spinner indefinitely

```tsx
// Correct spinner pattern
<Button disabled={isSaving} onClick={handleSave}>
  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
</Button>
```

---

## Phase 2 — FOEC Detection (Flash of Empty Content)

Before implementing any skeleton, check if the page has a deeper loading bug: the content renders empty, then reloads with data. A skeleton won't fix this — the root cause must be fixed first.

### Signs of FOEC
- Page briefly shows "No items found" or empty list, then data appears
- Content flashes in 200–500ms after page load
- Skeleton briefly appears, disappears into empty state, then data loads

### Root cause: auth hydration race condition

```tsx
// BAD — useEffect fires before auth resolves
// supabaseReady is false → empty state renders → auth resolves → data loads
useEffect(() => {
  if (!supabaseReady) {
    setData([]);
    setLoading(false);  // ← marks loading as done before auth is ready
    return;
  }
  loadData();
}, [supabaseReady]);

// GOOD — bail silently while auth is still resolving
const isAuthLoading = useAuthLoading();
const supabaseReady = useSupabaseReady();

useEffect(() => {
  if (isAuthLoading) return;              // ← auth still resolving, hold
  if (!supabaseReady || !activeDomain) {
    setData([]);
    setLoading(false);
    return;
  }
  loadData();
}, [activeDomain, supabaseReady, isAuthLoading]);
```

### Auth provider check

Does the auth provider expose `isAuthLoading` separately from `isReady`?

```tsx
// BAD — single boolean can't distinguish "loading" from "no session"
export function useSupabaseReady(): boolean { ... }

// GOOD — two hooks, consumers can hold the right state
export function useSupabaseReady(): boolean { ... }   // true once JWT in client
export function useAuthLoading(): boolean { ... }     // true while Clerk resolves
```

If the provider only exports one flag, fix it at the provider level — this fixes FOEC for all consumers at once. See the `page-loading` skill for the full provider refactor.

### FOEC checklist

- [ ] `useEffect` has `if (isAuthLoading) return;` as its first guard
- [ ] `isAuthLoading` is in the `useEffect` dependency array
- [ ] `setLoading(false)` is NOT called in the auth-loading bail branch
- [ ] Auth provider exposes `isAuthLoading` separately from `isReady`

---

## Phase 3 — Audit Existing Loading States

Before writing new skeletons, audit what already exists.

### Step 3.1 — Discover existing patterns

Search the codebase for:
- `components/ui/skeleton*` or similar skeleton components
- `loading.tsx` files (Next.js App Router)
- `isLoading`, `isFetching`, `loading` state variables
- `animate-pulse`, `animate-shimmer`, shimmer classes
- `Skeleton`, `CardSkeleton`, `TableSkeleton` usage
- `Suspense` with `fallback` props
- Spinner/loader components: `Loader2`, `Spinner`, `LoadingSpinner`

Catalogue:
| Component | Type | Location | Status |
|-----------|------|----------|--------|

### Step 3.2 — Verify existing skeletons match the real layout

For every existing skeleton, open **both** the skeleton component and the real component side by side and check:

| Check | Pass | Fail |
|-------|------|------|
| Same number of columns in grid | Match | Mismatch → update |
| Same card structure (header, body, footer) | Match | Mismatch → update |
| Same number of list rows (reasonable approximation) | Match | Mismatch → update |
| Skeleton preserves page spacing/padding | Match | Mismatch → update |
| No layout shift when skeleton → real content | No shift | Shift → fix dimensions |
| Text skeleton lines use variable widths | Variable | All same-width → update |

### Step 3.3 — Identify missing loading states

| Signal | Action |
|--------|--------|
| Component uses `isLoading` but renders nothing while loading | Add skeleton |
| Page fetches data but has no `loading.tsx` | Add `loading.tsx` |
| Suspense boundary has empty or generic fallback | Replace with layout-matched skeleton |
| Data section shows blank while fetching | Add inline skeleton |
| Already has correct skeleton | Skip — do not modify |
| Already has spinner that works in context | Skip — do not modify |

---

## Phase 4 — Implement or Fix Loading Animations

### Rule 1: Match the real layout exactly

The skeleton MUST mirror the shape of the real content:
- Same grid columns, same card structure, same sidebar split
- Same approximate number of items (use the real count when known, or a sensible default like 3–5)

```tsx
// BAD — generic placeholder
<div className="animate-pulse h-96 bg-muted rounded" />

// GOOD — mirrors actual rendered grid
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {Array.from({ length: 4 }).map((_, i) => (
    <Card key={i} className="p-4" aria-hidden="true">
      <Skeleton className="h-4 w-20 mb-3" />
      <Skeleton className="h-7 w-16 mb-1" />
      <Skeleton className="h-3 w-24" />
    </Card>
  ))}
</div>
```

### Rule 2: Use the project's existing skeleton component

Never create a new skeleton primitive if one exists. Import and use what the project already has.

```tsx
import { Skeleton } from "@/components/ui/skeleton"
```

### Rule 3: Match animation style

Use whatever animation the project already uses:

| Project uses | Use |
|-------------|-----|
| `animate-shimmer` with gradient | Same shimmer |
| `animate-pulse` (Tailwind default) | `animate-pulse` |
| Custom CSS animation | Same custom animation |
| No preference | `animate-pulse` (default) |

### Rule 4: Variable widths for text skeletons

```tsx
// BAD — uniform, looks robotic
<Skeleton className="h-4 w-full" />
<Skeleton className="h-4 w-full" />
<Skeleton className="h-4 w-full" />

// GOOD — variable, mimics real text
<Skeleton className="h-4 w-full" />
<Skeleton className="h-4 w-3/4" />
<Skeleton className="h-4 w-5/6" />
<Skeleton className="h-4 w-2/3" />  // last line always shorter
```

Use deterministic widths: `w-full, w-3/4, w-5/6, w-2/3, w-1/2`

### Rule 5: Stagger animation delays

```tsx
{rows.map((_, i) => (
  <Skeleton
    key={i}
    className="h-4 w-full"
    style={{ animationDelay: `${i * 50}ms` }}
  />
))}
```

### Rule 6: Accessibility

```tsx
// Purely decorative skeleton (most cases)
<div aria-hidden="true">
  <Skeleton />
</div>

// When screen reader should announce loading
<div role="status" aria-label="Loading content">
  <Skeleton />
</div>

// Container in loading state
<div aria-busy="true">
  <Skeleton />
</div>
```

### Rule 7: Next.js App Router — `loading.tsx`

```tsx
// app/(dashboard)/example/loading.tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
```

Open the actual page component, read its layout, then replicate with skeletons.

### Rule 8: Inline component skeletons

```tsx
function DataWidget({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card aria-hidden="true">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16" />
      </Card>
    )
  }
  return (
    <Card>
      <h3>{data.title}</h3>
      <p>{data.value}</p>
    </Card>
  )
}
```

### Rule 9: Combine with auth loading guard

Skeleton should cover both `isLoading` AND `isAuthLoading` — while auth is resolving, show the skeleton, not an empty state:

```tsx
if (isLoading || isAuthLoading) {
  return (
    <div aria-hidden="true" className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}
```

### Rule 10: Skip skeletons for these

- Static content (nav, headers with no data dependency)
- Content that loads in <100ms
- Error states → show error UI
- Empty states → show empty state UI (only after loading is complete)
- Form submissions → button spinner, not skeleton

### Rule 11: Never replace working animations

- Working spinner on a button → keep it
- Working progress bar on file upload → keep it
- Animated dots on AI response → keep it
- Only add or fix — never remove working loading states

---

## Common Skeleton Patterns

### Stats card grid
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-hidden="true">
  {Array.from({ length: 4 }).map((_, i) => (
    <Card key={i} className="p-4">
      <Skeleton className="h-4 w-20 mb-3" />
      <Skeleton className="h-7 w-16 mb-1" />
      <Skeleton className="h-3 w-24" />
    </Card>
  ))}
</div>
```

### Data table
```tsx
<div aria-hidden="true">
  <div className="flex gap-4 p-3 border-b">
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton key={i} className="h-4 flex-1" />
    ))}
  </div>
  {Array.from({ length: 5 }).map((_, r) => (
    <div key={r} className="flex gap-4 p-3 border-b" style={{ animationDelay: `${r * 40}ms` }}>
      {Array.from({ length: columns }).map((_, c) => (
        <Skeleton key={c} className={`h-4 flex-1 ${['w-full','w-3/4','w-5/6','w-2/3'][c % 4]}`} />
      ))}
    </div>
  ))}
</div>
```

### Chart placeholder
```tsx
<Card className="p-4" aria-hidden="true">
  <Skeleton className="h-4 w-32 mb-4" />
  <Skeleton className="h-48 w-full rounded" />
</Card>
```

### List with avatars
```tsx
<div className="space-y-3" aria-hidden="true">
  {Array.from({ length: 5 }).map((_, i) => (
    <div key={i} className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  ))}
</div>
```

### Page header
```tsx
<div className="flex items-center justify-between mb-6" aria-hidden="true">
  <div className="space-y-1">
    <Skeleton className="h-7 w-48" />
    <Skeleton className="h-4 w-64" />
  </div>
  <Skeleton className="h-10 w-28 rounded-md" />
</div>
```

### Sidebar item list
```tsx
<div className="space-y-1 p-2" aria-hidden="true">
  {Array.from({ length: 6 }).map((_, i) => (
    <Skeleton key={i} className={`h-9 rounded-md ${['w-full','w-5/6','w-full','w-4/5','w-full','w-3/4'][i]}`} />
  ))}
</div>
```

---

## Checklist Before Finishing

**Skeleton quality**
- [ ] Every skeleton mirrors the real layout (same grid, columns, card structure)
- [ ] Used the project's existing `<Skeleton>` component
- [ ] Text skeleton lines have variable widths
- [ ] Animation style matches the project
- [ ] No layout shift when skeleton → real content

**FOEC**
- [ ] `if (isAuthLoading) return;` is the first guard in every data-fetching `useEffect`
- [ ] Auth provider exposes `isAuthLoading` separately from `isReady`
- [ ] Skeleton covers both `isLoading` and `isAuthLoading`

**Spinner / action states**
- [ ] Form submission and destructive actions use button spinner, not skeleton
- [ ] Spinner buttons are disabled while in-progress
- [ ] Spinner returns to idle state on success or error

**Accessibility**
- [ ] `aria-hidden="true"` or `role="status"` on all skeleton containers
- [ ] Spinner buttons have accessible label or `aria-label`

**Preservation**
- [ ] No existing working loading animation was removed or replaced
- [ ] Empty states only render after loading is complete AND data is confirmed empty

## See also
