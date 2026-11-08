# CLAUDE.md

## Scope

- When asked to change something in `apps/cms`, do not make any changes in `apps/site` unless explicitly told to.
- Do not ask whether `apps/site` should be changed as well, and do not propose site changes. The site is handled separately.

## Git

- Never make commits on your own. Only commit when explicitly told to.

## Code style

- If statements must always use curly braces and be split across multiple lines, e.g.:

  ```ts
  if(error) {
    throw error;
  }
  ```

- Prefer `undefined` over `null`.
