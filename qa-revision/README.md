# qa-revision

Last-mile CAT quant revision booklet for matterthathinks.github.io.
Five chapters — Arithmetic, Algebra, Geometry & Mensuration, Number System,
Modern Maths — each with topics that expand to show formulas, a short
"quick trick" note, and a PYQ slot.

## Structure

```
qa-revision/
  index.html              cover page / table of contents
  arithmetic.html          }
  algebra.html              }  one page per chapter (all share the same
  geometry.html              }  template — see render.js)
  number-system.html        }
  modern-maths.html        }
  data/*.json               the actual content, one file per chapter
  assets/css/style.css      shared styling
  assets/js/app.js          countdown + accordion behaviour (all pages)
  assets/js/render.js       reads a chapter's JSON and builds the page
```

The HTML pages are just shells — all real content lives in `data/*.json`.
To add or edit formulas, tricks, or PYQs, you only ever touch the JSON files.

## Adding PYQs

Each topic in a `data/*.json` file has a `"pyqs"` array. Right now they're
mostly empty — the page shows a "no PYQs filed here yet" placeholder until
you add some. Add an entry like this:

```json
{
  "tag": "CAT 2023",
  "q": "The question text goes here.",
  "a": "The worked solution / final answer goes here."
}
```

`tag` is optional (shows as a small pill next to the question — exam name,
year, or difficulty all work). Drop the object into the right topic's
`pyqs` array and the page picks it up automatically, no HTML changes needed.

## Adding a new topic to an existing chapter

Add an object to that chapter's `"subsections"` array:

```json
{
  "id": "unique-slug-no-spaces",
  "title": "Topic Name",
  "trick": "One or two sentences of exam-specific shortcut advice.",
  "formulas": [
    {"label": "What this formula is for", "latex": "a^2+b^2=c^2"}
  ],
  "pyqs": []
}
```

`latex` is rendered with KaTeX, so standard LaTeX math syntax works
(`\dfrac`, `\sqrt`, `\left(\right)`, etc.).

## Adding a whole new chapter

1. Create `data/<slug>.json` following the shape of the existing files
   (`id`, `chapter` number as a zero-padded string, `title`, `tagline`,
   `subsections`).
2. Copy any existing chapter HTML file (e.g. `algebra.html`) to
   `<slug>.html`, and update its `data-chapter-root` attribute and the
   prev/next links at the bottom.
3. Add a new `<li class="toc__item">` entry to `index.html`.

## Uploading to GitHub

Drag the whole `qa-revision` folder into the GitHub web upload page for
`matterthathinks.github.io` (or `matterthahinks.github.io` — double check
which one is the live repo) — modern GitHub preserves the folder structure
on drag-and-drop. It'll be live at `/qa-revision/`.
