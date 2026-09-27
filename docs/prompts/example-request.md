## Feature

**Name:** Password Recovery

**Goal:**
Allow a user who forgot their password to request account recovery via their email address and set a new password.

## Context

The system currently features email and password authentication, but lacks a way to recover access when the user forgets their password.

Recovery must take place via a temporary token sent to the registered email.

## Requirements

- Add a "Forgot my password" option on the login screen.
- Allow the user to enter their email.
- Send an email containing a password reset link.
- The link must contain a recovery token.
- The token must have a limited validity period.
- Allow the user to enter and confirm a new password.
- Invalidate the token after a successful reset.
- Allow requesting a new recovery after the token expires.

## Business Rules

- The entered email must be validated.
- The response to the request must not reveal whether the email is registered.
- The token must be random and non-predictable.
- The token must have an expiration period.
- A used token cannot be reused.
- The new password must meet the password requirements defined by the system.
- The new password must be stored using bcrypt.
- The recovery token must not be stored in plain text when a secure alternative exists.
- Recovery requests must not automatically create a session.
- All messages presented to the user must be in Brazilian Portuguese.

## User Flow

1. The user accesses the login screen.
2. The user selects "Forgot my password".
3. The system presents a form to enter the email.
4. The user enters the email and requests recovery.
5. The system presents a generic message informing that, if the email is registered, instructions will be sent.
6. The user accesses the link received via email.
7. The system validates the token.
8. The system presents the form to set a new password.
9. The user enters and confirms the new password.
10. The system updates the password and invalidates the token.
11. The user is redirected to the login screen.

## Data and API

- **Input:**
  - Email for recovery request.
  - Recovery token.
  - New password.
  - New password confirmation.

- **Output:**
  - Recovery request accepted.
  - Token validation.
  - Password change confirmation.

- **Endpoints:**
  - Create the necessary endpoints following existing API standards.

- **Persistence:**
  - Persist the necessary data to control recovery tokens.
  - Do not store tokens in plain text.
  - Update the user's password.

- **External dependencies:**
  - Use the existing email-sending solution, if any.
  - If none exists, create an abstraction that allows replacing the email provider in the future.

## UI / UX

- Add the "Forgot my password" link to the login screen.
- Create a page to request recovery.
- Create a page to set the new password.
- Use existing components and shadcn/ui.
- Use React Hook Form and Zod for forms.
- Display loading states during requests.
- Display validation error messages.
- Display a success message after the request.
- Display an appropriate message when the token is invalid or expired.
- The interface must work on desktop and mobile.
- All messages must be in pt-BR.

## Validation and Errors

- Invalid email.
- Password does not meet requirements.
- Password confirmation does not match the password.
- Non-existent token.
- Expired token.
- Token already used.
- Email sending failure.
- Unexpected password change failure.

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

1. Inspect the current authentication implementation.
2. Identify the affected packages: `frontend`, `backend`, and `shared`.
3. Inspect applicable `.clinerules`.
4. Reuse existing components, schemas, services, and standards.
5. Determine the implementation order that minimizes rework.

During implementation:

- Organize the frontend within `features/auth` or a dedicated password recovery feature, following the existing organization.
- Keep business logic in the backend.
- Use interfaces at infrastructure boundaries that may need to be replaced in the future.
- Do not turn the implementation into an object-oriented architecture.
- Do not create abstractions without concrete necessity.
- Do not expose information that reveals whether an email is registered.
- Keep user messages in pt-BR.
- Do not alter unrelated functionalities.

After implementation:

1. Run relevant tests.
2. Verify the complete flow between frontend, backend, and shared.
3. Verify loading, error, and success states.
4. Update affected documentation.
5. Review the implementation for potential security issues.

## Acceptance Criteria

- [ ] The user can access "Forgot my password" from the login screen.
- [ ] The user can request recovery by providing their email.
- [ ] The response does not reveal whether the email is registered.
- [ ] A secure token is created and has an expiration period.
- [ ] The user can set a new password via the received link.
- [ ] Expired or already used tokens are rejected.
- [ ] The new password is stored with bcrypt.
- [ ] The token is invalidated after use.
- [ ] Relevant tests have been implemented.
- [ ] Documentation has been updated.