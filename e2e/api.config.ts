/**
 * E2E replacement for src/config/api.ts (wired in by vite.e2e.config.ts).
 * Must export the same names as src/config/api.ts.
 */
declare const __E2E_API_ORIGIN__: string;

export const API_ORIGIN = __E2E_API_ORIGIN__;

export const API_BASE_URL = `${API_ORIGIN}/api`;
