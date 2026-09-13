export type University = { id: string; name: string; shortName: string; emailDomain: string };

export const UNIVERSITIES: University[] = [
  { id: "uw", name: "University of Waterloo", shortName: "Waterloo", emailDomain: "uwaterloo.ca" },
  { id: "uoft", name: "University of Toronto", shortName: "U of T", emailDomain: "mail.utoronto.ca" },
  { id: "ubc", name: "University of British Columbia", shortName: "UBC", emailDomain: "student.ubc.ca" },
  { id: "mcgill", name: "McGill University", shortName: "McGill", emailDomain: "mail.mcgill.ca" },
  { id: "queens", name: "Queen's University", shortName: "Queen's", emailDomain: "queensu.ca" },
  { id: "western", name: "Western University", shortName: "Western", emailDomain: "uwo.ca" },
];

export function searchUniversities(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return UNIVERSITIES;
  return UNIVERSITIES.filter(
    (u) => u.name.toLowerCase().includes(q) || u.shortName.toLowerCase().includes(q),
  );
}

export function getUniversity(id: string) {
  return UNIVERSITIES.find((u) => u.id === id) ?? null;
}
