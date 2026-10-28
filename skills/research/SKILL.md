---
name: research
description: Verify the latest 2026 best practices for a given technology, pattern, or API. Checks the vault Wiki first, then official docs (Context7) and the web for current consensus, deprecations and breaking changes, and updates the vault note when it is missing, stale or wrong.
argument-hint: [topic]
context: fork
model: sonnet
effort: high
allowed-tools:
  - Read
  - Glob
  - Grep
  - Edit
  - Write
  - Bash
  - mcp__plugin_context7_context7__resolve-library-id
  - mcp__plugin_context7_context7__query-docs
  - mcp__exa__web_search_exa
  - mcp__exa__web_fetch_exa
  - WebFetch
  - WebSearch
---

Research the best current practices for: **$ARGUMENTS**

If no argument is given, infer the topic from the current conversation or open file.

## Steps

1. **Knowledge base first, if you keep one** (none: skip to step 2). Read `<knowledge-base>/Index.md`, the relevant topic `index.md`, then the
   note(s). Grep the section you need rather than reading a whole long note. Write down what the vault
   currently says and the note's `updated` date - that is the baseline the web research is checked against.
2. **Context7** - resolve the library/framework ID, then query for the specific pattern or API.
3. **Exa** - `mcp__exa__web_search_exa` for `"<topic> best practices 2026"` and `"<topic> deprecations
   breaking changes 2026"`. Exa is the default for every search; fall back to
   built-in WebSearch only if Exa errors. Prefer primary sources; a vendor blog alone is not evidence.
4. **Compare vault vs current.** The vault is STALE when a primary source contradicts it, it misses a
   newer version/deprecation/breaking change, or it does not cover the topic at all. If sources disagree
   among themselves, flag it and do not write the disputed claim.
5. **Update the knowledge base when stale, if you keep one.** Only for
   durable cross-project engineering technique; project,
   client or business decisions are reported, never written.
   - Home: enrich the existing note's matching section; a new section in the closest note next; a new
     note only when nothing in the topic folder fits (copy `Wiki/_Template.md`, add it to the topic
     `index.md`, add a line to `Wiki/log.md`).
   - Correct, don't append beside: when the vault was wrong, replace the claim and say in the note what
     changed and why ("Superseded 2026-10: <old claim> - <source>"). Never leave both versions standing.
   - Every new claim carries its primary source link. Only verified, sourced claims go in; anything
     unconfirmed stays out of the note.
   - Bump `updated` to today; add `status: active` if missing.
   - If your knowledge base has a linter, run it and fix what it reports before returning.

## Output format

**One or two short paragraphs. Nothing else above them — no topic line, no headings, no
bullet list of deprecated things, no source-verdict section.** Just say, in plain English,
what the current practice is and what to do. Name the specific version, API or config key,
but explain it the way you would to someone who has not read the docs.

Two things must survive the compression, each as a clause inside those paragraphs rather
than a section of their own:

- if the sources disagree, or you only found one, say so and say which you trusted
- if something is now deprecated or outdated, name it in a sentence

Then, and only then:

**Action needed?**
Yes / No — one sentence on whether the current codebase needs to change.

**Vault:** one of - "current" (the note already matched, name it); "updated `Wiki/<path>.md` - <what
changed, one sentence>"; "not written - <reason>" (out of scope, sources disagreed, nothing durable).

## Rules

- No code changes. The only files this skill writes are vault `Wiki/` notes (and `Wiki/log.md` for a new note)
- Be specific: name the version, the API, the config key
- Plain language. No jargon the reader has to already know, no restating the question, no
  listing what you searched or ruled out. If a sentence does not change what to do, cut it
- If the topic is too broad, ask the user to narrow it
- Max 3 minutes of research — stop and summarise what you found, don't spiral
