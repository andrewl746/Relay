export function isUniversityEmail(email: string, domain: string) {
  const value = email.trim().toLowerCase();
  const at = value.lastIndexOf("@");
  if (at < 1 || at === value.length - 1) return false;
  const host = value.slice(at + 1);
  return host === domain || host.endsWith(`.${domain}`);
}
