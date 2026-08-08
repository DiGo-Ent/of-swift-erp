import { Link } from "@tanstack/react-router";
import { PanelLeft } from "lucide-react";
import type { Section } from "../navigation";
import logo from "@/assets/digo-logo.png.asset.json";

type Props = {
  email: string | null | undefined;
  sidebarOpen: boolean;
  onExpand: () => void;
  onSignOut: () => void;
};

export function Topbar({ email, sidebarOpen, onExpand, onSignOut }: Props) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3 sm:gap-3 sm:px-4">
      {!sidebarOpen && (
        <button
          onClick={onExpand}
          title="Expand sidebar"
          className="hidden shrink-0 text-muted-foreground lg:block"
        >
          <PanelLeft size={15} />
        </button>
      )}
      <img
        src={logo.url}
        alt="DiGo"
        width={22}
        height={22}
        className="h-[22px] w-[22px] shrink-0 lg:hidden"
      />
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="truncate text-sm font-medium">ERP Solution</span>
        <span className="hidden text-[11px] text-muted-foreground sm:inline">Powered by DiGo</span>
      </div>
      <span className="ml-auto hidden max-w-[200px] truncate text-xs text-muted-foreground md:block">
        {email}
      </span>
      <button
        onClick={onSignOut}
        className="ml-auto shrink-0 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent md:ml-0"
      >
        Log out
      </button>
    </header>
  );
}

/** Mobile / tablet sub-navigation for the active section. */
export function SectionTabs({ section }: { section: Section }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border bg-sidebar px-3 py-2 lg:hidden">
      {section.items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: true }}
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
          className="shrink-0 rounded-md px-3 py-1.5 text-xs text-muted-foreground"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

/** Mobile bottom tab bar. */
export function MobileTabBar({
  section,
  sections,
}: {
  section: Section;
  sections: readonly Section[];
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] lg:hidden">
      {sections.map((s) => {
        const Icon = s.icon;
        const active = section.id === s.id;
        return (
          <Link
            key={s.id}
            to={s.items[0].to}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${
              active ? "text-sidebar-primary" : "text-muted-foreground"
            }`}
          >
            <Icon size={18} />
            <span className="truncate">{s.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
