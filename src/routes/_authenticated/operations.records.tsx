import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/features/operations/pages/records-page";

export const Route = createFileRoute("/_authenticated/operations/records")({
  component: RecordsPage,
});
