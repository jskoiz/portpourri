---
name: commit
description: |
  Create a clean git commit that matches the actual BRDG diff and includes the
  validation that was run.
---

# Commit

1. Inspect `git status`, `git diff`, and `git diff --staged`.
2. Stage only the intended files.
3. Sanity-check that no generated junk, logs, or unrelated edits are staged.
4. Write a conventional commit subject that matches the change.
5. Include a short body with:
   - Summary of the user-visible or operator-visible change
   - Rationale
   - Validation actually run
6. Add `Co-authored-by: Codex <codex@openai.com>` unless instructed otherwise.
7. Use `git commit -F` with a real multi-line message file, not a single `-m` string.
