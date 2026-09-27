# Feature Request Prompt

Use this template when requesting a new feature or significant
functionality.

The goal is to provide enough context for the agent to understand the
requirement, identify affected areas, and implement the feature
consistently with the project architecture without unnecessary changes.

## Feature

**Name:** Short feature name

**Goal:**
Describe what the feature should allow the user/system to do. Focus on the expected outcome.

## Context

Explain why this feature is needed and any relevant existing behavior.

## Requirements

- Requirement 1
- Requirement 2
- Requirement 3
- ...

## Business Rules

- Business rule 1
- Business rule 2
- Business rule 3
- ...

## User Flow

1. Step 1
2. Step 2
3. Step 3

## Data and API
Fill only when relevant. Do not define implementation details unless they are requirements. 
-   **Input:** Data received
-   **Output:** Expected result
-   **Endpoints:** Existing/new endpoints if known
-   **Persistence:** Data that must be stored/updated
-   **External dependencies:**
    External services/packages if relevant

## UI / UX

Describe the expected user experience. Avoid prescribing implementation unless necessary.

- Screen/page affected
- Components or interactions
- Loading/empty/error/success states
- Responsive/accessibility requirements

## Validation and Errors

-  Invalid input
-  Unauthorized/forbidden scenarios 
-  Not found/conflict scenarios
-  Other expected errors

## Tests

The implementation should include or update tests for:

-   [ ] Main success flow
-   [ ] Validation errors
-   [ ] Relevant edge cases
-   [ ] Regression scenarios
-   [ ] Frontend behavior, when applicable
-   [ ] Backend behavior, when applicable
-   [ ] Shared contracts, when applicable

## Documentation

Update the relevant project documentation when the feature changes:

-   [ ] Business rules
-   [ ] API documentation
-   [ ] User flow
-   [ ] UI documentation
-   [ ] Other: `<!-- Specify -->`

## Implementation Guidance

Before implementing:

1.  Inspect the existing architecture, related features, and relevant
    code.
2.  Identify which packages are affected: `frontend`, `backend`, and/or
    `shared`.
3.  Inspect the applicable `.clinerules` files.
4.  Reuse existing components, utilities, patterns, and abstractions
    where appropriate.
5.  Identify the implementation order that minimizes contract mismatches
    and rework.

During implementation:

-   Keep the change limited to the feature scope.
-   Follow the existing feature-based frontend structure.
-   Preserve frontend/backend/shared boundaries.
-   Apply the backend's SOLID and dependency-inversion principles
    pragmatically.
-   Use interfaces only at meaningful dependency boundaries.
-   Do not introduce abstractions without a concrete reason.
-   Keep user-facing messages in Brazilian Portuguese (`pt-BR`).
-   Do not modify unrelated functionality.

After implementation:

1.  Run the relevant tests and validation.
2.  Review the complete feature flow from frontend to backend when
    applicable.
3.  Check for missing loading, empty, error, success, and validation
    states.
4.  Update affected documentation.
5.  Summarize the files changed, tests executed, and any relevant
    decisions or limitations.

## Acceptance Criteria

-   [ ] `<!-- Criterion 1 -->`
-   [ ] `<!-- Criterion 2 -->`
-   [ ] `<!-- Criterion 3 -->`