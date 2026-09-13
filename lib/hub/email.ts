export function getUniversityDomain(email: string): string | null {
  const value = email.trim().toLowerCase();
  const at = value.lastIndexOf("@");
  if (at < 1 || at === value.length - 1) return null;
  const host = value.slice(at + 1);

  // For the hackathon, we accept any .edu, .ac.uk, or .ca domain as a valid university.
  if (host.endsWith('.edu') || host.endsWith('.ac.uk') || host.endsWith('.ca')) {
    return host;
  }
  return null;
}

export function isUniversityEmail(email: string): boolean {
  return getUniversityDomain(email) !== null;
}
