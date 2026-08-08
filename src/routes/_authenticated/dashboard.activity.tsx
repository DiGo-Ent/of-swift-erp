import { createFileRoute } from "@tanstack/react-router";
import { ActivityPage } from "@/features/dashboard/pages/activity-page";

export const Route = createFileRoute("/_authenticated/dashboard/activity")({
  component: ActivityPage,
});
