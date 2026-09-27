# Security Rules

## Context

These rules protect application data, users, and infrastructure.
Security controls must be enforced at trusted system boundaries and must never be weakened to simplify development or testing.

## Rules

- Never hardcode secrets, tokens, passwords, private keys, or credentials.
- Validate all untrusted input at system boundaries.
- Treat client input, request bodies, query parameters, headers, files, and external API responses as untrusted.
- Never trust authorization decisions made by the frontend.
- Enforce authentication and authorization on the backend.
- Never expose passwords, password hashes, tokens, or sensitive internal data in API responses or logs.
- Hash passwords with bcrypt; never store plaintext passwords.
- Use generic authentication errors to avoid leaking whether an account exists.
- Avoid logging sensitive request data.
- Validate uploaded files by type and size before processing or storing them.
- Prevent path traversal when handling user-controlled file names or paths.
- Use parameterized/structured database operations; never build database queries from raw user input.
- Do not weaken validation or security controls to make tests pass.
- When modifying authentication, authorization, uploads, or sensitive data handling, review the complete affected flow.