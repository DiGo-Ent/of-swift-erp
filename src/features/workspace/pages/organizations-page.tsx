import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Btn, Field, Label, Modal, Panel, PageHeader } from "@/components/ui-kit";
import { useAuthUser } from "@/features/shell/hooks/use-auth-user";
import { activeWorkspace } from "../active-workspace";
import { createOrganization, errorMessage, listOrganizations, uploadOrgLogo, type OrganizationInput } from "../api";

const EMPTY: OrganizationInput = {
  name: "",
  legal_name: "",
  registration_number: "",
  tax_id: "",
  industry: "",
  org_size: "",
  website: "",
  contact_email: "",
  contact_phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country_code: "IN",
  timezone: "Asia/Kolkata",
  currency_code: "INR",
  locale: "en-IN",
  fiscal_year_start_month: "4",
  description: "",
};

export function OrganizationsPage() {
  const user = useAuthUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<OrganizationInput>(EMPTY);
  const [logo, setLogo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orgs = useQuery({ queryKey: ["organizations"], queryFn: listOrganizations });

  const create = useMutation({
    mutationFn: async () => {
      let logo_url: string | undefined;
      if (logo) logo_url = await uploadOrgLogo(user.id, logo);
      return createOrganization({ ...form, ...(logo_url ? { logo_url } : {}) });
    },
    onSuccess: async (org) => {
      activeWorkspace.setOrg(org.id);
      await qc.invalidateQueries({ queryKey: ["organizations"] });
      setOpen(false);
      setForm(EMPTY);
      setLogo(null);
      navigate({ to: "/organizations/$orgId/projects", params: { orgId: org.id } });
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Could not create organization"),
  });

  const set = (k: keyof OrganizationInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Select an organization"
        description="Choose an organization to work in, or create a new one to get started."
        actions={<Btn onClick={() => setOpen(true)}>New organization</Btn>}
      />

      {orgs.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {orgs.data?.length === 0 && !orgs.isLoading && (
        <Panel>
          <p className="text-sm font-medium">No organizations yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your first organization to start adding service projects.
          </p>
          <Btn className="mt-4" onClick={() => setOpen(true)}>
            Create organization
          </Btn>
        </Panel>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {orgs.data?.map((org) => (
          <Panel key={org.id} className="cursor-pointer hover:border-ring">
            <button
              className="w-full text-left"
              onClick={() => {
                activeWorkspace.setOrg(org.id);
                navigate({ to: "/organizations/$orgId/projects", params: { orgId: org.id } });
              }}
            >
              <p className="truncate text-sm font-semibold">{org.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {org.city ? `${org.city}, ` : ""}
                {org.country_code} · {org.currency_code}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Status: {org.status}</p>
            </button>
          </Panel>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create organization">
        <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div>
            <Label>Organization name *</Label>
            <Field value={form.name} onChange={set("name")} placeholder="Ram Enterprises" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Legal name</Label>
              <Field value={form.legal_name} onChange={set("legal_name")} />
            </div>
            <div>
              <Label>Industry</Label>
              <Field value={form.industry} onChange={set("industry")} />
            </div>
            <div>
              <Label>Registration no.</Label>
              <Field value={form.registration_number} onChange={set("registration_number")} />
            </div>
            <div>
              <Label>Tax / GST ID</Label>
              <Field value={form.tax_id} onChange={set("tax_id")} />
            </div>
            <div>
              <Label>Company size</Label>
              <Field value={form.org_size} onChange={set("org_size")} placeholder="1-50" />
            </div>
            <div>
              <Label>Website</Label>
              <Field value={form.website} onChange={set("website")} placeholder="https://" />
            </div>
            <div>
              <Label>Contact email</Label>
              <Field value={form.contact_email} onChange={set("contact_email")} />
            </div>
            <div>
              <Label>Contact phone</Label>
              <Field value={form.contact_phone} onChange={set("contact_phone")} />
            </div>
          </div>
          <div>
            <Label>Address line 1</Label>
            <Field value={form.address_line1} onChange={set("address_line1")} />
          </div>
          <div>
            <Label>Address line 2</Label>
            <Field value={form.address_line2} onChange={set("address_line2")} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>City</Label>
              <Field value={form.city} onChange={set("city")} />
            </div>
            <div>
              <Label>State</Label>
              <Field value={form.state} onChange={set("state")} />
            </div>
            <div>
              <Label>Postal code</Label>
              <Field value={form.postal_code} onChange={set("postal_code")} />
            </div>
            <div>
              <Label>Country code</Label>
              <Field value={form.country_code} onChange={set("country_code")} />
            </div>
            <div>
              <Label>Timezone</Label>
              <Field value={form.timezone} onChange={set("timezone")} />
            </div>
            <div>
              <Label>Currency</Label>
              <Field value={form.currency_code} onChange={set("currency_code")} />
            </div>
            <div>
              <Label>Locale</Label>
              <Field value={form.locale} onChange={set("locale")} />
            </div>
            <div>
              <Label>Fiscal year start month</Label>
              <Field
                type="number"
                min={1}
                max={12}
                value={form.fiscal_year_start_month}
                onChange={set("fiscal_year_start_month")}
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Field value={form.description} onChange={set("description")} />
          </div>
          <div>
            <Label>Organization logo</Label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="block w-full text-xs text-muted-foreground"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="outline" onClick={() => setOpen(false)} disabled={create.isPending}>
            Cancel
          </Btn>
          <Btn
            onClick={() => {
              setError(null);
              create.mutate();
            }}
            disabled={create.isPending || form.name.trim().length < 2}
          >
            {create.isPending ? "Creating…" : "Create organization"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
