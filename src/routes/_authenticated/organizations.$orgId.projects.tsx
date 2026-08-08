import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/features/workspace/pages/projects-page";

export const Route = createFileRoute("/_authenticated/organizations/$orgId/projects")({
  component: ProjectsPage,
});
