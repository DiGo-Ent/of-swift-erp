import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/features/settings/pages/account-page";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: AccountPage,
});
