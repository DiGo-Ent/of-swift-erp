
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

  -- INLINE sanitation: control chars, XSS markup and SQL-injection patterns
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

  -- logo is a private storage object path: <uid>/<file>
  if nullif(btrim(coalesce(_payload->>'logo_url','')),'') is not null
     and btrim(_payload->>'logo_url') !~ ('^' || _actor::text || '/[A-Za-z0-9._\-]{1,120}$') then
    raise exception 'invalid logo reference' using errcode = '22023';
  end if;

  if _op = 'create' then
    v_name := btrim(coalesce(_payload->>'name',''));
    if length(v_name) < 2 or length(v_name) > 120 then
      raise exception 'organization name must be 2-120 characters' using errcode = '22023';
    end if;
    if v_name !~ '^[\p{L}\p{N}][\p{L}\p{N} .,''&()\-_/]*$' then
      raise exception 'organization name has invalid characters' using errcode = '22023';
    end if;

    v_txt := nullif(btrim(coalesce(_payload->>'contact_email','')), '');
    if v_txt is not null and v_txt !~* '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$' then
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
end; $$;

revoke all on function public.batch_organizations(text, uuid, jsonb) from public, anon, authenticated;
