# audit-typescript — check catalogue

Static checks for TypeScript type-safety. Verified against the official TSConfig reference and the
2026 strict-mode consensus. Stack: TS 7 (`latest` 7.0.2, the native Go
port; 7.1 beta adds the API; 6.0.3 shipped 2026-04-16, 5.9 is two majors behind), Next.js 16 (Turbopack - forces
`isolatedModules` unless `verbatimModuleSyntax` is on; it never requires `verbatimModuleSyntax`), Zod 4 at boundaries.

**DETECT the TS major, never assume it** — `npx tsc --version`, or the `typescript` range in
`package.json`. Repos legitimately sit on 5.x and 6.x, and the TS7 checks below are `N/A` there.

Read `tsconfig.json` (and any `tsconfig.*.json` it extends) first. Findings about flags are
authoritative from the config; findings about `any`/casts are from Grep over `src`/`app`.

---

## TS1. Compiler strictness (weight: 35)

Check the effective compilerOptions. Each missing/disabled flag is a finding. On TS >=6 `strict` defaults true; flag only an explicit `false`.

| Flag | Severity if off | Why |
|---|---|---|
| `strict: true` | CRITICAL | umbrella: noImplicitAny, strictNullChecks, strictFunctionTypes, strictBindCallApply, strictPropertyInitialization, strictBuiltinIteratorReturn, noImplicitThis, useUnknownInCatchVariables, alwaysStrict |
| `noUncheckedIndexedAccess` | HIGH | `arr[0]` is `T \| undefined` — catches a common runtime crash class |
| `exactOptionalPropertyTypes` | MEDIUM | distinguishes "missing" from "explicitly undefined" |
| `noImplicitOverride` | LOW | safe class overrides |
| `noImplicitReturns` | LOW | every path returns |
| `isolatedModules` | HIGH | required for Turbopack/SWC single-file transpile correctness (implied by `verbatimModuleSyntax`; not a finding when that is on) |
| `verbatimModuleSyntax` | MEDIUM | explicit `import type`; avoids surprising elision |

Detect: read the merged config (follow `extends`). Any individual `strict`-family flag set to `false`
to silence errors is a CRITICAL finding ("voting for an untyped codebase").
Fix: enable in tsconfig. Auto-fixable (add the flag) under `--fix --config` — but run `tsc --noEmit`
after; enabling may surface real errors that are NOT auto-fixable (report those).

### TS1b. Options TS 6 deprecated and TS 7 rejects outright — HIGH (TS ≥6 only)

TS 6.0 changed the defaults and TS 7 turns those deprecations into **hard errors**, so a config that
merely warned before now fails to compile. On a repo still on TS 5.x these are `N/A`; flag them as
upgrade blockers rather than present defects.

| Option | Now |
|---|---|
| `target: es5` | unsupported |
| `moduleResolution: node` / `node10` / `classic` | unsupported — use `bundler` or `node16`/`nodenext` |
| `module: amd` / `umd` / `systemjs` / `none` | unsupported |
| `baseUrl` | unsupported — use `paths` relative to the config file |
| `downlevelIteration` | unsupported |
| `esModuleInterop: false` | unsupported - interop is always on |
| `allowSyntheticDefaultImports: false` | unsupported - always on |
| `alwaysStrict: false` | unsupported - always strict |

```bash
npx tsc --version
grep -nE '"(target|module|moduleResolution|baseUrl|downlevelIteration|esModuleInterop|allowSyntheticDefaultImports|alwaysStrict)"' tsconfig*.json
```

Fix: migrate the option. Report — **not** auto-fixable; `baseUrl` removal rewrites every path alias.

**Tooling caveat, not a config finding:** TS 7.0 has no stable programmatic compiler API until 7.1,
so anything that does `import typescript` directly — typescript-eslint type-aware rules, Vue/Svelte/
Astro language tooling — still needs TS 6 alongside it via `@typescript/typescript6`. If the repo
runs type-aware lint rules, check that package is present before recommending a 7.0 bump. 7.1 beta
ships `typescript/sync` and `typescript/async` (may change before stable); typescript-eslint 8.72
peers `typescript <6.1.0`, so it still needs TS 6 via `@typescript/typescript6`.

## TS2. Escape hatches (weight: 30)

### TS2a. Explicit `any` — HIGH
```
grep -rnE ':\s*any\b|<any>|as any\b|Array<any>|Promise<any>' src app --include=*.ts --include=*.tsx
```
Each is a hole in the type system. Allowed only as a documented escape hatch with an
`// eslint-disable-next-line @typescript-eslint/no-explicit-any` + reason. Report; not auto-fixed
(narrowing to `unknown` + guards is manual).

### TS2b. Double-assertion `as unknown as T` — HIGH
```
grep -rnE 'as unknown as ' src app
```
Defeats type checking entirely. Report.

### TS2c. `@ts-ignore` instead of `@ts-expect-error` — MEDIUM
```
grep -rn '@ts-ignore' src app
```
`@ts-ignore` silently rots; `@ts-expect-error` errors once the underlying issue is fixed.
Fix: replace `@ts-ignore` → `@ts-expect-error` (+ keep the reason). Guarded auto-fix under `--fix`.

### TS2d. Non-null assertion `!` on a value that could be null — MEDIUM
```
grep -rnE '\w+!\.' src app    # foo!.bar — asserts non-null, bypasses strictNullChecks
```
Report (mechanical replacement risks behaviour change); suggest a guard or optional chaining.

## TS3. Runtime boundaries (weight: 20)

### TS3a. External data used without Zod validation — HIGH
API responses, `request.json()`, form data, `JSON.parse`, env access typed as a shape without a
runtime parse. (Overlaps `audit-api` API1 — here it is the *type-trust* angle: a TS type on external
data is a lie until validated.)
```
grep -rnE 'JSON\.parse\(|as [A-Z]\w+(\[\])?\s*[;,)]' src | grep -iE 'response|json|body|env'
```
Fix: parse with a Zod schema at the boundary (removes most casts). Report.

### TS3b. Catch variable typed/used as non-unknown — MEDIUM
With `useUnknownInCatchVariables` (part of strict), `catch (e)` is `unknown`. Flag `catch (e: any)`
or `e.message` access without narrowing.
```
grep -rnE 'catch\s*\(\s*\w+\s*:\s*any|catch\s*\([^)]*\)\s*\{[^}]*\.(message|stack|code)' src app
```
Fix: narrow with `instanceof Error` first. Report (overlaps `audit-error-handling`).

## TS4. API surface types (weight: 15)

### TS4a. Exported function without an explicit return type — LOW
```
grep -rnE 'export (async )?function \w+\([^)]*\)\s*\{' src    # no `: ReturnType` before the brace
```
Project rule: explicit return types on exported functions (prevents accidental inference drift across
module boundaries). Report.

### TS4b. Value import that should be `import type` — LOW
With `verbatimModuleSyntax`, type-only imports must use `import type`.
```
grep -rnE "^import \{[^}]*\} from" src    # cross-check: types imported as values
```
Fix: convert to `import type`. Guarded auto-fix.

---

## Auto-fix summary
| Check | Auto-fix? |
|---|---|
| TS1 add missing flag (then tsc) | Guarded |
| TS2c @ts-ignore→@ts-expect-error | Guarded |
| TS4b value→`import type` | Guarded |
| everything else | No / report |
