# Auditoria de Performance: Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduzir a latência de cada página e mutação do Personal Wallet e corrigir os problemas de dados encontrados na auditoria (queries Supabase, cache Next.js, serviços Effect e bundle do cliente).

**Architecture:** As tarefas mexem em camadas isoladas: helpers partilhados em `src/_bff/common/`, repositórios e serviços de cada módulo, providers externos e alguns componentes cliente. Cada tarefa é independente e entregável sozinha, por ordem de impacto. As mudanças de arquitetura maiores (Cache Components, Server Actions) ficam no backlog como planos próprios.

**Tech Stack:** Next.js 16.2 (App Router, `unstable_cache`, proxy), React 19 + React Compiler, Effect v4, tRPC 11, Supabase (`@supabase/ssr` 0.12, PostgREST), Vitest via vite-plus.

**Spec:** Este documento. A secção "Parte A: Resultados da auditoria" é a spec; a "Parte B" são as tarefas.

## Global Constraints

- Todo o código em inglês (nomes, comentários, strings usadas como identificadores). Texto de UI e docs podem ser em português.
- Nunca usar travessões longos (em-dash) em código, comentários, docs ou commits.
- Imports sempre com o alias `@/`, nunca relativos, sem barrels.
- Serviços com `Effect.fn('name')`, falhas com `return yield* new TaggedError(...)`, nunca `throw` dentro de `Effect.gen`.
- Queries Supabase: verificar sempre o catch do `Effect.tryPromise` E o campo `error` devolvido.
- Repositórios nunca importados por outro módulo; helpers partilhados vivem em `src/_bff/common/`.
- Testes em `__tests__/` ao lado do código; ficheiros que importam `server-only` fazem `vi.mock('server-only', () => ({}))`.
- Formatação: sem ponto e vírgula, aspas simples, 4 espaços, 100 colunas.
- Máquina com 8 GB de RAM: durante o trabalho correr só os testes afetados (`pnpm exec vp test run <pasta>`); `pnpm check` e `pnpm knip` só no fim de cada tarefa, nunca em paralelo.
- Quando uma tarefa muda uma convenção descrita em `CLAUDE.md`, atualiza `CLAUDE.md` no mesmo commit.

## Review Focus

- Utilizador com mais de 1000 transações: a lista, os holdings e o FIFO têm de incluir todas, sem truncar em silêncio (Task 1).
- Sessão expirada ou JWT inválido depois da troca para `getClaims()`: tem de continuar a dar 401 e sign-out forçado, nunca 500 (Task 2).
- Criar uma transação e ver a lista logo a seguir ao `router.refresh()`: a nova linha tem de aparecer à primeira, sem dados stale (Task 3).
- Uma fonte de notícias que nunca responde: a página de notícias tem de abrir na mesma, só com menos itens (Task 5).
- Duas transações com a mesma `buy_date` na fronteira de uma página de 1000: nenhuma pode aparecer duplicada nem faltar (Task 1, ordenação estável por `id`).

---

## Parte A: Resultados da auditoria

Âmbito: todo o `src/` (540 ficheiros), SQL em `src/_bff/common/db/sql/`, `next.config.ts`, `proxy.ts`. Confirmei no código instalado (`node_modules/next` 16.2.11, `~/.effect`, `@supabase/auth-js` 2.110) os comportamentos de framework citados abaixo. Não tive acesso ao Supabase (Performance Advisor, `EXPLAIN`, esquema real das tabelas `transactions` e `data`), por isso tudo o que depende do esquema real aparece como "a verificar".

### O que já está bem

- Páginas fazem os fetches em paralelo com `Promise.all` e `getPortfolioData` está em `React.cache()`, por isso layout e página partilham uma só leitura.
- RLS das tabelas versionadas usa `(SELECT auth.uid())` (sem o problema de initplan por linha). `logs` tem índice `(project, created_at DESC)`; `portfolio_snapshots` tem `UNIQUE (user_id, snapshot_date)`, que serve a view mensal.
- Preços: um pedido por provider (Coinbase agrupado por moeda de cotação, Yahoo num só `quote`), retries por provider, falhas isoladas.
- Snapshots: leitura via view mensal (12 linhas/ano), paging explícito no rebuild, upserts em chunks de 500.
- Proxy usa `getClaims()` (verificação local), assets estáticos fora do matcher, React Compiler ativo, `optimizePackageImports` configurado, imagens em WebP.

### Resultados por prioridade

| ID  | Área             | Problema                                                                                                                                                                                                                                                                                                                                                                         | Impacto                        | Esforço | Tarefa |
| --- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------- | ------ |
| S1  | Supabase         | `getAllTransactionsByUserIdFn` não faz paging: o PostgREST corta em 1000 linhas e o resto desaparece em silêncio (holdings, FIFO, G/L e gráficos errados)                                                                                                                                                                                                                        | Crítico (correção)             | Baixo   | 1      |
| S2  | Supabase / Auth  | O middleware tRPC chama `auth.getUser()` (ida e volta ao servidor Auth) em cada render de página, em série antes de qualquer cache hit. O proxy já verificou o JWT com `getClaims()`                                                                                                                                                                                             | Alto (~50 a 200 ms por página) | Baixo   | 2      |
| N1  | Next cache       | Todas as mutações fazem `revalidatePath('/portfolio', 'layout')`. O `unstable_cache` grava as tags implícitas da rota (`softTags` em `unstable-cache.js`), por isso isto expira **todas** as entradas lidas em `/portfolio/*` de **todos** os utilizadores, incluindo notícias (1 h) e eventos (12 h), que voltam a chamar Yahoo/Google. As tags por utilizador ficam sem efeito | Alto                           | Médio   | 3      |
| N2  | Next cache       | `revalidateTag(tag, 'max')` é stale-while-revalidate no Next 16 (`revalidate.js`: só `expire: 0` ou sem perfil expira de imediato). Hoje só funciona porque o N1 apaga tudo; ao remover o `revalidatePath`, as mutações passam a mostrar dados antigos sem `{ expire: 0 }`                                                                                                       | Alto (ligado ao N1)            | Baixo   | 3      |
| N3  | Next cache       | Os fluxos de preços revalidam `getAllTransactions` de todos os utilizadores, mas a tabela `transactions` não muda com preços                                                                                                                                                                                                                                                     | Médio                          | Baixo   | 3      |
| E1  | Effect           | Chamadas externas no caminho do utilizador (notícias, eventos) não têm timeout e usam o retry de cron (2 s, 4 s). Num cache miss a página de notícias pode ficar presa ~10 s ou mais. `Effect.tryPromise` não passa o `AbortSignal` ao `fetch`, por isso uma interrupção não cancela o pedido HTTP                                                                               | Médio a alto                   | Baixo   | 5      |
| S4  | Supabase / cache | `getAssetsFn` usa `userId` na chave do cache, mas a tabela `data` é global: uma cópia igual por utilizador e um miss por utilizador após cada atualização de preços                                                                                                                                                                                                              | Médio                          | Baixo   | 4      |
| N4  | Next / CDN       | `GET /api/asset-logo` responde com `public, max-age=31536000` mas sem `s-maxage` / `CDN-Cache-Control`: o browser guarda, a CDN da Vercel não, e cada browser novo invoca a função por logo                                                                                                                                                                                      | Médio                          | Baixo   | 6      |
| B1  | Bundle           | Drawers com formulários (`react-hook-form` + zod) e a folha de exportação do header carregam no bundle inicial de cada página, embora só abram por clique. `PortfolioExport` está no layout, por isso entra em todas as rotas                                                                                                                                                    | Médio                          | Baixo   | 7      |
| S5  | Supabase         | O esquema de `transactions` e `data` não está versionado: não dá para confirmar o índice `(user_id, buy_date DESC)` nem as políticas RLS dessas tabelas                                                                                                                                                                                                                          | Médio (a verificar)            | Baixo   | 8      |
| S6  | Supabase         | A atualização de preços faz um `UPDATE` HTTP por ticker. Uma função RPC faz tudo num só pedido e numa só transação                                                                                                                                                                                                                                                               | Baixo a médio                  | Médio   | 9      |

### Backlog (planos próprios, fora deste plano)

Cada item muda a arquitetura ou toca em dezenas de ficheiros, por isso merece brainstorming e plano próprios.

1. **Cache Components (Next 16).** `unstable_cache` foi substituído por `'use cache'` + `cacheTag` + `cacheLife`. Com `cacheComponents: true`, o shell (sidebar, header, skeletons) fica pré-renderizado e só os dados fazem streaming. É o maior ganho de TTFB a médio prazo e resolve também o ponto 3.
2. **Server Actions para mutações.** No cliente o tRPC só serve mutações (zero `useQuery`), mas obriga a carregar `@trpc/react-query` + TanStack Query e a fazer duas idas ao servidor (POST da mutação e depois `router.refresh()`). Uma Server Action com `updateTag()` + `refresh()` faz tudo numa resposta e garante read-your-writes. Muda a convenção de controllers do `CLAUDE.md`, por isso é decisão tua.
3. **Streaming do layout e das notícias.** `/portfolio/layout.tsx` espera por `getPortfolioData()` antes de mostrar o shell, e o `loading.tsx` está dentro do layout, por isso no primeiro carregamento nem o skeleton aparece antes dos dados. Nas notícias, feed e calendário esperam um pelo outro. Solução: passar promises a componentes cliente e ler com `use()` dentro de `<Suspense>`. Depois das Tasks 2 e 5 o ganho é menor.
4. **`hide_prices` só no cliente.** O botão do olho muda um search param com `shallow: false`, o que força um render completo no servidor (auth, cache, FIFO, serialização) só para esconder números. Fica instantâneo com contexto cliente + cookie, mas o `hidePrices` atravessa dezenas de componentes servidor.
5. **Batch de logs.** `Logger` faz um `INSERT` por log em `after()`; um pedido com muitos avisos (notícias com fontes em falha) faz N inserts. Juntar num só insert por pedido.
6. **Pesquisa nos logs.** `ilike '%x%'` em `message`/`prefix` sem índice. Com retenção de 30 dias chega; se crescer, índice GIN `pg_trgm`.
7. **Snapshots horários.** `recordPortfolioSnapshots` lê `select('*')` de todas as transações de todos os utilizadores a cada hora. Selecionar só as colunas que `computeSnapshotTotals` usa.
8. **Sparklines.** `KpiSparkline` usa Recharts para três linhas pequenas; um `<svg>` simples é mais leve (o dashboard carrega Recharts na mesma por causa do gráfico de performance, por isso o ganho é só de render).

### Fora de âmbito, mas encontrado

- `purge_old_logs()` apaga logs com mais de 30 dias **de todos os projetos**, mas a tabela `logs` é partilhada com outra app. Falta `AND project = 'wallet'` (ou é intencional e deve ficar documentado).

---

## Parte B: Tarefas

### Task 1: Paging das transações do utilizador

**Files:**

- Create: `src/_bff/common/db/select-all-pages.helper.ts`
- Modify: `src/_bff/modules/transactions/transactions.repository.ts` (função `getAllTransactionsByUserIdFn`)
- Modify: `src/_bff/modules/snapshots/snapshots.repository.ts` (apagar o `selectAllPages` privado e importar o partilhado)
- Modify: `src/_bff/modules/snapshots/snapshots.constants.ts` (apagar `SELECT_PAGE_SIZE`)
- Test: `src/_bff/common/db/__tests__/select-all-pages.helper.test.ts`

**Interfaces:**

- Produces: `export const SELECT_PAGE_SIZE = 1000` e `export async function selectAllPages<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]>`. Lança o `error` da página, por isso quem chama embrulha num só `Effect.tryPromise`.

- [ ] **Step 1: Write the failing test**

```ts
vi.mock('server-only', () => ({}))

describe('selectAllPages', () => {
    it('reads a single page when it comes back short', async () => {
        const fetchPage = vi.fn().mockResolvedValue({ data: [1, 2, 3], error: null })
        expect(await selectAllPages(fetchPage)).toEqual([1, 2, 3])
        expect(fetchPage).toHaveBeenCalledTimes(1)
        expect(fetchPage).toHaveBeenCalledWith(0, 999)
    })

    it('keeps reading while pages come back full', async () => {
        const full = Array.from({ length: SELECT_PAGE_SIZE }, (_, index) => index)
        const fetchPage = vi
            .fn()
            .mockResolvedValueOnce({ data: full, error: null })
            .mockResolvedValueOnce({ data: full, error: null })
            .mockResolvedValueOnce({ data: [7, 8, 9], error: null })
        const rows = await selectAllPages(fetchPage)
        expect(rows).toHaveLength(2003)
        expect(fetchPage.mock.calls).toEqual([
            [0, 999],
            [1000, 1999],
            [2000, 2999],
        ])
    })

    it('throws the query error', async () => {
        const error = new Error('boom')
        await expect(selectAllPages(vi.fn().mockResolvedValue({ data: null, error }))).rejects.toBe(
            error
        )
    })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vp test run src/_bff/common/db/__tests__/select-all-pages.helper.test.ts`
Expected: FAIL, módulo `select-all-pages.helper` não existe.

- [ ] **Step 3: Move `selectAllPages` and `SELECT_PAGE_SIZE` to `src/_bff/common/db/select-all-pages.helper.ts`**

Mesmo corpo do helper atual em `snapshots.repository.ts`, com JSDoc (`@param fetchPage`). O ficheiro começa com `import 'server-only'`. Atualizar `snapshots.repository.ts` para importar daqui.

- [ ] **Step 4: Use it in `getAllTransactionsByUserIdFn`**

Dentro do `unstable_cache`, devolver `selectAllPages<Transaction>((from, to) => supabaseClient.from(DBTables.TRANSACTIONS).select('*').eq('user_id', userId).order('buy_date', { ascending: false }).order('id', { ascending: true }).range(from, to).overrideTypes<Transaction[]>())`. O segundo `order('id')` torna a ordem estável entre páginas (Review Focus: datas iguais na fronteira). O `SAFETY` cast deixa de ser preciso.

- [ ] **Step 5: Run tests and checks**

Run: `pnpm exec vp test run src/_bff/common/db src/lib/portfolio`
Expected: PASS. Depois `pnpm typecheck` e `pnpm knip` sem erros (o `SELECT_PAGE_SIZE` antigo não pode ficar órfão).

- [ ] **Step 6: Commit**

```bash
git add src/_bff/common/db src/_bff/modules/transactions/transactions.repository.ts src/_bff/modules/snapshots
git commit -m "fix: page user transactions past the 1000-row PostgREST cap"
```

---

### Task 2: Sessão com `getClaims()` em vez de `getUser()`

**Pré-requisito manual:** confirmar no Supabase (Project Settings, JWT Keys) que o projeto usa chaves assimétricas (ECC/RSA). Com a chave legada HS256, `getClaims()` faz fallback para `getUser()` e não há ganho (mas também não parte nada). O comentário em `get-cached-user-id.helper.ts` diz que já são assimétricas.

**Trade-off a aceitar:** uma sessão revogada no servidor (logout noutro dispositivo) continua válida até o access token expirar (1 h por omissão). O RLS do PostgREST valida o mesmo JWT, por isso não há acesso extra. Para uma app pessoal é aceitável.

**Files:**

- Modify: `src/_bff/modules/auth/helpers/get-session.helper.ts`
- Modify: `src/_bff/modules/auth/get-current-user/get-current-user.service.ts` (parâmetro passa a `SessionUser`)
- Modify: `src/_bff/trpc/server.ts` (só o comentário do middleware, que fala em `getUser()`)
- Modify: `CLAUDE.md` (secção "Invalid session": `getSession` usa `getClaims()`)
- Test: `src/_bff/modules/auth/helpers/__tests__/get-session.helper.test.ts`

**Interfaces:**

- Produces: `export type SessionUser = { id: string; user_metadata: UserMetadata }` (tipo `UserMetadata` de `@supabase/supabase-js`); `export function toSessionUser(claims: JwtPayload): SessionUser`; `getSession()` passa a devolver `SessionUser | null`, por isso `ctx.user` nos controllers é `SessionUser`. Os consumidores atuais só usam `.id` e `user_metadata` (`toCurrentUser` já recebe `Pick<User, 'user_metadata'>`).

- [ ] **Step 1: Write the failing tests**

```ts
it('treats an invalid JWT as an invalid session', () => {
    expect(isInvalidSessionError(new AuthInvalidJwtError('bad signature'))).toBe(true)
})

describe('toSessionUser', () => {
    it('maps the sub claim to the user id', () => {
        const user = toSessionUser({
            sub: 'user-1',
            user_metadata: { full_name: 'Ana' },
        } as JwtPayload)
        expect(user).toEqual({ id: 'user-1', user_metadata: { full_name: 'Ana' } })
    })

    it('defaults missing metadata to an empty object', () => {
        expect(toSessionUser({ sub: 'user-1' } as JwtPayload).user_metadata).toEqual({})
    })
})
```

`AuthInvalidJwtError` e `JwtPayload` importam de `@supabase/supabase-js` (re-exporta `@supabase/auth-js`).

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vp test run src/_bff/modules/auth`
Expected: FAIL, `toSessionUser` não existe e `AuthInvalidJwtError` não conta como sessão inválida.

- [ ] **Step 3: Implement**

- `isInvalidSessionError`: devolve também `true` para `error instanceof AuthInvalidJwtError`.
- `toSessionUser`: `{ id: claims.sub, user_metadata: claims.user_metadata ?? {} }`.
- `resolveUser`: troca `bd.auth.getUser()` por `bd.auth.getClaims()`. Sem erro e com `data?.claims`, devolve `toSessionUser(data.claims)`; sem claims, `user: null`; erro de sessão inválida, `user: null`; outro erro, `kind: 'get-user'`. O `SessionResult` passa a usar `SessionUser`.
- Atualizar o JSDoc do `resolveUser` (deixa de haver ida e volta à rede com chaves assimétricas).

- [ ] **Step 4: Run tests and checks**

Run: `pnpm exec vp test run src/_bff/modules/auth src/_bff/trpc`
Expected: PASS. Depois `pnpm typecheck` (o `bank-callback.service.ts` usa só `user.id`, deve compilar sem mudanças).

- [ ] **Step 5: Manual verification**

Com a app a correr (pedir ao utilizador para arrancar o dev server, regra do projeto): abrir `/portfolio`, confirmar que carrega; apagar os cookies `sb-*` e navegar, confirmar o redirect para `/`.

- [ ] **Step 6: Commit**

```bash
git add src/_bff/modules/auth src/_bff/trpc/server.ts CLAUDE.md
git commit -m "perf: verify the session locally with getClaims in the tRPC middleware"
```

---

### Task 3: Invalidação de cache precisa (sem `revalidatePath` global)

**Files:**

- Create: `src/_bff/common/cache/expire-cache-tags.helper.ts`
- Test: `src/_bff/common/cache/__tests__/expire-cache-tags.helper.test.ts`
- Test: `src/_bff/modules/transactions/create-transaction/__tests__/create-transaction.service.test.ts`
- Modify (mutações do utilizador: `expireCacheTags(...)` no lugar de `revalidateTag(tag, 'max')`, e apagar `revalidatePath(PRIVATE_ROUTE_PATH, 'layout')`):
    - `src/_bff/modules/transactions/{create,update,delete}-transaction/*.service.ts`
    - `src/_bff/modules/payslips/{create,update,delete}-payslip/*.service.ts`
    - `src/_bff/modules/settings/update-settings/update-settings.service.ts`
    - `src/_bff/modules/settings/helpers/write-user-expenses.helper.ts`
    - `src/_bff/modules/assets/{create,update,delete}-asset/*.service.ts`
    - `src/_bff/modules/assets/update-tickers-prices/update-tickers-prices.service.ts` (`updateTickers`, acionado pelo botão)
    - `src/_bff/modules/snapshots/rebuild-portfolio-snapshots/rebuild-portfolio-snapshots.service.ts`
    - `src/_bff/modules/bank/bank-callback/bank-callback.service.ts`
- Modify (fluxos de cron: mantêm `revalidateTag(tag, 'max')`, apagar só o `revalidatePath`):
    - `src/_bff/modules/assets/external-update-tickers/external-update-tickers.service.ts`
    - `src/_bff/modules/bank/external-sync-bank-balances/external-sync-bank-balances.service.ts`
- Não mexer: `cache/revalidate-cache` (ferramenta de dev, já usa `{ expire: 0 }`) e `auth/force-sign-out`.
- Modify: `CLAUDE.md` (secção "Mutations and caching")

**Interfaces:**

- Produces: `export function expireCacheTags(...tags: string[]): void`, que chama `revalidateTag(tag, { expire: 0 })` para cada tag. Expiração imediata, por isso o `router.refresh()` do cliente já recebe dados novos (read-your-writes em route handlers, onde `updateTag` não está disponível).

Porque funciona sem `revalidatePath`: as páginas de `/portfolio` são dinâmicas (`force-dynamic`, cookies), logo não há Full Route Cache para limpar; o cache do router no cliente é atualizado pelo `router.refresh()` e o callback do banco faz redirect (render novo).

- [ ] **Step 1: Write the failing tests**

```ts
// expire-cache-tags.helper.test.ts
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }))

it('expires every tag immediately', () => {
    expireCacheTags('a', 'b')
    expect(revalidateTag).toHaveBeenCalledWith('a', { expire: 0 })
    expect(revalidateTag).toHaveBeenCalledWith('b', { expire: 0 })
    expect(revalidatePath).not.toHaveBeenCalled()
})
```

```ts
// create-transaction.service.test.ts
vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }))
vi.mock('@/_bff/common/db/db.utils', () => ({
    createDBServerClient: vi.fn().mockResolvedValue({}),
}))
vi.mock('@/_bff/modules/transactions/transactions.repository', () => ({
    insertTransaction: vi.fn().mockResolvedValue({ error: null }),
}))

it('expires only the owner transactions tag', async () => {
    await Effect.runPromise(createTransaction('user-1', input))
    expect(revalidateTag).toHaveBeenCalledWith('getAllTransactions:user-1', { expire: 0 })
    expect(revalidatePath).not.toHaveBeenCalled()
})

it('does not touch the cache when the insert fails', async () => {
    vi.mocked(insertTransaction).mockResolvedValueOnce({ error: { message: 'x' } } as never)
    const exit = await Effect.runPromiseExit(createTransaction('user-1', input))
    expect(Exit.isFailure(exit)).toBe(true)
    expect(revalidateTag).not.toHaveBeenCalled()
})
```

`input` é um `CreateTransactionProps` válido de `transactions.dto.ts`. `vi.clearAllMocks()` em `beforeEach`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vp test run src/_bff/common/cache src/_bff/modules/transactions`
Expected: FAIL (helper não existe; o serviço ainda chama `revalidatePath` e usa `'max'`).

- [ ] **Step 3: Implement `expireCacheTags` and apply it to every user-mutation file listed above**

Cada serviço de mutação acaba com `expireCacheTags(<tag do dono>)`. `updateTickers` acaba com `expireCacheTags(GET_ASSETS_CACHE_KEY)`.

- [ ] **Step 4: Stop revalidating transactions on price updates (N3)**

Em `updateTickers` e `externalUpdateTickers`, apagar a revalidação de `GET_ALL_TRANSACTIONS_CACHE_KEY`: o repositório lê só a tabela `transactions`, que os preços não mudam (os holdings juntam preços a partir de `assets.getAll`). Se o import de `GET_ALL_TRANSACTIONS_CACHE_KEY` deixar de ser usado em `assets`, apagá-lo.

- [ ] **Step 5: Update `CLAUDE.md`**

Na secção "Mutations and caching": mutações do utilizador acabam com `expireCacheTags(<tag>)` (expiração imediata) e sem `revalidatePath`, porque o `revalidatePath('/portfolio', 'layout')` expira, via tags implícitas, as entradas de todos os utilizadores; os crons usam `revalidateTag(tag, 'max')`. Atualizar a frase que diz que o tag global `getAllTransactions` é invalidado pelos fluxos de preços.

- [ ] **Step 6: Run tests and checks**

Run: `pnpm exec vp test run src/_bff`
Expected: PASS. Depois `pnpm typecheck` e `pnpm knip` (imports de `revalidatePath` e `PRIVATE_ROUTE_PATH` que ficarem sem uso têm de sair).

- [ ] **Step 7: Manual verification**

Com a app a correr: criar uma transação, confirmar que aparece na lista à primeira; abrir `/portfolio/news` antes e depois de criar uma transação e confirmar nos logs do servidor que não há pedidos novos a Yahoo/Google.

- [ ] **Step 8: Commit**

```bash
git add src/_bff CLAUDE.md
git commit -m "perf: expire only the mutated cache tags instead of the whole portfolio layout"
```

---

### Task 4: Uma só entrada de cache para os assets

**Files:**

- Modify: `src/_bff/modules/assets/assets.repository.ts` (`getAssetsFn`)
- Modify: `src/_bff/modules/assets/get-assets/get-assets.service.ts`
- Modify: `src/_bff/modules/assets/get-assets/get-assets.controller.ts` (se passar o `userId` só para o serviço)

**Interfaces:**

- Produces: `getAssetsFn(supabaseClient: SbClient)` com chave `[GET_ASSETS_CACHE_KEY]` e `getAssets()` sem argumentos. A tabela `data` é partilhada e legível por qualquer utilizador autenticado, por isso o resultado não depende de quem pede.

- [ ] **Step 1: Remove `userId` from the cache key, the repository signature and the service**

O controller continua `protectedProcedure` (a rota exige sessão), só deixa de passar `ctx.user.id`. Apagar o `@param userId` do JSDoc.

- [ ] **Step 2: Run checks**

Run: `pnpm typecheck && pnpm exec vp test run src/lib/portfolio`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/_bff/modules/assets
git commit -m "perf: share one assets cache entry across users"
```

---

### Task 5: Timeouts e cancelamento nas chamadas externas

**Files:**

- Modify: `src/_bff/modules/news/providers/google-news.provider.ts` (`getGoogleNews`)
- Modify: `src/_bff/modules/assets/providers/coinbase.provider.ts` (`getQuotePrices`, `getCandlesWindow`)
- Modify: `src/_bff/modules/bank/providers/enable-banking.provider.ts` (todos os `fetch`)
- Modify: `src/_bff/modules/news/news.constants.ts`
- Modify: `src/_bff/modules/news/get-portfolio-news/get-portfolio-news.service.ts` (`fetchAssetNews`)
- Modify: `src/_bff/modules/news/get-portfolio-events/get-portfolio-events.service.ts` (`getCachedAssetEvents`)
- Modify: `CLAUDE.md` (secção "Retries": exceção para leituras interativas)
- Test: `src/_bff/modules/news/providers/__tests__/google-news.provider.test.ts`
- Test: `src/_bff/modules/assets/providers/__tests__/coinbase.provider.test.ts`

**Interfaces:**

- Produces: em `news.constants.ts`, `NEWS_SOURCE_TIMEOUT = '5 seconds'` e `NEWS_RETRY_POLICY = Schedule.max([Schedule.exponential('500 millis').pipe(Schedule.jittered), Schedule.recurs(1)])`. Pior caso por fonte: 5 s + 0,5 s + 5 s ≈ 11 s em vez de ilimitado, e normalmente muito menos. O retry de 2 s fica para os crons (preços, banco, snapshots).
- Os providers passam a usar a forma `Effect.tryPromise({ try: (signal) => fetch(url, { method: 'GET', signal }), catch })`, por isso `Effect.timeout` ou a interrupção do fiber cancelam o pedido HTTP. O Yahoo (`yahoo-finance2`) não aceita signal: o timeout corta o fiber, o pedido termina em background.

- [ ] **Step 1: Write the failing tests**

```ts
// google-news.provider.test.ts
it('passes an abort signal to fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(RSS))
    await Effect.runPromise(getGoogleNews(asset, 'AtlasClear'))
    expect(fetchSpy.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal)
})

it('aborts the request when the effect times out', async () => {
    let signal: AbortSignal | undefined
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
        signal = init?.signal ?? undefined
        return new Promise(() => {})
    })
    const result = await Effect.runPromise(
        getGoogleNews(asset, 'AtlasClear').pipe(Effect.timeout('10 millis'), Effect.result)
    )
    expect(Result.isFailure(result)).toBe(true)
    expect(signal?.aborted).toBe(true)
})
```

O mesmo par de testes para `getCoinbasePrices` em `coinbase.provider.test.ts`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vp test run src/_bff/modules/news/providers src/_bff/modules/assets/providers`
Expected: FAIL, o `fetch` é chamado sem `signal`.

- [ ] **Step 3: Pass the signal in every provider `fetch` listed above**

- [ ] **Step 4: Add the timeout to the news and events pipelines**

Em `fetchAssetNews`: `source.pipe(Effect.timeout(NEWS_SOURCE_TIMEOUT), Effect.retry(NEWS_RETRY_POLICY), Effect.result)`. O tipo do array `sources` passa a incluir `Cause.TimeoutException`; o log de falhas continua a usar `failure._tag` (`'TimeoutException'`). Em `getCachedAssetEvents`, a mesma ordem antes do `Effect.retry`. Uma fonte lenta conta como falha, por isso continua a não ser guardada em cache como "sem notícias".

- [ ] **Step 5: Update `CLAUDE.md`**

Na regra "Retries": leituras no caminho de um pedido do utilizador (notícias, eventos) usam `Effect.timeout` + `NEWS_RETRY_POLICY` (500 ms, 1 retry); os fluxos de cron mantêm o retry de 2 s. Todos os `fetch` dentro de `Effect.tryPromise` passam o `signal`.

- [ ] **Step 6: Run tests and checks**

Run: `pnpm exec vp test run src/_bff/modules/news src/_bff/modules/assets src/_bff/modules/bank`
Expected: PASS. Depois `pnpm typecheck`.

- [ ] **Step 7: Commit**

```bash
git add src/_bff/modules CLAUDE.md
git commit -m "perf: time out and cancel external calls on user-facing reads"
```

---

### Task 6: Logos servidos pela CDN

**Files:**

- Modify: `src/_bff/modules/assets/get-asset-logo/get-asset-logo.service.ts`
- Test: `src/_bff/modules/assets/get-asset-logo/__tests__/get-asset-logo.service.test.ts`

**Interfaces:**

- Produces: a resposta 200 traz `Cache-Control: public, max-age=31536000, immutable` (inalterado) e `CDN-Cache-Control: public, max-age=31536000, immutable`. A resposta 404 traz `Cache-Control: no-store`, para um logo em falha não ficar guardado.

Os caminhos dos logos mudam a cada upload (`upload-asset-image.helper.ts`), por isso guardar um ano na CDN é seguro. Confirmar no fim nos headers de produção (`x-vercel-cache: HIT` ao segundo pedido).

- [ ] **Step 1: Write the failing test**

```ts
vi.mock('server-only', () => ({}))

it('lets the CDN cache a found logo', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/webp' } })
    )
    const response = await Effect.runPromise(getAssetLogo('/logos/btc.webp'))
    expect(response.headers.get('CDN-Cache-Control')).toBe('public, max-age=31536000, immutable')
})

it('never caches a missing logo', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 404 }))
    const response = await Effect.runPromise(getAssetLogo('/logos/btc.webp'))
    expect(response.status).toBe(404)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
})
```

Usar um caminho que passe no `assetLogoPathSchema` (ver `assets.dto.ts`) e mockar `@/env/server` se `buildBucketAssetUrl` o exigir.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vp test run src/_bff/modules/assets/get-asset-logo`
Expected: FAIL, header em falta.

- [ ] **Step 3: Add the two headers**

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vp test run src/_bff/modules/assets/get-asset-logo`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/_bff/modules/assets/get-asset-logo
git commit -m "perf: let the CDN cache asset logos"
```

---

### Task 7: Lazy loading de drawers e da folha de exportação

**Files:**

- Modify: `src/modules/transactions/transactions-card/index.tsx` (`TransactionDrawer`)
- Modify: `src/modules/payslips/payslips-card.tsx` (`PayslipDrawer`)
- Modify: `src/modules/expenses/expenses-card.tsx` (`AddExpenseDrawer`)
- Modify: `src/modules/assets/asset-actions.tsx` e `src/modules/assets/add-asset-app.tsx` (`AssetDrawer`)
- Modify: `src/modules/portfolio-export/portfolio-export.tsx` (`PortfolioExportSheet`)
- Create: um `<component>.constants.ts` irmão de cada ficheiro acima que ainda não o tenha, a exportar o componente dinâmico (regra do projeto: nada de constantes inline no componente)

**Interfaces:**

- Produces: em cada `.constants.ts`, `export const LazyTransactionDrawer = dynamic(() => import('@/modules/transactions/transaction-drawer').then((mod) => mod.TransactionDrawer), { ssr: false })` (e o equivalente para cada drawer). O componente passa a renderizar o drawer só quando está aberto (`{open && <LazyX ... />}`), para o chunk só ser pedido no primeiro clique. Se o drawer depender de estar montado para animar a abertura, manter montado depois do primeiro open (estado `hasOpened`).
- Em `PortfolioExport`, mover `createPortfolioOverview(holdings)` para dentro do sheet lazy, para não correr em cada render do header.

- [ ] **Step 1: Measure the baseline**

Run: `pnpm build` (fechar o `next dev` antes, pouca RAM) e guardar o "First Load JS" de `/portfolio`, `/portfolio/transactions`, `/portfolio/payslips`, `/portfolio/expenses`, `/portfolio/prices`.

- [ ] **Step 2: Replace the static imports with the lazy components**

- [ ] **Step 3: Run checks**

Run: `pnpm typecheck && pnpm lint && pnpm exec vp test run src/modules`
Expected: sem erros.

- [ ] **Step 4: Measure again**

Run: `pnpm build`
Expected: "First Load JS" menor nas cinco rotas. Registar os números na mensagem do commit.

- [ ] **Step 5: Manual verification**

Com a app a correr: abrir cada drawer (criar transação, editar transação via `transaction_id` na URL, payslip, despesa, asset) e a folha "Overview"; confirmar que abrem, submetem e fecham. O deep link `?transaction_id=` tem de continuar a abrir o drawer de detalhe ao carregar a página.

- [ ] **Step 6: Commit**

```bash
git add src/modules
git commit -m "perf: load form drawers and the export sheet on first open"
```

---

### Task 8: Índices e RLS das tabelas não versionadas

**Files:**

- Create: `src/_bff/common/db/sql/transactions_indexes.sql`
- Modify: `CLAUDE.md` (lista de tabelas: apontar para o novo ficheiro)

Tarefa manual no SQL Editor do Supabase (o executor não tem acesso à base de dados; entrega o SQL e as instruções ao utilizador).

- [ ] **Step 1: Write `transactions_indexes.sql`**

```sql
-- Serves the per-user list read (user_id filter, buy_date desc, id tie-break for paging)
CREATE INDEX IF NOT EXISTS transactions_user_id_buy_date_idx
  ON public.transactions (user_id, buy_date DESC, id);
```

Mais um bloco comentado com as queries de verificação para o utilizador correr:

```sql
-- 1) Existing indexes
SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('transactions', 'data');
-- 2) RLS policies: every auth.uid() should be wrapped as (SELECT auth.uid())
SELECT tablename, policyname, qual, with_check FROM pg_policies
  WHERE tablename IN ('transactions', 'data');
-- 3) Plan of the hot query (replace the uuid)
EXPLAIN ANALYZE SELECT * FROM public.transactions
  WHERE user_id = '00000000-0000-0000-0000-000000000000'
  ORDER BY buy_date DESC, id LIMIT 1000;
```

- [ ] **Step 2: Hand off to the user**

Pedir ao utilizador para: correr as verificações; criar o índice só se não existir um equivalente; correr o Performance Advisor (Database, Advisors) e partilhar os avisos. Se alguma política usar `auth.uid()` sem `SELECT`, abrir uma tarefa para a recriar.

- [ ] **Step 3: Commit**

```bash
git add src/_bff/common/db/sql/transactions_indexes.sql CLAUDE.md
git commit -m "chore: version the transactions list index"
```

---

### Task 9: Atualização de preços num só pedido (RPC)

**Files:**

- Create: `src/_bff/common/db/sql/update_ticker_prices.sql`
- Modify: `src/_bff/modules/assets/assets.repository.ts` (substituir `updateAssetPrice` por `updateAssetPrices`)
- Modify: `src/_bff/modules/assets/update-tickers-prices/update-tickers-prices.service.ts` (substituir o `Effect.forEach` de `updateTicker` por uma só chamada)
- Test: `src/_bff/modules/assets/__tests__/assets.repository.test.ts`

**Interfaces:**

- Produces: função SQL `public.update_ticker_prices(prices jsonb) RETURNS void`, `SECURITY INVOKER`, que recebe `[{ "ticker": "BTC", "price": 123.4 }]` e faz um só `UPDATE public.data SET curr_price = p.price, last_updated_at = now() FROM jsonb_to_recordset(prices) AS p(ticker text, price numeric) WHERE data.ticker = p.ticker`. `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` e `GRANT EXECUTE ... TO service_role`.
- Produces: `export function updateAssetPrices(supabaseClient: SbClient, prices: { ticker: string; price: number }[])`, que devolve `supabaseClient.rpc('update_ticker_prices', { prices })`.

Ordem de deploy: o utilizador corre o SQL no Supabase **antes** do deploy do código.

- [ ] **Step 1: Write the failing test**

```ts
vi.mock('server-only', () => ({}))

it('sends every price in one rpc call', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null })
    await updateAssetPrices({ rpc } as never, [
        { ticker: 'BTC', price: 1 },
        { ticker: 'ETH', price: 2 },
    ])
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('update_ticker_prices', {
        prices: [
            { ticker: 'BTC', price: 1 },
            { ticker: 'ETH', price: 2 },
        ],
    })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vp test run src/_bff/modules/assets/__tests__/assets.repository.test.ts`
Expected: FAIL, `updateAssetPrices` não existe.

- [ ] **Step 3: Write the SQL file and `updateAssetPrices`**

- [ ] **Step 4: Use it in `updateTickersPrices`**

Construir a lista só com os tickers que têm preço (`prices.get(t.ticker)` definido e diferente de 0, a mesma regra do `if (!price) return` atual) e chamar uma vez, com a verificação dupla (catch do `tryPromise` e `error`). Uma falha é registada (`prefix: 'updateTickerPrices'`) e o fluxo devolve `{ success: false, status: 207 }`, como hoje. Lista vazia: não chamar o RPC. Apagar `updateTicker` e `updateAssetPrice`.

- [ ] **Step 5: Run tests and checks**

Run: `pnpm exec vp test run src/_bff/modules/assets`
Expected: PASS. Depois `pnpm typecheck` e `pnpm knip`.

- [ ] **Step 6: Commit**

```bash
git add src/_bff/common/db/sql/update_ticker_prices.sql src/_bff/modules/assets
git commit -m "perf: update every ticker price in one rpc call"
```

---

## Verificação final

- [ ] `pnpm check` e depois `pnpm knip` (um de cada vez).
- [ ] Com a app a correr: dashboard, transações (criar, editar, apagar), payslips, despesas, notícias, emergency fund e "Update prices" funcionam e mostram dados atualizados à primeira.
- [ ] Comparar no Vercel Speed Insights o TTFB e o LCP de `/portfolio` uma semana antes e depois do deploy.
