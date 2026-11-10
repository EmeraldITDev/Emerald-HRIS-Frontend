/**
 * Official Emerald Industrial Co. Departments
 * This is the single source of truth for all department lists
 */
export const DEPARTMENTS = [
  "Executive",
  "Human Resources",
  "Technical Operations",
  "Technical Commercial",
  "Business Development",
  "Finance",
  "IT",
  "Operations",
  "Supply Chain",
  "Procurement",
  "Corporate Communications"
] as const;

export type Department = typeof DEPARTMENTS[number];

