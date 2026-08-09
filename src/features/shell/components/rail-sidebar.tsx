import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { SECTIONS, type Section } from "../navigation";
import logo from "@/assets/digo-logo.png.asset.json";

type Props = {
  section: Section;
  onExpand: () => void;
  onSignOut: () => void;
};

/** Primary (icon rail) sidebar — desktop only. */
export function RailSidebar({ section, onExpand, onSignOut }: Props) {
  return (
    <nav className="hidden w-14 shrink-0 flex-col items-center gap-1 border-r border-sidebar-border bg-sidebar py-3 lg:flex">

      {SECTIONS.map((s) => {
        const Icon = s.icon;
        return (
          <Link
            key={s.id}
            to={s.items[0].to}
            title={s.label}
            onClick={onExpand}
            className={`flex h-9 w-9 items-center justify-center rounded-md ${
              section.id === s.id
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-muted-foreground hover:bg-sidebar-accent"
            }`}
          >
            <Icon size={17} />
          </Link>
        );
      })}
      <button
        onClick={onSignOut}
        title="Log out"
        className="mt-auto flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-destructive"
      >
        <LogOut size={17} />
      </button>
    </nav>
  );
}
