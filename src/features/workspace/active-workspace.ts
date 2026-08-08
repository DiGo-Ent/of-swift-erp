const ORG_KEY = "workspace.active_org";
const PROJECT_KEY = "workspace.active_project";

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

export const activeWorkspace = {
  orgId: () => read(ORG_KEY),
  projectId: () => read(PROJECT_KEY),
  setOrg(id: string) {
    window.localStorage.setItem(ORG_KEY, id);
    window.localStorage.removeItem(PROJECT_KEY);
  },
  setProject(id: string) {
    window.localStorage.setItem(PROJECT_KEY, id);
  },
  clear() {
    window.localStorage.removeItem(ORG_KEY);
    window.localStorage.removeItem(PROJECT_KEY);
  },
};
