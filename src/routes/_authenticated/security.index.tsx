import { createFileRoute } from "@tanstack/react-router";
import { TwoFactorPage } from "@/features/security/pages/two-factor-page";

export const Route = createFileRoute("/_authenticated/security/")({
  component: TwoFactorPage,
});
