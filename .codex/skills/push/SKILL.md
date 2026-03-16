---
name: push
description: |
  Push the current branch to GitHub and create or update the BRDG pull request.
---

# Push

## Preconditions

- `gh auth status` succeeds.
- Required local validation for the current scope is already green.

## Steps

1. Confirm branch name, git status, and last validation run.
2. Push the branch to `origin`.
3. If the push is rejected because the branch is stale or non-fast-forward, run the `pull` skill, rerun validation, and push again.
4. If no PR exists, create one. If a PR exists, update it.
5. Fill out `.github/pull_request_template.md` with concrete BRDG-specific content:
   - task scope
   - changes
   - validation actually run
   - visual evidence when mobile UI changed
   - risks and follow-ups
6. Ensure the PR has the `symphony` label.
7. Reply with the PR URL and attach it to the Linear issue.
