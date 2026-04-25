# Sentinal-Node Copilot Instructions

This repository combines a Next.js App Router app and a hardware edge node stack.

## Project Scope
- `Dashboard/` contains the product web app.
- `Dashboard/app/` contains frontend routes and backend API routes under `Dashboard/app/api/`.
- `Hardware/` contains edge node scripts and runtime logic.

## Architecture Rules
- Keep frontend logic in route pages and reusable components.
- Keep backend integration logic inside App Router API handlers.
- Avoid coupling hardware scripts directly to UI components.
- Share reusable logic through `Dashboard/lib/`, `Dashboard/hooks/`, and `Dashboard/store/`.

## Coding Conventions
- Prefer TypeScript for app changes.
- Keep API handlers thin and composable.
- Add short comments only when control flow is non-obvious.
- Preserve existing naming and folder structure.

## Reliability Expectations
- Validate external inputs in API routes.
- Return explicit error responses from API handlers.
- Keep side effects isolated in hooks or service helpers.

## Delivery Preferences
- Make small, focused commits.
- Keep commit messages semantic (`docs:`, `chore:`, `feat:`, `fix:`).
- Do not make unrelated refactors in the same change.
