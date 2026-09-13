export type Interest = { id: string; label: string; hint: string };

export const INTERESTS: Interest[] = [
  { id: "school-supplies", label: "School supplies", hint: "Textbooks, calculators, drafting kits" },
  { id: "kitchen-supplies", label: "Kitchen supplies", hint: "Mini fridges, cookware, small appliances" },
  { id: "hygiene", label: "Hygiene & toiletries", hint: "Unopened essentials people can't take with them" },
  { id: "furniture", label: "Furniture", hint: "Desks, chairs, shelves, whole rooms" },
  { id: "electronics", label: "Electronics", hint: "Monitors, lamps, chargers" },
  { id: "other", label: "Other essentials", hint: "Anything else students hand off" },
];
