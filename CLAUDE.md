# Personal Wallet

Personal crypto and stock portfolio tracker. Replaces an Excel-based workflow with automatic DCA calculations, P&L tracking, and portfolio analytics.

## Stack

- **Framework**: Next.js 16.1.6, React 19.2.3, TypeScript
- **Database**: Supabase (PostgreSQL) via `@supabase/ssr`
- **Auth**: Supabase Auth (email/password) via tRPC mutations
- **API Layer**: tRPC v11 (`@trpc/server`, `@trpc/client`, `@trpc/react-query`) + TanStack React Query
- **Env Validation**: `@t3-oss/env-nextjs` with zod schemas
- **Styling**: Tailwind CSS 4 with `@theme inline` tokens (OKLch color space)
- **Components**: shadcn/ui (New York style) + Lucide icons
- **Forms**: react-hook-form + zod validation
- **URL State**: nuqs for type-safe URL search params
- **Charts**: recharts (via shadcn chart wrapper)
- **Notifications**: sonner
- **Error Handling**: Effect (`effect`) for typed, composable error handling with retry logic
- **Toolchain**: vite-plus (unified lint, fmt, test via `vp` CLI)
- **Linting**: oxlint (via vite-plus) — replaces ESLint
- **Formatting**: oxfmt (via vite-plus) — replaces Prettier
- **Testing**: Vitest (via vite-plus) + @testing-library/react + jsdom
- **Bot Protection**: Vercel BotId (`botid`)
- **React Compiler**: enabled for automatic optimization
- **Package manager**: pnpm (never npm or yarn)

## Path Alias

`@/*` maps to `./src/*`

## General Rules

- Do not start a dev server unless explicitly asked
- Use always pnpm

## Project Structure

```
src/
  app/
    page.tsx              # Auth/login page (public)
    not-found.tsx         # 404 page
    layout.tsx            # Root layout
    api/
      trpc/
        [trpc]/
          route.ts        # tRPC HTTP handler (fetchRequestHandler → appRouter)
      updateTickers/
        route.ts          # POST endpoint to update ticker prices
    portfolio/
      page.tsx            # Dashboard (protected, Server Component)
      layout.tsx          # Portfolio layout with sidebar
      prices/
        page.tsx          # Current prices / watchlist page
  components/
    ui/                   # shadcn/ui primitives (auto-generated, do not edit)
    app-sidebar.tsx       # Navigation sidebar
    refresh-app.tsx       # "Update prices" button (assets.updateTickersPrices tRPC mutation)
    hide-prices.tsx       # Toggle to hide monetary values (nuqs)
    donut-chart.tsx       # Donut chart primitive
    toggle-theme.tsx      # Light/dark theme toggle
    service-worker-register.tsx  # PWA service worker registration
  modules/                # Feature UI modules (client/server components per feature)
    auth/                 # auth-card.tsx (login form), sign-out-app.tsx
    summary/              # portfolio-summary-cards.tsx (+ item)
    transactions/         # transactions-card.tsx (table + Add button + Actions column), transaction-drawer.tsx (create/edit Sheet form), delete-transaction-dialog.tsx (AlertDialog confirm)
    holdings-table/       # holdings-card.tsx (+ header/content)
    allocation-chart/     # allocation-chart.tsx + allocation-card-with-chart.tsx
    type-allocation-chart/ # Allocation by asset type
    watchlist/            # prices-summay-cards.tsx (prices page), add-asset-app.tsx (create-asset Sheet form)
  _bff/                   # Pure backend layer (NestJS-style, server-only)
    common/               # Shared backend infrastructure
      supabase/
        supabase.client.ts  # createSbServerClient, verifyApiKey
      errors/
        shared.errors.ts    # Shared TaggedErrors (CreateSbClientError, SbQueryError) + tagged() helper
        error-codes.ts      # ErrorCode enum — random 8-char hashes (error_hash) for log correlation
      logger/
        logger.ts           # Logging utility
    modules/              # Feature modules (service / router / repository / controller / helpers / providers)
      auth/
        login.service.ts    # Private login() Effect fn + LOGIN_PUBLIC_CONTROLLER
        sign-out.service.ts # Private signOut() Effect fn + SIGN_OUT_PROTECTED_CONTROLLER
        auth.router.ts      # AUTH_ROUTER — composes the auth controllers
        auth.dto.ts         # loginSchema (zod) + LoginProps (isomorphic, also used by the login form)
        auth.errors.ts      # IsBotError, SignInWithPasswordError, SignOutError, GetUserError
        get-session.helper.ts        # getSession — request-cached (React cache) user resolution for protectedProcedure
        get-cached-user-id.helper.ts # getCachedUserId — best-effort user id for logging (never throws)
      transactions/
        get-all-transactions.service.ts  # Private getAllTransactions Effect fn + GET_ALL_TRANSACTIONS_PROTECTED_CONTROLLER
        create-transaction.service.ts    # CREATE_TRANSACTION_PROTECTED_CONTROLLER (insert + cache revalidation)
        update-transaction.service.ts    # UPDATE_TRANSACTION_PROTECTED_CONTROLLER
        delete-transaction.service.ts    # DELETE_TRANSACTION_PROTECTED_CONTROLLER
        transactions.router.ts     # TRANSACTIONS_ROUTER
        transactions.repository.ts # Supabase select (unstable_cache) + insert/update/delete
        transactions.dto.ts        # create/update/delete zod schemas (isomorphic)
        transactions.constants.ts  # Cache key + revalidate time
      assets/
        get-assets.service.ts  # Private getAssets Effect fn + GET_ASSETS_PROTECTED_CONTROLLER
        create-asset.service.ts # CREATE_ASSET_PROTECTED_CONTROLLER (auto-fetches initial price via fetchPrice)
        update-tickers-prices.service.ts # updateTickersPrices + UPDATE_TICKERS_PRICES_PROTECTED_CONTROLLER + fetch/retry machinery (exports fetchPrice)
        assets.router.ts       # ASSETS_ROUTER
        assets.controller.ts   # HTTP handler for POST /api/updateTickers (Supabase cron)
        assets.repository.ts   # Cached select, select-all, insert, update curr_price
        assets.dto.ts          # createAssetSchema (zod, isomorphic)
        assets.constants.ts    # Cache key + revalidate time
        assets.errors.ts       # GetCoinbasePriceError, GetFinancePriceError, UpdateTickersError
        providers/
          coinbase.provider.ts # Coinbase price fetcher (crypto)
          yahoo.provider.ts    # Yahoo Finance price fetcher (stocks/ETFs)
  _trpc/                  # tRPC infrastructure
    api/index.ts          # appRouter (auth, assets, transactions) + AppRouter type
    server/index.ts       # initTRPC, publicProcedure, protectedProcedure (isAuthed middleware)
    server/caller.ts      # createCaller() — server-side caller for Server Components
    client/index.ts       # trpcClient (createTRPCReact<AppRouter>)
    context/index.ts      # createContext (fetch adapter)
    context/trpc-context.provider.tsx # Client provider (QueryClient + httpBatchLink → /api/trpc)
    utils/index.ts        # runEffect — runs an Effect, maps typed errors → TRPCError codes
  lib/
    calculations.ts       # Pure calculation functions (P&L, holdings aggregation, EUR conversion) — isomorphic, used by UI
    fifo.ts               # FIFO lot engine (chronological pass, lot consumption, historical FX)
    formaters.ts          # Currency/date/percentage formatters (Intl API)
    constants.ts          # Enums, route constants, ticker sets
    constants.server.ts   # Server-only static constants (bucket path)
    utils.ts              # Client utilities (cn, etc.)
    utils.server.ts       # Middleware helpers: sbProxy
    set-csp.ts            # Page Content Security Policy + Cache-Control headers
  types/
    Transaction.ts        # Transaction, Ticker, TickerData types
    Holding.ts            # HoldingSummary type
    Themes.ts             # Theme enum
  env/
    server.ts             # Server env validation (NEXT_SUPABASE_*)
    client.ts             # Client env validation (NEXT_PUBLIC_*)
    load-system-envs.ts   # Env loading
  styles/
    globals.css           # Global CSS with @theme inline tokens
    theme-typographic.css # Typography tokens
  proxy.ts                # Next.js middleware (Supabase auth proxy + page CSP; matcher excludes static assets)
instrumentation-client.ts # BotId client-side initialization
scripts/
  convert-to-webp.ts      # Converts all non-WebP images in public/assets to WebP
```

## Supabase Integration

### Tables
- `data` — ticker metadata and current prices (`TickerData`)
- `transactions` — buy/sell/reward/fee transactions (`Transaction`)

### Auth Flow
1. Login page (`/`) with email/password form
2. The form calls `trpcClient.auth.login.useMutation` → `LOGIN_PUBLIC_CONTROLLER` (`publicProcedure.input(loginSchema)`) → private `login()` Effect fn in `login.service.ts`, which runs `checkBotId()` and `supabase.auth.signInWithPassword` (zod validation happens at the tRPC `.input()` boundary)
3. `proxy.ts` middleware runs `sbProxy` on every matched request (static assets excluded via `matcher`)
4. `sbProxy` calls `supabase.auth.getClaims()` to refresh sessions
5. Unauthenticated users accessing `/portfolio` are redirected to `/`
6. Sign out via `trpcClient.auth.signOut.useMutation` → `SIGN_OUT_PROTECTED_CONTROLLER`, which revalidates the home layout

### Server Client
- `createSbServerClient(useSecretKey?, hooks?)` in `_bff/common/supabase/supabase.client.ts` creates a per-request Supabase client using `@supabase/ssr` with cookie-based session management
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

### tRPC API Layer
- **appRouter** (`src/_trpc/api/index.ts`): `auth` (login, signOut), `assets` (getAll, create, updateTickersPrices), `transactions` (getAll, create, update, delete); served by `app/api/trpc/[trpc]/route.ts` (fetch adapter)
- **Mutations + caching**: create/update/delete mutations end with `revalidateTag(...)` + `revalidatePath(PRIVATE_ROUTE_PATH, 'layout')`; the client calls `router.refresh()` on success — without the tag revalidation the `unstable_cache` data would stay stale. Transactions cache entries carry two tags: the global `getAllTransactions` (invalidated by the ticker-prices flows, which affect every user) and a per-user `getAllTransactions:<userId>` (built via `getAllTransactionsCacheTag`, invalidated by that user's create/update/delete mutations). Assets keep a single global `getAssets` tag because the `data` table is shared across users
- **Transactions CRUD**: inserts/updates/deletes are scoped by `user_id = ctx.user.id` (explicit column filter on top of RLS)
- **Procedure pattern**: each `*.service.ts` keeps the Effect business-logic function **private** and exports the tRPC procedure named `<ACTION>_<PUBLIC|PROTECTED>_CONTROLLER`; the module's `*.router.ts` only composes controllers into `<FEATURE>_ROUTER`
- **protectedProcedure** (`src/_trpc/server/index.ts`): `isAuthed` middleware resolves the session once per request (`getSession`, React `cache`) and injects a non-null `ctx.user`; infra failure → 500, missing user → 401. Protected services receive `ctx.user.id` and never resolve the session themselves
- **runEffect** (`src/_trpc/utils/index.ts`): runs an Effect at the procedure boundary, maps typed errors to `TRPCError` codes via `Match.exhaustive`, logs with the request user id, and returns `error_hash` as the TRPCError message
- **error_hash**: typed errors carry an `ErrorCode` (random 8-char hash, `_bff/common/errors/error-codes.ts`) so client-visible messages correlate with server logs without leaking details
- **Consumption**: Server Components use `createCaller()` (`src/_trpc/server/caller.ts`); Client Components use `trpcClient.*.useMutation`/`useQuery` (provider in `layout.tsx`, `httpBatchLink` → `/api/trpc`)
- `POST /api/updateTickers` stays a plain HTTP endpoint for the Supabase cron (`x-api-key` auth, which does not fit `protectedProcedure`); the FE "Update prices" button uses the `assets.updateTickersPrices` mutation instead

### Data Fetching
- All backend files use the `server-only` import guard
- **Module layering (NestJS-style)**: `repository` (Supabase access + `unstable_cache`) → `service` (Effect business logic + exported tRPC controller) → `router` (tRPC composition) / `controller` (plain HTTP boundary) → `helpers` / `providers` (external APIs). No `*.module.ts` files (would be barrel exports) — import directly from the specific file
- `unstable_cache` from Next.js with 4h revalidation and tagged cache keys (in the repository layer)
- Effect for error handling — services use `Effect.fn`/`Effect.gen` + `Effect.tryPromise`; tRPC services surface typed errors to `runEffect`, fire-and-forget flows (`updateTickersPrices`) recover with `Effect.catchAll`; TaggedErrors live in `*.errors.ts` (shared ones + `tagged()` helper in `_bff/common/errors/shared.errors.ts`)
- Data flows as props from Server Components (no client-side state management)
- Pure calculation logic (`lib/calculations.ts`) stays in `lib/`, not `_bff/` — it is isomorphic and consumed by UI components, so it cannot be `server-only`

### Environment Variables
```
NEXT_SUPABASE_URL               # Supabase project URL
NEXT_SUPABASE_PUBLISHABLE_KEY   # Supabase publishable key
NEXT_SUPABASE_SERVICE_ROLE_KEY  # Supabase service role key (bypasses RLS)
NEXT_UPDATE_TICKERS_SECRET_KEY  # API key for /api/updateTickers endpoint
NEXT_PUBLIC_VERCEL_URL          # Vercel deployment URL (auto-set)
```

## Supported Assets

Assets are dynamic — created in-app via the Watchlist "Add asset" form (`assets.create` mutation); the `Ticker` enum in `types/Transaction.ts` only covers the long-standing ones. Currently held:

- **Crypto**: ETH, SOL, BTC
- **ETF**: VUAA
- **Stocks**: ATCH

Transaction types: `BUY`, `SELL`, `REWARD`, `FEE`

## Conventions

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

## Future Plans

- (empty — transaction CRUD UI and in-app asset creation shipped July 2026)
