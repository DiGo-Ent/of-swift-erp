import { createFileRoute } from "@tanstack/react-router";
import { SessionPage } from "@/features/security/pages/session-page";

export const Route = createFileRoute("/_authenticated/security/sessions")({
  component: SessionPage,
});
