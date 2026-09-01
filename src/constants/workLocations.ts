export const STANDARD_WORK_LOCATIONS = [
  "Lagos Office",
  "Calabar Facility",
  "Abuja Office",
  "Port Harcourt Office",
  "Other",
] as const;

export type StandardWorkLocation = (typeof STANDARD_WORK_LOCATIONS)[number];

export const OTHER_WORK_LOCATION_PREFIX = "Other / ";

export function parseWorkLocation(stored?: string | null): {
  preset: StandardWorkLocation | "";
  otherDetail: string;
} {
  if (!stored?.trim()) return { preset: "", otherDetail: "" };

  if (stored.startsWith(OTHER_WORK_LOCATION_PREFIX)) {
    return {
      preset: "Other",
      otherDetail: stored.slice(OTHER_WORK_LOCATION_PREFIX.length).trim(),
    };
  }

  if ((STANDARD_WORK_LOCATIONS as readonly string[]).includes(stored)) {
    return { preset: stored as StandardWorkLocation, otherDetail: "" };
  }

  // Legacy free-text — prefill edit form as Other + original text
  return { preset: "Other", otherDetail: stored.trim() };
}

export function formatWorkLocation(preset: string, otherDetail?: string): string {
  if (preset === "Other") {
    const detail = (otherDetail || "").trim();
    return detail ? `${OTHER_WORK_LOCATION_PREFIX}${detail}` : "Other";
  }
  return preset;
}

export function matchesWorkLocationFilter(
  employeeLocation: string | undefined | null,
  filter: string,
): boolean {
  if (!filter || filter === "all") return true;
  if (!employeeLocation) return false;
  if (filter === "Other") {
    return employeeLocation === "Other" || employeeLocation.startsWith(OTHER_WORK_LOCATION_PREFIX);
  }
  return employeeLocation === filter;
}

/** Proposed one-time migration map (Item 9) — review before running. */
export const WORK_LOCATION_MIGRATION_MAP: Record<string, string> = {
  Lagos: "Lagos Office",
  "Lagos, Nigeria": "Lagos Office",
  "Lagos Office": "Lagos Office",
  "lagos office": "Lagos Office",
  Calabar: "Calabar Facility",
  "Calabar office": "Calabar Facility",
  "Calabar Facility": "Calabar Facility",
  Abuja: "Abuja Office",
  "Abuja Office": "Abuja Office",
  "Port Harcourt": "Port Harcourt Office",
  "Port Harcourt Office": "Port Harcourt Office",
  PH: "Port Harcourt Office",
};

export function proposeWorkLocationMigration(stored?: string | null): string {
  if (!stored?.trim()) return stored || "";
  const trimmed = stored.trim();
  if ((STANDARD_WORK_LOCATIONS as readonly string[]).includes(trimmed)) return trimmed;
  if (trimmed.startsWith(OTHER_WORK_LOCATION_PREFIX)) return trimmed;
  const mapped = WORK_LOCATION_MIGRATION_MAP[trimmed];
  if (mapped) return mapped;
  return formatWorkLocation("Other", trimmed);
}
