# PR Comment Template

When the user asks to post review findings as a PR comment, use this format.

## Structure

The structure adapts based on the verdict:

### When verdict is **Request Changes** or **Needs Discussion**

```markdown
## Code Review (Pass XXXX)

> [!CAUTION]
> **Verdict: Request Changes**
> {One-sentence rationale.}

### Action Items

- [ ] **{Issue title}** — `{file:line}` {Description of the issue and what to do about it.}
- [ ] ...

### Suggestions

- **{Topic}** — {Optional/cosmetic recommendation that won't block merge.}
- ...

### Notes

- **{Topic}** — {Observation or confirmation that doesn't require action.}
- ...

---

Review feedback assisted by the [critical-code-reviewer skill](https://github.com/posit-dev/skills/blob/main/posit-dev/critical-code-reviewer/SKILL.md).
```

### When verdict is **Approve**

```markdown
## Code Review (Pass XXXX)

> [!NOTE]
> **Verdict: Approve**
> {One-sentence rationale.}

### Suggestions

- **{Topic}** — {Optional/cosmetic recommendation that won't block merge.}
- ...

### Notes

- **{Topic}** — {Observation or confirmation that doesn't require action.}
- ...

---

Review feedback assisted by the [critical-code-reviewer skill](https://github.com/posit-dev/skills/blob/main/posit-dev/critical-code-reviewer/SKILL.md).
```

When approved, there are no **Action Items** — everything remaining is optional. Use **Suggestions** for cosmetic or non-breaking recommendations. If there are no suggestions either, omit that section entirely.

## Verdict

The verdict callout appears **below** the `## Code Review` heading and **above** the first `###` section. Use a GitHub blockquote callout based on severity:

| Verdict              | Callout type   |
| -------------------- | -------------- |
| **Approve**          | `> [!NOTE]`    |
| **Needs Discussion** | `> [!WARNING]` |
| **Request Changes**  | `> [!CAUTION]` |

The rationale line should be one sentence explaining why — e.g., "No blocking issues after rigorous review" or "3 blocking issues must be resolved before merge."

## Sections by verdict

| Section                        | Request Changes / Needs Discussion            | Approve                                       |
| ------------------------------ | --------------------------------------------- | --------------------------------------------- |
| **Action Items** (`- [ ]`)     | Required — blocking issues that must be fixed | Omitted — nothing blocks merge                |
| **Suggestions** (`- **bold**`) | Optional — non-blocking recommendations       | Optional — cosmetic/polish items              |
| **Notes** (`- **bold**`)       | Always — observations, confirmations, context | Always — observations, confirmations, context |

## Pass Numbering

Before posting, scan the PR's existing comments for previous `## Code Review (Pass N)` headings. Set the pass number to the next increment. If no previous code review comments exist, use `Pass 1`.

To scan: `gh pr view {PR_NUMBER} --repo {REPO} --comments --json comments --jq '.comments[].body'` and search for `Code Review (Pass`.

## Rules

- **Action items** are checkbox items (`- [ ]`). These are blocking issues, required changes, and verify items — things that must be resolved before merge. Only appear when verdict is NOT Approve.
- **Suggestions** are bold bullet points (no checkboxes). These are optional, cosmetic, or non-breaking recommendations. They appear in any verdict but are the primary feedback section when approved.
- **Notes** are bold bullet points (no checkboxes). These are confirmations, observations, and context — things worth recording but that don't need action.
- Keep it concise. The full review conversation has the details; the PR comment is the summary.
- Bold the issue/topic title, use `file:line` references where applicable.
- Always end with the attribution footer.
- Do NOT post automatically — only when the user explicitly asks.
