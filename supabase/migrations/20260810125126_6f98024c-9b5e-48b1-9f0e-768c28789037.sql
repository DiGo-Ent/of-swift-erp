-- =========================================================
-- 1. SERVICES (read-only catalogue)
-- =========================================================
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE CHECK (key ~ '^[a-z0-9_-]{2,40}$'),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  description text CHECK (description IS NULL OR char_length(description) <= 1000),
  category text CHECK (category IS NULL OR char_length(category) <= 80),
  icon text CHECK (icon IS NULL OR char_length(icon) <= 80),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view services"
  ON public.services FOR SELECT TO authenticated
  USING (true);

-- =========================================================
-- 2. ORGANIZATIONS (fully locked down)
-- =========================================================
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  code text NOT NULL CHECK (code ~ '^[A-Z0-9_-]{2,40}$'),
  legal_name text CHECK (legal_name IS NULL OR char_length(legal_name) BETWEEN 2 AND 160),
  org_type text NOT NULL DEFAULT 'personal'
    CHECK (org_type IN ('personal','enterprise','educational','non_profit','government')),
  industry text CHECK (industry IS NULL OR char_length(industry) <= 100),
  company_size text CHECK (company_size IS NULL OR company_size IN ('1-10','11-50','51-200','201-500','501-1000','1000+')),
  founded_on date,
  website text CHECK (website IS NULL OR website ~* '^https?://[^\s]{3,200}$'),
  email text CHECK (email IS NULL OR email ~* '^[^@\s]{1,64}@[^@\s]{1,190}\.[a-z]{2,20}$'),
  phone text CHECK (phone IS NULL OR phone ~ '^[0-9+()\-\s]{6,20}$'),
  tax_id text CHECK (tax_id IS NULL OR char_length(tax_id) <= 40),
  registration_no text CHECK (registration_no IS NULL OR char_length(registration_no) <= 60),
  address_line1 text CHECK (address_line1 IS NULL OR char_length(address_line1) <= 200),
  address_line2 text CHECK (address_line2 IS NULL OR char_length(address_line2) <= 200),
  city text CHECK (city IS NULL OR char_length(city) <= 100),
  state text CHECK (state IS NULL OR char_length(state) <= 100),
  postal_code text CHECK (postal_code IS NULL OR postal_code ~ '^[A-Za-z0-9 \-]{3,12}$'),
  country text CHECK (country IS NULL OR country ~ '^[A-Z]{2}$'),
  timezone text CHECK (timezone IS NULL OR char_length(timezone) <= 60),
  currency_code text CHECK (currency_code IS NULL OR currency_code ~ '^[A-Z]{3}$'),
  logo_url text CHECK (logo_url IS NULL OR logo_url ~* '^https?://[^\s]{3,400}$'),
  description text CHECK (description IS NULL OR char_length(description) <= 1000),
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','enterprise')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizations_owner_code_unique UNIQUE (owner_id, code)
);

REVOKE ALL ON public.organizations FROM anon, authenticated;
GRANT ALL ON public.organizations TO service_role;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;
-- Intentionally NO policies: table is unreachable from PostgREST.

-- =========================================================
-- 3. PROJECTS (fully locked down)
-- =========================================================
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  owner_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  code text NOT NULL CHECK (code ~ '^[A-Z0-9_-]{2,40}$'),
  description text CHECK (description IS NULL OR char_length(description) <= 1000),
  environment text NOT NULL DEFAULT 'production'
    CHECK (environment IN ('production','staging','sandbox')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projects_one_service_per_org UNIQUE (organization_id, service_id),
  CONSTRAINT projects_org_code_unique UNIQUE (organization_id, code)
);

REVOKE ALL ON public.projects FROM anon, authenticated;
GRANT ALL ON public.projects TO service_role;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;
-- Intentionally NO policies.

CREATE INDEX idx_organizations_owner ON public.organizations(owner_id);
CREATE INDEX idx_projects_org ON public.projects(organization_id);

-- =========================================================
-- 4. BRANCH FUNCTION: organizations
-- =========================================================
CREATE OR REPLACE FUNCTION public.batch_organizations(
  p_actor uuid,
  p_op text,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
  v_result jsonb;
  v_name text;
  v_code text;
  v_founded date;
BEGIN
  IF p_actor IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_op = 'select' THEN
    SELECT coalesce(jsonb_agg(to_jsonb(o) ORDER BY o.created_at), '[]'::jsonb)
      INTO v_result
      FROM public.organizations o
     WHERE o.owner_id = p_actor
       AND (p_payload->>'id' IS NULL OR o.id = (p_payload->>'id')::uuid);
    RETURN v_result;

  ELSIF p_op = 'insert' THEN
    v_name := btrim(coalesce(p_payload->>'name',''));
    v_code := upper(btrim(coalesce(nullif(p_payload->>'code',''), left(regexp_replace(v_name,'[^A-Za-z0-9]','','g'), 8))));
    v_founded := nullif(p_payload->>'founded_on','')::date;

    IF v_founded IS NOT NULL AND v_founded > CURRENT_DATE THEN
      RAISE EXCEPTION 'founded_on cannot be in the future';
    END IF;

    INSERT INTO public.organizations (
      owner_id, name, code, legal_name, org_type, industry, company_size, founded_on,
      website, email, phone, tax_id, registration_no,
      address_line1, address_line2, city, state, postal_code, country,
      timezone, currency_code, logo_url, description, plan
    ) VALUES (
      p_actor,
      v_name,
      v_code,
      nullif(btrim(coalesce(p_payload->>'legal_name','')),''),
      coalesce(nullif(p_payload->>'org_type',''),'personal'),
      nullif(btrim(coalesce(p_payload->>'industry','')),''),
      nullif(p_payload->>'company_size',''),
      v_founded,
      nullif(btrim(coalesce(p_payload->>'website','')),''),
      nullif(lower(btrim(coalesce(p_payload->>'email',''))),''),
      nullif(btrim(coalesce(p_payload->>'phone','')),''),
      nullif(btrim(coalesce(p_payload->>'tax_id','')),''),
      nullif(btrim(coalesce(p_payload->>'registration_no','')),''),
      nullif(btrim(coalesce(p_payload->>'address_line1','')),''),
      nullif(btrim(coalesce(p_payload->>'address_line2','')),''),
      nullif(btrim(coalesce(p_payload->>'city','')),''),
      nullif(btrim(coalesce(p_payload->>'state','')),''),
      nullif(btrim(coalesce(p_payload->>'postal_code','')),''),
      nullif(upper(btrim(coalesce(p_payload->>'country',''))),''),
      nullif(btrim(coalesce(p_payload->>'timezone','')),''),
      nullif(upper(btrim(coalesce(p_payload->>'currency_code',''))),''),
      nullif(btrim(coalesce(p_payload->>'logo_url','')),''),
      nullif(btrim(coalesce(p_payload->>'description','')),''),
      coalesce(nullif(p_payload->>'plan',''),'free')
    )
    RETURNING to_jsonb(public.organizations.*) INTO v_result;
    RETURN v_result;

  ELSIF p_op = 'update' THEN
    v_id := (p_payload->>'id')::uuid;
    IF v_id IS NULL THEN RAISE EXCEPTION 'id is required'; END IF;

    v_founded := nullif(p_payload->>'founded_on','')::date;
    IF v_founded IS NOT NULL AND v_founded > CURRENT_DATE THEN
      RAISE EXCEPTION 'founded_on cannot be in the future';
    END IF;

    UPDATE public.organizations o SET
      name            = coalesce(nullif(btrim(coalesce(p_payload->>'name','')),''), o.name),
      code            = coalesce(nullif(upper(btrim(coalesce(p_payload->>'code',''))),''), o.code),
      legal_name      = CASE WHEN p_payload ? 'legal_name' THEN nullif(btrim(coalesce(p_payload->>'legal_name','')),'') ELSE o.legal_name END,
      org_type        = coalesce(nullif(p_payload->>'org_type',''), o.org_type),
      industry        = CASE WHEN p_payload ? 'industry' THEN nullif(btrim(coalesce(p_payload->>'industry','')),'') ELSE o.industry END,
      company_size    = CASE WHEN p_payload ? 'company_size' THEN nullif(p_payload->>'company_size','') ELSE o.company_size END,
      founded_on      = CASE WHEN p_payload ? 'founded_on' THEN v_founded ELSE o.founded_on END,
      website         = CASE WHEN p_payload ? 'website' THEN nullif(btrim(coalesce(p_payload->>'website','')),'') ELSE o.website END,
      email           = CASE WHEN p_payload ? 'email' THEN nullif(lower(btrim(coalesce(p_payload->>'email',''))),'') ELSE o.email END,
      phone           = CASE WHEN p_payload ? 'phone' THEN nullif(btrim(coalesce(p_payload->>'phone','')),'') ELSE o.phone END,
      tax_id          = CASE WHEN p_payload ? 'tax_id' THEN nullif(btrim(coalesce(p_payload->>'tax_id','')),'') ELSE o.tax_id END,
      registration_no = CASE WHEN p_payload ? 'registration_no' THEN nullif(btrim(coalesce(p_payload->>'registration_no','')),'') ELSE o.registration_no END,
      address_line1   = CASE WHEN p_payload ? 'address_line1' THEN nullif(btrim(coalesce(p_payload->>'address_line1','')),'') ELSE o.address_line1 END,
      address_line2   = CASE WHEN p_payload ? 'address_line2' THEN nullif(btrim(coalesce(p_payload->>'address_line2','')),'') ELSE o.address_line2 END,
      city            = CASE WHEN p_payload ? 'city' THEN nullif(btrim(coalesce(p_payload->>'city','')),'') ELSE o.city END,
      state           = CASE WHEN p_payload ? 'state' THEN nullif(btrim(coalesce(p_payload->>'state','')),'') ELSE o.state END,
      postal_code     = CASE WHEN p_payload ? 'postal_code' THEN nullif(btrim(coalesce(p_payload->>'postal_code','')),'') ELSE o.postal_code END,
      country         = CASE WHEN p_payload ? 'country' THEN nullif(upper(btrim(coalesce(p_payload->>'country',''))),'') ELSE o.country END,
      timezone        = CASE WHEN p_payload ? 'timezone' THEN nullif(btrim(coalesce(p_payload->>'timezone','')),'') ELSE o.timezone END,
      currency_code   = CASE WHEN p_payload ? 'currency_code' THEN nullif(upper(btrim(coalesce(p_payload->>'currency_code',''))),'') ELSE o.currency_code END,
      logo_url        = CASE WHEN p_payload ? 'logo_url' THEN nullif(btrim(coalesce(p_payload->>'logo_url','')),'') ELSE o.logo_url END,
      description     = CASE WHEN p_payload ? 'description' THEN nullif(btrim(coalesce(p_payload->>'description','')),'') ELSE o.description END,
      plan            = coalesce(nullif(p_payload->>'plan',''), o.plan),
      status          = coalesce(nullif(p_payload->>'status',''), o.status),
      updated_at      = now()
    WHERE o.id = v_id AND o.owner_id = p_actor
    RETURNING to_jsonb(o.*) INTO v_result;

    IF v_result IS NULL THEN RAISE EXCEPTION 'organization not found'; END IF;
    RETURN v_result;

  ELSIF p_op = 'delete' THEN
    v_id := (p_payload->>'id')::uuid;
    IF v_id IS NULL THEN RAISE EXCEPTION 'id is required'; END IF;

    DELETE FROM public.organizations o
     WHERE o.id = v_id AND o.owner_id = p_actor
    RETURNING to_jsonb(o.*) INTO v_result;

    IF v_result IS NULL THEN RAISE EXCEPTION 'organization not found'; END IF;
    RETURN v_result;
  END IF;

  RAISE EXCEPTION 'unsupported operation';
END;
$$;

REVOKE ALL ON FUNCTION public.batch_organizations(uuid, text, jsonb) FROM public, anon, authenticated;

-- =========================================================
-- 5. BRANCH FUNCTION: projects
-- =========================================================
CREATE OR REPLACE FUNCTION public.batch_projects(
  p_actor uuid,
  p_op text,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
  v_org uuid;
  v_service uuid;
  v_name text;
  v_code text;
  v_result jsonb;
BEGIN
  IF p_actor IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_op = 'select' THEN
    SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.created_at), '[]'::jsonb)
      INTO v_result
      FROM public.projects p
     WHERE p.owner_id = p_actor
       AND (p_payload->>'organization_id' IS NULL OR p.organization_id = (p_payload->>'organization_id')::uuid)
       AND (p_payload->>'id' IS NULL OR p.id = (p_payload->>'id')::uuid);
    RETURN v_result;

  ELSIF p_op = 'insert' THEN
    v_org := (p_payload->>'organization_id')::uuid;
    v_service := (p_payload->>'service_id')::uuid;
    IF v_org IS NULL OR v_service IS NULL THEN
      RAISE EXCEPTION 'organization_id and service_id are required';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = v_org AND o.owner_id = p_actor) THEN
      RAISE EXCEPTION 'organization not found';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.services s WHERE s.id = v_service AND s.is_active) THEN
      RAISE EXCEPTION 'service not found';
    END IF;

    IF EXISTS (SELECT 1 FROM public.projects p WHERE p.organization_id = v_org AND p.service_id = v_service) THEN
      RAISE EXCEPTION 'this organization already has a project for this service';
    END IF;

    v_name := btrim(coalesce(p_payload->>'name',''));
    v_code := upper(btrim(coalesce(nullif(p_payload->>'code',''), left(regexp_replace(v_name,'[^A-Za-z0-9]','','g'), 8))));

    INSERT INTO public.projects (
      organization_id, service_id, owner_id, name, code, description, environment
    ) VALUES (
      v_org, v_service, p_actor, v_name, v_code,
      nullif(btrim(coalesce(p_payload->>'description','')),''),
      coalesce(nullif(p_payload->>'environment',''),'production')
    )
    RETURNING to_jsonb(public.projects.*) INTO v_result;
    RETURN v_result;

  ELSIF p_op = 'update' THEN
    v_id := (p_payload->>'id')::uuid;
    IF v_id IS NULL THEN RAISE EXCEPTION 'id is required'; END IF;

    UPDATE public.projects p SET
      name        = coalesce(nullif(btrim(coalesce(p_payload->>'name','')),''), p.name),
      code        = coalesce(nullif(upper(btrim(coalesce(p_payload->>'code',''))),''), p.code),
      description = CASE WHEN p_payload ? 'description' THEN nullif(btrim(coalesce(p_payload->>'description','')),'') ELSE p.description END,
      environment = coalesce(nullif(p_payload->>'environment',''), p.environment),
      status      = coalesce(nullif(p_payload->>'status',''), p.status),
      updated_at  = now()
    WHERE p.id = v_id AND p.owner_id = p_actor
    RETURNING to_jsonb(p.*) INTO v_result;

    IF v_result IS NULL THEN RAISE EXCEPTION 'project not found'; END IF;
    RETURN v_result;

  ELSIF p_op = 'delete' THEN
    v_id := (p_payload->>'id')::uuid;
    IF v_id IS NULL THEN RAISE EXCEPTION 'id is required'; END IF;

    DELETE FROM public.projects p
     WHERE p.id = v_id AND p.owner_id = p_actor
    RETURNING to_jsonb(p.*) INTO v_result;

    IF v_result IS NULL THEN RAISE EXCEPTION 'project not found'; END IF;
    RETURN v_result;
  END IF;

  RAISE EXCEPTION 'unsupported operation';
END;
$$;

REVOKE ALL ON FUNCTION public.batch_projects(uuid, text, jsonb) FROM public, anon, authenticated;

-- =========================================================
-- 6. SINGLE PUBLIC RPC ENTRY POINT
-- =========================================================
CREATE OR REPLACE FUNCTION public.rpc_workspace(
  p_action text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_op text;
  v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF jsonb_typeof(v_payload) <> 'object' THEN
    RAISE EXCEPTION 'invalid payload';
  END IF;

  v_op := lower(btrim(coalesce(v_payload->>'op','select')));
  IF v_op NOT IN ('select','insert','update','delete') THEN
    RAISE EXCEPTION 'unsupported operation';
  END IF;

  CASE lower(btrim(coalesce(p_action,'')))
    WHEN 'organizations' THEN
      RETURN public.batch_organizations(v_actor, v_op, v_payload);
    WHEN 'projects' THEN
      RETURN public.batch_projects(v_actor, v_op, v_payload);
    ELSE
      RAISE EXCEPTION 'unsupported action';
  END CASE;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_workspace(text, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rpc_workspace(text, jsonb) TO authenticated;

-- =========================================================
-- 7. SEED SERVICES
-- =========================================================
INSERT INTO public.services (key, name, description, category, icon) VALUES
  ('hr', 'HR Management', 'Employee records, attendance, payroll and leave management.', 'Human Resources', 'users'),
  ('institution', 'Institution & School Management', 'Students, admissions, classes, fees and academic administration.', 'Education', 'graduation-cap');
