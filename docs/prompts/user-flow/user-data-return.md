## Feature

**Name:** User data return (authenticated user profile)

**Goal:**
Make the authenticated user's basic data (ID, name and email) available to the frontend in a secure way, and keep it in a global store so every part of the application can use it.

## Context

Today the Login feature returns only the user ID and sets the session cookies. The frontend needs the user's name and email to be displayed and used across the application (e.g., header, profile areas, greetings). This feature makes login return these fields, provides a secure way to retrieve the current user from the existing session cookie, and stores the data in a Zustand store.

## Scope

**In scope:** login response update (ID, name, email), secure endpoint to retrieve the current authenticated user (evaluate the existing `/me` route in the auth routes), shared schema/type for the user data, Zustand store, store hydration and cleanup, rate limiting coverage, tests and documentation.

**Out of scope (do not implement):** profile editing, password change or recovery, email verification, changes to the token/session strategy (cookies, expiration, refresh behavior), changes to the sign-up validation rules, changes to the Dashboard layout (only consume the store if a minimal change is required to prove the integration).

## Requirements

- On login, the response must return `id`, `name` and `email` of the user (instead of only the ID).
- Provide a secure way to fetch the current user's data using the existing session cookie (HttpOnly). The frontend must never read, store or send tokens manually.
- Evaluate the existing `/me` route in the auth routes:
  - If it exists and fits, reuse and adjust it to return `id`, `name` and `email`.
  - If it does not fit, justify and propose the alternative before implementing it. Do not create a duplicate endpoint.
- The user data must never include the password, the hash or any other sensitive/internal field (e.g., tokens, timestamps not required, internal flags).
- Store the user data in a Zustand store, to be used in every necessary place of the frontend.
- Keep the rate limit applied to the endpoint(s) involved.

## Business Rules

### Returned data

- Fields returned: `id`, `name`, `email`. Nothing else.
- The data must be built from an explicit allowlist of fields (select/map only these fields). Never return the full user entity and remove fields afterward.
- `email` is returned as persisted (lowercase).

### Current user retrieval

- The user identity must come exclusively from the validated session cookie. The endpoint must not accept a user ID or any identifier from the client (query, params or body) to prevent access to other users' data.
- If the session is missing, invalid or expired: return HTTP 401 following the existing API error format, with a generic pt-BR message. Reuse the existing authentication middleware and refresh behavior; do not reimplement token validation.
- If the session is valid but the user no longer exists: treat as unauthenticated (401) and ensure the session is not kept active, following the existing standards.
- The response must include `Cache-Control: no-store` (or the project's equivalent) so the user data is not cached by browsers or intermediaries.

### Frontend store

- The store holds `user` (`id`, `name`, `email`) or `null`, plus the actions needed to set and clear it.
- The store is in memory only. Do not persist user data in `localStorage`, `sessionStorage` or any other browser storage. The source of truth is always the backend.
- Because memory is lost on page reload, the application must restore the user by calling the current-user endpoint at startup (or at the existing auth bootstrap point) while the session cookie is valid.
- The store must be filled after login and after sign-up (see "Sign-up integration").
- The store must be cleared on logout and when a 401 is received and the session cannot be refreshed.
- Components must read the user from the store through selectors, avoiding unnecessary re-renders.

### Sign-up integration

- The sign-up contract (returns only the user ID plus session cookies) must not change. After a successful sign-up, the frontend must populate the store using the same current-user retrieval used for page reload, or the equivalent already available in the existing flow. Evaluate the least intrusive option and report the decision.

## User Flow

1. The user logs in.
2. The backend creates the session (cookies) and returns `id`, `name` and `email`.
3. The frontend saves the data in the Zustand store and redirects as it does today.
4. When the user reloads the page or opens the application with a valid session, the frontend requests the current user endpoint, using the cookie automatically, and fills the store before rendering protected content that depends on it.
5. If the request returns 401 and the session cannot be refreshed (following the existing refresh behavior), the store is cleared and the user is redirected to login, following the existing behavior.
6. When the user logs out, the store is cleared.
7. If an unexpected error happens (network or server failure) while fetching the user, a generic pt-BR message is displayed (toast or alert) and the application does not break; the store remains empty.

## Data and API

- **Input (current user endpoint):** none. Identity comes from the session cookie only.

- **Output:**
  - Login success: `id`, `name`, `email`, plus the session cookies already set by the Login feature, following the existing response envelope.
  - Current user success: HTTP 200 with `id`, `name`, `email`, following the existing response envelope.
  - Unauthenticated: HTTP 401 with a generic pt-BR message, following the existing API error format.
  - Rate limit exceeded: following the existing rate limit response.
  - Unexpected error: HTTP 500 with a generic pt-BR message and no internal details.

- **Shared:**
  - Define in `shared` the Zod schema and inferred type for the returned user (`id`, `name`, `email`) and use them in the backend response typing and in the frontend store/API client. Do not duplicate the type.

- **Endpoints:**
  - Adjust the login endpoint response.
  - Evaluate and, if suitable, adjust the existing `/me` route in the auth routes. Follow existing API standards (route naming, response envelope, error format).

- **Persistence:**
  - No schema change is expected. Read the existing user data only.
  - Never log passwords, hashes, tokens or cookies.

## UI / UX

- Create a Zustand store following the existing frontend organization (inspect existing stores and the `features/` structure before deciding the location, e.g., `features/auth` or `features/users`).
- Do not create new visual components unless required by the existing flows.
- Handle the loading state while the user is being restored on startup, avoiding flashes of unauthenticated content or wrong redirects.
- All interface texts and messages must be in pt-BR.

## Validation and Errors

- The backend response must be validated or typed through the shared schema, so no unexpected field (e.g., password hash) can leak by mistake.
- 401: generic pt-BR message, without technical details.
- Unexpected errors: generic pt-BR message, without technical details or stack traces.

## Security

- Rate limiting: the project already applies a global rate limit, and only endpoints that are not covered must declare it explicitly. Verify that the login and current user endpoints are covered by the global rate limit. Do not add a redundant limiter. If any of them is not covered (e.g., excluded or registered before the middleware), declare it explicitly following the existing standard and report it.
- Authentication: use the existing HttpOnly session cookie. Do not expose tokens to JavaScript and do not move session data to browser storage.
- Verify the cookie flags remain HttpOnly, Secure (in production) and an appropriate SameSite value. Verify this feature does not weaken them.
- CSRF: the current user endpoint is read-only (GET) and must not change state. Verify that no state-changing operation was added. Follow the project's existing approach and report any gap instead of inventing a new mechanism.
- Prevent IDOR: the endpoint must never accept a user identifier from the client.
- Do not expose sensitive data (password, hash, tokens, internal fields) or stack traces in any response or log.
- Add `Cache-Control: no-store` to responses with user data.

## Tests

The implementation must include or update tests for the cases below.

**Backend**

- Login success returns `id`, `name` and `email`, and the session cookies are still set.
- Login response never contains password, hash or any field outside the allowlist.
- Current user endpoint with a valid session returns `id`, `name` and `email`.
- Current user endpoint without a session, with an invalid session and with an expired session returns 401 in the existing error format.
- The endpoint ignores any identifier sent by the client (query, params, body) and returns only the authenticated user.
- User deleted after the session was issued results in 401.
- Response contains `Cache-Control: no-store`.
- Rate limit is applied to the login and current user endpoints (covered by the global limiter, or explicit if needed).
- Database failure returns a generic error.
- Regression: existing logout and refresh behavior remains unchanged, and existing login tests still pass after the response change.

**Shared**

- The user Zod schema accepts `id`, `name`, `email` and rejects/strips extra fields such as `password` or `passwordHash`.

**Frontend**

- Store: starts empty, `setUser` fills it, `clearUser` empties it.
- Login success fills the store with `id`, `name` and `email`.
- Sign-up success results in the store being filled.
- Page reload with a valid session restores the store through the current user endpoint.
- 401 on restore clears the store and follows the existing redirect to login.
- Logout clears the store.
- Network/server error on restore shows a generic pt-BR message and does not break the application.
- No user data is written to `localStorage` or `sessionStorage`.

## Documentation

Update the relevant project documentation (locate the existing files in the repository and update them, do not create duplicates):

- [x] Business rules
- [x] API documentation (login response change, current user endpoint, request/response, status codes)
- [x] User flow
- [x] UI documentation (store and its usage)

## Implementation Guidance

Before implementing:

1. Identify the affected packages: `frontend`, `backend` and `shared`.
2. Inspect applicable `.clinerules`.
3. Inspect the existing auth routes (including `/me`), the authentication middleware, the rate limit configuration, the login/sign-up/logout flows, and existing Zustand stores.
4. Decide, and report before coding, whether `/me` will be reused as is, adjusted, or replaced, with the reason.
5. Determine the implementation order that minimizes rework (suggested: `shared` schema, then `backend`, then `frontend`).

During implementation:

- Keep business logic in the backend.
- Reuse existing components, schemas, services, middleware and standards.
- Do not create interfaces or abstractions unless they follow an existing project pattern.
- Do not turn the implementation into an object-oriented architecture.
- Keep user messages in pt-BR.
- Do not alter unrelated functionalities, and do not change the session/token strategy.

After implementation:

1. Run relevant tests (frontend, backend and shared).
2. Verify the complete flow between frontend, backend and shared: login, page reload, sign-up, session expiration and logout.
3. Verify loading, error and success states.
4. Update affected documentation.
5. Review the implementation for potential security issues (cookie flags HttpOnly, Secure, SameSite; CSRF; IDOR; rate limiting; caching headers; sensitive data in logs, responses and browser storage).

## Acceptance Criteria

- [ ] The login response returns `id`, `name` and `email`, and no sensitive data.
- [ ] The current user data can be retrieved securely using the existing session cookie, without the client sending any user identifier.
- [ ] The `/me` route was evaluated and the decision (reuse, adjust or replace) was reported.
- [ ] The password, hash and any field outside the allowlist are never returned.
- [ ] The user data is stored in a Zustand store, in memory only, and available throughout the frontend.
- [ ] The store is filled after login and sign-up, restored on page reload with a valid session, and cleared on logout and unrecoverable 401.
- [ ] The user type/schema is defined in `shared` and reused by backend and frontend.
- [ ] Rate limiting covers the involved endpoints (global coverage verified, explicit declaration only where missing).
- [ ] The existing login, logout, refresh and sign-up contracts were not changed beyond the login response fields.
- [ ] Loading, error and success states work on desktop and mobile.
- [ ] The security review was done, with any gap reported.
- [ ] Relevant tests have been implemented and pass.
- [ ] Documentation has been updated.
