import { Suspense, useState } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { Btn, Modal } from "@/components/ui-kit";
import { SECTIONS, sectionFor } from "../navigation";
import { RailSidebar } from "./rail-sidebar";
import { SectionSidebar } from "./section-sidebar";
import { Topbar, SectionTabs, MobileTabBar } from "./topbar";
import { useSignOut } from "../hooks/use-sign-out";
import { useAuthUser } from "../hooks/use-auth-user";

export function AppShell() {
  const user = useAuthUser();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const section = sectionFor(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { confirmOpen, setConfirmOpen, signingOut, signOut } = useSignOut();

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background text-foreground">
      <RailSidebar
        section={section}
        onExpand={() => setSidebarOpen(true)}
        onSignOut={() => setConfirmOpen(true)}
      />
      {sidebarOpen && (
        <SectionSidebar section={section} onCollapse={() => setSidebarOpen(false)} />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          email={user.email}
          sidebarOpen={sidebarOpen}
          onExpand={() => setSidebarOpen(true)}
          onSignOut={() => setConfirmOpen(true)}
        />
        <SectionTabs section={section} />

        {/* Only this region swaps when navigating between feature pages. */}
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 pb-24 sm:px-5 sm:py-5 lg:pb-6">
          <div className="mx-auto w-full max-w-5xl">
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
              <Outlet />
            </Suspense>
          </div>
        </main>

        <MobileTabBar section={section} sections={SECTIONS} />
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Log out?">
        <p className="text-xs text-muted-foreground">
          You will need to sign in again, including two-factor verification.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="outline" onClick={() => setConfirmOpen(false)} disabled={signingOut}>
            Cancel
          </Btn>
          <Btn variant="danger" onClick={signOut} disabled={signingOut}>
            {signingOut ? "Logging out…" : "Log out"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
