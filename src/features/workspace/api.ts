import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Organization = Tables<"organizations">;
export type Project = Tables<"projects">;
export type Service = Tables<"services">;

export const LOGO_BUCKET = "org-logos";

/** Services catalog — read-only for every signed-in user. */
export async function listServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Organizations the signed-in user is a member of (enforced by RLS). */
export async function listOrganizations(): Promise<Organization[]> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listProjects(orgId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type OrganizationInput = {
  name: string;
  legal_name?: string;
  registration_number?: string;
  tax_id?: string;
  industry?: string;
  org_size?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country_code?: string;
  timezone?: string;
  currency_code?: string;
  locale?: string;
  fiscal_year_start_month?: string;
  description?: string;
  logo_url?: string;
};

/** Creates the organization; the creator automatically becomes its admin. */
export async function createOrganization(input: OrganizationInput): Promise<Organization> {
  const { data, error } = await supabase.rpc("rpc_create_organization", {
    _payload: input as never,
  });
  if (error) throw error;
  return data as unknown as Organization;
}

export type ProjectInput = {
  org_id: string;
  service_id: string;
  name: string;
  code?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  currency_code?: string;
  timezone?: string;
};

/** One project per service per organization — enforced server-side. */
export async function createProject(input: ProjectInput): Promise<Project> {
  const { data, error } = await supabase.rpc("rpc_create_project", {
    _payload: input as never,
  });
  if (error) throw error;
  return data as unknown as Project;
}

/** Uploads a logo into the caller's own folder and returns its storage path. */
export async function uploadOrgLogo(userId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/${crypto.randomUUID()}.${ext || "png"}`;
  const { error } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}

export async function signedLogoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(LOGO_BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

/** Surfaces the real Postgres/RPC message instead of a generic fallback. */
export function errorMessage(e: unknown, fallback: string): string {
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return fallback;
}
