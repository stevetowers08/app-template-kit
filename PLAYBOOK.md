# Building an App

The main parts of an app, what good looks like in each, and the skill that builds it and the
skill that checks it. Work through them top to bottom.

**How to use it:** install the skills, open your app in Claude Code and say
*"Read the app playbook and take me through Design"* (or whichever part you are on).

| Part | Build with | Check with |
|---|---|---|
| [Setup](#setup) | `setup-new-repo` | `audit-repo` |
| [Design](#design) | `setup-design-system` | `audit-design-system` |
| [Data and auth](#data-and-auth) | `supabase` | `audit-database` |
| [APIs](#apis) | `setup-error-handling` | `audit-api` |
| [Error handling](#error-handling) | `setup-error-handling` | `audit-error-handling` |
| [Loading](#loading) | | `audit-page-loading` |
| [Testing](#testing) | `setup-testing` | `audit-tests` |
| [Security](#security) | | `audit-security` |
| [Monitoring](#monitoring) | `setup-sentry` | `audit-observability` |
| [Launch](#launch) | | `audit-production-readiness` |
| [Upkeep](#upkeep) | `update-skills` | `audit-skill-freshness` |

Build skills add something to your app. Check skills score it and list what to fix. Run one at a
time: each reads what the last one left behind.

## Setup

Before any code. Gives the agent the rules of your repo and one command that proves work is done.

- `AGENTS.md` holds only what the agent cannot work out from the code: commands, traps, decisions.
- One `verify` command runs types, lint, tests and build. Green means done.
- CI runs `verify` on every pull request.
- Deploy a first page early, so every change ships the same way.

**Build:** `setup-new-repo`

**Check:** `audit-repo`

**Done when:** `verify` passes in CI and a first page is live on a preview link.

## Design

Before you build screens. Changing the look later costs far more.

- Pick one look for the whole app.
- Colours, spacing and corner radius come from design tokens, never hard-coded values.
- Build from shared components (button, card, input). Never hand-roll one.
- Write the design docs from the real code once tokens and components exist.

**Build:** `setup-design-system`

**Check:** `audit-design-system`

**Done when:** a real page uses only tokens and shared components.

## Data and auth

Before features. The database is the hardest thing to change later.

- Row-level security on every table, so the database itself blocks the wrong user.
- Logging in and permission are different things. Decide, table by table, who can read and write.
- Check permission on the server for every request, not just in the page.
- Change the database only through migrations. Index what you search and sort on.

**Build:** `supabase`

**Check:** `audit-database`

**Done when:** every table has row-level security and a test proving another user is blocked.

## APIs

Every route and server action.

- Validate every input before using it.
- Check the user's permission inside every action.
- One error format across every route.
- Timeouts and retries on calls to outside services.

**Build:** `setup-error-handling`

**Check:** `audit-api`

**Done when:** every route validates input, checks permission and has a test.

## Error handling

From the first API route.

- Expected errors get a clear message and a retry button.
- Unexpected errors land on a friendly fallback screen, never a crash or a stack trace.
- Never hide an error silently.
- When something breaks, deny access. Never grant it by accident.

**Build:** `setup-error-handling`

**Check:** `audit-error-handling`

**Done when:** a forced error on each page shows a friendly screen and gets logged.

## Loading

Once real pages exist, and again before launch.

- Measure real users first, then lab tools.
- Skeletons while content loads, spinners for button actions.
- Load data in parallel, not one request after another.
- The app frame and navigation appear instantly.

**Check:** `audit-page-loading`

**Done when:** key pages pass Google's Core Web Vitals for real users.

## Testing

Set it up at your first feature. Every feature after adds tests.

- Write the failing test first, then the code.
- End-to-end tests for sign-in, payments and the main feature.
- Every bug becomes a test, so it cannot come back.
- Check each test fails when the code is wrong. Agents write tests that always pass.

**Build:** `setup-testing`

**Check:** `audit-tests`

**Done when:** all tests run in CI and the main user journeys are covered end to end.

## Security

Before launch, then monthly.

- Secrets live in environment variables, never in code the browser sees.
- Limit how often people can try to sign in or hit expensive routes.
- Security headers on every page.
- Business-logic bugs are security bugs, such as a free user getting paid features when something breaks.

**Check:** `audit-security`

**Done when:** the audit is clean against the OWASP Top 10.

## Monitoring

Before anyone else uses the app.

- Errors are tracked and point at your real code.
- Logs show which request and which user.
- You get an alert on a new error, before users tell you.

**Build:** `setup-sentry`

**Check:** `audit-observability`

**Done when:** a test error in production reaches Sentry and sends you an alert.

## Launch

Before the first real users.

- Every change goes to a preview link first, then to production.
- Database changes ship before the code that needs them.
- Know how to roll back, and practise it once.
- Backups on, and one restore tested.
- Accessibility, page titles and share images, privacy policy.
- Email set up so it does not land in spam.
- Spending alerts on hosting and paid services.

**Check:** `audit-production-readiness`

**Done when:** you have rolled back once and restored a backup once.

## Upkeep

Every month. Frameworks move fast, and a skill with old advice gives old answers with confidence.

- Update your installed skills to their latest versions.
- Check your skills for advice that has gone out of date: versions, renamed settings, old APIs.
- Approve each fix yourself. Never let a skill rewrite itself.
- Update your app's dependencies at the same time.

**Build:** `update-skills` (it can also schedule the monthly update for you)

**Check:** `audit-skill-freshness`

**Done when:** skills are up to date and the check finds nothing out of date.

## Getting the skills

Install everything in this playbook:

```bash
npx skills add stevetowers08/app-template-kit -g -a claude-code
```

Two come from their makers: `npx skills add shadcn/ui` for components and
`npx skills add supabase/agent-skills` for the database.

`research` is included too: it checks current best practice on any topic.

## Sources

[Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist) ·
[Next.js data security](https://nextjs.org/docs/app/guides/data-security) ·
[Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod) ·
[Vercel production checklist](https://vercel.com/docs/production-checklist) ·
[Core Web Vitals](https://web.dev/articles/vitals) ·
[OWASP Top 10](https://owasp.org/Top10/2025/) ·
[Google SRE: reliable launches](https://sre.google/sre-book/reliable-product-launches/) ·
[Claude Code best practices](https://code.claude.com/docs/en/best-practices) ·
[agents.md](https://agents.md)
