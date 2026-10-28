# Route trace brief (for subagents)

Fill the `<...>` fields and send one brief per route group. Spawn them all in one message, pass the
model explicitly, and give each `subagent_type: Explore` (read-only).

```
Read-only loading-sequence trace in <repo path> (<framework + version>, React <version>, React
Compiler <on|off>). Do NOT start a dev server, run a build, query a database or edit files. Another
session may be editing this tree; just read.

Grade against the checklist in <knowledge-base>/Frontend/Next.js/Next.js Rendering
Performance.md, section "Performance Audit Checklist", steps 2-8 (read it first), and against the
repo's own rendering contract at <path or "none">.

Field data (real users, P75, 30 days):
<route> n <n>  LCP <ms> = ttfb <ms> + load_delay <ms> + load_dur <ms> + render <ms>
        INP <ms> (<phase split if known>)  CLS <value> (<element>)  LCP element: <selector>
...

Scope: <"the app shell: root layout, route-group layouts, providers, sidebar/nav, header,
toolbars" | the routes above>.

For each route (or the shell), write the loading sequence as a numbered timeline:
1. What is in the first HTML flush (nav? header? card frames? skeleton? blank?)
2. What it waits on: await / use() / Suspense boundary / provider gate, with file:line
3. What must hydrate before the LCP element shows
4. Client fetches, in order, marking any that depend on an earlier response
5. Which step the LCP element paints after
Match the LCP element selector to its component and explain why it paints when it does.

Then list defects. Each one: [CONFIRMED|SUSPECTED], checklist step, file:line, the quoted line,
impact (which field number it explains), fix shape. CONFIRMED means you read the code path end to
end. A waterfall must be a real dependency, not two awaits already in Promise.all.

Work in small batches so an interruption leaves finished work. Spawn no subagents. Report in under
<500-700> words: timelines first, then defects ranked by impact.
```

## Grouping guide

- Group 1 is always the shell, alone: its defects explain many routes.
- Then 2-4 routes per agent, grouped by shared layout or shared components (e.g. all list pages
  using one table), busiest first.
- A route with INP or CLS over target gets that named in its brief so the agent also traces the
  handler or the shifting element.
