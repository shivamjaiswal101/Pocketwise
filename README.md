# PocketWise · Student Finance

PocketWise is a React + TypeScript student finance application built with Vite and Lucide icons.

## Run locally on Windows

Requires Node.js 20.19+ (the current development setup uses Node 22). Double-click **Start PocketWise.bat**. The launcher installs the locked frontend dependencies if needed, starts the local Vite server, and opens the app. Keep the console open while using it.

Or use PowerShell:

```powershell
npm install
npm run dev -- --host 127.0.0.1 --open
```

## Temporary preview and authentication UI

- `/` and `/welcome`: landing page with account actions and a **temporary preview** entry.
- `/register`: validated form. After validation, choose **Continue in temporary preview** to enter the dashboard. Only the display name is kept in this browser tab; passwords and email are discarded.
- `/login`: validated login UI. Login itself is not connected; valid input offers the same temporary preview option.
- `/verify-email`: six-digit UI; no code is sent or verified.
- `/register-success`: development preview only; its dashboard button remains disabled.
- `/forgot-password`: validated form; no reset email is sent.
- `/dashboard`: first-time dashboard. It labels temporary sessions and offers an **End preview** action. A direct visit without a temporary session is labeled as a development preview.

The temporary preview is not an account or secure authentication. It lasts for this browser tab only and stores a display name in `sessionStorage`; it never stores a password or sends any entered data. Add Expense and Add Income save unified transaction records to browser `localStorage`; the Transactions page searches, filters, views, edits, and deletes these same records. Savings goals and their recorded contributions use a separate key in the same browser storage and do not affect income, expenses, or recorded balance. Existing expense records are read from the previous expense storage key and carried forward when the unified transaction store is first written. Records remain after refresh and browser restart in the same browser profile, but are not synced across devices or users. Available Balance is total recorded income minus total recorded expenses across all dates; transaction-page summaries use the selected date range. Neither is a verified bank balance. Goal contributions are progress records only and do not represent bank transfers. Authentication remains a preview and does not create real accounts.

## AI Money Coach preview

The AI Money Coach is in **demo mode**. Suggested questions load explicitly labeled sample conversations; typed messages remain in page memory and are not sent to an AI service. The financial snapshot reads the existing local transaction and forecast services. No LLM SDK, API key, or external AI request is used.

The future request/response contract is in `src/coach/coachContract.ts`, with an optional same-origin HTTP adapter in `src/coach/coachApi.ts` targeting `POST /api/coach/messages`. That backend route is intentionally not implemented: the current React preview has no authenticated API backend, and the separate Python/SQLite service is not connected to it. A secure backend must authenticate users, retrieve approved financial context from application services, validate provider configuration, and call the selected provider before live mode can be enabled. Adding a key alone will not activate live AI.

Reserved server-side settings are listed in `.env.example`. Keep secrets in a backend environment file and never add an `AI_API_KEY` to a `VITE_` variable. `.env` and other `.env.*` files are ignored by Git; `.env.example` contains placeholders only.

## Build

```powershell
npm run build
npm test
```

The older Python/SQLite finance service modules remain separate and are not wired to this UI.
