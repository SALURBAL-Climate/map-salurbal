---
name: ship
description: Ship code changes via PR. Use when the user says "ship", wants to create a PR, push changes, or send work for review. Handles the full lifecycle - branching off main, committing, pushing, creating or updating PRs with descriptions based on the full diff vs main, and opening the PR in the browser.
---

# Ship

Ship is a flexible, idempotent shipping workflow. Every time it runs, it assesses the current state and does the right thing — branching, committing, pushing, and creating or updating a PR with a description that always reflects the **complete diff vs main**.

## User context

The user may provide context about what they're shipping. Use this to inform branch names, commit messages, and PR descriptions. If no context is provided, derive it from the code changes.

## Step 1: Assess the current state

Run these commands to understand where we are:

1. `git branch --show-current` — what branch are we on?
2. `git status` — any uncommitted changes? (never use `-uall` flag)
3. If NOT on `main`: `gh pr list --head <current-branch> --json number,title,url` — is there already a PR for this branch?

If there are no uncommitted changes AND the branch is identical to main (no diff), tell the user there's nothing to ship and stop.

## Step 2: Branch off main (if on main)

If the current branch is `main`:

1. Pull latest: `git pull origin main`
2. Pick a short branch name from the user's context or the nature of the changes.
   - Format: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`, `chore/<slug>`, or `tech/<slug>`
   - Keep it short and descriptive
3. Run `git checkout -b <branch-name>`

If already on a feature branch, stay on it.

## Step 3: Commit (if uncommitted changes exist)

If there are uncommitted changes:

1. Run `git diff` and `git diff --cached` to understand all changes.
2. Assess whether the changes are logically cohesive or span multiple concerns.
   - If changes are related, make a single commit.
   - If changes span multiple unrelated concerns (e.g., a new feature AND a config tweak), make **separate commits** — one per logical unit. Stage and commit each group individually.
3. For each commit:
   - Stage relevant files **by name** (not `git add -A`). Never stage secrets or `.env` files — warn the user if spotted.
   - Write a commit message based on the actual diffs:
     - Short subject line, imperative mood, under 72 chars
     - Body explaining "why" if non-trivial
     - **NEVER** use closing keywords (`Closes`, `Fixes`, `Resolves` and their variants) — issues are always closed manually by a human. Use `Related to #123` or `See #123` instead.
     - End with `Co-Authored-By: Claude <noreply@anthropic.com>`
   - Commit using a HEREDOC for the message.

If no uncommitted changes, skip this step.

## Step 4: Push

```bash
git push -u origin <branch-name>
```

## Step 5: Analyze the full diff vs main

**This runs every time, regardless of lifecycle stage.** It ensures the PR always reflects the complete picture.

1. `git log main..<branch> --oneline` — all commits on this branch
2. `git diff main...<branch> --stat` — all changed files
3. `git diff main...<branch>` — the full diff
4. `git rev-parse HEAD` — capture the HEAD commit SHA for permalink generation

Use this to generate a PR title and description.

## Step 6: Create or update the PR

### PR title

- Under 70 characters
- Derived from user context and the full diff

### File links in the PR body

When linking to files in the repository, **always use commit SHA permalinks**, never branch-name links. Branch links break when the branch is deleted after merge. SHA links are immutable and work during review, after merge, and after branch deletion.

- **Get the SHA:** use the HEAD SHA captured in Step 5
- **Format:** `https://github.com/{owner}/{repo}/blob/{sha}/path/to/file`
- **Never use:** `https://github.com/{owner}/{repo}/blob/{branch-name}/path/to/file`

Since `/ship` is idempotent, re-running it after new commits will update the SHA links to the latest HEAD automatically.

### PR body

Use this format:

```
## Context
<Bullet points describing WHY these code changes were made — the motivation, problem being solved, or product requirement>

## Changes
<Bullet points summarizing WHAT code changes were made>

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### Create or update

- **No existing PR:** `gh pr create --title "..." --body "$(cat <<'EOF' ... EOF)"`
- **PR already exists:** `gh pr edit <number> --title "..." --body "$(cat <<'EOF' ... EOF)"`

## Step 7: Open in browser

```bash
gh pr view --web
```

## Step 8: Report back

Tell the user:

- Branch name
- PR number and URL
- Summary of what was shipped
- Whether this was a new PR or an update

## Rules

- **NEVER** force push
- **NEVER** push directly to main
- **NEVER** skip commit hooks (`--no-verify`)
- **NEVER** commit secrets or `.env` files
- **NEVER** use GitHub closing keywords (`Closes`, `Fixes`, `Resolves` and their variants) in commit messages or PR descriptions. Issues are always closed manually by a human. Reference issues with `Related to #123` or `See #123`.
- If something fails, stop and tell the user — don't retry blindly
- Always base PR descriptions on the **full diff vs main**, not just the latest commit
- **NEVER** use branch-name links (`/blob/<branch>/...`) in PR bodies — always use commit SHA permalinks (`/blob/<sha>/...`)
