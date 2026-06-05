# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # development server (http://localhost:3000)
npm run build         # production build
npm run lint          # ESLint
npm run db:push       # apply schema changes to the DB without creating a migration file
npm run db:migrate    # create a versioned migration (prompts for a name)
npm run db:studio     # open Prisma Studio in the browser
npm run create-admin  # interactive CLI to create or promote an admin user
```

Environment: copy `.env.example` to `.env` and fill in `DATABASE_URL` and `AUTH_SECRET` before running anything.

## Architecture

This is a **fullstack Next.js 16 monolith**. There is no separate backend process — the API lives in `app/api/` as Next.js Route Handlers, and the frontend pages live in `app/` as React client components.

### Data flow

```
Browser → useLibrary() hook → fetch → app/api/** → Prisma → PostgreSQL
```

Every UI mutation and read goes through `contexts/library-context.tsx`, which owns all client-side state (`books`, `loans`, `users`, etc.) and exposes typed functions (`createLoan`, `returnBook`, `rateBook`, …). Pages never call `fetch` directly — they consume `useLibrary()`.

### Key files

| File | Role |
|---|---|
| `contexts/library-context.tsx` | Global state + all API calls. Central hub of the frontend. |
| `lib/serializers.ts` | Converts Prisma records → frontend types. **Loan `status` is computed here**, not stored in the DB. `reservationExpiresAt` is also derived (loanDate + 30 min). |
| `lib/auth.ts` | `getCurrentUser()` reads the `biblioteca_session` httpOnly cookie, verifies the JWT, and returns the DB user. Called at the top of every protected API route. |
| `lib/prisma.ts` | Singleton Prisma client. Import from here, never instantiate directly. |
| `prisma/schema.prisma` | Single source of truth for the DB schema. |

### API route conventions

- All routes call `getCurrentUser()` to get the session user.
- Staff-only routes additionally check `isStaff(user.role)` (from `lib/auth.ts`).
- Responses always return serialized data through functions in `lib/serializers.ts`, never raw Prisma objects.
- Dates are serialized to ISO strings in the API and revived back to `Date` objects in `reviveLoan()` / `reviveUser()` inside the context.

### Derived fields (do not store in DB)

- `Loan.status` — computed by `loanStatus()` in `serializers.ts` from `returnDate`, `pickedUpAt`, and `dueDate`.
- `Loan.reservationExpiresAt` — `loanDate + 30 minutes`, only present on pending loans.
- `Book.availableCopies` — can be derived as `totalCopies - activeLoans`; `serializeBook()` accepts an optional `activeLoans` count to override the stored value.
