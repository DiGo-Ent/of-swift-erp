import { supabase } from '@/integrations/supabase/client';
import type {
  Organization,
  OrganizationInput,
  Project,
  ProjectInput,
  Service,
} from '@/types/organization.types';

type Row = Record<string, unknown>;

const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.length > 0 ? v : undefined;

function mapOrganization(row: Row): Organization {
  return {
    id: String(row.id),
    name: String(row.name),
    code: String(row.code),
    legalName: str(row.legal_name),
    orgType: str(row.org_type),
    industry: str(row.industry),
    companySize: str(row.company_size),
    foundedOn: str(row.founded_on),
    website: str(row.website),
    email: str(row.email),
    phone: str(row.phone),
    taxId: str(row.tax_id),
    registrationNo: str(row.registration_no),
    addressLine1: str(row.address_line1),
    addressLine2: str(row.address_line2),
    city: str(row.city),
    state: str(row.state),
    postalCode: str(row.postal_code),
    country: str(row.country),
    timezone: str(row.timezone),
    currencyCode: str(row.currency_code),
    logoUrl: str(row.logo_url),
    description: str(row.description),
    plan: str(row.plan),
    status: str(row.status),
    createdAt: String(row.created_at ?? '').split('T')[0],
  };
}

function mapProject(row: Row): Project {
  return {
    id: String(row.id),
    orgId: String(row.organization_id),
    serviceId: String(row.service_id),
    name: String(row.name),
    code: String(row.code),
    description: str(row.description),
    environment: str(row.environment),
    status: str(row.status),
    createdAt: String(row.created_at ?? '').split('T')[0],
  };
}

/**
 * All table access goes through the single secured RPC entry point.
 * No getSession()/refreshSession() here — the Supabase client already handles
 * token refresh (autoRefreshToken), so every extra call was pure overhead.
 */
async function callWorkspace(action: 'organizations' | 'projects', payload: Record<string, unknown>) {
  const { data, error } = await supabase.rpc('rpc_workspace', {
    p_action: action,
    p_payload: payload as never,
  });

  if (error) throw new Error(error.message);
  return data as unknown;
}

export const organizationService = {
  async fetchServices(): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('id, key, name, description, category, icon')
      .eq('is_active', true)
      .order('name');
    if (error) throw new Error(error.message);
    return (data ?? []).map((s) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      description: s.description ?? undefined,
      category: s.category ?? undefined,
      icon: s.icon ?? undefined,
    }));
  },


  async fetchOrganizations(): Promise<Organization[]> {
    const rows = (await callWorkspace('organizations', { op: 'select' })) as Row[] | null;
    return (rows ?? []).map(mapOrganization);
  },

  async fetchProjects(orgId?: string): Promise<Project[]> {
    const rows = (await callWorkspace('projects', {
      op: 'select',
      ...(orgId ? { organization_id: orgId } : {}),
    })) as Row[] | null;
    return (rows ?? []).map(mapProject);
  },

  async createOrganization(input: OrganizationInput): Promise<Organization> {
    const row = (await callWorkspace('organizations', {
      op: 'insert',
      name: input.name,
      code: input.code,
      legal_name: input.legalName,
      org_type: input.orgType,
      industry: input.industry,
      company_size: input.companySize,
      founded_on: input.foundedOn,
      website: input.website,
      email: input.email,
      phone: input.phone,
      tax_id: input.taxId,
      registration_no: input.registrationNo,
      address_line1: input.addressLine1,
      address_line2: input.addressLine2,
      city: input.city,
      state: input.state,
      postal_code: input.postalCode,
      country: input.country,
      timezone: input.timezone,
      currency_code: input.currencyCode,
      description: input.description,
      plan: input.plan,
    })) as Row;
    return mapOrganization(row);
  },

  async createProject(input: ProjectInput): Promise<Project> {
    const row = (await callWorkspace('projects', {
      op: 'insert',
      organization_id: input.orgId,
      service_id: input.serviceId,
      name: input.name,
      code: input.code,
      description: input.description,
      environment: input.environment,
    })) as Row;
    return mapProject(row);
  },

  async deleteOrganization(id: string): Promise<void> {
    await callWorkspace('organizations', { op: 'delete', id });
  },

  async deleteProject(id: string): Promise<void> {
    await callWorkspace('projects', { op: 'delete', id });
  },
};
