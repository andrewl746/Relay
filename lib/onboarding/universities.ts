export type CampusAddress = {
  street: string
  city: string
  province: string
  country: string
  postalCode: string
}

export type University = {
  id: string
  name: string
  shortName: string
  emailDomain: string
  /** Official campus address, used when someone says they live on campus. */
  campus: CampusAddress
}

export const UNIVERSITIES: University[] = [
  { id: "uw", name: "University of Waterloo", shortName: "Waterloo", emailDomain: "uwaterloo.ca", campus: { street: "200 University Ave W", city: "Waterloo", province: "ON", country: "Canada", postalCode: "N2L 3G1" } },
  { id: "uoft", name: "University of Toronto", shortName: "U of T", emailDomain: "mail.utoronto.ca", campus: { street: "27 King’s College Cir", city: "Toronto", province: "ON", country: "Canada", postalCode: "M5S 1A1" } },
  { id: "ubc", name: "University of British Columbia", shortName: "UBC", emailDomain: "student.ubc.ca", campus: { street: "2329 West Mall", city: "Vancouver", province: "BC", country: "Canada", postalCode: "V6T 1Z4" } },
  { id: "mcgill", name: "McGill University", shortName: "McGill", emailDomain: "mail.mcgill.ca", campus: { street: "845 Sherbrooke St W", city: "Montreal", province: "QC", country: "Canada", postalCode: "H3A 0G4" } },
  { id: "queens", name: "Queen's University", shortName: "Queen's", emailDomain: "queensu.ca", campus: { street: "99 University Ave", city: "Kingston", province: "ON", country: "Canada", postalCode: "K7L 3N6" } },
  { id: "western", name: "Western University", shortName: "Western", emailDomain: "uwo.ca", campus: { street: "1151 Richmond St", city: "London", province: "ON", country: "Canada", postalCode: "N6A 3K7" } },
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
