# Personal Wallet

Personal crypto and stock portfolio tracker. Replaces an Excel-based workflow with automatic DCA calculations, P&L tracking, and portfolio analytics.

# Project Conventions

## Language

**ALL code must be written in English — no exceptions.**

This includes: variable names, function names, type names, constants, file names, code comments, JSDoc, inline strings used as identifiers (cache keys, error tags, enum values), and any other code artifact.

Human-facing UI copy and documentation may be in any language, but **everything inside `.ts` / `.tsx` files must be English.**


## Path Alias

`@/*` maps to `./src/*`

## General Rules

- Do not start a dev server unless explicitly asked
- Use always pnpm

### tRPC — controllers, services, repositories (NestJS-style layering)
Each tRPC route is a **controller**: a thin binding in
`src/_bff/modules/<module>/controllers/<name>.controller.ts` that delegates to an exported
**service** in `services/<name>.service.ts`. Data access lives in **repositories**
(`repositories/<table>.repository.ts`). Controllers contain **no business logic and no Supabase
queries** — only the zod input schema, the `runEffect` call, and the error→TRPC-code `Match` map.


Each module composes its controllers in a router file at the module root, and `appRouter`
namespaces the module routers:

#### Rules
- Controller files **must** be named `src/_bff/modules/<module>/controllers/<name>.controller.ts` and export exactly **one** constant: `<NAME>_PROTECTED_CONTROLLER` or `<NAME>_PUBLIC_CONTROLLER`.
- Controllers are **thin**: zod input schema + `runEffect(...)` + `Match` error map. No `Effect.fn`, no business logic, no Supabase access.
- Services (`services/<name>.service.ts`) are **exported** `Effect.fn(...)` functions holding the business logic. They create the Supabase client (choosing publishable vs service-role key) and pass it into repositories.
- Repositories (`repositories/<table>.repository.ts`) are **exported** `Effect.fn(...)` functions that receive `supabase: SupabaseClient` as their first parameter and wrap queries with the dual error check (catch + `error` field). One file per table/domain. **No cross-module imports.**
- **Dependency direction**: controller → service → (repository | processor | helper). Cross-module imports go through `services/` or `processors/` only — never another module's controller or repository.
- Use `protectedProcedure` (from `@/_trpc/server`) for authenticated routes — `ctx.user` is guaranteed; pass it into the service. Auth is enforced by the middleware, so **never** map `UnauthenticatedError` / `GetUserError` in the `Match`.
- Use `publicProcedure` for unauthenticated routes (auth flows, public forms).
- `runEffect` comes from `@/_trpc/utils`; the `Match.value(error).pipe(… Match.exhaustive)` mapping lives in the controller file.
- Register controllers in the module's `<module>.router.ts` (exporting `<MODULE>_ROUTER`), and register that router under its namespace in `src/_trpc/router/index.ts`.

`protectedProcedure` runs `getSession()` once per request (cached) and injects `ctx.user`: it throws `401` when there is no user and `500` on infrastructure failure. Services still create their own Supabase client, so each one controls whether it uses the publishable or service-role key.

- **Mutations + caching**: create/update/delete mutations end with `revalidateTag(...)` + `revalidatePath(PRIVATE_ROUTE_PATH, 'layout')`; the client calls `router.refresh()` on success — without the tag revalidation the `unstable_cache` data would stay stale. Transactions cache entries carry two tags: the global `getAllTransactions` (invalidated by the ticker-prices flows, which affect every user) and a per-user `getAllTransactions:<userId>` (built via `getAllTransactionsCacheTag`, invalidated by that user's create/update/delete mutations). Assets keep a single global `getAssets` tag because the `data` table is shared across users
- **Transactions CRUD**: inserts/updates/deletes are scoped by `user_id = ctx.user.id` (explicit column filter on top of RLS)
- **error_hash**: typed errors carry an `ErrorCode` (random 8-char hash, `_bff/common/errors/error-codes.ts`) so client-visible messages correlate with server logs without leaking details
- **Consumption**: Server Components use `createCaller()` (`src/_trpc/server/caller.ts`); Client Components use `trpcClient.*.useMutation`/`useQuery` (provider in `layout.tsx`, `httpBatchLink` → `/api/trpc`)
- `POST /api/updateTickers` stays a plain HTTP endpoint for the Supabase cron (`x-api-key` auth, which does not fit `protectedProcedure`); the FE "Update prices" button uses the `assets.updateTickersPrices` mutation instead


## Supabase Integration

### Tables
- `data` — ticker metadata and current prices (`TickerData`)
- `transactions` — buy/sell/reward/fee transactions (`Transaction`)

### Server Client
- `createDBServerClient(useSecretKey?, hooks?)` in `_bff/common/db/db.utils.ts` creates a per-request Supabase client using `@supabase/ssr` with cookie-based session management
- `useSecretKey` (default `false`): when `true`, uses the service role key to bypass RLS — use only for server-to-server operations (cron jobs, webhooks) with no user session
- Accepts optional `hooks` parameter with `onGetAll` and `onSetAll` callbacks that run **after** the default cookie handlers (used by `sbProxy` to sync cookies onto middleware request/response)
- Always create a new client per request (required for Fluid compute)

### Automatic Price Updates
- **API endpoint**: `POST /api/updateTickers` — the route delegates to `handleUpdateTickers` in `_bff/modules/assets/assets.controller.ts`, which authorizes, calls `updateTickersPrices` (fetches from Coinbase for crypto and Yahoo Finance for stocks/ETFs), updates the `data` table, and revalidates caches
- **Auth**: `x-api-key` header (timing-safe comparison) or authenticated Supabase user session
- **FE trigger**: the "Update prices" button calls the `assets.updateTickersPrices` tRPC mutation (`update-tickers-prices.service.ts`), which runs the same flow (checkBotId + update + cache revalidation) behind `protectedProcedure`
- **Bot protection**: `checkBotId()` blocks automated requests in production
- **Supabase cron**: `invoke_update_tickers()` SQL function calls the endpoint every 4 hours via `pg_net`
- **Secrets**: API key and endpoint URL stored in Supabase Vault (`update_tickers_api_key`, `update_tickers_url`)

## Supported Assets

Assets are dynamic — created in-app via the Watchlist "Add asset" form (`assets.create` mutation); the `Ticker` enum in `types/Transaction.ts` only covers the long-standing ones. Currently held:

- **Crypto**: ETH, SOL, BTC
- **ETF**: VUAA
- **Stocks**: ATCH

Transaction types: `BUY`, `SELL`, `REWARD`, `FEE`

### React 19
- Use `use()` instead of `useContext()` to consume context
- No `forwardRef` — use ref as a regular prop
- Server Components by default; add `"use client"` only when state, effects, or browser APIs are needed

### Data Architecture
- All data fetched from Supabase via server-only services
- Pure functions for all calculations — no side effects
- Realized G/L uses FIFO (chronological lots, oldest sold first — matches Portuguese tax rules); `avg_cost_per_share` of the remaining position is the weighted average of the remaining lots; REWARD transactions enter as zero-cost lots (FIFO engine lives in `lib/fifo.ts`)
- Multi-currency (EUR/USD/USDC per asset) with **historical FX**: costs and realized G/L convert to EUR at each transaction's `exchange_rate` (EUR per 1 USD/USDC at transaction date, e.g. `0.87`; fallback: current rate when absent) and market value converts at the current rate
- EUR conversion happens ONLY in `lib/calculations.ts` — `HoldingSummary` carries precomputed `_eur` fields and UI components consume them as-is (never convert in components)
- Formatters use `Intl.NumberFormat` and `Intl.DateTimeFormat` (pt-PT locale), not date-fns

### URL State (nuqs)
- `NuqsAdapter` wraps the app in `layout.tsx` with `shallow: false` (triggers server re-renders on param changes)
- Parsers defined in `src/lib/searchParams.ts` using `createSearchParamsCache` + `parseAsBoolean`
- Server Components read params via `searchParamsCache.parse(props.searchParams)`
- Client Components read/write params via `useQueryState` hook
- URL key mapping exported as `paramsUrlKeys` for shared use between server and client

### Styling
- Use Tailwind token classes (`bg-background`, `text-primary`) — never raw `var()` in className
- Theme colors defined in `src/styles/globals.css` via `@theme inline` (OKLch)
- Typography tokens in `src/styles/theme-typographic.css`
- Chart colors: `chart-1` through `chart-5`
- **Conditional classes**: Always use `cn()` with object syntax for conditional classes — never use template literals with ternaries in `className`
  ```tsx
  // ✅ Correct
  className={cn('text-xs font-medium', {
      'text-success': isPositive,
      'text-destructive': isNegative,
      'text-muted-foreground': isNeutral,
  })}

  // ❌ Wrong — never do this
  className={`text-xs font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}
  ```

### Security
- Page CSP set via `set-csp.ts` in the proxy (documents only — CSP is inert on subresources)
- Static assets are excluded from the proxy via `matcher` in `proxy.ts`; their headers (nosniff, HSTS, X-Frame-Options, Referrer-Policy, plus the `/sw.js` worker CSP + no-cache) come from `headers()` in `next.config.ts` (CDN-level, no proxy invocations)
- `/_next/image` caching is governed solely by `images.minimumCacheTTL` (31 days)
- **Bot Protection**: Vercel BotId via `botid` package

### Bot Protection (Vercel BotId)
- **Client-side**: `instrumentation-client.ts` calls `initBotId()` with protected routes
- **Server-side**: `checkBotId()` from `botid/server` in API route handlers and inside the tRPC `login` service
- **Config**: `withBotId()` wraps `next.config.ts` for proxy rewrites
- Protected routes: `/api/updateTickers` (POST), `/api/trpc/*` (POST), `/portfolio` (POST), `/` (POST)
- In development, BotId always returns `isBot: false` — only active in production on Vercel
- Deep Analysis enabled via Vercel Dashboard → Firewall → Rules

### Code Quality
- **Component helpers/constants files (STRICTLY MANDATORY — no exceptions)**: helper functions used by a component live in a sibling `<component-name>.helpers.ts` file, and constants in `<component-name>.constants.ts` — never inline in the component file. Example: `transactions-card.tsx` imports from `transactions-card.helpers.ts` and `transactions-card.constants.ts`
- No barrel exports (index.ts re-exports)
- Import directly from the specific file
- Always use the `@/*` path alias for imports — never use relative paths like `'./label'` or `'../utils'`
- `server-only` import guard only on `.router` service files
- JSDoc (with `@param` tags) only on helper functions whose behavior isn't obvious from the name (e.g. `toInputDate`, `toDbDate`, `uploadAssetImage`); self-descriptive functions (services like `createAsset`, controllers, repository CRUD) get no JSDoc — comment elsewhere only when there is context the code genuinely cannot express
- All images in `public/assets/` must be WebP format — run `pnpm convert:webp` to convert

### Effect (Error Handling & Retry)
- All services use `Effect.gen` generators instead of `try/catch` or custom `tryCatch` wrappers
- `Effect.tryPromise` wraps any promise that can fail (Supabase queries, external API calls)
- `Effect.promise` wraps promises that are not expected to fail (e.g., `supabase.auth.getClaims()`)
- `Effect.catchAll` at the pipeline end for fire-and-forget flows (logging + safe fallback); tRPC services skip it and let typed errors reach `runEffect`
- `Effect.fail` or `return yield* new SomeTaggedError(...)` (errors are yieldable) for explicit typed failures — **never use `throw` inside `Effect.gen`** (creates defects that bypass `catchAll`/`runEffect`)
- `Effect.fn('name')` for named service functions (better traces); tRPC services take `userId`/input args and never resolve the session
- `Effect.runPromise` (or `runEffect` for tRPC procedures) converts the Effect pipeline back to a `Promise` at the boundary
- **Retry logic**: `_bff/modules/assets/update-tickers-prices.service.ts` uses `Schedule.exponential('2 second')` with `Schedule.jittered` and `Schedule.intersect(Schedule.recurs(2))` for exponential backoff with jitter on external API calls (Coinbase, Yahoo Finance) — approximate delays: ~2s → ~4s, max 2 retries
- **Concurrency**: `Effect.forEach` with `{ concurrency: 'unbounded' }` for parallel ticker updates
- **Pattern**: `Effect.fn('name')(function* () { ... })` for tRPC services (typed errors surface to the controller); `Effect.gen(function* () { ... }).pipe(Effect.catchAll(...))` where recovery is local
- **Schedule combinators**: use `Schedule.intersect` (not `Schedule.compose`) to combine exponential backoff with retry limits; always add `Schedule.jittered` to prevent thundering herd
- **`tagged()` helper**: the explicit constructor return type annotation in `shared.errors.ts` is required — without it TypeScript leaves `_tag` as the unsubstituted generic and `Match.tag`/`Effect.catchTag` cannot discriminate the error union

#### Effect Documentation
- **LLM-optimized docs**: `https://effect.website/llms-full.txt` — fetch via `WebFetch` when writing or reviewing Effect code
- **Skill**: `.claude/skills/effect-ts/SKILL.md` — project-specific patterns and rules

## Code Quality Tools

### Scripts
```
pnpm lint          # oxlint (via vp lint)
pnpm fmt           # oxfmt (via vp fmt)
pnpm typecheck     # TypeScript (tsc --noEmit)
pnpm check         # lint + typecheck + tests combined
pnpm knip          # Dead code / unused exports detection
pnpm test          # Vitest (single run, via vp test run)
pnpm test:watch    # Vitest (watch mode, via vp test)
pnpm test:coverage # Vitest with coverage
pnpm convert:webp  # Convert all non-WebP images in public/assets to WebP
```

### vite-plus (unified toolchain)
- Config: `vite.config.ts` — single file for lint, fmt, test
- CLI: `vp lint`, `vp fmt`, `vp test` (wraps oxlint, oxfmt, vitest)
- Replaces: ESLint, Prettier, separate vitest config

### oxlint
- Plugins: `typescript`, `react`, `react-perf`, `nextjs`, `import`, `unicorn`
- Categories: `correctness` (error), `suspicious` (warn), `pedantic` (warn), `perf` (warn), `style` (off)
- Ignored paths: `.next`, `out`, `build`, `node_modules`, `src/components/ui`, `scripts`, test dirs
- Rule config syntax: `'rule-name': 'off'` or `['warn', { option: value }]`

### oxfmt
- No semicolons, single quotes, 4-space indent, 100 char width, ES5 trailing commas
- Ignores: `build`, `coverage`, `CLAUDE.md`, `.agents`, `.claude`, `design-system`

### TypeScript
- Strict mode enabled, `verbatimModuleSyntax`, `isolatedModules`
- Target: ES2017, module resolution: bundler

### Vitest
- Config: `vite.config.ts` (test section)
- Environment: jsdom
- Test locations: `src/lib/__tests__/*.test.ts`, `src/hooks/__tests__/*.test.ts`
- Globals enabled (`describe`, `it`, `expect` without imports)
- Files with `server-only` import require mocking: `vi.mock('server-only', () => ({}))`

### Knip (dead code detection)
- Config: `knip.json`
- Extra entry points: `src/env/client.ts`, `src/env/load-system-envs.ts`
- Ignores: `src/components/ui/**` (shadcn auto-generated), `husky`, `radix-ui`
- Ignored binaries: `tsx`
- Tags: `-lintignore` (skips `@lintignore` tagged exports)

### Husky (pre-commit hook)
Runs on every commit:
1. `pnpm fmt` — oxfmt auto-format and stage changes
2. `pnpm check` — lint + typecheck + tests
3. `pnpm knip` — dead code check


### Data Ordering
- Transactions are fetched sorted by `buy_date` descending directly from Supabase (`.order('buy_date', { ascending: false })`) for display; holdings calculations sort ascending internally (FIFO requires chronological processing — on equal dates, acquisitions are processed before sells), so they are input-order independent