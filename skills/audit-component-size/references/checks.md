# audit-component-size — check catalogue

Static checks for oversized / over-complex code. Thresholds come from the project's global
the defaults in `SKILL.md` — honour the repo's own rules if it states any.

Thresholds (global code-style):
- **Functions: ≤ 50 lines**, one responsibility.
- **Files: 200-400 typical, 800 hard max** — extract when larger.
- **Components: ≤ ~200-300 lines** — extract subcomponents/hooks past that.
- **Nesting: ≤ 4 levels** — prefer early returns.

Scope boundary: this skill owns **size/length/complexity** only. It DEFERS duplicate components + style
drift → `audit-design-system`, dead/orphaned files → `check-cleanup`, folder/file placement →
`audit-architecture`, and per-diff reuse cleanup → the built-in `/simplify`. Don't re-report those here.

## Contents
CS1 Function size · CS2 File size · CS3 Component size · CS4 Nesting & complexity

---

## CS1. Function / hook size (weight: 30)
Functions over ~50 lines usually do more than one thing.
```
# rough: flag functions whose body spans many lines (manual-confirm the boundaries)
grep -rnE '(export )?(async )?function |=>\s*\{$|^\s*const \w+ = (async )?\(' src --include=*.ts --include=*.tsx
# or use an AST/lint rule (eslint max-lines-per-function) where available
```
Read each flagged function; if > 50 lines and doing >1 job, it's a finding. Fix: extract pure helpers,
early returns. Report (extraction is the `--fix` refactor process, not auto-applied).

## CS2. File size (weight: 30)
```
find src app -name '*.ts' -o -name '*.tsx' | grep -vE '\.(test|spec|d)\.' | xargs wc -l 2>/dev/null \
  | awk '$1 > 400 {print}' | sort -rn
```
Files **> 400 lines = warn**, **> 800 = HIGH** (split by responsibility). Exclude generated files
(`types`, schema dumps). Report the worst, with a suggested split (by export/responsibility).

## CS3. Component size (weight: 25)
React components over ~200-300 lines should be decomposed (subcomponents, extracted hooks, smaller
render functions).
```
grep -rlnE 'export (default )?function [A-Z]|const [A-Z]\w+ = \(' src --include=*.tsx \
  | xargs wc -l 2>/dev/null | awk '$1 > 200 {print}' | sort -rn
```
Fix: extract subcomponents + move logic to a `use*` hook. Report.

## CS4. Nesting & complexity (weight: 15)
Deep nesting (> 4 levels), long parameter lists (> ~4 params → an options object), giant switch/if
ladders.
```
grep -rnE '^\s{16,}' src --include=*.ts --include=*.tsx        # 16+ leading spaces ≈ >4 indent levels
grep -rnE '\([^)]*,[^)]*,[^)]*,[^)]*,[^)]*\)' src --include=*.ts  # 5+ positional params
```
Fix: early returns, extract nested blocks into named functions, options object for long param lists.
Report (heuristics — read to confirm).

---

## The fix = a disciplined refactor (never bulk-auto-applied)
`--fix` does NOT mass-rewrite. It refactors **one focused area at a time**:
1. **Checkpoint** — confirm a clean git tree (or stash). 2. **Plan** the split, preserving every public
interface (props, signatures, exports) and behaviour. 3. **Extract** the smallest pieces — pure helpers,
subcomponents, `use*` hooks. 4. **Validate** — `tsc --noEmit`, `eslint`, `npm test --passWithNoTests`;
fix failures before moving on. 5. **Document** the standardised pattern in the relevant `CLAUDE.md`
(e.g. "dashboard cards use `<Card>`; no custom wrappers") so the bloat doesn't recur. One area per
session; no gold-plating; no new libraries/abstractions without flagging.

## Auto-fix summary
| Check | Auto-fix? |
|---|---|
| all CS checks | No (report) / Guarded under `--fix` via the one-area refactor process above + validation |
