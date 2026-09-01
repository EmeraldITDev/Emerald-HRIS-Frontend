export const STANDARD_WORK_LOCATIONS = [
  "Lagos Office",
  "Calabar Facility",
  "Abuja Office",
  "Port Harcourt Office",
  "Other",
] as const;

export type StandardWorkLocation = (typeof STANDARD_WORK_LOCATIONS)[number];

export const OTHER_WORK_LOCATION_PREFIX = "Other / ";

/** Normalize for case/spacing/hyphen-insensitive alias lookup. */
export function normalizeWorkLocationKey(value: string): string {
  return value.trim().toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ");
}

/** Case/spacing-insensitive aliases → standard value (Item 9 migration). */
export const WORK_LOCATION_ALIASES: Record<string, StandardWorkLocation> = {
  lagos: "Lagos Office",
  "lagos office": "Lagos Office",
  "lagos hq": "Lagos Office",
  "lagos nigeria": "Lagos Office",
  abuja: "Abuja Office",
  "abuja office": "Abuja Office",
  calabar: "Calabar Facility",
  "calabar office": "Calabar Facility",
  "calabar facility": "Calabar Facility",
  "port harcourt": "Port Harcourt Office",
  "port harcourt office": "Port Harcourt Office",
  ph: "Port Harcourt Office",
};

/** Exact-string overrides (production audit). */
export const WORK_LOCATION_MIGRATION_MAP: Record<string, string> = {
  LAGOS: "Lagos Office",
  "Lagos/Canada": "Other / Lagos/Canada",
  "KENYA REMOTE": "Other / KENYA REMOTE",
  "Oando Gas Plant. Rivers State": "Other / Oando Gas Plant. Rivers State",
};

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

  const migrated = proposeWorkLocationMigration(stored);
  if ((STANDARD_WORK_LOCATIONS as readonly string[]).includes(migrated)) {
    return { preset: migrated as StandardWorkLocation, otherDetail: "" };
  }
  if (migrated.startsWith(OTHER_WORK_LOCATION_PREFIX)) {
    return {
      preset: "Other",
      otherDetail: migrated.slice(OTHER_WORK_LOCATION_PREFIX.length).trim(),
    };
  }

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

/** Proposed one-time migration target — review with HR before running. */
export function proposeWorkLocationMigration(stored?: string | null): string {
  if (!stored?.trim()) return stored || "";
  const trimmed = stored.trim();
  if ((STANDARD_WORK_LOCATIONS as readonly string[]).includes(trimmed)) return trimmed;
  if (trimmed.startsWith(OTHER_WORK_LOCATION_PREFIX)) return trimmed;

  if (WORK_LOCATION_MIGRATION_MAP[trimmed]) {
    return WORK_LOCATION_MIGRATION_MAP[trimmed];
  }

  const alias = WORK_LOCATION_ALIASES[normalizeWorkLocationKey(trimmed)];
  if (alias) return alias;

  return formatWorkLocation("Other", trimmed);
}
