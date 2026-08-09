import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { activeWorkspace } from "@/features/workspace/active-workspace";
import { listOrganizations, listProjects, listServices } from "@/features/workspace/api";

function useOutsideClose(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return ref;
}

type MenuItem = { id: string; label: string; hint?: string };

function Switcher({
  label,
  items,
  activeId,
  onSelect,
  footer,
}: {
  label: string;
  items: MenuItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  footer?: { label: string; onClick: () => void };
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(() => setOpen(false));
  const active = items.find((i) => i.id === activeId);

  return (
    <div className="relative min-w-0" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex min-w-0 max-w-[190px] items-center gap-1.5 rounded-md px-2 py-1 text-sm hover:bg-accent"
        title={active?.label ?? label}
      >
        <span className="truncate font-medium">{active?.label ?? label}</span>
        <ChevronsUpDown size={13} className="shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-md border border-border bg-popover shadow-md">
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <div className="max-h-64 overflow-y-auto py-1">
            {items.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">Nothing here yet</p>
            )}
            {items.map((i) => (
              <button
                key={i.id}
                onClick={() => {
                  setOpen(false);
                  onSelect(i.id);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-accent"
              >
                <span className="min-w-0 flex-1 truncate">{i.label}</span>
                {i.hint && (
                  <span className="shrink-0 text-[10px] text-muted-foreground">{i.hint}</span>
                )}
                {i.id === activeId && <Check size={13} className="shrink-0 text-primary" />}
              </button>
            ))}
          </div>
          {footer && (
            <button
              onClick={() => {
                setOpen(false);
                footer.onClick();
              }}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-[13px] hover:bg-accent"
            >
              <Plus size={13} /> {footer.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Org → project breadcrumb switcher shown in the global header. */
export function WorkspaceSwitcher() {
  const navigate = useNavigate();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    setOrgId(activeWorkspace.orgId());
    setProjectId(activeWorkspace.projectId());
  }, []);

  const orgs = useQuery({ queryKey: ["organizations"], queryFn: listOrganizations });
  const services = useQuery({ queryKey: ["services"], queryFn: listServices });
  const projects = useQuery({
    queryKey: ["projects", orgId],
    queryFn: () => listProjects(orgId!),
    enabled: !!orgId,
  });

  const resolvedOrgId = orgs.data?.find((o) => o.id === orgId)?.id ?? orgs.data?.[0]?.id ?? null;

  return (
    <div className="flex min-w-0 items-center gap-1">
      <Switcher
        label="Organizations"
        activeId={resolvedOrgId}
        items={(orgs.data ?? []).map((o) => ({ id: o.id, label: o.name }))}
        onSelect={(id) => {
          activeWorkspace.setOrg(id);
          setOrgId(id);
          setProjectId(null);
          navigate({ to: "/organizations/$orgId/projects", params: { orgId: id } });
        }}
        footer={{ label: "New organization", onClick: () => navigate({ to: "/organizations" }) }}
      />
      <span className="text-muted-foreground">/</span>
      <Switcher
        label="Projects"
        activeId={projectId}
        items={(projects.data ?? []).map((p) => ({
          id: p.id,
          label: p.name,
          hint: services.data?.find((s) => s.id === p.service_id)?.name,
        }))}
        onSelect={(id) => {
          activeWorkspace.setProject(id);
          setProjectId(id);
          navigate({ to: "/dashboard" });
        }}
        footer={{
          label: "New project",
          onClick: () =>
            resolvedOrgId &&
            navigate({
              to: "/organizations/$orgId/projects",
              params: { orgId: resolvedOrgId },
            }),
        }}
      />
    </div>
  );
}
