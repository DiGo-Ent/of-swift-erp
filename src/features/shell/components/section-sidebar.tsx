import { Link } from "@tanstack/react-router";
import { PanelLeftClose } from "lucide-react";
import type { Section } from "../navigation";

type Props = {
  section: Section;
  onCollapse: () => void;
};

/** Secondary sidebar listing the active section's pages — desktop only. */
export function SectionSidebar({ section, onCollapse }: Props) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex items-center justify-between px-3 py-3">
        <span className="truncate text-sm font-semibold">{section.label}</span>
        <button
          onClick={onCollapse}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          title="Collapse"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>
      <div className="flex flex-col gap-0.5 px-2 pb-2">
        {section.items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
            className="truncate rounded-md px-2.5 py-2 text-[13px] text-sidebar-foreground hover:bg-sidebar-accent sm:py-1.5"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
