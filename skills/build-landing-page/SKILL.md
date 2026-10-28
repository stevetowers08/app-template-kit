---
name: build-landing-page
description: Guides building a modern, non-generic landing page or marketing site end-to-end - discovery questions (brand, platform, content, references), brand-tokens-first setup, a platform decision (Webflow MCP vs custom Next.js+shadcn vs headless-CMS-for-editability), sequenced component-registry selection (Tailark/Shadcnblocks/Aceternity/Magic UI/21st.dev), anti-AI-slop build discipline, and a screenshot-loop + self-critique QA pass before calling it done. Pulls current practice live from the Wiki knowledge base in Obsidian rather than static instructions baked into this file. Use when asked to build, design, redesign, or scope a landing page, marketing site, or website - especially when avoiding a generic/templated/AI-slop look matters, or when the user references "no AI slop," "modern," "premium," or a specific platform (Webflow, Framer, Next.js, shadcn) for a marketing site.
---

# Build Landing Page

Builds a landing page/marketing site the way the Wiki knowledge base documents current (2026) professional practice: tokens before generation, one cohesive registry for structure before motion libraries, named anti-slop tells actively avoided, and a verification loop before anything ships. The vault is the living source of truth - this skill orchestrates and asks questions, it does not duplicate the vault's content, so re-read the vault notes each run rather than trusting memory of a past run.

## Step 0 - Read the vault first, every time

Read these before doing anything else (paths are fixed, vault is `<knowledge-base>/`):

- `Landing Pages/index.md` - hub, points to the 4 category notes below
- `Landing Pages/Copywriting.md` - framework selector (PAS/AIDA/BAB/StoryBrand), section-by-section structure, headline formulas
- `Landing Pages/Design & Generators.md` - the 11 essential elements, the 2026 anti-slop tell catalog, the tokens-first + screenshot-loop workflow, component/section manifests, motion rules, verified Core Web Vitals baseline
- `Landing Pages/Ad & Strategy.md` - only if the page is for paid traffic (ad-to-page message match)
- `Landing Pages/Optimisation & CRO.md` - the audit rubric to run at the end
- `Shadcn Registries/Landing Pages & Marketing.md` - the ranked registry shortlist and sequenced build order
- `Integrations/Website Builder Platforms - AI Agent Build Capability.md` - the Webflow/Framer/custom-code decision framework

If any note has been updated since last use, the new content applies - do not rely on a cached summary from a previous session.

## Step 1 - Ask before building, don't assume

Ask these up front, grouped, and don't skip to building on partial answers. Skip a group only if the user already answered it unprompted.

**Brand & visual identity**
- Do brand tokens (colors, fonts) already exist, or does an existing live site need auditing to extract them (if so: get the URL, use browser automation to pull computed styles - colors, fonts, spacing - don't guess from a screenshot)?
- Real photography/video available, or does that need sourcing/a shoot? (Real imagery beats a generated mockup - see the anti-slop note on why fake product mockups are a tell when there's no real product to show.)
- 1-2 reference sites/screenshots to anchor the screenshot loop in Step 6? (Cap at 2 - more makes comparison harder, not easier.)

**Platform & editability**
- Who edits content after launch, and how technical are they? This decides Webflow (native, agent-buildable via its MCP for CMS/pages, Designer-open needed for layout, no IX3) vs custom Next.js+shadcn+headless-CMS (full agent-buildable, real component ecosystem, content editing via Sanity/Payload admin, not drag-and-drop layout) vs Framer (largely NOT agent-buildable - see the vault note before recommending this path).
- Full custom build, or is there an existing repo/stack to match? Check the project's own conventions before assuming a fresh Next.js scaffold.

**Content & goal**
- Primary goal/action (the one CTA everything points to) and the primary audience.
- What's the reader's awareness stage (unaware/problem-aware/solution-aware/product-aware/most-aware)? This picks the copy framework in Step 5.
- Real proof available now - testimonials, case studies, stats? Never fabricate placeholder proof; if it doesn't exist yet, flag the gap rather than inventing a number or a quote.
- Is this landing page for paid traffic (needs ad-to-page message match) or organic/referral?

## Step 2 - Tokens before anything gets generated

A CLAUDE.md paragraph is a suggestion the model can still override; a token file is a type it structurally can't violate. Do this before writing a single component:

1. Copy `assets/tokens-template.json` into the project, fill every `REPLACE` with a literal value (never a description like "modern blue" - an actual hex/px/font-name).
2. Copy `assets/CLAUDE-fragment.md` into the project's `CLAUDE.md` (create one if it doesn't exist), fill its `REPLACE` markers to match.
3. If a value is needed that isn't in the token file, the rule is: ask before adding it, don't invent a shade to fill the gap.

## Step 3 - Decide the platform

Read `Integrations/Website Builder Platforms - AI Agent Build Capability.md` for the full breakdown; summary of the decision:

- **Client needs to self-edit visual layout in a drag-and-drop canvas** -> Webflow (its MCP handles CMS/pages/custom-code headlessly, but layout changes need the Designer open with the Bridge App, and IX3 interactions are manual only) or Framer (essentially not agent-buildable - confirm the user has read this trade-off before going this route).
- **AI-agent-built custom code + full component ecosystem is the priority, and client content-editing (not layout-editing) is enough** -> custom Next.js + shadcn + a headless CMS (Sanity Studio or Payload admin) wired in for content types. This is the fully agent-buildable path and matches most "our team needs to update jobs/articles/case studies" style briefs precisely.
- Do not attempt to build a custom-coded site AND a "go for go" Webflow/Framer twin for editability - there's no sync mechanism, and it doubles the build for no real benefit; pick one.

## Step 4 - Pick registries, in this order

Read `Shadcn Registries/Landing Pages & Marketing.md` for the full ranked list and rationale; the sequence matters more than which single registry is "best":

1. **Structure first**: Tailark (landing-specific, avoids the generic-shadcn look by design) or Shadcnblocks (broadest coverage) - lock real copy/IA in one cohesive theme before any polish pass.
2. **Fill structural gaps**: Shadcnblocks for anything the first pass didn't cover, so the base stays visually consistent.
3. **Motion pass, after structure is locked**: Aceternity for 1-2 standout moments (not more - overuse reads as generic AI-SaaS), Magic UI for restrained animation touches.
4. **21st.dev / Magic MCP last, surgical only**: for the one-off gap nothing else had a good answer for, or refining a component already in the codebase. It's a mixed-style community marketplace, not a single design language - using it early or broadly produces visual inconsistency.

## Step 5 - Build the page

- Pick the copy framework from `Landing Pages/Copywriting.md` matching the audience's awareness stage from Step 1 (PAS is the default workhorse for problem-aware traffic; StoryBrand for brand/trust-led sections).
- Structure the page on the 11 essential elements from `Design & Generators.md` §2, cut what the goal doesn't need (not every page needs pricing or FAQ).
- Every custom or adapted component gets a manifest - copy `assets/component-manifest-template.yaml`, fill the `when_to_use`/`when_not_to_use` fields concretely (a vague rule is as useless as no rule). For a multi-section page, also write the composition/pattern half of that template so sections assemble as an intentional sequence, not components used in isolation.
- Actively avoid the 2026 anti-slop tell catalog in `Design & Generators.md` §4 - re-check the specific list, it's more current than what's summarized in the CLAUDE.md fragment.
- Never fabricate proof (testimonials, stats, logos, case-study outcomes). If it doesn't exist, leave a flagged placeholder, don't invent one.

## Step 6 - Screenshot loop

After building a section: capture a real screenshot, compare it against the 1-2 reference images from Step 1, fix mismatches, repeat at least twice. This closes the gap between generic and on-brand more than any single prompt improvement - don't skip it because the build "looks done."

## Step 7 - Self-critique before calling it done

Run two adversarial passes, not one:

1. **CRO pass**: review the page as a skeptical conversion specialist - above-the-fold clarity, value-prop, trust signals, friction points, CTA strength. List the top issues by impact, fix the highest ones. (`Landing Pages/Optimisation & CRO.md` has the fuller audit rubric if the page needs a deeper pass.)
2. **Anti-slop pass**: re-check the page against the Design & Generators.md §4 tell catalog. Run the `avoid-ai-design` Claude Code skill in `detect` mode if installed, otherwise do it manually - purple-gradient/Inter/centered-three-card/untouched-shadcn-zinc/glassmorphism are the highest-severity tells.
3. **Technical baseline**: Core Web Vitals targets from `Design & Generators.md` §6 (LCP ≤2.5s, INP ≤200ms, CLS ≤0.1), WCAG 2.2 AA contrast and tap targets, `prefers-reduced-motion` fallback present.

Treat any drift found (a default the model reverted to) as a missing spec entry - add the explicit constraint to CLAUDE.md/tokens.json rather than just fixing the one instance and moving on.

## Resources

### assets/
- `tokens-template.json` - 3-tier (primitive/semantic/component) token file to copy into the project and fill in Step 2.
- `CLAUDE-fragment.md` - paste into the project's CLAUDE.md in Step 2; anti-generic guardrails + the token-enforcement rule.
- `component-manifest-template.yaml` - per-component manifest shape (when_to_use/when_not_to_use/slots/props/tokens_used) plus the composition/pattern shape, used in Step 5.
