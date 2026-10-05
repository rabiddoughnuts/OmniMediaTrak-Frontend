export const AUTH_CHANGED_EVENT = "omnimediatrak:auth";
export const AUTH_CHANGE_STORAGE_KEY = "omnimediatrak-auth-change";

type AuthChangeReason = "login" | "logout";

export function notifyAuthChanged(reason: AuthChangeReason) {
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: { reason } }));
  try {
    const nonce = typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
    window.localStorage.setItem(
      AUTH_CHANGE_STORAGE_KEY,
      JSON.stringify({ reason, at: Date.now(), nonce })
    );
  } catch {
    // The current tab still navigates; storage may be unavailable by browser policy.
  }
}

export function safeAuthRedirectPath(requestedPath: string | null | undefined): string {
  if (!requestedPath) return "/";
  try {
    const base = new URL("https://omnimediatrak.invalid");
    const target = new URL(requestedPath, base);
    if (target.origin !== base.origin) return "/";
    if (["/auth/login", "/auth/register", "/auth/logout"].includes(target.pathname)) return "/";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/";
  }
}
