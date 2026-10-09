# Models

`/craft` (builder) and `/audit` (reviewer) are independent and run on different models so they do not share blind spots.

| Command | Model | How it is set |
|---|---|---|
| `/craft` | Recommended: Claude Sonnet 5.5 (high) | The chat's selected model. Cursor command files have no model field, so this is documented, not enforced. |
| `/audit` | `gpt-5.6-sol-high` (a different family) | Pinned in `model:` frontmatter of `.cursor/agents/pr-auditor.md`; runs on it whichever model the chat uses. |

Rules:
- The auditor model must differ from the builder model, preferably a different family.
- If only one family is available, use two different models from it and accept the reduced independence. Change `model:` in `pr-auditor.md` and update this file.
- Confirm on first run that the subagent frontmatter `model:` is honoured: the report's `Reviewed by:` line must name the pinned model.
