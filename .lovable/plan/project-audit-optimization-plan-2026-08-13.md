# Project Audit + Optimization Plan

Deep audit of the current `src/` tree. Every finding below was verified by reading the files.

## Summary verdict

Structure feature-based hai (accha base), lekin production-level nahi hai kyunki:
- ek hi kaam ke liye **do Supabase clients**, **do navigation entry points**, aur **do router layers** hain
- `navigationConfig.tsx` ka aadha code (RBAC + route validation + mobile bar builder) **kisi ne import hi nahi kiya** — dead code
- `DashboardPage` khud ek mini-router hai, isliye settings pages code-split nahi hote aur "current page" ke 3 sources of truth hain

---

## 1. Duplicate files doing the same job (remove)

| Duplicate | Evidence | Action |
|---|---|---|
| `src/lib/supabaseClient.ts` **and** `src/integrations/supabase/client.ts` | app ka saara code (`authService`, `organizationService`, `SessionContext`) sirf `lib/supabaseClient` import karta hai; generated typed client ka **zero** consumer | ek client rakho: generated `integrations/supabase/client.ts` (typed, `Database` generics) ko single source banao, `lib/supabaseClient.ts` delete karo, imports update karo |
| Hardcoded URL + anon JWT fallback in `lib/supabaseClient.ts` | literal project URL aur anon key file me inline | env-only client (generated file) use karne se apne aap fix |
| `src/integrations/supabase/types.ts` (385 lines) | sirf dead client dwara import | client migrate karne ke baad ye zinda + useful ho jayega (RPC/table types) |
| `navigateTo` re-export from `PrimaryRailSidebar.tsx` | `Header`, `OrgProjectsPage`, `OrganizationsPage`, `CreateOrganizationPage`, `DashboardPage`, `SecondaryNavSidebar`, `MobileBottomBar`, `MobileLauncherSheet` navigation ke liye ek **component file** import karte hain | sab jagah `@/lib/navigation` se import; `PrimaryRailSidebar` se `export { navigateTo }` aur `export { navigationConfig }` hatao |
| `src/features/dashboard/services/dashboardService.ts` + `hooks/useDashboard.ts` | pura mock data; hook me `activeModule`, `showNewInvoiceModal`, `addNewTransaction` kahin use nahi | hook ko 5-line static selector banao (ya mock ko component ke paas rakho), unused state hatao |

## 2. Dead code inside `src/config/navigationConfig.tsx`

Zero consumers (grep confirmed, config file ke bahar koi import nahi):
- `getMobileBottomBarConfig()` — mobile bar apne andar hi paths hardcode karta hai
- `VALID_PROTECTED_ROUTES`, `isPathValid()`, `checkRouteAccess()`
- `filterMenuByRoles()`, `hasAccessToRoleKey()`, `normalizeRole()` — RBAC likha gaya par kabhi wire nahi hua (aur `filterMenuByRoles` input array ko **mutate** karta hai — bug)
- `SubNavItem.icon` etc. theek hai; `navigationConfig` alias `dashboardNavigation` duplicate export hai

Action: `navigationConfig.tsx` ko sirf nav data + types tak simat do (`dashboardNavigation`, `orgMenuNavigation`, `orgListNavigation`, types). RBAC helpers delete (jab actual roles table wire hoga tab `features/auth` ke andar naya banega). Alias export hatao.

## 3. Routing: do router ek saath chal rahe hain (biggest issue)

Aaj: `AppRoutes` ke 4 different route patterns (`/dashboard/*`, `/settings/*`, `/overview`, project URLs) sab **ek hi** `DashboardRouteWrapper` pe jaate hain. Uske baad `DashboardPage` khud:
- regex se `/dashboard/project/<id>` strip karta hai, `cleanPath` banata hai
- `activeSection` string se decide karta hai
- `activeSubItem` ko **alag state** me rakhta hai aur `useEffect` se sync karta hai
- `useEffect` me `navigateTo(..., {replace:true})` se redirects karta hai
- `MfaSettingsPage` / `ChangePasswordPage` ko **conditionally render** karta hai

Nateeja: settings pages ka koi lazy chunk nahi (dashboard bundle me baked), URL ke 3 sources of truth (URL + `activeSubItem` + `activeSection`), aur project route (`/dashboard/project/:projectId/*`) sirf catch-all se match hota hai.

Fix (production pattern):
```text
/dashboard/organizations                         -> OrganizationsPage
/dashboard/new                                   -> CreateOrganizationPage
/dashboard/org/:orgId                            -> OrgProjectsPage
/dashboard/project/:projectId  (layout route)    -> DashboardLayout (Header + 2 sidebars + mobile nav)
    index -> overview
    overview                                     -> OverviewPage      (lazy)
    settings/mfa                                 -> MfaSettingsPage   (lazy)
    settings/change-password                     -> ChangePasswordPage(lazy)
/settings/*   (no project)                       -> same layout, project-less
```
- `DashboardLayout` = shell only + `<Outlet/>` in `<Suspense>` → page switch par sirf `<main>` badlega
- `activeSection` / `activeSubItem` state delete → `useMatch`/`useParams` se derive
- redirect `useEffect` delete → `<Navigate>` / index routes
- `AppRoutes` me nested duplicate `ErrorBoundary` ek hi rakho

## 4. Props drilling (unnecessary lines)

`user`, `onLogout`, `activeOrganization`, `activeProject` har route element me manually pass hote hain (`AppRoutes` ~90 lines sirf props wiring). Data already context me hai (`useSession`, `useOrganization`).

Action: pages/layout khud `useSession()` + `useOrganization()` padhein. `OrgProjectsRouteWrapper` aur `DashboardRouteWrapper` wrappers poori tarah delete. `AppRoutes` ~90 lines se ~35 lines.

## 5. Data-fetch layer

Verified as correct: single `rpc_workspace` entry, TanStack Query keys `userId` se scoped, no manual `getSession()/refreshSession()`.

Tuning to do:
- `main.tsx` ka inline `QueryClient` → `src/lib/queryClient.ts` (single source, testable)
- request amplification: aaj `refetchOnMount: true` + `refetchOnWindowFocus: true` + 30s `refetchInterval` teeno on hain. `refetchOnMount` ko `staleTime` pe chhodo (default `true` sirf stale par firing hota hai — verify) aur polling ko sirf workspace queries tak rakho, global default se hatao
- `useProjectsQuery(userId)` sab projects laata hai aur client-side filter hota hai (`getProjectsForOrg`) — theek hai chhote data pe, so keep, lekin `projectsKey(userId, orgId)` ka dual-key optimistic write duplicate hai → ek key policy pe simplify
- `useOrganization` provider ko 4 jobs se todo: context+derive (`OrganizationProvider.tsx`), persistence (`lib/workspaceStorage.ts`), mutations+toasts (`hooks/useWorkspaceMutations.ts`)
- `src/context/useOrganization.ts` `React.createElement` use karta hai kyunki `.ts` hai → `.tsx` component file (`src/context/OrganizationProvider.tsx`) + `useOrganization` hook alag

## 6. Naming / structure consistency

- `features/settings/2MFA/` aur `ChangePassword/` → `features/settings/two-factor/`, `features/settings/change-password/` (folder naming digit se shuru nahi honi chahiye, baaki project lowercase hai)
- `src/hooks/useOrganizationsQuery.ts` global hooks me hai jabki org feature ka hai → `features/organizations/hooks/`
- `MetricsOverview`/`RecentActivityTable` ke saath ek `features/dashboard/pages/OverviewPage.tsx` banao (aaj overview ka JSX `DashboardPage` ke andar inline hai)

## 7. Performance

- Settings + overview pages lazy → dashboard first-load chunk chhota
- `<main>` ke andar hi `Suspense` → shell re-render nahi hoga
- Header/sidebars already `React.memo`; props drilling hatane ke baad memo actually effective hoga (aaj naye object props har render pe aate hain)
- inline `style={{}}` objects har render pe recreate hote hain (Header/Dashboard/OrgProjects me bahut) → repeated ones ko `main.css` classes me move karo (tokens already defined hain)
- `index.html` title/description production values verify + fix

---

## Execution order

1. Single Supabase client (delete `lib/supabaseClient.ts`, imports → `@/integrations/supabase/client`)
2. Single navigation entry (`@/lib/navigation` everywhere; sidebar re-exports delete)
3. `navigationConfig.tsx` cleanup (dead RBAC/route/mobile-bar code delete)
4. Route restructure: `DashboardLayout` + nested lazy routes; `DashboardPage` ka internal routing delete
5. Props drilling remove; wrappers delete; `AppRoutes` slim
6. `useOrganization` split + `lib/queryClient.ts` + query policy tuning
7. Folder renames (`settings/*`, org query hook move)
8. Dead dashboard mock state cleanup + inline-style consolidation + `index.html` meta
9. Verify: typecheck, app 200, click-through of every route, aur network tab me `rpc_workspace` count (login = 1, page switch = 0)

## Notes

- Koi database/migration change nahi.
- Har step ke baad typecheck + preview verify, taki koi route toote na.
