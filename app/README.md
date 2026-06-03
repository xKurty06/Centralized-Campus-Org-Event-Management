# Salikop Frontend

This `app/` workspace contains the Next.js frontend for SALIKOP, the Centralized Campus Organization and Event Management System.

## Purpose

The frontend provides the user-facing experience for:

- student sign-in and profile flows
- campus event discovery and registration
- organization directory browsing
- officer event management workflows
- administrator oversight screens

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

## Development

From the repository root:

```bash
npm run dev:app
```

From `app/` directly:

```bash
npm run dev
```

The frontend runs on `http://localhost:3000` by default.

## Build

```bash
npm run build
```

## Notes

- The frontend integrates with the Laravel API under `backend/`.
- Product styling and route conventions should follow the Salikop patterns documented in `app/AGENTS.md` and `.agents/skills/app-frontend-patterns/SKILL.md`.
