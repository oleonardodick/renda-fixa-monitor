## Feature

**Name:** User creation

**Goal:**
Allow new users to create an account so they can use all the application resources.

## Context

To access all the functionalities of the system, users must have an account and be logged in. This feature provides a public way for new users to create their accounts and be logged in right after.

## Scope

**In scope:** public sign-up screen, sign-up endpoint, shared validation schema, user persistence, automatic login after sign-up (reusing the existing Login feature), tests and documentation.

**Out of scope (do not implement):** email verification, password recovery, social login, changes to the existing login/logout/refresh behavior, changes to the Dashboard.

## Requirements

- The create user route (frontend page and backend endpoint) must be public.
- Allow users to input name, email, password and confirm password.
- Validate the submitted data. If valid, create the user and log them in.
- Reuse the existing Login feature to create the session. The sign-up service must call the existing internal session-creation function/service. It must NOT call the HTTP login endpoint.
- A user who is already authenticated and accesses the sign-up page must be redirected to the Dashboard.

## Business Rules

### Name

- Trimmed before validation.
- Minimum 3 and maximum 100 characters (after trim).

### Email

- Trimmed and converted to lowercase before validation and persistence.
- Must be in a valid format.
- Must be unique (case-insensitive, since emails are stored in lowercase).
- Uniqueness must be guaranteed by a unique constraint in the database, in addition to the application check. A violation caused by concurrent requests must be handled as "email already in use", not as a generic error.
- Decision: when the email is already registered, the system explicitly informs it (field-level error on email). This is accepted for sign-up. Mitigate enumeration with rate limiting on the endpoint.

### Password

- Minimum 8 characters and maximum 72 bytes (bcrypt limit; do not truncate silently).
- Must satisfy at least 3 of the following 4 rules:
  - At least 1 uppercase letter.
  - At least 1 lowercase letter.
  - At least 1 number.
  - At least 1 special character.
- Must not be trimmed or otherwise altered.

### Confirm password

- Must be equal to the password.
- Decision: `confirmPassword` is sent to the backend and validated on both sides by the same Zod schema defined in `shared`. It is never persisted or logged.

### General

- After the user creation, the user must be logged in using the existing Login feature.
- Validation errors for input format (e.g., invalid email format, empty password) must be displayed specifically under their respective form fields.
- All user-facing messages (frontend and backend) must be in Brazilian Portuguese (pt-BR).

## User Flow

1. The user accesses the create account screen.
2. The system presents a form with name, email, password and confirm password.
3. The user fills in the fields.
4. The user clicks the "Criar Conta" button.
5. The system validates the submitted data (client-side with Zod, then server-side with the same schema).
6. If the data is valid:
   - a. The system creates the user and logs them in via the existing Login feature.
   - b. The user is redirected to the Dashboard page.
7. If the data is invalid or the email is already in use, the system returns the errors and displays them under the respective fields. The user stays on the form and no redirect happens.
8. If an unexpected error happens (network or server failure), a generic pt-BR message is displayed (toast or alert) and the form data is preserved, except password fields.

## Data and API

- **Input:**
  - `name` (string).
  - `email` (string, validated format).
  - `password` (string).
  - `confirmPassword` (string).

- **Output:**
  - Success: the created user ID only (no password, hash or other sensitive data), plus the session cookies set by the Login feature.
  - Validation error: HTTP 400 with errors per field, following the existing API error format.
  - Email already in use: HTTP 409 with an error on the `email` field, following the existing API error format.
  - Unexpected error: HTTP 500 with a generic pt-BR message and no internal details.

- **Endpoints:**
  - Create the necessary endpoint(s) following existing API standards (route naming, response envelope, error format).

- **Persistence:**
  - Store the user in the database with a unique constraint on email.
  - The password must never be stored in plain text. Use bcrypt, with the cost factor taken from configuration (default 12, unless the project already defines another).
  - Never log passwords or hashes.

## UI / UX

- Add Name, Email, Password and Confirm Password fields on the create user screen.
- Add a "Criar Conta" link to the login screen that redirects to the create user page. Also add a link back to login on the sign-up screen, if consistent with the existing design.
- Use existing components and shadcn/ui.
- Use React Hook Form and Zod for the form, with the Zod schema coming from `shared`.
- Display loading states during requests (disable the submit button and prevent double submission).
- Display specific field-level validation errors (from Zod and from the API response, mapped to their fields).
- Accessibility: every field has a label, invalid fields use `aria-invalid` and are linked to their error message, and focus moves to the first invalid field after a failed submit.
- The interface must work seamlessly on desktop and mobile.
- All interface texts and messages must be in pt-BR.

## Validation and Errors

- Invalid name, email or password: the message must be specific and be shown in the corresponding field (e.g., "A senha deve ter pelo menos 8 caracteres").
- Email already in use: specific message shown in the email field.
- Password mismatch: message shown in the confirm password field.
- Unexpected errors: generic pt-BR message, without technical details.

## Security

- Apply rate limiting to the sign-up endpoint, reusing existing middleware or standards if they exist.
- Session cookies (set by the Login feature) must keep HttpOnly, Secure (in production) and an appropriate SameSite value. Verify that this flow does not weaken them.
- Verify CSRF protection is adequate for the cookie-based flow. Follow the project's existing approach, and report if there is a gap instead of inventing a new mechanism.
- Do not expose sensitive data or stack traces in responses.

## Tests

The implementation must include or update tests for the cases below.

**Backend**

- Successful creation: user is persisted, password is stored as a bcrypt hash, session is created via the Login feature, response contains the user ID.
- Name too short, too long, and only whitespace.
- Invalid email format.
- Duplicate email, including different casing (`A@x.com` vs `a@x.com`) and surrounding spaces.
- Concurrent creation with the same email results in a single user and a 409 for the other request.
- Password: fewer than 8 characters, longer than 72 bytes, exactly 2 of 4 rule types (rejected), exactly 3 of 4 (accepted), all 4 (accepted).
- Password and confirm password different.
- Database failure returns a generic error.
- Regression: existing login, logout and refresh behavior remains unchanged.

**Shared**

- The Zod schema covers all rules above, including trimming and lowercasing.

**Frontend**

- Renders all fields and the "Criar Conta" button.
- Field-level errors displayed in pt-BR under the correct fields.
- API errors (400 and 409) mapped to the correct fields.
- Loading state and double-submit prevention.
- Success redirects to the Dashboard.
- Authenticated user is redirected away from the sign-up page.
- The "Criar Conta" link on the login screen navigates to the sign-up page.

## Documentation

Update the relevant project documentation (locate the existing files in the repository and update them, do not create duplicates):

- [x] Business rules
- [x] API documentation (new endpoint, request/response, status codes)
- [x] User flow
- [x] UI documentation

## Implementation Guidance

Before implementing:

1. Identify the affected packages: `frontend`, `backend`, and `shared`.
2. Inspect applicable `.clinerules`.
3. Reuse existing components, schemas, services, and standards.
4. Determine the implementation order that minimizes rework (suggested: `shared` schema, then `backend`, then `frontend`).

During implementation:

- Organize the frontend within `features/users`, following the existing organization.
- Keep business logic in the backend.
- Use interfaces only at infrastructure boundaries that may be replaced in the future: password hasher and user repository. Do not create interfaces or abstractions elsewhere.
- Do not turn the implementation into an object-oriented architecture.
- Keep user messages in pt-BR.
- Do not alter unrelated functionalities.

After implementation:

1. Run relevant tests (frontend, backend and shared).
2. Verify the complete flow between frontend, backend, and shared.
3. Verify loading, error, and success states.
4. Update affected documentation.
5. Review the implementation for potential security issues (cookie flags HttpOnly, Secure, SameSite; CSRF; rate limiting; sensitive data in logs and responses).

## Acceptance Criteria

- [ ] A new user can create an account with a valid name, email, password and confirm password.
- [ ] After creation, the session is created through the existing Login feature and the user is redirected to the Dashboard.
- [ ] Invalid data shows specific pt-BR messages under the corresponding fields, validated on both frontend and backend with the shared Zod schema.
- [ ] An already registered email (including case and whitespace variations and concurrent requests) is rejected with a field-level message.
- [ ] The password follows the defined rules (8+ characters, at most 72 bytes, 3 of 4 types) and is stored only as a bcrypt hash.
- [ ] The response returns only the user ID, with no sensitive data.
- [ ] The "Criar Conta" link on the login screen leads to the sign-up page, and authenticated users are redirected away from it.
- [ ] Loading, error and success states work on desktop and mobile.
- [ ] The existing login, logout and refresh behavior was not changed.
- [ ] Rate limiting is applied and the security review was done, with any gap reported.
- [ ] Relevant tests have been implemented and pass.
- [ ] Documentation has been updated.
