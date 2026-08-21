# Print My Calendar

A small static tool: pick a date range (and, optionally, a goal day), and it
builds a clean, printable calendar — one page per month — that you print
straight from the browser to a PDF. No backend, no build step, nothing to
install.

## Files

- `index.html` — the page structure (form + print output)
- `style.css` — all styling, including the print layout
- `script.js` — the calendar-generation logic

That's the whole app. Open `index.html` directly in a browser and it works.

## How it works

1. The person picks a **from month** and **to month** (defaults to this
   month → the same month next year), an optional **goal day**, a
   **palette** (Colour / Monochrome), and an **orientation**
   (Landscape / Portrait).
2. On submit, JavaScript builds one `.cal-page` per month directly in the
   page — no server call, nothing uploaded anywhere.
3. The **"Print / Save as PDF"** button calls the browser's native
   `window.print()`. In the print dialog, choosing "Save as PDF" (every
   modern browser offers this) is what actually produces the PDF file.
   This is the same approach almost every "printable calendar" site on the
   web uses — it's the simplest and most reliable option for a static
   GitHub Pages site, since generating real PDFs server-side would need a
   backend (Puppeteer, etc.), which GitHub Pages can't run.

If someone wants their PDF a specific format, they should use their browser's
print dialog. It preserves the exact fonts, colours, and layout — no
extra libraries needed.

## Goal-day countdown

If a goal day is set, every date from **today** (whatever day the person
happens to be using the tool) through the goal day is numbered, counting
down to `0` on the goal day. That day's cell gets a border and a "Goal day"
label instead of the usual countdown number. Without a goal day, it's a
plain calendar — no numbers at all.

## Deploying to matterthathinks.github.io/print-my-calendar

Drop these three files into a folder named `print-my-calendar` at the root
of your `matterthathinks.github.io` repository:

```
matterthathinks.github.io/
└── print-my-calendar/
    ├── index.html
    ├── style.css
    └── script.js
```

Commit and push — GitHub Pages serves it automatically at
`https://matterthathinks.github.io/print-my-calendar/`.

**One real caveat:** a GitHub Pages *user site* URL is always
`https://<your-github-username>.github.io`, tied to the literal account
name — it's not a custom label you can set independently. So this exact
URL only works if your GitHub account (or a GitHub org you control) is
actually named `matterthathinks`. If your account is `nayakashutosh` (as
your portfolio suggests), this same folder would instead land at
`https://nayakashutosh.github.io/print-my-calendar/` unless you either:

- create a separate GitHub account/org literally named `matterthathinks`, or
- add a **custom domain** (e.g. `tools.matterthathinks.com`) to your
  existing GitHub Pages site via a `CNAME` file, if you own that domain.

## Notes on the design decisions

- **Fonts** load from Google Fonts (Cormorant Garamond for the serif
  display type, IBM Plex Mono for numbers/labels, Jost for body text).
  They need an internet connection the first time; after that they're
  cached by the browser.
- **Tables, not CSS Grid/Flexbox**, drive the calendar layout. This was a
  deliberate choice after testing: real `<table>` elements with fixed row
  heights are the most reliable way to guarantee exactly one page per
  month across different browsers' print engines. Flexbox-based height
  distribution turned out to be inconsistent in testing, so it was
  avoided for anything print-critical.
- **No watermark/floral decoration** — an earlier version had a subtle
  botanical motif, but it added real fragility (SVG positioning behaved
  inconsistently across renderers) for a purely decorative payoff, so it
  was cut in favor of a simpler, sturdier result.
- **36-month cap** on the date range, just as a sanity limit — nothing
  breaks past that, it's simply an unreasonable amount of paper.
