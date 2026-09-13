export const USER_COOKIE = "relay-user";

export function setDevUser(userId: string) {
  document.cookie = `${USER_COOKIE}=${encodeURIComponent(userId)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}

export function safeNextPath(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
