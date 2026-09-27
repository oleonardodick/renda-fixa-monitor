---
paths:
  - "frontend/**"
  - "apps/frontend/**"
  - "apps/web/**"
---

# Frontend Rules

## Context

The frontend uses React with shadcn/ui, Tailwind CSS, React Hook Form, Zod, Zustand, React Router, and Axios.
Features are organized by domain under a `features` directory to keep related UI, state, hooks, services, and logic cohesive.
Keep presentation, client state, API communication, and business rules separated while following the project's existing component patterns.

## Rules

### Feature Structure

- Organize application functionality under a `features` directory.
- Each feature must have its own directory named after its domain.
- Keep feature-specific pages, hooks, services, stores, components, schemas, types, and utilities inside the feature directory.
- Create subdirectories only when the feature actually needs them.
- Do not create empty or placeholder directories.
- Do not place feature-specific code in global directories.
- Place code in a global directory only when it is genuinely shared by multiple features.
- Avoid coupling one feature directly to another feature's internal implementation.
- Prefer explicit public interfaces when one feature needs functionality from another feature.

### React

- Use React with functional components and hooks.
- Use TypeScript; avoid `any`.
- Use React Router for navigation.
- Use shadcn/ui components for UI primitives and common interaction patterns.
- Use React Hook Form for non-trivial forms.
- Use Zod for form validation.
- Prefer schemas shared with the backend when the validation represents a shared contract.

### State

- Use Zustand only for state that must be shared across components or routes.
- Keep local UI state local.
- Keep feature-specific state inside the feature.
- Do not create a store when local state or existing server data is sufficient.

### API and Business Logic

- Keep API communication in feature services or hooks, not directly in presentation components.
- Use Axios through the project's existing API client/configuration.
- Keep business rules out of pages and presentational components.
- Move reusable feature logic into hooks or utilities when appropriate.
- Do not duplicate API types that already exist in the shared package.

### Components

- Keep components focused on presentation and interaction.
- Prefer existing project components before creating new ones.
- Keep feature-specific components inside the feature directory.
- Move a component to a global location only when it is genuinely reusable across features.

### UI State

- Handle loading, error, empty, and success states explicitly.
- Keep effects minimal and use them only for synchronization with external systems.

### Patterns

- Use PascalCase to name components, ex: `UserForm.tsx`.
- Use the word use + camelCase to name custom hooks, ex: `useAuth.tsx`.
- Use camelCase to name functions and variables, ex: `handleSubmit`, `const isLoading`.
- Use UPPER_SNAKE_CASE for constants, ex: `API_BASE_URL`.
- Prefer arrow functions and named exports.