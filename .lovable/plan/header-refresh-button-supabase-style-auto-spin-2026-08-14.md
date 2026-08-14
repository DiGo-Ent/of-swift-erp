# Header Refresh Button — Supabase-style Auto Spin

Samajh gaya: header me ek refresh icon chahiye jo **khud spin kare** jab bhi background me data sync ho raha ho (30s polling, window focus, ya mutation ke baad), aur click karne par manual refresh bhi kare — bilkul Supabase table editor ke refresh button jaisa.

## Kaam kaise karega

```text
TanStack Query -> isFetching (orgs + projects)  ->  icon spin ON
fetch complete -> short "just synced" tick      ->  icon spin OFF
user click     -> refresh() -> wahi spin state
```

Spin ke liye koi naya request nahi banega — hum sirf **already chal rahi** queries ka fetching state dikha rahe hain, is liye rate limit par zero asar.

## Changes

### 1. `src/context/OrganizationProvider.tsx`
- Context value me do naye fields expose karna:
  - `isSyncing: boolean` — `orgsQuery.isFetching || projectsQuery.isFetching` (initial load bhi cover)
  - `lastSyncedAt: number | null` — `orgsQuery.dataUpdatedAt` / `projectsQuery.dataUpdatedAt` me se latest
- `refresh()` already exists (invalidate orgs + projects) — usi ko button click par use karenge, koi duplicate logic nahi.

### 2. `src/components/common/RefreshButton.tsx` (naya, chhota)
- `RefreshCw` (lucide) icon-only button, header ki existing inline-style language me.
- Props: `isSyncing`, `lastSyncedAt`, `onRefresh`.
- Behaviour:
  - `isSyncing` true -> icon continuously rotate (CSS `animation: erp-spin 0.8s linear infinite`).
  - Spin minimum ~500ms visible rakhenge (chhoti local timer se), warna 80ms ki fast fetch me flicker jaisa lagta hai aur user ko dikhta hi nahi.
  - Sync khatam hote hi ~1.2s ke liye icon ka color success green, phir normal muted — "kuch update hua" ka signal.
  - `title` tooltip: `Last synced: 12s ago` (lastSyncedAt se relative text), syncing ke waqt `Syncing...`.
  - Disabled while syncing, `aria-label="Refresh data"`, `aria-busy`.

### 3. `src/styles/main.css`
- Ek keyframe `@keyframes erp-spin { to { transform: rotate(360deg) } }` add karna (agar already nahi hai) — reduced-motion users ke liye `prefers-reduced-motion` me spin band, sirf color pulse.

### 4. `src/components/common/Header.tsx`
- `useOrganization()` se `isSyncing`, `lastSyncedAt`, `refresh` lena.
- `<RefreshButton />` ko `ProfileDropdown` ke bilkul left me rakhna (screenshot me jahan aapne circle kiya hai).
- Auth/public pages par (jab `userEmail` nahi hai) button hide — wahan workspace query hi nahi chalti.

## Result

- 30s wala background poll chalte hi header ka icon apne aap ghoomega, phir green flash dega -> user ko pata chal jayega ki data sync hua.
- Tab wapas focus karne par bhi wahi spin dikhega.
- Manual control bhi mil jayega: click = instant refetch.
- Koi extra network request nahi, koi DB / backend change nahi.
