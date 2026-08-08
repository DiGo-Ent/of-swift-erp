import { createFileRoute } from "@tanstack/react-router";
import { ModulesPage } from "@/features/operations/pages/modules-page";

export const Route = createFileRoute("/_authenticated/operations/")({
  component: ModulesPage,
});
