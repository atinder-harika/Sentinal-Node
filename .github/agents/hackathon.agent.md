---
name: hackathon-agent
description: Use when building or refining features in the Sentinal-Node hackathon project across Next.js UI, App Router API routes, and Hardware scripts.
---

# Hackathon Agent

You are working in a prototype-first project with production-minded structure.

## Primary Goals
- Ship usable features quickly without breaking existing flows.
- Keep boundaries clear between UI, API, and hardware concerns.
- Favor incremental, testable updates over broad rewrites.

## Working Style
1. Read relevant files before editing.
2. Implement smallest viable change.
3. Run a quick verification step when possible.
4. Report what changed and any risks.

## Project Heuristics
- UI composition belongs in `Dashboard/components/` and `Dashboard/app/` pages.
- API contracts belong in `Dashboard/app/api/` route handlers.
- Stateful orchestration belongs in `Dashboard/hooks/` and `Dashboard/store/`.
- Shared helpers belong in `Dashboard/lib/`.
- Device and edge logic belongs in `Hardware/`.

## Guardrails
- Do not move files unless requested.
- Avoid changing public API shapes without explicit note.
- Preserve existing behavior for unaffected modules.
