---
name: audit-dependencies
description: Audit a project's dependency hygiene and supply-chain safety - known vulnerabilities (npm/pnpm audit, signature/provenance verification), supply-chain hardening (lifecycle-script restriction, npm ci vs install, release-age cooldown, committed lockfile, exotic subdeps), dead weight (unused deps via knip, duplicate/competing libs), and freshness (outdated majors, security version floors, publish-token hygiene). Reports a scored summary; pass --fix for safe low-risk fixes. Use when asked to audit/check/review dependencies, CVEs, supply chain, unused packages, or outdated libs.
disable-model-invocation: true
argument-hint: "[--fix] [--vulns|--ci|--unused]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
last_verified: 2026-10-21
---

# audit-dependencies

Scan a project for dependency risk against the 2026 supply-chain threat model (Shai-Hulud 2.0, axios
RAT, provenance-stripped versions): known vulns, supply-chain hardening, dead weight, and freshness.
Report a **scored** summary. With `--fix`, apply only non-breaking, reversible fixes (`npm audit fix`
non-breaking, CI `install`→`ci`, remove knip-confirmed unused); major bumps and lockfile changes are
report-only.

> When to use: "audit dependencies", "check for CVEs / supply chain", "any unused packages", "are we
> outdated". Mirrors the `audit-database` report shape for `/full-audit`. Keep the template stable.
> Owns general dependency CVEs; `audit-security` owns the app-code security verdict (it defers broad
> CVE scanning here).

## Modes

| Invocation | Behaviour |
|---|---|
| `/audit-dependencies` (default) | **Report only.** Run every check, score, output the report. |
| `/audit-dependencies --fix` | Report, then apply guarded fixes (non-breaking `audit fix`, CI `npm ci`, remove unused). Ask before each; re-run the command to confirm. |
| `--fix --vulns` / `--ci` / `--unused` | Limit fixes to that area. |

`--fix` NEVER does a major version bump, edits the lockfile by hand, or bulk-upgrades — each upgrade
is an attack-surface change that needs changelog review.

## Procedure

1. **Detect the package manager** (`package-lock.json`/`pnpm-lock.yaml`/`bun.lock`/`bun.lockb`) and read
   `.npmrc`/`pnpm-workspace.yaml` — defaults differ sharply (pnpm >=10 and npm >=12 block dependency
   lifecycle scripts by default; npm 11 needs `strict-allow-scripts`).
2. **Run the checks** in `references/checks.md` (DEP1-DEP4). Command-based checks (`npm audit`, `knip`,
   `npm outdated`) need installed devDeps/network — if unavailable, mark `SKIPPED (cannot run)`, never
   guess. Treat `npm audit` as one signal (it misses typosquat/ATO).
3. **Score** each dimension; compute the overall grade.
4. **Output the report** (template below).
5. **If `--fix`:** apply guarded fixes one at a time, re-run the relevant command to confirm it
   cleared, report applied vs deferred.

## Scoring

Start each dimension at 100; subtract per finding (CRITICAL -40, HIGH -20, MEDIUM -10, LOW -3,
floor 0). Overall = weighted mean over runnable dimensions (exclude SKIPPED).

| Dim | Weight | Covers |
|---|---|---|
| DEP2 Supply-chain hardening | 30 | lifecycle scripts restricted, `npm ci`, release-age cooldown, committed lockfile, exotic subdeps |
| DEP4 Freshness | 25 | outdated majors, security version floors, publish-token hygiene |
| DEP1 Known vulnerabilities | 25 | audit advisories, signature/provenance verification in CI |
| DEP3 Dead weight | 20 | unused deps (knip), duplicate/competing libs |

Grade: A ≥90, B ≥80, C ≥70, D ≥60, F <60.

## Report template (keep stable - the audit pipeline parses this)

```
# Dependency Audit - <project> - <grade> (<overall>/100)

Mode: report | fix    PM: npm|pnpm|bun    audit/knip: ran | SKIPPED (cannot run)

| Dimension | Score | Findings |
|---|---|---|
| DEP2 Supply-chain hardening | NN | n |
| DEP4 Freshness              | NN | n |
| DEP1 Known vulnerabilities  | NN | n |
| DEP3 Dead weight            | NN | n |

## Findings
### [SEVERITY] <id> <title>   (check DEP2a)
- Where: <package | .npmrc | CI file>
- Evidence: <command output | grep hit>
- Fix: <one line>  •  Auto-fixable: yes/no/guarded
- Applied: yes/no/deferred   (only in --fix mode)

## Skipped
- <checks marked SKIPPED (cannot run)>
```

## Rules

- **Never guess a command result.** If `npm audit`/`knip`/`npm outdated` can't run, mark `SKIPPED`.
- Report-only is the default. Auto-fix only the guarded checks in `references/checks.md`, one at a time.
- Never major-bump or bulk-upgrade automatically — each is an attack-surface change needing review.
- `npm audit` is one signal; it misses typosquat/ATO/novel attacks — pair with the hardening checks.
- Honour project lib rules on duplicates (`motion` not `framer-motion`, `cn()` not `clsx`).
- Keep the report under ~600 lines; summarise advisory counts, don't dump the full tree.

## See also
- `references/checks.md` - probe + fix catalogue
- Sibling: `audit-security` SEC5b (framework CVE version floor)
