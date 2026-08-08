import { createFileRoute } from "@tanstack/react-router";
import { OrganizationsPage } from "@/features/workspace/pages/organizations-page";

export const Route = createFileRoute("/_authenticated/organizations/")({
  component: OrganizationsPage,
});
