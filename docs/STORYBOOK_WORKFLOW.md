# BRDG Storybook Workflow

Storybook is the default workshop for isolated mobile UI work in BRDG. Use it to iterate quickly on visuals, component states, and composed modules without paying the cost of full app boot, seeded data resets, or backend-dependent debugging.

This document is the canonical workflow for Storybook usage. Keep other docs short and link back here instead of restating the rules.

## Decision Rule

Use Storybook first when the task is primarily:

- visual styling, spacing, typography, or color work
- accessibility-sensitive component states or semantics that can be reviewed without real navigation or backend data
- component and module composition
- bottom-sheet shell work
- empty, loading, error, selected, disabled, or long-content states
- screen-shell layout work that does not need real navigation or backend state

Use the seeded app runtime instead when the task depends on:

- auth, session restore, or navigation flow wiring
- React Query fetching, invalidation, or persistence behavior
- realtime chat, event creation, RSVP, or notifications flows
- profile photo upload, reorder, or other backend-managed mutations
- proving that a user-facing claim works end to end in the real app

Do not create ad hoc preview routes for visual-only work. Expand Storybook instead.

## Fast Loop

1. Start Storybook from the repo root with `npm run storybook`.
2. Add or update the relevant story before iterating deeply in the integrated app.
3. Use controls/actions-friendly stories for prop tuning and interaction review.
4. Review the state matrix in Storybook until the visual result is acceptable.
5. Move to the seeded app runtime only if the change affects navigation, server data, persistence, or another real app contract.

## Story Authoring Standard

- Stories live under `mobile/src/stories`.
- Prefer arg-driven stories over hard-coded render-only stories so Storybook controls stay useful.
- Keep one overview or matrix story when it helps, but also add focused stories for the high-value states.
- Every shared primitive or reusable module should cover the states that tend to regress:
  - default
  - active or selected
  - loading
  - error
  - disabled
  - long-content or overflow
- Reuse shared decorators and screen frames instead of repeating layout wrappers in every story.
- Prefer reusable fixture builders for profiles, events, messages, and notifications instead of large inline mock objects once stories start to multiply.
- Keep stories deterministic. Avoid hidden dependence on shared query cache, auth state, or live network data.

## Coverage Expectations

Storybook should cover:

- design primitives
- shared bottom-sheet shells
- reusable cards and list rows
- chat composer and quick-action modules
- discovery, explore, create, profile, auth, and event-detail screen shells where visual iteration is common

The seeded `ui-preview` runtime remains the canonical place to validate that the integrated app still works end to end.

## PR Expectations

- Visual-only mobile changes should add or update a Storybook story in the same task.
- Reusable UI changes under `mobile/src/components`, `mobile/src/design`, or `mobile/src/features/**/components` should update Storybook in the same diff unless the PR template explains why Storybook is not the right surface.
- If a visual change also affects behavior or contracts, add the story and then validate the integrated flow in the app runtime.
- If behavior or accessibility semantics change and are not covered by existing tests, add tests or document why tests were not added.

## Recommended Review Flow

1. Review the isolated component or module in Storybook.
2. Review the screen-shell story if the change spans a larger layout.
3. Validate the integrated app path with `npm run dev:mobile` and `npm run dev:scenario -- ui-preview` only when real app behavior is involved.
4. Run the relevant checks before closing the task.
