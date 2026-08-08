// Single guarded service-worker registration point.
const BLOCKED_HOST_SUFFIXES = [
  ".lovableproject.com",
  ".lovableproject-dev.com",
  ".beta.lovable.dev",
];
const BLOCKED_HOSTS = ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"];

function isBlockedContext() {
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  if (new URL(window.location.href).searchParams.get("sw") === "off") return true;
  const h = window.location.hostname;
  if (h.startsWith("id-preview--") || h.startsWith("preview--")) return true;
  if (BLOCKED_HOSTS.includes(h)) return true;
  return BLOCKED_HOST_SUFFIXES.some((s) => h.endsWith(s));
}

export async function setupPwa() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  if (isBlockedContext()) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter((r) => (r.active?.scriptURL ?? "").endsWith("/sw.js"))
        .map((r) => r.unregister()),
    );
    return;
  }

  const { registerSW } = await import("virtual:pwa-register");
  registerSW({ immediate: true, onNeedRefresh() {}, onOfflineReady() {} });
}