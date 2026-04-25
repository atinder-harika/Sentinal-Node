# Sentinal-Node

Sentinal-Node is a hackathon-built tactical incident intelligence platform that fuses a modern web dashboard with tethered edge hardware nodes.

The project is designed around fast operator response loops: edge devices collect and stream field signals, the Next.js backend orchestrates AI processing, and the UI presents live incident context for dispatch and decision support.

## Core Highlights

- Modern UI/UX: A high-clarity tactical dashboard built with Next.js App Router and reusable component primitives for live operational visibility.
- Decoupled application architecture: Frontend experience and backend API routes live in one Next.js codebase, while maintaining clear boundaries between presentation, orchestration, and integrations.
- Tethered hardware stack: Dedicated edge node scripts live in `Hardware/`, enabling on-site sensing and event forwarding into the core application loop.

## Repository Layout

- `Dashboard/`: Unified Next.js application.
- `Dashboard/app/`: App Router pages and backend route handlers under `Dashboard/app/api/`.
- `Dashboard/components/`: Shared UI building blocks and feature components.
- `Dashboard/hooks/`: Client-side orchestration hooks used to coordinate crisis workflows.
- `Dashboard/store/`: Global state management.
- `Dashboard/lib/`: Shared utilities and integration helpers.
- `Hardware/`: Edge node runtime scripts and device-side logic.

## Architecture Overview

Sentinal-Node intentionally separates responsibilities into three coordinated layers:

1. Presentation Layer (Dashboard UI)
	- Tactical pages and modules render live incident context.
	- Components focus on operator-facing workflows and situational awareness.

2. Orchestration Layer (Next.js API)
	- App Router API endpoints handle AI-facing backend workflows.
	- Integrations include vision analysis, language model interactions, audio handling, and logging/dispatch routes.

3. Edge Layer (Hardware Nodes)
	- Device scripts run at the edge to capture or relay mission-critical signals.
	- Hardware remains tethered to the software platform through lightweight exchange contracts.

## Development Intent

This codebase was built to prove an end-to-end crisis loop in a hackathon setting, while preserving enough structure for post-hackathon hardening:

- Extendable API-first backend patterns.
- Reusable UI modules for rapid iteration.
- Clear hardware/software contract boundaries.

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Component-driven UI architecture
- Zustand-based state management
- Edge node scripts for hardware integration