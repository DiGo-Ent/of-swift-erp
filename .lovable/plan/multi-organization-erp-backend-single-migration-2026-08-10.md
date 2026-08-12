# Multi-organization ERP backend (single migration)

Right now organizations and projects live only in `localStorage` (demo data). This plan replaces that with a real, locked-down backend: three tables, two branch functions, one RPC entry point, and inline validation only — no triggers, no extra helper functions.

## Concept being modelled

- A user can own **many organizations** (different companies / lines of work).
- We sell **one ERP with multiple solutions (services)**. For now two: **HR Management** and **Institution & School Management**.
- Inside one organization, **only one project per service** may exist — an org cannot have two HR projects. A second, different service in the same org is allowed.

## Tables

### 1. `public.services` (catalogue — read-only)
Fields: `key` (slug), `name`, `description`, `category`, `icon`, `is_active`, timestamps.
Seeded with exactly two rows: `hr` (HR Management) and `institution` (Institution & School Management).

Access: RLS on, **one SELECT policy for signed-in users only**. No insert/update/delete policy and no write grants — nobody can modify it from the app.

### 2. `public.organizations` (fully locked down)
Company profile fields so a user can keep complete details:
`name`, `code` (unique per owner), `legal_name`, `org_type` (personal / enterprise / educational / non_profit / government), `industry`, `company_size` (1-10 … 1000+), `founded_on` (date the company was formed), `website`, `email`, `phone`, `tax_id`, `registration_no`, `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `country`, `timezone`, `currency_code`, `logo_url`, `description`, `plan`, `status`, `owner_id`, timestamps.

### 3. `public.projects` (fully locked down)
`organization_id`, `service_id`, `name`, `code`, `description`, `environment` (production / staging / sandbox), `status`, `owner_id`, timestamps.
**Unique constraint `(organization_id, service_id)`** enforces the one-solution-per-org rule at database level.

## Lockdown model

- `organizations` and `projects`: RLS **enabled and forced**, and **zero policies**. All privileges revoked from `anon` and `authenticated`. Direct PostgREST access returns nothing — the tables are unreachable from the client, by design.
- Branch functions `public.batch_organizations` and `public.batch_projects`: `SECURITY DEFINER`, `EXECUTE` revoked from `public`, `anon`, `authenticated`. They cannot be called from the client at all.
- Single public entry point `public.rpc_workspace(p_action text, p_payload jsonb)`: `SECURITY DEFINER`, `EXECUTE` granted **only to `authenticated`**. It resolves `auth.uid()`, rejects anonymous calls, and dispatches to the right branch function.

One branch function per table, each handling all four operations (`select` / `insert` / `update` / `delete`) through an `p_op` argument. Naming: `batch_<table_name>`.

## Inline validation (no triggers)

All validation lives in column definitions and `CHECK` constraints, so no trigger or validation function is needed:

- Length caps on every text column (`name` 2-120, `code` 2-40, `description` ≤ 1000, address fields ≤ 200, etc.).
- Regex checks: `code` `^[A-Z0-9_-]{2,40}$`, email format, `https?://` for website/logo, ISO currency `^[A-Z]{3}$`, country `^[A-Z]{2}$`.
- Enum-style `CHECK ... IN (...)` for `org_type`, `company_size`, `plan`, `status`, `environment`.
- `founded_on` must not be a future date (uses `CURRENT_DATE`, evaluated per-insert inside the branch function's validation, kept out of the constraint so it stays immutable).
- Ownership is always taken from `auth.uid()` inside the RPC — never from the payload.

## Injection / abuse hardening in the RPC

- Everything is parameterised — no dynamic SQL, no `EXECUTE`, no string concatenation of identifiers.
- `SET search_path = ''` on every function; all objects referenced fully-qualified.
- Payload fields read with typed `jsonb` extraction and `trim()`; unknown keys ignored.
- Unknown `p_action` / `p_op` raises an exception.
- Every write re-checks that the target row's `owner_id = auth.uid()` before applying, so IDs cannot be forged.
- `select` returns only rows owned by the caller.

## Frontend wiring after the migration

`src/services/organizationService.ts` returns to live mode and talks only to `rpc_workspace`:

```
supabase.rpc('rpc_workspace', { p_action: 'organizations', p_payload: { op: 'select' } })
```

- `fetchOrganizations` / `fetchProjects` → `op: 'select'`
- `createOrganization` / `createProject` → `op: 'insert'`
- The create-organization form gains the new detail fields (type, size, founded date, contact, address, tax).
- Project creation gains a **service picker** loaded from `services`, and surfaces a clear error when that service already has a project in the org.
- `useOrganization` drops the demo seed and localStorage fallback for lists, keeping localStorage only for the active org/project selection.

## Deliverable

One single SQL migration containing, in order: the three tables with grants, RLS enablement, the services read policy, the two `batch_*` branch functions, the `rpc_workspace` entry point, all `REVOKE`/`GRANT` statements, and the two seeded service rows. No triggers, no extra functions.

Frontend changes follow in the same task, after the migration is approved.
