# Why `rpc_workspace` fires 4x — analysis and fix plan

## Verdict: frontend issue, not backend

The RPC and the rate limiter are fine. The duplication comes from the data-fetching layer: there are **four independent triggers** that all call the same fetch, and **nothing dedupes them**.

## What the code actually does (verified)

`OrganizationProvider` (`src/context/useOrganization.ts`) is hand-rolled state with a `refresh()` that always fires 3 network calls together:

```text
refresh() -> getSession()
          -> rpc_workspace(organizations, select)   <- call #1
          -> rpc_workspace(projects, select)        <- call #2
          -> from('services').select()              <- call #3
```

Triggers that call `refresh()` on a single page load:

1. Provider mount effect (`checkAndRefresh`) -> `refresh(true)`.
2. `supabase.auth.onAuthStateChange` in the same provider -> `refresh(true)` again when the SDK replays the restored session (`SIGNED_IN` / `USER_UPDATED` on token restore).
3. `AppRoutes` effect (`src/routes/AppRoutes.tsx:76-83`) -> `void refreshOrganizations()` whenever `organizations.length === 0 && !isLoading`. This runs while trigger 1 is still in flight, and it re-runs on **every re-render where those deps change** — which is exactly why requests also appear when the user only switches pages.
4. `React.StrictMode` (`src/main.tsx`) double-invokes mount effects in dev, doubling triggers 1 and 3.

Net effect on one refresh: ~4 `rpc_workspace(organizations)` + ~4 `rpc_workspace(projects)` + services — matching what the rate limiter recorded (limit is 30/60s, so it burns ~25% of the budget per refresh).

Two more amplifiers:

- `src/hooks/useOrganizationsQuery.ts` already defines proper React Query hooks with `staleTime`, **but nothing imports them**. The QueryClient in `main.tsx` is configured well (no refetch on mount/focus) and is completely unused for this data, so React Query's built-in request de-duplication never applies.
- `callWorkspace()` does `getSession()` + a possible `refreshSession()` **on every single call**, so each duplicate also produces extra auth traffic.
- Page switching uses `navigateTo()` = raw `history.pushState` + a synthetic `popstate` event (`PrimaryRailSidebar.tsx:23`), plus `DashboardPage` dispatches more `popstate` events in effects. Each one forces `AppRoutes` to re-render, which re-evaluates trigger 3.

Also worth noting for the "data page pe theek se serve nahi hota" part: the URL-sync effect in the provider (`useEffect` on `[organizations, projects]`) does `setActiveOrganization` / `setActiveProject` *after* data lands, so pages render one frame with `null` selection and stale `localStorage` copies, and `isLoading` is a single global flag for all three datasets — there is no per-page "loading vs empty" state.

## Fix plan

### 1. Single source of truth: React Query, one provider, zero manual triggers
- Make `OrganizationProvider` a thin wrapper over the existing `useOrganizationsQuery` / `useProjectsQuery` plus a new `useServicesQuery`, instead of `useState` + `refresh()`.
- Delete the provider's `refresh()` mount effect and its `onAuthStateChange` refetch. Auth state becomes a *query key input* (`enabled: !!session`), not a fetch trigger.
- Remove the `refresh` effect from `AppRoutes` entirely.
- Result: React Query dedupes identical in-flight keys, so even 4 triggers = 1 network call, and StrictMode double-mount is absorbed.

### 2. One session listener for the whole app
- Add a small `useSessionQuery` (or session context) that owns the only `onAuthStateChange` subscription and exposes `session`/`userId`. `useAuth` and the org provider consume it instead of each subscribing.
- Include `userId` in query keys so sign-out/sign-in swaps cache cleanly (`queryClient.clear()` on `SIGNED_OUT`) rather than refetching defensively.

### 3. Stop re-authenticating per RPC call
- Drop `getSession()` + `refreshSession()` from `callWorkspace()`. The Supabase client already has `autoRefreshToken: true`; let it handle expiry and treat a 401 as a query error.

### 4. Fetch only what the page needs
- Organizations list page: organizations query only.
- Org detail page: projects query scoped by `orgId` (`rpc_workspace(projects, { organization_id })`), so it doesn't pull every project.
- Services: fetched lazily, only when the create-project form opens.
- Project dashboard: no fetch at all — reads the already-cached org/project from the cache by id.

### 5. Real navigation, so re-renders stop causing fetches
- Replace `navigateTo()`'s `pushState` + synthetic `popstate` with react-router `useNavigate`, and remove the `popstate` dispatches in `DashboardPage`. Same for the mobile bars/launcher.

### 6. Per-page loading and selection correctness
- Derive `activeOrganization` / `activeProject` from the URL params + cached lists (`useMemo`), instead of `useState` + a post-fetch sync effect; keep `localStorage` only as a fallback for "last used".
- Expose per-query `isLoading` / `isError` so each page shows its own skeleton or empty state instead of one global flag.

### 7. Verify
- Load dashboard, refresh, switch pages, and count `rpc_workspace` calls in the network log: expected **1 organizations + 1 projects per load**, and **0 on page switch** while data is fresh.
- Confirm via `rpc_rate_limit` rows that `hit_count` grows by ~2 per refresh, not ~8.

## Technical notes

- No database or RPC changes are needed; `rpc_workspace`, `batch_*`, and `rpc_rate_limit_check` stay as they are.
- Files touched: `src/context/useOrganization.ts`, `src/hooks/useOrganizationsQuery.ts`, `src/routes/AppRoutes.tsx`, `src/features/organizations/services/organizationService.ts`, `src/features/organizations/hooks/useOrganizationsPage.ts`, `src/features/dashboard/components/PrimaryRailSidebar.tsx` (+ mobile nav files), `src/features/dashboard/pages/DashboardPage.tsx`, `src/features/auth/hooks/useAuth.ts`.
- `React.StrictMode` stays enabled — the point is that correct query-based fetching is immune to double-mount, so double-mount stops being a symptom to hide.
