# setup-error-handling - file templates

All paths assume a `src/`-less App Router layout; prefix with `src/` if the project uses it. Adapt import
aliases (`@/lib/...`) to the project's `tsconfig` paths. Style boundary UIs to the design system - the
markup here is deliberately minimal.

## Table of contents
1. `lib/errors.ts` - AppError + factories
2. `lib/api/handler.ts` - centralized handler + `withApiHandler`
3. `lib/validation.ts` - Zod helpers at trust boundaries
4. `lib/fetch.ts` - `fetchWithRetry` (timeout + transient retry)
5. `lib/query-client.ts` - TanStack Query retry tuning
6. `app/error.tsx` - route-segment boundary
7. `app/global-error.tsx` - root boundary
8. `components/ErrorBoundary.tsx` - component-level (catchError / react-error-boundary)
9. `app/not-found.tsx` - 404 (optional)
10. Wiring examples - route handler, Server Action, server try/catch

---

## 1. `lib/errors.ts`

```ts
// One error type for the whole app. Carries an HTTP status + a stable machine code so the
// centralized handler can map it without a giant switch, and clients can branch on `code`.
export class AppError extends Error {
  readonly code: string
  readonly httpStatus: number
  readonly details?: unknown

  constructor(
    message: string,
    opts: { code: string; httpStatus: number; details?: unknown; cause?: unknown },
  ) {
    super(message, { cause: opts.cause })
    this.name = 'AppError'
    this.code = opts.code
    this.httpStatus = opts.httpStatus
    this.details = opts.details
  }
}

// Factories for the statuses that actually carry distinct meaning. Add more as real cases appear -
// don't pre-create a taxonomy you don't use yet.
export const BadRequest = (message = 'Bad request', details?: unknown) =>
  new AppError(message, { code: 'BAD_REQUEST', httpStatus: 400, details })
export const Unauthorized = (message = 'Not authenticated') =>
  new AppError(message, { code: 'UNAUTHORIZED', httpStatus: 401 })
export const Forbidden = (message = 'Not allowed') =>
  new AppError(message, { code: 'FORBIDDEN', httpStatus: 403 })
export const NotFoundError = (message = 'Not found') =>
  new AppError(message, { code: 'NOT_FOUND', httpStatus: 404 })
export const Conflict = (message = 'Conflict', details?: unknown) =>
  new AppError(message, { code: 'CONFLICT', httpStatus: 409, details })
export const TooManyRequests = (message = 'Too many requests') =>
  new AppError(message, { code: 'RATE_LIMITED', httpStatus: 429 })

// Next attaches a `digest` to errors that reach an error boundary. Boundary props are typed `unknown`,
// so narrow before reading it. Returns undefined when the error carries no string digest.
export function errorDigest(error: unknown): string | undefined {
  if (!(error instanceof Error) || !('digest' in error)) return undefined
  return typeof error.digest === 'string' ? error.digest : undefined
}
```

---

## 2. `lib/api/handler.ts`

```ts
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { AppError } from '@/lib/errors'

// The one shape every API error uses. `details` is only present for validation (field errors).
export type ApiErrorBody = { error: string; code: string; details?: unknown }

export function toErrorResponse(err: unknown): NextResponse<ApiErrorBody> {
  // Validation failed = the request was well-formed but semantically wrong -> 422 (not 400).
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.issues.map((i) => ({
          // issue.path is PropertyKey[]; String() keeps a symbol key from making join() throw.
          field: i.path.map(String).join('.') || '(root)',
          message: i.message,
          code: i.code,
        })),
      },
      { status: 422 },
    )
  }

  // Expected, known errors carry their own status. Only report server-side ones to Sentry -
  // a 404 or 403 is not a bug, so reporting it is noise.
  if (err instanceof AppError) {
    if (err.httpStatus >= 500) Sentry.captureException(err)
    return NextResponse.json(
      { error: err.message, code: err.code, ...(err.details ? { details: err.details } : {}) },
      { status: err.httpStatus },
    )
  }

  // Anything else is unexpected: report it, but never leak the message/stack to the client.
  Sentry.captureException(err)
  return NextResponse.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 },
  )
}

// Wrap a route handler so it never needs its own try/catch. Throw AppError (or let Zod throw)
// from anywhere inside and the shape + status are handled in one place.
export function withApiHandler<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (err) {
      return toErrorResponse(err)
    }
  }
}
```

---

## 3. `lib/validation.ts`

```ts
import type { z } from 'zod'

// Throw on invalid input -> the centralized handler turns the ZodError into a 422 with field details.
// Use at API boundaries and when validating EXTERNAL API responses (they change without warning).
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data)
}

// For forms / Server Actions where you want field errors back instead of an exception.
// Returns the first message per field (enough to render inline).
export function safeParseFields<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { data: T; fieldErrors: null } | { data: null; fieldErrors: Record<string, string> } {
  const result = schema.safeParse(data)
  if (result.success) return { data: result.data, fieldErrors: null }

  const fieldErrors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = issue.path.map(String).join('.') || '(root)'
    fieldErrors[key] ??= issue.message
  }
  return { data: null, fieldErrors }
}
```

---

## 4. `lib/fetch.ts`

```ts
// Resilient fetch for EXTERNAL calls. Times out, and retries only transient failures with
// jittered exponential backoff. Returns the Response (incl. non-retryable error responses) so the
// caller decides how to map them; throws only on network/timeout after exhausting attempts.
const RETRYABLE_STATUS = new Set([429, 502, 503, 504])
const MAX_DELAY_MS = 30_000

type RetryInit = RequestInit & { timeoutMs?: number; maxAttempts?: number }

export async function fetchWithRetry(url: string | URL, init: RetryInit = {}): Promise<Response> {
  const { timeoutMs = 10_000, maxAttempts = 3, ...rest } = init

  for (let attempt = 0; ; attempt++) {
    const isLast = attempt >= maxAttempts - 1
    try {
      // AbortSignal.timeout is the built-in way to bound a fetch (no manual AbortController).
      const res = await fetch(url, { ...rest, signal: AbortSignal.timeout(timeoutMs) })
      if (res.ok || !RETRYABLE_STATUS.has(res.status) || isLast) return res
      await sleep(backoffMs(attempt, res.headers.get('retry-after')))
    } catch (err) {
      // Network error / timeout (TypeError, TimeoutError, AbortError). Retry unless out of attempts.
      if (isLast) throw err
      await sleep(backoffMs(attempt, null))
    }
  }
}

function backoffMs(attempt: number, retryAfter: string | null): number {
  // A 429/503 may tell us exactly how long to wait - that beats any computed guess.
  if (retryAfter) {
    const seconds = Number(retryAfter)
    if (!Number.isNaN(seconds)) return Math.min(seconds * 1000, MAX_DELAY_MS)
  }
  const base = Math.min(1000 * 2 ** attempt, MAX_DELAY_MS)
  return base + Math.random() * 1000 // jitter avoids a thundering herd when a server recovers
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// POST/PATCH are not safe to retry blindly - a duplicate can create a second record. Only retry a
// mutating request if the endpoint is idempotent, or send an Idempotency-Key header the server honours:
//   fetchWithRetry(url, { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body })
```

---

## 5. `lib/query-client.ts`

```ts
import { QueryClient } from '@tanstack/react-query'
import { AppError } from '@/lib/errors'

// Retry only transient failures. TanStack's default retries ALL errors 3x; that wastes time on 4xx
// that will never succeed. We keep its built-in exponential backoff (1s, doubling, capped at 30s).
function isTransient(error: unknown): boolean {
  const status = error instanceof AppError ? error.httpStatus : undefined
  if (status === undefined) return true // network/unknown -> worth a retry
  return status === 429 || status >= 500
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => isTransient(error) && failureCount < 3,
    },
    mutations: {
      retry: 0, // mutations are usually non-idempotent - don't auto-retry. Opt in per-mutation if safe.
    },
  },
})
```

---

## 6. `app/error.tsx`

```tsx
'use client' // error boundaries must be Client Components

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

import { errorDigest } from '@/lib/errors'

// Segment-level fallback. Placed in any route folder, it catches render errors in that segment's tree.
// Place these strategically (e.g. per dashboard section) so one crash doesn't blank the whole app.
export default function Error({
  error,
  // Next 16.3+: `retry` re-fetches the segment's Server Component data on the server; `reset` only
  // clears client state. See the version note below this block for 16.2 and earlier.
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  useEffect(() => {
    // Tag with the digest so this client fallback maps to the exact server-side issue. The raw
    // server error (before Next strips it to a digest) is captured separately by onRequestError
    // in instrumentation.ts - see /setup-sentry.
    Sentry.captureException(error, { tags: { digest: errorDigest(error) } })
  }, [error])

  return (
    <div role="alert" className="p-6">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground mt-1">This section failed to load. You can try again.</p>
      <button onClick={() => retry()} className="mt-4 underline">
        Try again
      </button>
      {/* Don't render raw error.message/stack here: redundant in dev (Next's overlay already shows
          it) and an info-disclosure risk for client errors in prod. The digest above is the bridge.
          If you want a local convenience, gate a <pre> on NODE_ENV === 'development' only. */}
    </div>
  )
}
```

> **Version note (applies to every boundary below):** Next 16.3+ provides `retry` and a stable
> `catchError`; the retry re-fetches the segment on the server (fixes transient DB/timeout errors on
> retry). Next 16.2 exposes the same APIs as `unstable_retry` and `unstable_catchError`. Earlier
> versions provide `reset: () => void` only, which clears client state without re-fetching: rename
> `retry` to `reset` in the prop type and the call.

---

## 7. `app/global-error.tsx`

```tsx
'use client' // must be a Client Component; replaces the root layout, so it ships its own <html>/<body>

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

import { errorDigest } from '@/lib/errors'

// Last-resort net for errors thrown by the root layout itself. Rare, but without it a root-layout
// crash shows a fully broken page.
export default function GlobalError({
  error,
  retry, // Next 16.3+; see the version note under section 6 for earlier versions
}: {
  error: unknown
  retry: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { digest: errorDigest(error) } })
  }, [error])

  return (
    <html>
      <body>
        <div role="alert" style={{ padding: 24 }}>
          <h2>Something went wrong</h2>
          <button onClick={() => retry()}>Try again</button>
        </div>
      </body>
    </html>
  )
}
```

---

## 8. `components/ErrorBoundary.tsx`

### Variant A - Next 16.3+ (preferred): framework-aware `catchError`

```tsx
'use client'

import { catchError, type ErrorInfo } from 'next/error'
import * as Sentry from '@sentry/nextjs'

import { errorDigest } from '@/lib/errors'

// Wrap any subtree (incl. Server Components) for granular boundaries. Unlike react-error-boundary,
// this lets notFound()/redirect()/unauthorized() reach the framework, and retry() re-fetches server data.
function Fallback(props: { title?: string }, { error, retry }: ErrorInfo) {
  Sentry.captureException(error, { tags: { digest: errorDigest(error) } })
  return (
    <div role="alert" className="p-4">
      <p>{props.title ?? 'Something went wrong'}</p>
      <button onClick={() => retry()} className="mt-2 underline">
        Try again
      </button>
    </div>
  )
}

export default catchError(Fallback)
// Usage:  <ErrorBoundary title="Couldn't load profile"><UserProfile /></ErrorBoundary>
```

### Variant B - Next < 16.2 or pure client trees only: `react-error-boundary`

```tsx
// Install: npm i react-error-boundary
// ONLY use around trees with no Server Components and no framework throws (notFound/redirect) beneath,
// or as the fallback before you can upgrade to catchError.
'use client'

import { ErrorBoundary } from 'react-error-boundary'
import * as Sentry from '@sentry/nextjs'

export function ClientErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error) => Sentry.captureException(error)}
      fallbackRender={({ resetErrorBoundary }) => (
        <div role="alert" className="p-4">
          <p>Something went wrong</p>
          <button onClick={resetErrorBoundary} className="mt-2 underline">
            Try again
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
```

---

## 9. `app/not-found.tsx` (optional)

```tsx
import Link from 'next/link'

// Rendered by notFound(). Use notFound() for missing resources instead of rolling your own 404.
export default function NotFound() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold">Not found</h2>
      <p className="text-muted-foreground mt-1">We couldn't find what you were looking for.</p>
      <Link href="/" className="mt-4 inline-block underline">
        Go home
      </Link>
    </div>
  )
}
```

---

## 10. Wiring examples

### Route handler - `withApiHandler` + `parseOrThrow`

```ts
// app/api/items/route.ts
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api/handler'
import { parseOrThrow } from '@/lib/validation'
import { NotFoundError } from '@/lib/errors'

const CreateItem = z.object({ name: z.string().min(1), qty: z.number().int().positive() })

export const POST = withApiHandler(async (req: Request) => {
  const body = parseOrThrow(CreateItem, await req.json()) // invalid -> 422 automatically
  const item = await db.items.create(body)
  if (!item) throw NotFoundError('Parent collection missing') // -> 404, consistent shape
  return NextResponse.json(item, { status: 201 })
})
```

### Server Action - expected errors via `useActionState`

```ts
'use server'
import { safeParseFields } from '@/lib/validation'
import { ContactSchema } from '@/lib/schemas'

export async function submitContact(_prev: unknown, formData: FormData) {
  const { data, fieldErrors } = safeParseFields(ContactSchema, Object.fromEntries(formData))
  if (fieldErrors) return { ok: false as const, fieldErrors } // expected -> return, don't throw
  await sendMessage(data)
  return { ok: true as const }
}
// Client: const [state, action] = useActionState(submitContact, null)
```

### Server `try/catch` - rethrow framework control flow

```ts
import { unstable_rethrow } from 'next/navigation'

try {
  const user = await getUser() // may call notFound()/redirect() internally
  return render(user)
} catch (err) {
  unstable_rethrow(err) // let notFound()/redirect() through - never swallow framework throws
  Sentry.captureException(err)
  throw err // bubble to the nearest error.tsx boundary
}
```
