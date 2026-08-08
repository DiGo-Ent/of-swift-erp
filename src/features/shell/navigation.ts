import { LayoutDashboard, Boxes, ShieldCheck, Settings } from "lucide-react";

export const SECTIONS = [
  {
    id: "workspace",
    label: "Workspace",
    icon: LayoutDashboard,
    items: [
      { to: "/dashboard", label: "Overview" },
      { to: "/dashboard/activity", label: "Activity" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: Boxes,
    items: [
      { to: "/operations", label: "Modules" },
      { to: "/operations/records", label: "Records" },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: ShieldCheck,
    items: [
      { to: "/security", label: "Two-factor (TOTP)" },
      { to: "/security/sessions", label: "Session" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    items: [{ to: "/settings", label: "Account" }],
  },
] as const;

export type Section = (typeof SECTIONS)[number];

export function sectionFor(pathname: string): Section {
  return (
    SECTIONS.find((s) =>
      s.items.some((i) => pathname === i.to || pathname.startsWith(`${i.to}/`)),
    ) ??
    SECTIONS.find((s) =>
      pathname.startsWith(`/${s.id === "workspace" ? "dashboard" : s.id}`),
    ) ??
    SECTIONS[0]
  );
}
