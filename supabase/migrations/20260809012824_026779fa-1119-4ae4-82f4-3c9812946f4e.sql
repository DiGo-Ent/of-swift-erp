CREATE OR REPLACE FUNCTION public.batch_organizations(_op text, _actor uuid, _payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      if v_txt ~* '(;|--|/\*|\*/)\s*(select|insert|update|delete|drop|alter|truncate|grant|revoke|union)\y'
         or v_txt ~* '\yunion\s+(all\s+)?select\y'
         or v_txt ~* '\y(drop|truncate)\s+table\y' then
        raise exception 'field % contains disallowed sql pattern', v_key using errcode = '22023';
      end if;
    end if;
  end loop;

  if nullif(btrim(coalesce(_payload->>'logo_url','')),'') is not null
     and btrim(_payload->>'logo_url') !~ ('^' || _actor::text || '/[A-Za-z0-9._-]{1,120}$') then
    raise exception 'invalid logo reference' using errcode = '22023';
  end if;

  if _op = 'create' then
    v_name := btrim(coalesce(_payload->>'name',''));
    if length(v_name) < 2 or length(v_name) > 120 then
      raise exception 'organization name must be 2-120 characters' using errcode = '22023';
    end if;
    if v_name !~ '^[[:alnum:]][[:alnum:] .,''&()_/-]*$' then
      raise exception 'organization name has invalid characters' using errcode = '22023';
    end if;

    v_txt := nullif(btrim(coalesce(_payload->>'contact_email','')), '');
    if v_txt is not null and v_txt !~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' then
      raise exception 'invalid contact email' using errcode = '22023';
    end if;
    if nullif(btrim(coalesce(_payload->>'contact_phone','')),'') is not null
       and btrim(_payload->>'contact_phone') !~ '^\+?[0-9 ()-]{6,20}$' then
      raise exception 'invalid contact phone' using errcode = '22023';
    end if;
    if nullif(btrim(coalesce(_payload->>'website','')),'') is not null
       and btrim(_payload->>'website') !~* '^https?://[a-z0-9.-]+\.[a-z]{2,}(/[^[:space:]]*)?$' then
      raise exception 'invalid website url' using errcode = '22023';
    end if;

    v_num := coalesce(nullif(_payload->>'fiscal_year_start_month','')::smallint, 4);
    if v_num < 1 or v_num > 12 then
      raise exception 'fiscal_year_start_month must be 1-12' using errcode = '22023';
    end if;

    v_base := btrim(regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'), '-');
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
end; $function$;

CREATE OR REPLACE FUNCTION public.batch_projects(_op text, _actor uuid, _payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_org uuid; v_service uuid; v_name text; v_row public.projects%rowtype;
  v_txt text; v_key text; v_id uuid; v_status text;
begin
  if _actor is null then raise exception 'unauthenticated' using errcode = '42501'; end if;
  if _payload is null or jsonb_typeof(_payload) <> 'object' then
    raise exception 'invalid payload' using errcode = '22023';
  end if;

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
      if v_txt ~* '(;|--|/\*|\*/)\s*(select|insert|update|delete|drop|alter|truncate|grant|revoke|union)\y'
         or v_txt ~* '\yunion\s+(all\s+)?select\y'
         or v_txt ~* '\y(drop|truncate)\s+table\y' then
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
    if v_name !~ '^[[:alnum:]][[:alnum:] .,''&()_/-]*$' then
      raise exception 'project name has invalid characters' using errcode = '22023';
    end if;
    if nullif(btrim(coalesce(_payload->>'code','')),'') is not null
       and btrim(_payload->>'code') !~ '^[A-Za-z0-9_-]{2,24}$' then
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
end; $function$;