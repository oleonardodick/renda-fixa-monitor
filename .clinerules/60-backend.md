---
paths:
  - "backend/**"
  - "apps/backend/**"
  - "apps/api/**"
---

# Backend Rules

## Context

The backend uses a functional and modular TypeScript architecture.
Apply SOLID principles to improve separation of concerns, dependency management, extensibility, and testability without turning the project into an object-oriented architecture.
Prefer functions, modules, composition, and dependency injection over classes and inheritance.
Use interfaces at meaningful dependency boundaries so infrastructure packages can be replaced without coupling business logic to concrete implementations.

## Architecture

- Keep route handlers thin and focused on HTTP concerns.
- Keep business logic independent from HTTP, database, and infrastructure details.
- Separate application logic from infrastructure implementations.
- Prefer composition and dependency injection over inheritance.
- Prefer pure functions when they provide a simpler solution.
- Keep modules small and focused on a single responsibility.
- Avoid coupling domain/application code directly to infrastructure packages.
- Keep dependencies flowing toward business logic, not the opposite.
- Do not introduce architectural layers without a concrete responsibility.

## SOLID

- Apply SOLID principles pragmatically; do not force patterns where they add complexity without value.
- Follow Single Responsibility by keeping modules focused on one cohesive responsibility.
- Follow Open/Closed by favoring composition and interchangeable implementations over modifying stable business logic.
- Follow Liskov Substitution when defining interchangeable implementations through interfaces.
- Follow Interface Segregation by keeping interfaces small and focused on the capabilities their consumers need.
- Follow Dependency Inversion by depending on abstractions at infrastructure boundaries instead of concrete implementations.
- Prefer dependency injection through function parameters or factory functions instead of classes.
- Do not create interfaces solely to satisfy a rule when there is no meaningful abstraction or substitution boundary.

## Interfaces and Dependencies

- Use TypeScript interfaces for dependencies that may reasonably have alternative implementations.
- Define interfaces in the layer that owns the required behavior, not in the infrastructure implementation.
- Keep interfaces focused on behavior rather than exposing implementation details.
- Inject concrete implementations at application composition/bootstrap boundaries.
- Do not import infrastructure implementations into business logic when an interface can define the required dependency.
- Use interfaces for external dependencies such as persistence, file storage, email, cache, external APIs, authentication providers, and other replaceable infrastructure.
- Do not create interfaces for simple internal functions or data structures when no substitution benefit exists.
- Prefer dependency injection through function arguments or factory functions.
- Avoid service locator patterns and global mutable dependencies.

## HTTP

- Use Fastify for HTTP APIs.
- Validate external input with Zod.
- Keep HTTP-specific concerns inside routes/controllers.
- Use appropriate HTTP status codes.
- Handle expected application errors explicitly.
- Do not expose internal errors, stack traces, database errors, or sensitive data to clients.
- Keep authentication and authorization enforcement on the backend.

## Persistence

- Use Mongoose for MongoDB access.
- Keep Mongoose-specific code inside infrastructure/persistence modules.
- Do not expose Mongoose documents to business logic when a domain/application representation is sufficient.
- Do not couple business logic to Mongoose types or APIs.
- Use repository abstractions only when they provide a meaningful boundary or simplify testing/replacement.
- Keep database queries out of route handlers.

## API Documentation

- Keep API documentation synchronized with the implementation.
- Use Scalar for API documentation when modifying documented endpoints.

## Patterns

- Use camelCase for variables, functions, methods and instances. Ex: `userRepository.ts`.
- Use PascalCase for interfaces, types and classes. Ex: `UserService.ts`.
- User UPPER_SNAKE_CASE for constants. Ex: `MAX-RETRIES`.