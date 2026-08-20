# The Number Ledger

A single-page reference + practice tool for multiplication tables (1–30), squares
(1–25, with the anchor-method trick for 26–100), and cubes (1–20). No build step,
no dependencies beyond two Google Fonts — three files, pure HTML/CSS/JS.

## Files
- `index.html` — structure and content for all four sections (Tables, Squares, Cubes, Practice)
- `style.css` — theme tokens, light/dark mode, layout
- `app.js` — reference-table rendering + the adaptive quiz engine

## Publishing on GitHub Pages

Since `matterthathinks.github.io` is already your Pages root, this becomes a
sub-path automatically — no extra Pages setup needed.

1. Go to `github.com/matterthathinks/matterthathinks.github.io`
2. Click **Add file → Create new file**
3. In the filename box type `numbers-practice/index.html` — GitHub creates the
   folder for you as soon as you type the `/`. Paste in the contents of `index.html`, commit.
4. Repeat for `numbers-practice/style.css` and `numbers-practice/app.js`.
5. Wait 30–60 seconds, then visit `https://matterthathinks.github.io/numbers-practice/`
   (note the trailing slash — without it, the browser won't find `style.css`/`app.js`
   via their relative paths).

That's it. No `numbers-practice.` — your original URL in the ask had a stray dot
after the repo name; the real address is `matterthathinks.github.io/numbers-practice/`.

## How the adaptive timer works
Each mode (Tables / Squares / Cubes / Mixed) has its own countdown, starting at
10s, that steps down through `10 → 8 → 6 → 4 → 3` as you string together five
correct, comfortably-fast answers in a row. A wrong answer or a timeout knocks
it back one step. All of this — plus per-fact "you keep missing this one so it
shows up more often" weighting — lives in `localStorage`, so it's private to
your browser and persists across days without any backend.

## Nothing to be afraid of
This is genuinely simple to build and maintain: three static files, no npm,
no server. If you ever want to add a mode (say, cube roots, or percentages),
it's a matter of adding one more `pick*Fact()` / `*Distractors()` pair in
`app.js` and one button in `index.html`.
