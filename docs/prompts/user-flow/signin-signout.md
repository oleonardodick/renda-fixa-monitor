## Feature

**Name:** Sign In and Sign Out

**Goal:**
Allow users to Sign In and Sign Out in the system using secure cookie-based authentication.

## Context

To access all the functionalities of the system, users must be logged in. This feature is responsible for creating the login backend endpoint and frontend form, allowing users to authenticate securely and invalidate their session via sign out.

## Requirements

- Define the login route as public, so everyone can access it.
- Allow users to input their email and password.
- Validate the submitted data. If successful, create a new user session.
- Generate an access token using the existing JWT plugin, with a 1-hour expiration.
- Generate a refresh token, with a 1-day expiration.
- Securely store the access token and refresh token using HttpOnly cookies.
- On logout, clear the authentication cookies and redirect to the login page.

## Business Rules

- Generate the tokens using the JWT plugin that already exists in the system.
- The JWT access token payload must contain at least the user ID.
- Store tokens in secure HttpOnly cookies (or appropriate client/server cookies configuration matching the stack) to prevent XSS vulnerabilities.
- Do not store the backend session on a database for now (stateless JWT).
- The response and error messages must not reveal whether the email or password is incorrect (generic message: "E-mail ou senha inválidos").
- Validation errors for input format (e.g., invalid email format, empty password) must be displayed specifically under their respective form fields.
- When successful, return the user ID and necessary success metadata to the frontend.
- The access token must have a 1-hour expiration.
- The refresh token must have a 1-day expiration.
- On logout, invalidate/clear the session cookies.
- All user-facing messages must be in Brazilian Portuguese (pt-BR).

## User Flow

1. The user accesses the login screen.
2. The system presents a form to enter the email and password.
3. The user inputs their email and password.
4. The user clicks the "Confirmar" button.
5. The system validates the sent data.
6. The system returns success and sets authentication cookies, or returns a generic error if unauthorized.
7. A new session is initiated.
8. The user is redirected to the Dashboard page (to be created in another feature).
9. The user triggers the "Sair" action (button location may be temporary for now).
10. The authentication cookies are cleared and the user is redirected to the login page.

## Data and API

- **Input:**
  - Email (string, validated format).
  - Password (string).

- **Output:**
  - Generic error when unauthorized.
  - User ID and success confirmation when authorized (tokens handled via cookies).

- **Endpoints:**
  - Create the necessary endpoints following existing API standards.

- **Persistence:**
  - Does not store the session on the database for now.

## UI / UX

- Add the Email and Password fields to the login screen.
- Add the "Esqueci minha senha" link to the login screen (no logic required yet).
- Use existing components and shadcn/ui.
- Use React Hook Form and Zod for forms.
- Display loading states during requests.
- Display specific field-level validation errors (from Zod).
- The interface must work seamlessly on desktop and mobile.
- All interface texts and messages must be in pt-BR.
- Include a "Sair" button component on the interface when logged in (its final layout position can be adjusted in future tasks).

## Validation and Errors

- Invalid email or password: The message must be generic ("E-mail ou senha incorretos" ou similar) and must not indicate which specific field failed authentication.

## Tests

The implementation should include or update tests for:

- [x] Main success flow
- [x] Validation errors
- [x] Relevant edge cases
- [x] Regression scenarios
- [x] Frontend behavior
- [x] Backend behavior
- [x] Shared contracts

## Documentation

Update the relevant project documentation when the feature changes:

- [x] Business rules
- [x] API documentation
- [x] User flow
- [x] UI documentation
- [ ] Other: N/A

## Implementation Guidance

Before implementing:

1. Identify the affected packages: `frontend`, `backend`, and `shared`.
2. Inspect applicable `.clinerules`.
3. Reuse existing components, schemas, services, and standards.
4. Determine the implementation order that minimizes rework.

During implementation:

- Organize the frontend within `features/auth`, following the existing organization.
- Keep business logic in the backend.
- Use interfaces at infrastructure boundaries that may need to be replaced in the future.
- Do not turn the implementation into an object-oriented architecture.
- Do not create abstractions without concrete necessity.
- Keep user messages in pt-BR.
- Do not alter unrelated functionalities.

After implementation:

1. Run relevant tests.
2. Verify the complete flow between frontend, backend, and shared.
3. Verify loading, error, and success states.
4. Update affected documentation.
5. Review the implementation for potential security issues (such as cookie flags: HttpOnly, Secure, SameSite).

## Acceptance Criteria

- [ ] The user can login to the system.
- [ ] The response/error does not reveal whether the email or password is wrong.
- [ ] The access token is created via JWT and has an expiration period of 1 hour.
- [ ] The refresh token is created and has an expiration period of 1 day.
- [ ] Tokens are securely stored via HttpOnly cookies.
- [ ] The user ID is returned in the response.
- [ ] The user can logout of the system and clear cookies.
- [ ] Relevant tests have been implemented.
- [ ] Documentation has been updated.
