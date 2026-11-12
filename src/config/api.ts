/**
 * Backend API configuration — the single place the backend URL lives.
 * To point the app at a different backend, change API_ORIGIN below
 * (no .env needed).
 *
 * Playwright e2e runs swap this file for e2e/api.config.ts (see
 * vite.e2e.config.ts) so tests hit the isolated local test backend.
 */
//export const API_ORIGIN = 'http://localhost:8000';
export const API_ORIGIN = 'https://hris-backend-to3i.onrender.com';

/** Base for API requests — the backend mounts all routes under `/api`. */
export const API_BASE_URL = `${API_ORIGIN}/api`;
