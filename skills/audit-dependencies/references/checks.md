# audit-dependencies — check catalogue

Checks for dependency hygiene + supply-chain safety. Verified against Unit 42's 2026 npm threat
analysis, npm/pnpm provenance (SLSA) guidance, and knip docs. 2026 context: Shai-Hulud 2.0, the axios
RAT, and the TanStack-router cache-poisoning worm all shipped via lifecycle scripts, git-URL
dependencies, or trusted-publisher abuse (TanStack shipped through the real OIDC publisher, so
provenance alone is not a safeguard).

Detect the package manager (`package-lock.json`=npm, `pnpm-lock.yaml`=pnpm, `bun.lock`/`bun.lockb`=bun;
bun >=1.2 writes text `bun.lock` for new projects, an existing `bun.lockb` stays until migrated) and read
`.npmrc`/`pnpm-workspace.yaml` first — defaults differ sharply by manager.

Some checks run a command (npm audit, knip) — those need network/devDeps installed; if unavailable
mark `SKIPPED (cannot run)`, never guess a result.

---

## DEP1. Known vulnerabilities (weight: 25)

### DEP1a. Open advisories — severity = advisory level
```
npm audit --omit=dev --json    # or: pnpm audit --prod --json
```
Map critical/high advisories to findings. Note: `npm audit` only covers *published* advisories — it
does NOT catch novel attacks (typosquat, ATO). Treat as one signal. Fix: `npm audit fix` for
non-breaking; majors are manual + changelog review. Report (auto-fix only the non-breaking `audit fix`
under `--fix --vulns`, then re-run).

### DEP1b. Missing signature/provenance verification in CI — MEDIUM
`npm audit signatures` (SLSA/Sigstore) should be a blocking CI step.
```
grep -rn "audit signatures" .github/workflows .gitlab-ci.yml 2>/dev/null
```
Report if absent.

## DEP2. Supply-chain hardening (weight: 30)

### DEP2a. Lifecycle scripts not restricted — HIGH
postinstall/preinstall hooks are the #1 attack vector.
```
# npm >=12: allowScripts in root package.json. npm 11: strict-allow-scripts in .npmrc. pnpm: allowBuilds + strictDepBuilds.
grep -nE "ignore-scripts|strict-allow-scripts" .npmrc 2>/dev/null
grep -n "allowScripts" package.json
grep -nE "allowBuilds|strictDepBuilds|onlyBuiltDependencies" pnpm-workspace.yaml 2>/dev/null
```
npm >=12: blocks dependency lifecycle scripts unless root `package.json` `allowScripts` allows them;
verify the allowlist names only packages that need a build step.
npm 11: set `strict-allow-scripts=true` (default `false`).
Never combine `ignore-scripts` with an allowlist: `--ignore-scripts` overrides `allowScripts`, so approved builds are skipped.
pnpm: verify `allowBuilds` (10.26+; replaces `onlyBuiltDependencies`, removed in 11.0.0) and that `strictDepBuilds`
is not `false` (added 10.3.0, default `true` from v11; set it explicitly on v10). Report.

### DEP2b. CI uses `npm install` not `npm ci` — HIGH
```
grep -rn "npm install\b" .github/workflows 2>/dev/null    # should be `npm ci`
```
`npm ci` installs exactly from the lockfile and fails on drift. Fix: change CI to `npm ci`. Guarded
auto-fix under `--fix --ci`.

### DEP2c. No release-age cooldown — MEDIUM
A new (possibly compromised) version reaching builds immediately. The axios attack was live ~3h;
a release-age cooldown of 1-7 days dodges it. Check Renovate `minimumReleaseAge` (duration string),
Dependabot `cooldown` (3-day default; version updates only), pnpm `minimumReleaseAge` (minutes; default 1440
from v11) or npm `min-release-age` (days). Report if none.

### DEP2d. Lockfile not committed — HIGH
```
git ls-files | grep -E 'package-lock.json|pnpm-lock.yaml|bun.lock|bun.lockb'    # must be present
```
No committed lockfile = non-reproducible + invisible supply-chain diffs. Report.

### DEP2e. Exotic/git/tarball subdeps — MEDIUM
```
grep -nE '"[^"]+":\s*"(git\+|https?://|github:|file:)' package.json
```
pnpm: recommend `blockExoticSubdeps: true` (10.26+; default `true` from v11).
npm >=12: `allow-git` and `allow-remote` default to `none`; verify `.npmrc` does not widen them.
```
grep -nE "allow-git|allow-remote" .npmrc 2>/dev/null
```
Report git/tarball sources.

## DEP3. Dead weight (weight: 20)

### DEP3a. Unused dependencies — MEDIUM
```
npx knip --dependencies    # lists deps in package.json not imported anywhere
```
Each unused dep is attack surface + install cost. Fix: remove. Guarded auto-fix (`npm rm <pkg>`) under
`--fix --unused`, one at a time, after confirming knip isn't fooled by dynamic imports.

### DEP3b. Duplicate / competing libraries — LOW
Two libs for the same job (e.g. two date libs, framer-motion + motion, clsx + classnames).
```
node -e "const d=require('./package.json').dependencies||{};console.log(Object.keys(d).join('\n'))" | sort
```
Report pairs for consolidation (project rule: `motion` not `framer-motion`, `cn()` not `clsx`).

## DEP4. Freshness (weight: 25)

### DEP4a. Outdated majors on core deps — MEDIUM
```
npm outdated --json    # focus on next, react, typescript, @supabase/*, security-relevant deps
```
Flag majors behind, especially anything below a known security floor. **Do not hardcode a floor
here** — `audit-security` SEC5b owns it and derives it from the GitHub advisory API; a number copied
into this file is a second definition that drifts out of step with the first (it already did: both
files carried a floor that named the wrong package). Run SEC5b's query, or cross-ref it. Fix: bump +
changelog review; never bulk-upgrade. Report.

### DEP4b. Token-authenticated publish / weak publish auth — MEDIUM
If this repo publishes a package: a token-authenticated publish stays possible beside trusted publishing unless the package is set to "Require two-factor authentication and disallow tokens". Classic npm tokens are revoked (2025-12-09); a granular token with bypass 2FA can still publish.
```
grep -rn "NODE_AUTH_TOKEN\|npm publish" .github/workflows 2>/dev/null    # prefer OIDC trusted publishing
```
Report (publishing repos only).

---

## Auto-fix summary
| Check | Auto-fix? |
|---|---|
| DEP1a non-breaking `npm audit fix` | Guarded |
| DEP2b CI `npm install`→`npm ci` | Guarded |
| DEP3a remove unused (knip-confirmed) | Guarded, one at a time |
| everything else | No / report |

Always re-run the relevant command after a fix to confirm it cleared.
