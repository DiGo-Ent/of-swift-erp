
-- ============================================================
-- ENUMS
-- ============================================================
create type public.org_role as enum ('admin','manager','member');
create type public.org_status as enum ('active','suspended','archived');
create type public.project_status as enum ('planning','active','on_hold','completed','archived');
create type public.member_status as enum ('active','invited','disabled');

-- ============================================================
-- SERVICES (read-only catalog)
-- ============================================================
create table public.services (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.services to authenticated;
grant all on public.services to service_role;

alter table public.services enable row level security;

create policy "services_select_authenticated"
  on public.services for select to authenticated using (is_active);

insert into public.services (code, name, description, icon, sort_order) values
  ('hr_management','HR Management','Employee lifecycle, payroll, attendance and performance management.','users',1),
  ('institution_management','Institution Management','Students, staff, admissions, academics and fee management.','graduation-cap',2),
  ('construction_management','Construction Management','Sites, materials, contractors, milestones and cost control.','hard-hat',3);

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  legal_name text,
  registration_number text,
  tax_id text,
  industry text,
  org_size text,
  website text,
  contact_email text,
  contact_phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country_code text not null default 'IN',
  timezone text not null default 'Asia/Kolkata',
  currency_code text not null default 'INR',
  locale text not null default 'en-IN',
  fiscal_year_start_month smallint not null default 4,
  description text,
  logo_url text,
  status public.org_status not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organizations_created_by_idx on public.organizations (created_by);

grant select on public.organizations to authenticated;
grant all on public.organizations to service_role;

alter table public.organizations enable row level security;

-- ============================================================
-- ORGANIZATION MEMBERS
-- ============================================================
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  role public.org_role not null default 'member',
  status public.member_status not null default 'active',
  invited_by uuid,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index organization_members_user_idx on public.organization_members (user_id);

grant select on public.organization_members to authenticated;
grant all on public.organization_members to service_role;

alter table public.organization_members enable row level security;

-- membership helper (security definer: avoids RLS recursion)
create or replace function public.is_org_member(_org_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = _org_id and m.user_id = _user_id and m.status = 'active'
  );
$$;

create or replace function public.is_org_admin(_org_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = _org_id and m.user_id = _user_id
      and m.status = 'active' and m.role = 'admin'
  );
$$;

revoke all on function public.is_org_member(uuid, uuid) from public;
revoke all on function public.is_org_admin(uuid, uuid) from public;
grant execute on function public.is_org_member(uuid, uuid) to authenticated, service_role;
grant execute on function public.is_org_admin(uuid, uuid) to authenticated, service_role;

create policy "organizations_select_members"
  on public.organizations for select to authenticated
  using (public.is_org_member(id, auth.uid()));

create policy "organization_members_select_members"
  on public.organization_members for select to authenticated
  using (user_id = auth.uid() or public.is_org_member(org_id, auth.uid()));

-- ============================================================
-- PROJECTS  (one project per service per organization)
-- ============================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  name text not null,
  code text,
  description text,
  status public.project_status not null default 'active',
  start_date date,
  end_date date,
  timezone text not null default 'Asia/Kolkata',
  currency_code text not null default 'INR',
  logo_url text,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, service_id),
  unique (org_id, name)
);

create index projects_org_idx on public.projects (org_id);

grant select on public.projects to authenticated;
grant all on public.projects to service_role;

alter table public.projects enable row level security;

create policy "projects_select_members"
  on public.projects for select to authenticated
  using (public.is_org_member(org_id, auth.uid()));

-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger organization_members_updated_at before update on public.organization_members
  for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();

-- ============================================================
-- LOCKED BATCH LAYER  (batch_<tablename>) — only callable by the
-- SECURITY DEFINER rpc_* entry points, never by anon/authenticated.
-- All validation is INLINE inside each batch function.
-- ============================================================

-- ---------- batch_services : catalog is immutable ----------
create or replace function public.batch_services(_op text, _actor uuid, _payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  raise exception 'services catalog is read-only (op=%, actor=%)', _op, _actor
    using errcode = '42501';
end; $$;

-- ---------- batch_organizations ----------
create or replace function public.batch_organizations(_op text, _actor uuid, _payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_name text; v_slug text; v_base text; v_i int := 0;
  v_id uuid; v_row public.organizations%rowtype;
  v_txt text; v_key text;
  v_num smallint;
begin
  if _actor is null then raise exception 'unauthenticated' using errcode = '42501'; end if;
  if _payload is null or jsonb_typeof(_payload) <> 'object' then
    raise exception 'invalid payload' using errcode = '22023';
  end if;

  -- INLINE sanitation of every incoming text value: reject control chars,
  -- angle-bracket/script (XSS) payloads and classic SQL-injection patterns.
  for v_key, v_txt in select k, v from jsonb_each_text(_payload) as t(k, v) loop
    if v_txt is not null then
      if length(v_txt) > 2000 then
        raise exception 'field % exceeds 2000 characters', v_key using errcode = '22001';
      end if;
      if v_txt ~ '[\x00-\x08\x0b\x0c\x0e-\x1f]' then
        raise exception 'field % contains control characters', v_key using errcode = '22023';
      end if;
      if v_txt ~* '<\s*/?\s*[a-z!]|javascript\s*:|data\s*:\s*text/html|on[a-z]+\s*=\s*["'']' then
        raise exception 'field % contains disallowed markup/script content', v_key using errcode = '22023';
      end if;
      if v_txt ~* '(;|--|/\*|\*/)\s*(select|insert|update|delete|drop|alter|truncate|grant|revoke|union)\b'
         or v_txt ~* '\bunion\s+(all\s+)?select\b'
         or v_txt ~* '\b(drop|truncate)\s+table\b' then
        raise exception 'field % contains disallowed sql pattern', v_key using errcode = '22023';
      end if;
    end if;
  end loop;

  if _op = 'create' then
    v_name := btrim(coalesce(_payload->>'name',''));
    if length(v_name) < 2 or length(v_name) > 120 then
      raise exception 'organization name must be 2-120 characters' using errcode = '22023';
    end if;
    if v_name !~ '^[\p{L}\p{N}][\p{L}\p{N} .,''&()\-_/]*$' then
      raise exception 'organization name has invalid characters' using errcode = '22023';
    end if;

    v_txt := nullif(btrim(coalesce(_payload->>'contact_email','')), '');
    if v_txt is not null and v_txt !~* '^[a-z0-9._%%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$' then
      raise exception 'invalid contact email' using errcode = '22023';
    end if;
    if nullif(btrim(coalesce(_payload->>'contact_phone','')),'') is not null
       and btrim(_payload->>'contact_phone') !~ '^\+?[0-9 \-()]{6,20}$' then
      raise exception 'invalid contact phone' using errcode = '22023';
    end if;
    if nullif(btrim(coalesce(_payload->>'website','')),'') is not null
       and btrim(_payload->>'website') !~* '^https?://[a-z0-9.\-]+\.[a-z]{2,}(/[^\s]*)?$' then
      raise exception 'invalid website url' using errcode = '22023';
    end if;
    if nullif(btrim(coalesce(_payload->>'logo_url','')),'') is not null
       and btrim(_payload->>'logo_url') !~* '^https://[a-z0-9.\-]+/[^\s]*$' then
      raise exception 'invalid logo url' using errcode = '22023';
    end if;

    v_num := coalesce((_payload->>'fiscal_year_start_month')::smallint, 4);
    if v_num < 1 or v_num > 12 then
      raise exception 'fiscal_year_start_month must be 1-12' using errcode = '22023';
    end if;

    -- unique slug
    v_base := regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g');
    v_base := btrim(v_base, '-');
    if v_base = '' then v_base := 'org'; end if;
    v_slug := v_base;
    while exists (select 1 from public.organizations o where o.slug = v_slug) loop
      v_i := v_i + 1;
      v_slug := v_base || '-' || v_i::text;
    end loop;

    insert into public.organizations (
      name, slug, legal_name, registration_number, tax_id, industry, org_size,
      website, contact_email, contact_phone, address_line1, address_line2,
      city, state, postal_code, country_code, timezone, currency_code, locale,
      fiscal_year_start_month, description, logo_url, created_by
    ) values (
      v_name, v_slug,
      nullif(btrim(coalesce(_payload->>'legal_name','')),''),
      nullif(btrim(coalesce(_payload->>'registration_number','')),''),
      nullif(btrim(coalesce(_payload->>'tax_id','')),''),
      nullif(btrim(coalesce(_payload->>'industry','')),''),
      nullif(btrim(coalesce(_payload->>'org_size','')),''),
      nullif(btrim(coalesce(_payload->>'website','')),''),
      lower(nullif(btrim(coalesce(_payload->>'contact_email','')),'')),
      nullif(btrim(coalesce(_payload->>'contact_phone','')),''),
      nullif(btrim(coalesce(_payload->>'address_line1','')),''),
      nullif(btrim(coalesce(_payload->>'address_line2','')),''),
      nullif(btrim(coalesce(_payload->>'city','')),''),
      nullif(btrim(coalesce(_payload->>'state','')),''),
      nullif(btrim(coalesce(_payload->>'postal_code','')),''),
      upper(coalesce(nullif(btrim(coalesce(_payload->>'country_code','')),''),'IN')),
      coalesce(nullif(btrim(coalesce(_payload->>'timezone','')),''),'Asia/Kolkata'),
      upper(coalesce(nullif(btrim(coalesce(_payload->>'currency_code','')),''),'INR')),
      coalesce(nullif(btrim(coalesce(_payload->>'locale','')),''),'en-IN'),
      v_num,
      nullif(btrim(coalesce(_payload->>'description','')),''),
      nullif(btrim(coalesce(_payload->>'logo_url','')),''),
      _actor
    ) returning * into v_row;

    -- creator is always the admin of what they create
    insert into public.organization_members (org_id, user_id, role, status, invited_by)
    values (v_row.id, _actor, 'admin', 'active', _actor);

    return to_jsonb(v_row);

  elsif _op = 'update' then
    v_id := nullif(_payload->>'id','')::uuid;
    if v_id is null then raise exception 'id is required' using errcode = '22023'; end if;
    if not public.is_org_admin(v_id, _actor) then
      raise exception 'only organization admins can update this organization' using errcode = '42501';
    end if;

    update public.organizations o set
      legal_name = coalesce(nullif(btrim(coalesce(_payload->>'legal_name','')),''), o.legal_name),
      industry = coalesce(nullif(btrim(coalesce(_payload->>'industry','')),''), o.industry),
      org_size = coalesce(nullif(btrim(coalesce(_payload->>'org_size','')),''), o.org_size),
      contact_phone = coalesce(nullif(btrim(coalesce(_payload->>'contact_phone','')),''), o.contact_phone),
      address_line1 = coalesce(nullif(btrim(coalesce(_payload->>'address_line1','')),''), o.address_line1),
      address_line2 = coalesce(nullif(btrim(coalesce(_payload->>'address_line2','')),''), o.address_line2),
      city = coalesce(nullif(btrim(coalesce(_payload->>'city','')),''), o.city),
      state = coalesce(nullif(btrim(coalesce(_payload->>'state','')),''), o.state),
      postal_code = coalesce(nullif(btrim(coalesce(_payload->>'postal_code','')),''), o.postal_code),
      description = coalesce(nullif(btrim(coalesce(_payload->>'description','')),''), o.description),
      logo_url = coalesce(nullif(btrim(coalesce(_payload->>'logo_url','')),''), o.logo_url)
    where o.id = v_id
    returning * into v_row;

    return to_jsonb(v_row);
  end if;

  raise exception 'unsupported op %', _op using errcode = '22023';
end; $$;

-- ---------- batch_organization_members ----------
create or replace function public.batch_organization_members(_op text, _actor uuid, _payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_org uuid; v_user uuid; v_role text; v_row public.organization_members%rowtype;
begin
  if _actor is null then raise exception 'unauthenticated' using errcode = '42501'; end if;
  v_org := nullif(_payload->>'org_id','')::uuid;
  v_user := nullif(_payload->>'user_id','')::uuid;
  if v_org is null or v_user is null then
    raise exception 'org_id and user_id are required' using errcode = '22023';
  end if;
  if not public.is_org_admin(v_org, _actor) then
    raise exception 'only organization admins can manage members' using errcode = '42501';
  end if;

  v_role := lower(btrim(coalesce(_payload->>'role','member')));
  if v_role not in ('admin','manager','member') then
    raise exception 'invalid role' using errcode = '22023';
  end if;

  if _op = 'upsert' then
    insert into public.organization_members (org_id, user_id, role, status, invited_by)
    values (v_org, v_user, v_role::public.org_role, 'active', _actor)
    on conflict (org_id, user_id) do update set role = excluded.role, status = 'active'
    returning * into v_row;
    return to_jsonb(v_row);
  elsif _op = 'remove' then
    if v_user = _actor then
      raise exception 'admins cannot remove themselves' using errcode = '42501';
    end if;
    delete from public.organization_members m where m.org_id = v_org and m.user_id = v_user;
    return jsonb_build_object('removed', true);
  end if;

  raise exception 'unsupported op %', _op using errcode = '22023';
end; $$;

-- ---------- batch_projects ----------
create or replace function public.batch_projects(_op text, _actor uuid, _payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_org uuid; v_service uuid; v_name text; v_row public.projects%rowtype;
  v_txt text; v_key text; v_id uuid; v_status text;
begin
  if _actor is null then raise exception 'unauthenticated' using errcode = '42501'; end if;
  if _payload is null or jsonb_typeof(_payload) <> 'object' then
    raise exception 'invalid payload' using errcode = '22023';
  end if;

  -- INLINE XSS / SQL-injection / control-character guard on every text value
  for v_key, v_txt in select k, v from jsonb_each_text(_payload) as t(k, v) loop
    if v_txt is not null then
      if length(v_txt) > 2000 then
        raise exception 'field % exceeds 2000 characters', v_key using errcode = '22001';
      end if;
      if v_txt ~ '[\x00-\x08\x0b\x0c\x0e-\x1f]' then
        raise exception 'field % contains control characters', v_key using errcode = '22023';
      end if;
      if v_txt ~* '<\s*/?\s*[a-z!]|javascript\s*:|data\s*:\s*text/html|on[a-z]+\s*=\s*["'']' then
        raise exception 'field % contains disallowed markup/script content', v_key using errcode = '22023';
      end if;
      if v_txt ~* '(;|--|/\*|\*/)\s*(select|insert|update|delete|drop|alter|truncate|grant|revoke|union)\b'
         or v_txt ~* '\bunion\s+(all\s+)?select\b'
         or v_txt ~* '\b(drop|truncate)\s+table\b' then
        raise exception 'field % contains disallowed sql pattern', v_key using errcode = '22023';
      end if;
    end if;
  end loop;

  if _op = 'create' then
    v_org := nullif(_payload->>'org_id','')::uuid;
    v_service := nullif(_payload->>'service_id','')::uuid;
    if v_org is null or v_service is null then
      raise exception 'org_id and service_id are required' using errcode = '22023';
    end if;
    if not public.is_org_admin(v_org, _actor) then
      raise exception 'only the organization admin can create projects' using errcode = '42501';
    end if;
    if not exists (select 1 from public.services s where s.id = v_service and s.is_active) then
      raise exception 'unknown service' using errcode = '22023';
    end if;
    if exists (select 1 from public.projects p where p.org_id = v_org and p.service_id = v_service) then
      raise exception 'this organization already has a project for this service' using errcode = '23505';
    end if;

    v_name := btrim(coalesce(_payload->>'name',''));
    if length(v_name) < 2 or length(v_name) > 120 then
      raise exception 'project name must be 2-120 characters' using errcode = '22023';
    end if;
    if v_name !~ '^[\p{L}\p{N}][\p{L}\p{N} .,''&()\-_/]*$' then
      raise exception 'project name has invalid characters' using errcode = '22023';
    end if;
    if nullif(btrim(coalesce(_payload->>'code','')),'') is not null
       and btrim(_payload->>'code') !~ '^[A-Za-z0-9\-_]{2,24}$' then
      raise exception 'invalid project code' using errcode = '22023';
    end if;

    insert into public.projects (
      org_id, service_id, name, code, description, start_date, end_date,
      timezone, currency_code, created_by
    ) values (
      v_org, v_service, v_name,
      upper(nullif(btrim(coalesce(_payload->>'code','')),'')),
      nullif(btrim(coalesce(_payload->>'description','')),''),
      nullif(_payload->>'start_date','')::date,
      nullif(_payload->>'end_date','')::date,
      coalesce(nullif(btrim(coalesce(_payload->>'timezone','')),''),'Asia/Kolkata'),
      upper(coalesce(nullif(btrim(coalesce(_payload->>'currency_code','')),''),'INR')),
      _actor
    ) returning * into v_row;

    return to_jsonb(v_row);

  elsif _op = 'update' then
    v_id := nullif(_payload->>'id','')::uuid;
    if v_id is null then raise exception 'id is required' using errcode = '22023'; end if;
    select p.* into v_row from public.projects p where p.id = v_id;
    if v_row.id is null then raise exception 'project not found' using errcode = 'P0002'; end if;
    if not public.is_org_admin(v_row.org_id, _actor) then
      raise exception 'only the organization admin can update projects' using errcode = '42501';
    end if;
    v_status := lower(btrim(coalesce(_payload->>'status', v_row.status::text)));
    if v_status not in ('planning','active','on_hold','completed','archived') then
      raise exception 'invalid project status' using errcode = '22023';
    end if;

    update public.projects p set
      name = coalesce(nullif(btrim(coalesce(_payload->>'name','')),''), p.name),
      description = coalesce(nullif(btrim(coalesce(_payload->>'description','')),''), p.description),
      status = v_status::public.project_status
    where p.id = v_id
    returning * into v_row;

    return to_jsonb(v_row);
  end if;

  raise exception 'unsupported op %', _op using errcode = '22023';
end; $$;

-- batch layer is fully locked down
revoke all on function public.batch_services(text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.batch_organizations(text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.batch_organization_members(text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.batch_projects(text, uuid, jsonb) from public, anon, authenticated;

-- ============================================================
-- PUBLIC RPC LAYER — the only entry points, authenticated users only
-- ============================================================
create or replace function public.rpc_create_organization(_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'unauthenticated' using errcode = '42501'; end if;
  return public.batch_organizations('create', auth.uid(), _payload);
end; $$;

create or replace function public.rpc_update_organization(_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'unauthenticated' using errcode = '42501'; end if;
  return public.batch_organizations('update', auth.uid(), _payload);
end; $$;

create or replace function public.rpc_upsert_organization_member(_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'unauthenticated' using errcode = '42501'; end if;
  return public.batch_organization_members('upsert', auth.uid(), _payload);
end; $$;

create or replace function public.rpc_remove_organization_member(_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'unauthenticated' using errcode = '42501'; end if;
  return public.batch_organization_members('remove', auth.uid(), _payload);
end; $$;

create or replace function public.rpc_create_project(_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'unauthenticated' using errcode = '42501'; end if;
  return public.batch_projects('create', auth.uid(), _payload);
end; $$;

create or replace function public.rpc_update_project(_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'unauthenticated' using errcode = '42501'; end if;
  return public.batch_projects('update', auth.uid(), _payload);
end; $$;

revoke all on function public.rpc_create_organization(jsonb) from public, anon;
revoke all on function public.rpc_update_organization(jsonb) from public, anon;
revoke all on function public.rpc_upsert_organization_member(jsonb) from public, anon;
revoke all on function public.rpc_remove_organization_member(jsonb) from public, anon;
revoke all on function public.rpc_create_project(jsonb) from public, anon;
revoke all on function public.rpc_update_project(jsonb) from public, anon;

grant execute on function public.rpc_create_organization(jsonb) to authenticated;
grant execute on function public.rpc_update_organization(jsonb) to authenticated;
grant execute on function public.rpc_upsert_organization_member(jsonb) to authenticated;
grant execute on function public.rpc_remove_organization_member(jsonb) to authenticated;
grant execute on function public.rpc_create_project(jsonb) to authenticated;
grant execute on function public.rpc_update_project(jsonb) to authenticated;

-- ============================================================
-- ORG LOGO STORAGE POLICIES (bucket: org-logos)
-- ============================================================
create policy "org_logos_read"
  on storage.objects for select
  using (bucket_id = 'org-logos');

create policy "org_logos_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'org-logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "org_logos_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'org-logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "org_logos_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'org-logos' and (storage.foldername(name))[1] = auth.uid()::text);
