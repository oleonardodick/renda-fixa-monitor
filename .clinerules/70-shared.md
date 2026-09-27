---
paths:
  - "shared/**"
  - "packages/shared/**"
---

# Shared Package Rules

## Context

The shared package is the contract layer between frontend and backend.
It must remain independent of application-specific frameworks and should contain only genuinely reusable types, schemas, and utilities.

## Rules

- Keep shared code framework-independent.
- Use TypeScript and Zod. Avoid `any`.
- Do not import frontend or backend-specific dependencies.
- Shared schemas define contracts, not UI behavior.
- Prefer sharing types and validation schemas over duplicating them.
- Keep shared modules small and cohesive.
- Do not move code into shared merely to avoid duplication in one package.
- Changes to shared contracts must consider all consumers.
- Preserve backward compatibility unless a breaking change is intentional and documented.
- Run tests for shared code and affected consumers after contract changes.