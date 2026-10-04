# Feature

**Name:** Redis infrastructure setup

**Goal:**
Prepare the backend to use Redis in a safe and reusable way, providing connection, configuration, and abstractions, without changing any existing behavior.

## Context

The application will use Redis in the future for different purposes (for example, evolving the refresh token rule). This feature only prepares the infrastructure: connection, configuration, lifecycle, and abstractions. No existing functionality will start using Redis in this step.

## Scope

**In scope:** Redis connection plugin for Fastify (own implementation), configuration and environment variables, abstractions for future use, connection lifecycle (start and shutdown), health verification of the connection, tests and documentation.

**Out of scope (do not implement):**

- Using Redis in any route, service, or business rule.
- Changes to the refresh token rule, login, logout, sign-up, or any existing behavior.
- Caching, rate limiting, sessions, or any other functional use of Redis.
- Changes to `frontend` and `shared`.
- Use of the official Fastify Redis plugin (`@fastify/redis`).

## Requirements

- The library to use is the official Node Redis (`redis` package), **already installed** in the `backend` project. Do not install other Redis libraries and do not replace it.
- Create a **custom Fastify plugin** to manage the Redis connection. Do not use `@fastify/redis` or similar third-party plugins.
- The plugin must create the client, connect it, expose it to the application, and close it gracefully when the server shuts down.
- No Redis data (host, port, password, user, database, TLS, etc.) may be hardcoded. Everything must come from environment variables, validated by the project's existing configuration mechanism.
- Create the abstractions necessary for future use of Redis (see "Abstractions").
- Redis must not be used by any route or existing service in this step.
- Nothing that currently works may be changed or broken.

## Configuration and Environment Variables

- Locate all existing `.env` files in the project (for example `.env`, `.env.example`, `.env.test`, and any others used by the backend, Docker, or CI) and update them. Do not create duplicates of files that already exist.
- Add the variables needed to connect to Redis, following the naming and organization standards of the existing variables. Suggested (adapt to the existing standard):
  - `REDIS_HOST`
  - `REDIS_PORT`
  - `REDIS_USERNAME` (optional)
  - `REDIS_PASSWORD` (optional)
  - `REDIS_DB` (default 0)
  - `REDIS_TLS` (boolean, default false)
  - `REDIS_KEY_PREFIX` (optional, to namespace the keys)
  - Connection timeout and reconnection variables, if relevant.
- `.env.example` must contain all the variables with safe example values, never real credentials.
- Real `.env` files must not contain secrets that would be committed. Verify that they are in `.gitignore`, and report if they are not.
- Validate the variables at application startup using the existing configuration schema (for example Zod or env schema, following the project standard). Invalid or missing required variables must fail with a clear message, without exposing values.
- If the project uses Docker Compose, check whether a Redis service already exists. If it does not, report it and suggest the addition, but only add it if the project's standards allow and it does not affect existing services.

## Abstractions

Create only what is necessary to enable future use, keeping it simple and following `.clinerules`:

- **Redis client provider:** a single point to create and obtain the configured client (Node Redis), isolating the library details from the rest of the application.
- **Plugin decoration:** expose the client on the Fastify instance (for example `fastify.redis`) with correct TypeScript typing (module augmentation).
- **Interface at the infrastructure boundary:** define a small interface for the basic operations that future features will need (for example `get`, `set` with optional TTL, `del`, `exists`), and a Node Redis-based implementation. This is the only place where an interface is justified, because it is an infrastructure boundary that may be replaced.
- **Key prefix:** a way to apply `REDIS_KEY_PREFIX` consistently, so that features do not have to deal with it.
- Do not create generic repositories, services, factories, or layers that have no use today. Do not turn the implementation into an object-oriented architecture.

## Connection Lifecycle and Behavior

- Connect when the application starts, and register the plugin in the correct order in the Fastify bootstrap.
- Handle the client `error` event so that connection failures do not cause an unhandled exception that brings down the process.
- Define and document the behavior when Redis is unavailable at startup. Follow the safest option for the current state of the project: since nothing uses Redis yet, **the application must be able to start and continue working even if Redis is unavailable**, logging a warning. Make this behavior explicit and, if appropriate, configurable (for example a variable that defines whether Redis is required at startup).
- Configure a reconnection strategy with a limit and backoff, using the options already provided by Node Redis.
- Close the connection gracefully on shutdown (`onClose` hook), without leaving open handles.
- Provide a simple way to check the connection health (for example an internal `ping` function). Do not create a new public route for it. If the project already has a health check, report it and do not change it in this step.

## Security

- Never log passwords, tokens, the full connection URL with credentials, or the content of stored values.
- Support TLS through configuration, without enabling it by default.
- Do not expose the Redis client or its configuration in HTTP responses.
- Report any gap found in the existing configuration (for example `.env` committed in the repository).

## Tests

The implementation must include or update tests for the cases below. Use mocks or an isolated instance so that the test suite does not depend on a real Redis server, unless the project already has a standard for integration tests with containers.

- The plugin registers and decorates the Fastify instance with the client.
- The client is created with the configuration coming from the environment variables (host, port, database, TLS, prefix).
- Invalid or missing required variables make the startup fail with a clear message.
- Redis unavailable at startup follows the defined behavior, without bringing down the application.
- The client's `error` event is handled and does not cause an unhandled exception.
- The connection is closed when the server shuts down.
- The key prefix is applied correctly by the operations abstraction.
- The basic operations (`get`, `set` with and without TTL, `del`, `exists`) call the client correctly.
- Passwords and credentials do not appear in logs.
- **Regression:** the existing test suite (login, logout, refresh token, sign-up, and others) passes without changes and without needing Redis.

## Documentation

Update the relevant project documentation (locate the existing files in the repository and update them, do not create duplicates):

- [x] Environment variables and configuration (new variables, defaults, and which are required)
- [x] Backend architecture (Redis plugin, abstractions, and lifecycle)
- [x] How to run the project locally with Redis (including Docker, if applicable)
- [x] Guidelines for future use of Redis (how to obtain the client and the operations abstraction, and the key prefix convention)

## Implementation Guidance

Before implementing:

1. Identify the affected package: only `backend` (plus the `.env` files and infrastructure files, if applicable).
2. Inspect applicable `.clinerules`.
3. Locate the existing configuration mechanism (environment variable validation), the Fastify bootstrap, how existing plugins are organized and registered, and the logging standard.
4. Reuse existing standards for plugins, configuration, and folder structure.
5. Confirm that the `redis` package is already in the backend's `package.json` and check its installed version, to use the API compatible with it.

During implementation:

- Follow the structure and naming used by the existing plugins.
- Keep the plugin focused on connection and lifecycle. Keep the operations abstraction separate from the plugin.
- Do not register Redis in any route and do not inject the client into existing services.
- Do not alter unrelated functionalities, existing configuration, or existing dependencies.
- Keep the code and comments consistent with the project language standard. Messages shown to end users, if any, must be in pt-BR.

After implementation:

1. Run all backend tests and confirm that they pass, including the existing ones.
2. Start the application with Redis available and verify the connection and the graceful shutdown.
3. Start the application without Redis and verify that the behavior matches the defined one.
4. Verify that no existing route, service, or rule references Redis.
5. Confirm that no credentials are in the code, in the logs, or in versioned files.
6. Update affected documentation.
7. Review the implementation for security issues (credentials in logs, TLS, `.env` in version control).

## Acceptance Criteria

- [ ] The Redis connection is managed by a custom Fastify plugin that uses the `redis` (Node Redis) package, without `@fastify/redis`.
- [ ] No connection data is hardcoded; everything comes from environment variables validated at startup.
- [ ] All `.env` files and `.env.example` were updated, with no real secrets versioned.
- [ ] The client is exposed on the Fastify instance with correct typing.
- [ ] The operations abstraction (interface plus Node Redis implementation) exists, applies the key prefix, and is covered by tests.
- [ ] The application starts and works even if Redis is unavailable, with the behavior documented.
- [ ] The connection is closed gracefully on shutdown, and client errors do not bring down the process.
- [ ] Redis is not used in any route, service, or business rule (including the refresh token rule).
- [ ] Existing behavior (login, logout, refresh token, sign-up, and others) was not changed, and the existing tests pass without Redis.
- [ ] Credentials and sensitive data do not appear in logs or responses.
- [ ] Relevant tests have been implemented and pass.
- [ ] Documentation has been updated.
