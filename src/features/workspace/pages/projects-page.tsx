import { useState } from "react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Btn, Field, Label, Modal, Panel, PageHeader } from "@/components/ui-kit";
import { activeWorkspace } from "../active-workspace";
import { createProject, listOrganizations, listProjects, listServices } from "../api";

const route = getRouteApi("/_authenticated/organizations/$orgId/projects");

export function ProjectsPage() {
  const { orgId } = route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const orgs = useQuery({ queryKey: ["organizations"], queryFn: listOrganizations });
  const services = useQuery({ queryKey: ["services"], queryFn: listServices });
  const projects = useQuery({
    queryKey: ["projects", orgId],
    queryFn: () => listProjects(orgId),
  });

  const org = orgs.data?.find((o) => o.id === orgId);
  const usedServiceIds = new Set((projects.data ?? []).map((p) => p.service_id));

  const create = useMutation({
    mutationFn: () =>
      createProject({
        org_id: orgId,
        service_id: serviceId!,
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
      }),
    onSuccess: async (project) => {
      activeWorkspace.setOrg(orgId);
      activeWorkspace.setProject(project.id);
      await qc.invalidateQueries({ queryKey: ["projects", orgId] });
      setServiceId(null);
      setName("");
      setCode("");
      setDescription("");
      navigate({ to: "/dashboard" });
    },
    onError: (e: unknown) =>
      setError(e instanceof Error ? e.message : "Could not create project"),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={org ? `${org.name} — projects` : "Projects"}
        description="One project per service. Pick an existing project or create a new one."
        actions={
          <Btn variant="outline" onClick={() => navigate({ to: "/organizations" })}>
            Change organization
          </Btn>
        }
      />

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Your projects
        </h2>
        {projects.data?.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No project yet in this organization.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.data?.map((p) => {
            const service = services.data?.find((s) => s.id === p.service_id);
            return (
              <Panel key={p.id} className="cursor-pointer hover:border-ring">
                <button
                  className="w-full text-left"
                  onClick={() => {
                    activeWorkspace.setOrg(orgId);
                    activeWorkspace.setProject(p.id);
                    navigate({ to: "/dashboard" });
                  }}
                >
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {service?.name ?? "Service"} · {p.status}
                  </p>
                </button>
              </Panel>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Available services
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.data?.map((s) => {
            const taken = usedServiceIds.has(s.id);
            return (
              <Panel key={s.id} className={taken ? "opacity-60" : ""}>
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                <Btn
                  className="mt-3 h-8 px-3 text-xs"
                  variant={taken ? "outline" : "primary"}
                  disabled={taken}
                  onClick={() => {
                    setError(null);
                    setServiceId(s.id);
                  }}
                >
                  {taken ? "Already created" : "Create project"}
                </Btn>
              </Panel>
            );
          })}
        </div>
      </section>

      <Modal open={!!serviceId} onClose={() => setServiceId(null)} title="Create project">
        <div className="space-y-3">
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div>
            <Label>Project name *</Label>
            <Field value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Project code</Label>
            <Field value={code} onChange={(e) => setCode(e.target.value)} placeholder="HRM-01" />
          </div>
          <div>
            <Label>Description</Label>
            <Field value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="outline" onClick={() => setServiceId(null)} disabled={create.isPending}>
            Cancel
          </Btn>
          <Btn onClick={() => create.mutate()} disabled={create.isPending || name.trim().length < 2}>
            {create.isPending ? "Creating…" : "Create project"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
