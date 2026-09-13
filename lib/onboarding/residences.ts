import { getUniversity, type CampusAddress } from "./universities";

export type Residence = { id: string; name: string; street: string; postalCode: string };

/** Picking this instead of a building shows the typed address fields. */
export const RESIDENCE_NOT_LISTED = "not-listed";

/**
 * On-campus residences, from each university's housing office. Buildings that
 * only publish a PO box (Waterloo's Village 1, Ron Eydt and MKV) use the main
 * campus street address. Lists are not exhaustive — anyone whose building is
 * missing picks "not listed" and types it.
 */
const RESIDENCES: Record<string, Residence[]> = {
  uw: [
    { id: "cmh", name: "Claudette Millar Hall", street: "165 University Ave W", postalCode: "N2L 3E8" },
    { id: "clv", name: "Columbia Lake Village", street: "350 Columbia St W", postalCode: "N2L 6G8" },
    { id: "mkv", name: "Mackenzie King Village", street: "200 University Ave W", postalCode: "N2L 3G1" },
    { id: "mh", name: "Minota Hagey", street: "200 University Ave W", postalCode: "N2L 3G1" },
    { id: "nrb", name: "New Residence Building", street: "170 Seagram Dr", postalCode: "N2L 0L5" },
    { id: "rev", name: "Ron Eydt Village", street: "200 University Ave W", postalCode: "N2L 3G1" },
    { id: "uwp", name: "UW Place", street: "108 Seagram Dr", postalCode: "N2L 3B9" },
    { id: "v1", name: "Village 1", street: "200 University Ave W", postalCode: "N2L 3G1" },
  ],
  uoft: [
    { id: "campusone", name: "CampusOne", street: "253 College St", postalCode: "M5T 1R5" },
    { id: "chestnut", name: "Chestnut Residence", street: "89 Chestnut St", postalCode: "M5G 1R1" },
    { id: "gradhouse", name: "Graduate House", street: "60 Harbord St", postalCode: "M5S 3L1" },
    { id: "innis", name: "Innis College", street: "111 St. George St", postalCode: "M5S 2E8" },
    { id: "knox", name: "Knox Residence", street: "59 St. George St", postalCode: "M5S 2E6" },
    { id: "new", name: "New College", street: "40 Willcocks St", postalCode: "M5S 1C6" },
    { id: "oak", name: "Oak House", street: "700 Spadina Ave", postalCode: "M5S 2J2" },
    { id: "smc", name: "St. Michael's College", street: "81 St. Mary St", postalCode: "M5S 1J4" },
    { id: "trinity", name: "Trinity College", street: "6 Hoskin Ave", postalCode: "M5S 1H8" },
    { id: "uc", name: "University College", street: "15 King's College Cir", postalCode: "M5S 3H7" },
    { id: "vic", name: "Victoria College", street: "150 Charles St W", postalCode: "M5S 1K9" },
    { id: "woodsworth", name: "Woodsworth College", street: "321 Bloor St W", postalCode: "M5S 1S5" },
  ],
  ubc: [
    { id: "marine", name: "Marine Drive", street: "2205 Lower Mall", postalCode: "V6T 1Z4" },
    { id: "vanier", name: "Place Vanier", street: "1935 Lower Mall", postalCode: "V6T 1X1" },
    { id: "totem", name: "Totem Park", street: "2525 West Mall", postalCode: "V6T 1W9" },
    { id: "gage", name: "Walter Gage", street: "5959 Student Union Blvd", postalCode: "V6T 1K2" },
  ],
  mcgill: [
    { id: "bishop-mountain", name: "Bishop Mountain Hall", street: "3935 University St", postalCode: "H3A 2B4" },
    { id: "carrefour", name: "Carrefour Sherbrooke", street: "475 Sherbrooke St W", postalCode: "H3A 2L9" },
    { id: "douglas", name: "Douglas Hall", street: "3851 University St", postalCode: "H3A 2B4" },
    { id: "gardner", name: "Gardner Hall", street: "3925 University St", postalCode: "H3A 2B7" },
    { id: "citadelle", name: "La Citadelle", street: "410 Sherbrooke St W", postalCode: "H3A 1B3" },
    { id: "mcconnell", name: "McConnell Hall", street: "3905 University St", postalCode: "H3A 2B5" },
    { id: "molson", name: "Molson Hall", street: "3915 University St", postalCode: "H3A 2B6" },
    { id: "nrh", name: "New Residence Hall", street: "3625 Ave du Parc", postalCode: "H2X 3P8" },
    { id: "rvc", name: "Royal Victoria College", street: "3425 University St", postalCode: "H3A 2A8" },
    { id: "solin", name: "Solin Hall", street: "3510 Rue Lionel-Groulx", postalCode: "H4C 1M7" },
  ],
  queens: [{ id: "victoria", name: "Victoria Hall", street: "75 Bader Lane", postalCode: "K7L 3N8" }],
  western: [
    { id: "bayfield", name: "Bayfield Hall", street: "291 Windermere Rd", postalCode: "N6G 2J9" },
    { id: "clare", name: "Clare Hall", street: "271 Ramsay Rd", postalCode: "N6G 0S2" },
    { id: "delaware", name: "Delaware Hall", street: "1151 Richmond St", postalCode: "N6A 5B9" },
    { id: "elgin", name: "Elgin Hall", street: "1151 Richmond St", postalCode: "N6A 5B9" },
    { id: "essex", name: "Essex Hall", street: "1200 Western Rd", postalCode: "N6G 5E3" },
    { id: "lambton", name: "Lambton Hall", street: "1421 Western Rd", postalCode: "N6G 4W4" },
    { id: "london", name: "London Hall", street: "1140 Western Rd", postalCode: "N6G 0A3" },
    { id: "medway-sydenham", name: "Medway-Sydenham Hall", street: "1151 Richmond St", postalCode: "N6A 5B9" },
    { id: "ontario", name: "Ontario Hall", street: "230 Sarnia Rd", postalCode: "N6G 0N2" },
    { id: "perth", name: "Perth Hall", street: "1125 Western Rd", postalCode: "N6G 5K8" },
    { id: "saugeen", name: "Saugeen-Maitland Hall", street: "289 Windermere Rd", postalCode: "N6G 2J8" },
  ],
};

export function residencesFor(universityId: string | null | undefined): Residence[] {
  return (universityId && RESIDENCES[universityId]) || [];
}

/** The full address saved for a residence, in the profile's address columns. */
export function residenceAddress(universityId: string, residenceId: string): CampusAddress | null {
  const university = getUniversity(universityId);
  const residence = residencesFor(universityId).find((r) => r.id === residenceId);
  if (!university || !residence) return null;
  return {
    street: `${residence.name}, ${residence.street}`,
    city: university.campus.city,
    province: university.campus.province,
    country: university.campus.country,
    postalCode: residence.postalCode,
  };
}

/** Which residence a saved street belongs to, so returning to the form keeps the choice. */
export function residenceFromStreet(universityId: string | null, street: string | null): string | null {
  if (!street) return null;
  return residencesFor(universityId).find((r) => street.startsWith(`${r.name}, `))?.id ?? null;
}
