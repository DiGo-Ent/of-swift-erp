import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/features/shell/components/app-shell";
import { activeWorkspace } from "@/features/workspace/active-workspace";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/" });

    // Workspace gate: an organization (and a project inside it) must be
    // selected before any feature page becomes reachable.
    if (!location.pathname.startsWith("/organizations")) {
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id")
        .order("created_at", { ascending: true });

      if (!orgs || orgs.length === 0) throw redirect({ to: "/organizations" });

      const stored = activeWorkspace.orgId();
      const orgId = orgs.find((o) => o.id === stored)?.id ?? orgs[0]!.id;

      const { data: projects } = await supabase
        .from("projects")
        .select("id")
        .eq("org_id", orgId)
        .limit(1);

      if (!projects || projects.length === 0) {
        throw redirect({ to: "/organizations/$orgId/projects", params: { orgId } });
      }
    }

    return { user: data.user };
  },
  component: AppShell,
});
