---
name: audit-repo
description: Slash-only launcher for the audit-repo subagent - the judgement half of a repo harness audit.
disable-model-invocation: true
allowed-tools: Agent, Read, Glob
argument-hint: "[optional scope, e.g. 'verify only', 'skills only', or a path]"
last_verified: 2026-08-21
---

Delegate to the **`audit-repo` subagent** (`~/.claude/agents/audit-repo.md`). Do not run the
audit inline - the whole point is that a heavy read happens in an isolated context and only a
short verdict comes back.

1. If `$ARGUMENTS` names a scope, pass it through and tell the subagent to answer only those of
   its six questions and to say in its Denominators block which it skipped. With no arguments,
   it runs all six.
2. Spawn it with `run_in_background: false` - the user is waiting on the verdict.
3. Relay the subagent's report to the user **as written**. Do not summarise it further, do not
   re-run its commands to check them, and do not start fixing anything. It is read-only by
   design; acting on a finding is a separate, confirmed decision.

Pass this in the task prompt, because a subagent does not inherit the parent conversation:

- the repo root, and whether the working tree is dirty
- the name of the repo's mechanical checker if one exists (`scripts/check-rules.mjs` or
  equivalent), so it runs that rather than redoing the mechanical half by hand
- any area the user already knows is broken, so it does not spend a question rediscovering it

**Related:** `/audit-documentation` scores a repo's docs against the standard AGENTS.md +
CLAUDE.md + Diataxis architecture. This audits whether the harness can verify its own work.
They overlap only on the always-on token count; run this one when the question is
"is our agent config actually working", not "is our docs layout standard".
