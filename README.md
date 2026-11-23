# Emerald HRIS — Frontend

Web app for Emerald's Human Resource Information System (HRIS): employee records, attendance and leave, payroll and payslips, performance reviews, training, benefits and executive reporting.

Live at [hris.emeraldcfze.com](https://hris.emeraldcfze.com). Backend API: `hris-backend` (Laravel).

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS + shadcn/ui · TanStack React Query · React Hook Form + Zod · Recharts · jsPDF · Playwright

## Getting started

Requires Node.js 18+.

```bash
npm install
npm run dev             # http://localhost:8080
```

No `.env` file is needed.

### Backend API URL

The backend URL is set in one place: [`src/config/api.ts`](src/config/api.ts). Edit `API_ORIGIN` there to point the app at a different backend (for example `http://localhost:8000` for a local Laravel server). All requests go to `${API_ORIGIN}/api`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run all Playwright tests in `e2e/` |
| `npm run test:e2e:performance` | Run the performance-review suites (batches 1–6 and acceptance) |
| `npm run test:e2e:report` | Open the last Playwright HTML report |

## End-to-end tests

The Playwright tests never touch production data. [`playwright.config.ts`](playwright.config.ts) starts two servers:

- a Laravel API on port `8010`, backed by SQLite, started from the `hris-backend` repo. That repo must be checked out next to this one, at `../hris-backend`;
- the Vite dev server on port `8080`, using [`vite.e2e.config.ts`](vite.e2e.config.ts). This config swaps `src/config/api.ts` for [`e2e/api.config.ts`](e2e/api.config.ts), so the app talks to the local test API.

Override the ports with `E2E_API_PORT` and `E2E_WEB_PORT`.

## Modules

- **Dashboards:** HR dashboard, Chairman's View (executive overview), analytics and reports
- **Employees:** employee records, profiles, documents, bulk CSV import, exits and resignations
- **Attendance and leave:** clock-in/out, leave requests and balances, manager approvals, organisation dashboard, weekly/monthly/yearly reports
- **Payroll:** payroll runs and review, gross-salary import, payslips with PDF download
- **Performance:** review cycles, objectives, review forms, ratings and acknowledgement
- **Training, benefits and recruitment**
- **Communication:** announcements, notifications, company policies
- **Account:** my profile, security and password, settings

Access to each module depends on the user's role (see [`src/lib/permissions.ts`](src/lib/permissions.ts) and [`src/constants/roles.ts`](src/constants/roles.ts)).

## Project structure

```
src/
  pages/        Route-level screens
  components/   UI components, grouped by module (attendance, payroll, performance, …)
  contexts/     Auth context
  hooks/        Shared React hooks
  lib/          API client, permissions, payroll and performance helpers
  utils/        CSV import/export and PDF generation
  constants/    Roles, departments, work locations, company details
  config/       Backend API URL
e2e/            Playwright specs and test setup
docs/           Feature notes and verification reports
backend/, backend_files/, database/
                Reference backend code and SQL kept from earlier hand-offs;
                the live backend is the separate hris-backend repo
```

## Deployment

Every push to `main` deploys to cPanel through GitHub Actions ([`.github/workflows/deploy-cpanel.yml`](.github/workflows/deploy-cpanel.yml)). The workflow builds the app and uploads the changed files in `dist/` over FTP to `public_html/hris.emeraldcfze.com/`. It reads the FTP login from the secrets `CPANEL_FTP_SERVER`, `CPANEL_FTP_USERNAME` and `CPANEL_FTP_PASSWORD`.

[`public/.htaccess`](public/.htaccess) is copied into `dist/`. It sends every route to `index.html`, so client-side routing works on Apache. It also stops browsers from caching `index.html`, `version.json` and `manifest.json`. Each build writes a new `version.json`, which the app checks so it can tell users when an update is available.

The backend endpoint is defined in [`src/config/api.ts`](src/config/api.ts). Changing it requires rebuilding and deploying the frontend, which a push to `main` does.

`vercel.json` holds the same routing and caching rules for Vercel hosting.
