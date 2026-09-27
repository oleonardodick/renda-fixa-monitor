---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
  - "**/__tests__/**"
---

# Testing Rules

## Context

Tests should provide confidence in observable behavior while remaining simple and maintainable.
These rules prevent tests from becoming coupled to implementation details or encouraging changes solely to satisfy tests.

## Rules

- Use Vitest for frontend and backend tests.
- Test behavior, not implementation details.
- Keep each test focused on one behavior.
- Use descriptive names that state the expected behavior and relevant condition.
- Cover success, validation/error, and important edge cases.
- Mock external boundaries, not the code under test.
- Do not add mocks when a real lightweight implementation is simpler and deterministic.
- Reuse existing test helpers and factories before creating new ones.
- Do not weaken production code only to simplify a test.
- When fixing a bug, add or update a regression test.
- Run the affected test suite after modifying tests.