# Personal Wallet

Personal crypto and stock portfolio tracker. Replaces an Excel-based workflow with automatic DCA calculations, P&L tracking, and portfolio analytics.

# Project Conventions

## Language

**ALL code must be written in English, no exceptions.**

This includes: variable names, function names, type names, constants, file names, code comments, JSDoc, inline strings used as identifiers (cache keys, error tags, enum values), and any other code artifact.

Human-facing UI copy and documentation may be in any language, but **everything inside `.ts` / `.tsx` files must be English.**

## General Rules

- Do not start a dev server unless explicitly asked
- Use always pnpm
- NEVER use em-dashes ("—") in any writing: UI copy, code comments, docs, commit messages. Rephrase with commas, colons, parentheses, or separate sentences instead
- For shadcn components ALWAYS use `base-ui`, NEVER `radix-ui`
- JSDoc (with `@param` tags) only on helpers whose behavior isn't obvious from the name (e.g. `toInputDate`, `toDbDate`, `uploadAssetImage`). Self-descriptive functions (services like `createAsset`, controllers, repository CRUD) get no JSDoc; comment elsewhere only when there is context the code genuinely cannot express
- All images in `public/assets/` must be WebP: run `pnpm convert:webp` to convert

## Imports: ALWAYS use the `@/` alias

**Never** use relative imports (`./`, `../`). **Always** use the `@/` path alias (`@/*` → `./src/*`) for every import within `src/`:

```tsx
// ❌ Wrong: relative paths
import { createTransaction } from './create-transaction.service'
import { updateTransactionSchema } from '../transactions.dto'

// ✅ Correct: alias paths
import { createTransaction } from '@/_bff/modules/transactions/create-transaction/create-transaction.service'
import { updateTransactionSchema } from '@/_bff/modules/transactions/transactions.dto'
```

Import directly from the specific file. No barrel exports (`index.ts` files that re-export other files).

## Services (Effect-TS)

All services use `Effect.gen` generators instead of `try/catch` or custom `tryCatch` wrappers. For Effect questions use the `effect-ts` skill, or fetch `https://effect.website/llms-full.txt` via `WebFetch`.

### Rules
- `Effect.fn('name')(function* () { ... })` for named services (better traces). tRPC services take `userId` / input args and never resolve the session
- `Effect.tryPromise` wraps any promise that can fail (Supabase queries, external APIs); `Effect.promise` wraps promises that are not expected to fail (e.g. `supabase.auth.getClaims()`)
- Supabase queries: always check both the `Effect.tryPromise` catch AND the returned `error` field
- Fail with `return yield* new SomeTaggedError(...)` (errors are yieldable) or `Effect.fail`. **Never `throw` inside `Effect.gen`**: it creates defects that bypass `catchAll` / `runEffect`
- Typed errors are `tagged()` classes (`src/_bff/common/errors/shared.errors.ts` for shared ones, `<module>.errors.ts` per module) carrying `cause`, an optional `message` and an `error_hash`. The explicit constructor return type on `tagged()` is required: without it `_tag` stays the unsubstituted generic and `Match.tag` / `Effect.catchTag` cannot discriminate the union
- `error_hash` is an `ErrorCode` member (random 8-char hash in `src/_bff/common/errors/error-codes.ts`) so client-visible messages correlate with server logs without leaking details
- tRPC services let typed errors reach `runEffect`. Fire-and-forget flows end with `Effect.catchAll` (log + safe fallback) and run with `Effect.runPromise`
- **Retries** on external APIs (Coinbase, Yahoo Finance): `Schedule.exponential('2 second').pipe(Schedule.jittered, Schedule.intersect(Schedule.recurs(2)))`, i.e. ~2s → ~4s, max 2 retries (see `update-tickers-prices.service.ts`). Use `Schedule.intersect` (not `Schedule.compose`) to cap retries and always add `Schedule.jittered`
- Parallel work: `Effect.forEach(..., { concurrency: 'unbounded' })`

## tRPC: controllers, services, repositories

Each tRPC route is a **controller** (`<use-case>.controller.ts`) that delegates to an exported **service** (`<use-case>.service.ts`) in the same use-case folder. Data access lives in the module's **repository** (`<module>.repository.ts`).

```typescript
// 1) src/_bff/modules/transactions/create-transaction/create-transaction.controller.ts: thin tRPC binding
export const CREATE_TRANSACTION_PROTECTED_CONTROLLER = protectedProcedure
    .input(createTransactionSchema) // from transactions.dto.ts
    .mutation(({ ctx, input }) =>
        runEffect(createTransaction(ctx.user.id, input), 'createTransaction', (error) =>
            Match.value(error).pipe(
                Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.exhaustive // required, fails to compile if a case is missing
            )
        )
    )

// 2) src/_bff/modules/transactions/transactions.router.ts: module composition root
import 'server-only'

export const TRANSACTIONS_ROUTER = router({
    create: CREATE_TRANSACTION_PROTECTED_CONTROLLER,
    // ...
})

// 3) src/_bff/trpc/router.ts: appRouter namespaces the module routers
export const appRouter = router({
    transactions: TRANSACTIONS_ROUTER, // → trpcClient.transactions.create.useMutation()
    // ...
})
```

### Rules
- **Controllers** are thin: `.input(<schema>)` + `runEffect(...)` + the error→TRPC-code `Match` map. No `Effect.fn`, no business logic, no Supabase access. One per file, exporting exactly **one** constant: `<NAME>_PROTECTED_CONTROLLER` or `<NAME>_PUBLIC_CONTROLLER`
- **Input schemas** (zod) and their inferred types live in `<module>.dto.ts`, never in the controller
- **Services** are exported `Effect.fn(...)` functions holding the business logic. They create the Supabase client (`createDBServerClient`, choosing publishable vs service-role key), pass it into the repository and do the dual error check
- **Repositories** are plain functions receiving `supabaseClient: SbClient` (`src/_bff/common/db/types.ts`) as their first parameter and returning the query; reads are wrapped in `unstable_cache`. One file per module, never imported by another module
- `runEffect` comes from `@/_bff/trpc/utils`; the `Match.value(error).pipe(… Match.exhaustive)` mapping lives in the controller file
- Use `protectedProcedure` (from `@/_bff/trpc/server`) for authenticated routes and pass `ctx.user.id` into the service. It runs `getSession()` once per request (cached), throws `401` when there is no user and `500` on infrastructure failure. Auth is enforced by the middleware, so **never** map `UnauthenticatedError` / `GetUserError` in the `Match`
- Use `publicProcedure` for unauthenticated routes (auth flows)
- Register controllers in the module's `<module>.router.ts` (exporting `<MODULE>_ROUTER`), and that router under its namespace in `src/_bff/trpc/router.ts`. Routers only compose, and start with `import 'server-only'`

### Calling from Server Components
Use the caller, no HTTP overhead:

```typescript
import { createCaller } from '@/_bff/trpc/caller'

const caller = await createCaller()
const transactions = await caller.transactions.getAll()
```

### Calling from Client Components
`trpcClient.<module>.<route>.useQuery()` / `.useMutation()` from `src/lib/trpc/index.ts`. The provider is `src/providers/trpc-provider.tsx` (mounted in `layout.tsx`, links `unauthorizedLink` → `httpBatchLink` → `/api/trpc`).

### Invalid session: forced sign-out
- `UNAUTHORIZED` (401) is reserved for an invalid session: never map business errors (e.g. wrong password → `BAD_REQUEST`) to it
- `createCaller()` redirects to `GET /api/auth/sign-out` on 401 (via `onError`), and the client `unauthorizedLink` (`src/lib/trpc/trpc-unauthorized-link.ts`) hard-navigates there
- That route (`force-sign-out.service.ts`) signs out locally and deletes all `sb-*` cookies, so it works even when the session is already dead
- `runEffect` upgrades PostgREST JWT rejections (`PGRST301` to `PGRST303`) to 401. `getSession` only returns "no user" for invalid-session auth errors (network/5xx stay 500 so users aren't signed out by outages)

### Mutations and caching
- Create/update/delete services end with `revalidateTag(<tag>, 'max')` + `revalidatePath(PRIVATE_ROUTE_PATH, 'layout')`, and the client calls `router.refresh()` on success. Without the tag revalidation the `unstable_cache` data would stay stale
- Transactions cache entries carry two tags: the global `getAllTransactions` (invalidated by the ticker-prices flows, which affect every user) and a per-user `getAllTransactions:<userId>` (built via `getAllTransactionsCacheTag`, invalidated by that user's mutations). Assets keep a single global `getAssets` tag because the `data` table is shared across users
- Transactions inserts/updates/deletes are scoped by `user_id = userId` (explicit column filter on top of RLS)

## Backend module layout

All backend code lives under `src/_bff/modules/<module>/` (`assets`, `auth`, `transactions`):

- `<module>.router.ts`: module composition root, exports `<MODULE>_ROUTER`
- `<use-case>/<use-case>.controller.ts` + `<use-case>/<use-case>.service.ts`: one folder per route (e.g. `create-transaction/`). A use case with no tRPC route (plain HTTP handler, e.g. `external-update-tickers/`) has only the service
- `<module>.repository.ts`, `<module>.dto.ts`, `<module>.errors.ts`, `<module>.constants.ts`: module-wide data access, zod schemas, typed errors and constants
- `providers/<name>.provider.ts`: external API clients (Coinbase, Yahoo Finance)
- `<name>.helper.ts`: request-scoped or pure helpers (e.g. `get-session.helper.ts`, `upload-asset-image.helper.ts`)

**Dependency direction**: controller → service → (repository | provider | helper). Never import another module's controller or repository.

Shared backend infra: `src/_bff/common/db/` (Supabase clients, table/bucket names, the cron SQL), `src/_bff/common/errors/` (`shared.errors.ts`, `error-codes.ts`), `src/_bff/common/logger/`. The tRPC transport layer lives in `src/_bff/trpc/`: `server.ts` (procedures and the auth middleware), `utils.ts` (`runEffect`), `context.ts`, `router.ts` (`appRouter`) and `caller.ts` (`createCaller`). Its client half is frontend code: `src/lib/trpc/` and `src/providers/trpc-provider.tsx`.

`import 'server-only'` goes on every router and on any file that must never reach the client bundle (secrets, cookies, service-role access), e.g. `caller.ts`, `db.utils.ts`, `*.server.ts`.

## Supabase

- **Tables**: `data` (ticker metadata and current prices, `TickerData`, shared by all users) and `transactions` (buy/sell/reward/fee rows, `Transaction`, per user)
- **Storage**: bucket `public_assets` holds asset logos. Uploads are converted to WebP (`upload-asset-image.helper.ts`) and served through `GET /api/asset-logo` because the page CSP only allows same-origin images; build URLs with `buildLogoUrl`
- **Server client**: `createDBServerClient(useSecretKey?, hooks?)` in `src/_bff/common/db/db.utils.ts`. Always create a new client per request (required for Fluid compute)
  - Default: `@supabase/ssr` with cookie-based session (RLS applies)
  - `useSecretKey = true`: service-role client that bypasses RLS, with no session. Only for writes to shared data (asset create/update/delete, ticker price updates) and server-to-server flows
  - `hooks.onGetAll` / `hooks.onSetAll` run **after** the default cookie handlers (`sbProxy` uses `onSetAll` to sync cookies onto the proxy request/response)

### Automatic price updates
- `POST /api/updateTickers` is a plain HTTP endpoint for the Supabase cron: the route calls `externalUpdateTickers` (`external-update-tickers.service.ts`), authorized by the `x-api-key` header only (timing-safe `verifyApiKey`), which does not fit `protectedProcedure`
- The FE "Update prices" button uses the `assets.updateTickersPrices` mutation (`update-tickers-prices.service.ts`) instead. Both fetch Coinbase (crypto) and Yahoo Finance (stocks/ETFs), update the `data` table and revalidate the caches
- **Cron**: the `invoke_update_tickers()` SQL function (`src/_bff/common/db/sql/invoke_update_tickers.sql`) calls the endpoint every hour via `pg_net`
- **Secrets**: API key and endpoint URL are stored in Supabase Vault (`update_tickers_api_key`, `update_tickers_url`)

## Portfolio data

- Assets are dynamic: created in-app via the Watchlist "Add asset" form (`assets.create` mutation). The `Ticker` enum in `src/types/Transaction.ts` only covers the long-standing ones
- Transaction types: `BUY`, `SELL`, `REWARD`, `FEE`
- Pure functions for all calculations, no side effects. The portfolio engine lives in `src/lib/portfolio/`
- **FIFO** realized G/L (chronological lots, oldest sold first, matches Portuguese tax rules) in `fifo.ts`. `avg_cost_per_share` of the remaining position is the weighted average of the remaining lots; REWARD transactions enter as zero-cost lots
- **Ordering**: transactions are fetched `buy_date` descending from Supabase for display. Holdings calculations sort ascending internally (on equal dates acquisitions go before sells), so they are input-order independent
- **Multi-currency** (EUR/USD/USDC per asset) with historical FX: costs and realized G/L convert to EUR at each transaction's `exchange_rate` (EUR per 1 USD/USDC at transaction date, e.g. `0.87`; fallback: current rate when absent), market value converts at the current rate
- EUR conversion happens ONLY in `src/lib/portfolio/` (`fifo.ts`, `calculations.ts`): `HoldingSummary` carries precomputed `_eur` fields and UI components consume them as-is (never convert in components)
- Formatters use `Intl` / `toLocale*String` with the `pt-PT` locale, not date-fns

## Code placement: helpers and constants

| Consumers | Where it lives |
| --- | --- |
| One component | Sibling `<component-name>.helpers.ts` (helpers) and `<component-name>.constants.ts` (constants), **never inline in the component file**. Example: `transactions-card/index.tsx` imports from `transactions-card.helpers.ts` and `transactions-card.constants.ts` |
| 2+ frontend modules | `src/lib/<area>/` (`portfolio/`, `utils/`, `constants/`, `core/`) |
| One backend module | `<module>.constants.ts` or a `<name>.helper.ts` in that module |

The component helpers/constants split is **strictly mandatory, no exceptions**.

## Components

- React 19: use `use()` instead of `useContext()`, and pass `ref` as a regular prop (no `forwardRef`)
- Server Components by default; add `"use client"` only when state, effects, or browser APIs are needed

### Props: ALWAYS use a named `type Props`

**Never** inline the type directly in the function signature. **Always** declare a named `type Props` above the component:

```tsx
// ❌ Wrong: inline type in signature
export function MyComponent({ name, email }: { name?: string; email?: string }) { ... }

// ✅ Correct: named type above the component
type Props = {
    name?: string
    email?: string
}

export function MyComponent({ name, email }: Props) { ... }
```

### Styling: ALWAYS use `cn()` with object syntax for conditional classes

**Never** use template literals or ternaries inside `className`:

```tsx
// ❌ Wrong
className={`text-xs font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}

// ✅ Correct
className={cn('text-xs font-medium', {
    'text-success': isPositive,
    'text-destructive': isNegative,
    'text-muted-foreground': isNeutral,
})}
```

### Styling: ALWAYS use theme tokens
- Tailwind token classes (`bg-background`, `text-primary`), never raw `var()` in `className`
- Theme colors live in `src/styles/globals.css` (`@theme inline`, OKLch), including `success`, `warning` and the chart colors `chart-1` to `chart-5`
- Typography tokens live in `src/styles/theme-typographic.css`

## Next.js Page & Layout Props

**ALWAYS** use the generated typed helpers. **NEVER** define props manually with raw types.

```tsx
// ✅ Correct: page
type Props = PageProps<'/portfolio/transactions'>

// ✅ Correct: layout
type Props = LayoutProps<'/portfolio'>

// ❌ WRONG: never do this, not even for dynamic routes
type Props = { params: Promise<{ slug: string }> }
type Props = { params: { slug: string }; searchParams: { q: string } }
```

Rules:
- The string must match the exact route path relative to `src/app/` (without the filename)
- These types are auto-generated (`pnpm typecheck` runs `next typegen` first). If a new route isn't there yet, regenerate; never write the type by hand

## URL state (nuqs)

- `NuqsAdapter` wraps the app in `layout.tsx` with `shallow: false` (param changes trigger server re-renders). Client-only filters opt into `shallow: true` in their `useQueryState` call
- Parsers live in `src/lib/core/searchParams.ts` (`createSearchParamsCache` + `parseAs*`), with the URL key mapping exported as `paramsUrlKeys` for server and client
- Server Components read params via `searchParamsCache.parse(props.searchParams)`; Client Components read/write them via `useQueryState`

## Security and bot protection

- Page CSP is set by `set-csp.ts` in the proxy (documents only, CSP is inert on subresources)
- Static assets are excluded from the proxy via `matcher` in `proxy.ts`. Their headers (nosniff, HSTS, X-Frame-Options, Referrer-Policy, plus the `/sw.js` worker CSP + no-cache) come from `headers()` in `next.config.ts` (CDN-level, no proxy invocations)
- `/_next/image` caching is governed solely by `images.minimumCacheTTL` (1 year)
- **Vercel BotId** (`botid` package): `withBotId()` wraps `next.config.ts`, and `instrumentation-client.ts` calls `initBotId()` for `/api/updateTickers`, `/api/trpc/*`, `/portfolio` and `/` (all POST). Server-side `checkBotId()` is currently disabled (commented out in `login.service.ts` and `update-tickers-prices.service.ts`). BotId always returns `isBot: false` in development; Deep Analysis is enabled via Vercel Dashboard → Firewall → Rules

## Tooling

```
pnpm lint          # oxlint (via vp lint)
pnpm fmt           # oxfmt (via vp fmt)
pnpm typecheck     # next typegen + tsc --noEmit
pnpm check         # lint + typecheck + tests
pnpm knip          # dead code / unused exports (knip.json)
pnpm test          # Vitest single run (via vp test run)
pnpm test:watch    # Vitest watch mode
pnpm test:coverage # Vitest with coverage
pnpm convert:webp  # convert non-WebP images in public/assets to WebP
```

- **vite-plus**: `vite.config.ts` is the single config for lint (oxlint), fmt (oxfmt) and test (Vitest). Read it for the exact rules instead of duplicating them here
- **Formatting**: no semicolons, single quotes, 4-space indent, 100 char width, ES5 trailing commas
- **Tests**: Vitest with jsdom and globals (`describe`, `it`, `expect` without imports), setup in `src/tests/setup.ts`. Tests live in a `__tests__/` folder next to the code under test. Files importing `server-only` must mock it: `vi.mock('server-only', () => ({}))`
- **Pre-commit (Husky)**: `pnpm fmt`, stage all changes (`git add -A`), `pnpm check`, `pnpm knip`
