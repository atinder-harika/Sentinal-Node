---
applyTo: "Dashboard/**/*.{ts,tsx,js,jsx},Hardware/**/*"
description: "Use this for architecture and implementation guidance in Sentinal-Node."
---

# Architecture Instruction

This codebase is a unified Next.js App Router application with an adjacent hardware stack.

## Structure Contract
- `Dashboard/app/`: route pages and API handlers.
- `Dashboard/components/`: reusable UI and feature components.
- `Dashboard/hooks/`: client orchestration logic and backend wiring.
- `Dashboard/store/`: global state and shared client state.
- `Dashboard/lib/`: shared utilities, service wrappers, and environment helpers.
- `Hardware/`: edge runtime scripts and node-side integrations.

## Implementation Rules
- Keep API access behind route handlers in `Dashboard/app/api/`.
- Keep UI components presentational when possible.
- Place orchestration logic in hooks or store modules, not in leaf UI components.
- Reuse helpers instead of duplicating API or parsing logic.

## Change Boundaries
- Frontend UI updates should not directly mutate hardware code.
- Hardware updates should not require UI file changes unless contract changes.
- If a contract changes, update both sides in a single focused change.

## Quality Checklist
- Confirm imports are from the intended layer.
- Keep files cohesive and single-purpose.
- Use clear names for API route handlers and hook responsibilities.
