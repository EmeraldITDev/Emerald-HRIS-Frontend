/**
 * Per-user preference storage (browser-side).
 *
 * The backend has no settings endpoints yet, so preferences are stored
 * per signed-in user in localStorage. Everything here is UI preference
 * only — no HR records are changed.
 */

export interface UserSettings {
  notifications: {
    email: boolean;
    onboarding: boolean;
    leaveRequests: boolean;
    payrollReminders: boolean;
    performanceReviews: boolean;
    trainingReminders: boolean;
  };
  appearance: {
    theme: "light" | "dark" | "system";
    language: string;
    dateFormat: string;
    currency: string;
  };
  system: {
    payrollFrequency: string;
    taxYear: string;
    autoCalculateTaxes: boolean;
    annualLeaveDays: number;
    sickLeaveDays: number;
    carryForwardLeave: boolean;
    reviewFrequency: string;
    threeSixtyReviews: boolean;
    dataRetention: string;
    autoBackup: boolean;
  };
  security: {
    twoFactor: boolean;
    sessionTimeout: string;
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    email: true,
    onboarding: true,
    leaveRequests: true,
    payrollReminders: false,
    performanceReviews: true,
    trainingReminders: true,
  },
  appearance: {
    theme: "system",
    language: "en",
    dateFormat: "dd/mm/yyyy",
    currency: "ngn",
  },
  system: {
    payrollFrequency: "monthly",
    taxYear: String(new Date().getFullYear()),
    autoCalculateTaxes: true,
    annualLeaveDays: 25,
    sickLeaveDays: 10,
    carryForwardLeave: true,
    reviewFrequency: "annual",
    threeSixtyReviews: false,
    dataRetention: "7years",
    autoBackup: true,
  },
  security: {
    twoFactor: false,
    sessionTimeout: "30",
  },
};

const keyFor = (userId?: string | number | null) => `hris_settings_${userId ?? "anon"}`;

export function loadUserSettings(userId?: string | number | null): UserSettings {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(parsed?.notifications || {}) },
      appearance: { ...DEFAULT_SETTINGS.appearance, ...(parsed?.appearance || {}) },
      system: { ...DEFAULT_SETTINGS.system, ...(parsed?.system || {}) },
      security: { ...DEFAULT_SETTINGS.security, ...(parsed?.security || {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveUserSettings(userId: string | number | null | undefined, settings: UserSettings) {
  localStorage.setItem(keyFor(userId), JSON.stringify(settings));
}
