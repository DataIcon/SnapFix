export type UserRole = "civilian" | "civi-work";

export type SnapfixSession = {
  displayName: string;
  role: UserRole;
};

const SESSION_KEY = "snapfix_session";

export function getSession(): SnapfixSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<SnapfixSession>;
    if (
      p &&
      typeof p.displayName === "string" &&
      (p.role === "civilian" || p.role === "civi-work")
    ) {
      return { displayName: p.displayName.trim() || "משתמש", role: p.role };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function setSession(session: SnapfixSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
