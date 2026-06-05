---
name: netlify-build
description: Create a Netlify-deploy-friendly build of the site. Use when the user wants to "make a netlify build", "create a netlify build.zip", "netlify-ify a branch", or otherwise produce a deployable zip with relative paths. Forks a branch (from the current branch or main), rewrites GitHub-Pages absolute paths to relative ones, and zips the static site into `netlify build.zip` ready to drag-drop into Netlify.
---

# Netlify Build

This site is normally served from GitHub Pages at the `/map-salurbal/` subpath, so its
internal links and asset references are written as **absolute root paths** (e.g.
`/map-salurbal/index.html`, `/images/Assets/favicon.ico`). Netlify serves from the domain
**root**, so those absolute paths break there.

This skill produces a Netlify-friendly copy: it forks a branch, rewrites the absolute paths
to **relative** ones, and bundles the static site into `netlify build.zip` for manual
"drag-and-drop" deploy on Netlify.

It is safe to re-run — each run reassesses state and rebuilds the zip from the current files.

## User context

The user may name a source branch or a new branch name. Use it if given. Otherwise ask /
derive sensible defaults as described below.

## Step 1: Choose the source branch

Run `git branch --show-current` to get the current branch.

Unless the user already specified the source, ask them with AskUserQuestion which branch to
fork from:
- **Current branch** (`<current-branch>`) — the work in progress, e.g. with the latest
  processed headshots/pins. **Recommended** default.
- **main** — the released baseline.

Do NOT modify the source branch. All edits happen on a new branch forked from it.

## Step 2: Create the build branch

1. Make sure the working tree is clean (`git status`). If there are uncommitted changes,
   tell the user and ask whether to stash/commit them or include them — do not silently
   discard work.
2. Pick a branch name. Default: `netlify-build/<source-branch>` (e.g.
   `netlify-build/initial-update`). If that branch already exists, either reuse it
   (`git checkout`) and reset it to the source, or append a suffix — confirm with the user.
3. Create and switch to it from the chosen source:
   `git checkout -b <build-branch> <source-branch>`

## Step 3: Rewrite absolute paths to relative

Apply these transforms across **all** `*.html` files and `scripts/*.js` (and `styles.css`
if relevant). The rules, in order:

1. Strip the GitHub-Pages subpath prefix: `/map-salurbal/` → `` (empty).
   - `href="/map-salurbal/index.html"` → `href="index.html"`
   - `url: '/map-salurbal/usa.html'` → `url: 'usa.html'`
2. Drop the leading slash on remaining root-relative asset references so they resolve
   relative to the page:
   - `href="/images/Assets/favicon.ico"` → `href="images/Assets/favicon.ico"`
   - any `src="/..."`, `href="/..."`, `url('/...')` → same without the leading `/`
   - **Do not** touch protocol-relative (`//cdn…`) or absolute URLs (`https://…`) — only
     a quote/paren immediately followed by a single `/`.

The current known occurrences are: the favicon `<link>` and back-button `<a>` in every
`*.html`, and the `url:` fields in `scripts/script.js`. New pages may add more, so don't
hardcode the file list — process every HTML/JS file.

Recommended approach (PowerShell, edits the working tree in place):

```powershell
$targets = Get-ChildItem -Path *.html, scripts\*.js
foreach ($f in $targets) {
    $t = Get-Content -Raw $f.FullName
    $t = $t -replace '/map-salurbal/', ''          # strip GH Pages subpath
    $t = $t -replace '(href|src)="/(?!/)', '$1="'  # drop leading slash on attrs
    $t = $t -replace "(href|src)='/(?!/)", "`$1='"
    $t = $t -replace "url\(\s*'/(?!/)", "url('"     # CSS-in-attr / inline
    Set-Content -NoNewline -Encoding utf8 $f.FullName $t
}
```

(If you prefer, apply the edits with the Edit tool file-by-file instead — either is fine.)

### Verify the rewrite

After editing, confirm nothing was missed and nothing external was broken. Grep the working
tree for leftover absolute internal references:

- Search `*.html` / `*.js` for `="/`, `='/`, `: '/`, `url('/`, and `/map-salurbal/`.
- Any remaining hit should be a legitimately external URL (`https://`, `//cdn…`). If an
  internal path remains absolute, fix it.

## Step 4: Commit the path changes

Commit so the build branch is a real, reusable Netlify branch:

```
git add <changed html + js files>
git commit -m "Use relative paths for Netlify root deploy"
```

Stage files by name; do not `git add -A` (avoids sweeping in the zip or dev files).

## Step 5: Build `netlify build.zip`

Bundle the **static site only**, with files at the archive root (no wrapping folder, so it
unzips straight into Netlify's publish dir). Include: all `*.html`, `styles.css`,
`README.md`, and the `images/` and `scripts/` directories. Exclude `.git`, `.claude`,
`.context`, the zip itself, and any non-README markdown/protocol docs.

```powershell
Compress-Archive -Path *.html, styles.css, README.md, images, scripts `
  -DestinationPath 'netlify build.zip' -Force
```

If new top-level asset folders (e.g. `fonts/`, `css/`) exist, add them to `-Path`.

The zip is a build artifact. By default leave it **uncommitted** (consider adding
`netlify build.zip` to `.gitignore`). Only commit it if the user asks — note that the
`feat/relative-branch` history did commit it previously, but that bloats the repo.

## Step 6: Report

Tell the user:
- The new branch name and what it was forked from.
- That paths were rewritten and verified.
- The location of `netlify build.zip` (repo root) and that they can drag-and-drop it into
  the Netlify deploy UI (or `netlify deploy` CLI).
- Whether the zip is committed or not.
