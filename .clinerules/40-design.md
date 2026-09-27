---
paths:
  - "frontend/**"
  - "frontend/src/**"
  - "apps/frontend/**"
  - "apps/web/**"
  - "**/*.tsx"
  - "**/*.css"
---

# UI Design Rules

## Context

The interface should remain visually consistent, accessible, and responsive as new features are added.
The project uses shadcn/ui as its component foundation, Tailwind CSS for styling, and Lucide for icons.
Prefer existing project components and shadcn/ui components instead of creating new UI patterns.

## Rules

- Use shadcn/ui components whenever an appropriate component exists.
- Prefer existing project-specific components before adding a new shadcn/ui component.
- Add a new shadcn/ui component when the required UI pattern does not already exist.
- Do not recreate shadcn/ui components manually when an equivalent component is available.
- Customize shadcn/ui components through their supported composition and styling patterns.
- Use Tailwind CSS for styling.
- Use `tailwind-merge` for conditional or conflicting class composition when appropriate.
- Use Lucide icons instead of manually drawn SVG icons when an equivalent icon exists.
- Keep spacing, typography, borders, radius, and colors consistent with the existing design system.
- Prefer existing design tokens and CSS variables over arbitrary values.
- Design responsive layouts for desktop and mobile.
- Provide visible loading, empty, error, and success states where applicable.
- Preserve keyboard accessibility and semantic HTML.
- Associate labels with form controls.
- Avoid unnecessary animations and visual effects.