# Project Rules

## Context

This is a pnpm Node.js monorepo composed of frontend, backend, and shared packages.
The shared package contains reusable contracts and validation used by frontend and backend.
The backend owns business rules, security, persistence, and API contracts.
The frontend owns presentation, interaction, and client-side state.
Frontend features are organized by domain inside feature-specific directories.
Changes spanning multiple packages must preserve these boundaries.

## Language

The application's user-facing messages must be written in Brazilian Portuguese (pt-BR).
Code, identifiers, file names, comments, and technical documentation may remain in English.

## Rules

- Use TypeScript for all application code.
- Respect the existing monorepo structure and package boundaries.
- Use pnpm; do not introduce npm or yarn.
- Reuse existing dependencies and patterns before adding new ones.
- Prefer the simplest solution that satisfies the requirement.
- Do not introduce abstractions without a concrete reuse case.
- Keep business rules out of UI components and HTTP route handlers.
- Keep shared types and validation in the shared package when used by multiple packages.
- Organize frontend functionality by feature/domain rather than by technical layer.
- Keep feature-specific code inside its feature directory.
- Do not move feature-specific code into global directories unless it is genuinely shared.
- Write all user-facing messages in Brazilian Portuguese (pt-BR).
- Keep error, validation, success, warning, empty-state, loading, and confirmation messages in pt-BR.
- Backend API messages intended for the user must also be in pt-BR.
- Use consistent terminology across frontend and backend.
- Prefer clear, natural, and concise Brazilian Portuguese over literal translations from English.
- Do not translate code identifiers, variable names, function names, routes, or technical terms unless required by the existing project conventions.
- Do not mix Portuguese and English in the same user-facing message.
- Do not change unrelated files.
- Before modifying code, inspect the existing implementation and follow established patterns.
- Preserve backward compatibility unless the task explicitly requires a breaking change.
- After changes, run the smallest relevant validation available.
- Never commit or push any changes. This has to be manualy made by the user.