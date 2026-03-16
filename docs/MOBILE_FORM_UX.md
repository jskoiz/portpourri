# Mobile Form UX Checklist

Use these defaults when adding or changing editable mobile surfaces in BRDG.

- Prefer structured inputs over raw text when the value comes from a bounded set.
- Use bottom sheets for selection flows so date, location, and discrete choices behave consistently.
- Use `DateField` for dates instead of split month/day/year or manual typing.
- Use `LocationField` for city and place entry so recent selections and known BRDG spots are reusable.
- Use `SheetSelectField` for bounded single-choice values such as profile attributes.
- Use `StepperField` when a small numeric range is easier to adjust than type.
- Set semantic text input metadata where it applies: `autoComplete`, `textContentType`, `keyboardType`, `returnKeyType`, `submitBehavior`, and capitalization rules.
- Keep keyboard dismissal and scroll behavior consistent: `keyboardShouldPersistTaps="handled"` and keyboard-aware containers on form-heavy screens.
- Keep helper/error copy directly under the field, not detached elsewhere in the screen.
- For bottom sheets, include explicit close semantics through `Cancel`, `Done`, or `Apply`.
- Preserve existing backend payload contracts unless a schema change is explicitly intended.
