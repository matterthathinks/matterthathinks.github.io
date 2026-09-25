# SBI PO / Clerk Mock Test Portal

A static, client-side mock test app — no backend, no build step. Deploys as-is to GitHub Pages.

## Try it locally first
Browsers block `fetch()` on local files opened directly, so run a tiny local server from this folder:
```
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

## Deploy to GitHub Pages
1. Create a new GitHub repo, push these files (`index.html`, `data/` folder, this README) to it.
2. Repo → Settings → Pages → Source: deploy from branch `main`, folder `/ (root)`.
3. Your site goes live at `https://<username>.github.io/<repo-name>/`.

## Adding a new test
Add a new JSON file to `data/` (copy `data/sample-test.json` as a starting point), then add its filename
to the `TEST_FILES` array near the top of the `<script>` block in `index.html`:
```js
const TEST_FILES = ["data/sample-test.json", "data/sbi-po-2022-prelims.json"];
```
It'll then show up automatically on the landing page.

## JSON schema
```jsonc
{
  "id": "unique-test-id",
  "examType": "SBI PO / Clerk",      // groups tests on the landing page; any string, e.g. "CAT". Optional — defaults to "SBI PO / Clerk".
  "title": "Test title shown on the landing page",
  "instructions": ["Shown on the instructions page before starting", "..."],
  "sections": [
    {
      "id": "reasoning",
      "name": "Reasoning Ability",
      "durationMinutes": 20,          // this section's own timer — set per section, so a CAT test can use different limits than a 20-20-20 SBI test
      "passages": [                    // optional — shared reading/data-set panels
        {
          "id": "p1",
          "text": "Passage text. Use \\n\\n for paragraph breaks. **bold** renders as bold.",
          "image": "data:image/png;base64,..."   // optional — a chart/table image shown above the passage text
        }
      ],
      "questions": [
        {
          "id": "r1",
          "passageId": "p1",            // or null if the question stands alone
          "text": "Question text. Wrap any **bold** word/phrase from the source paper in double asterisks and it renders bold.",
          "image": "data:image/png;base64,...",  // optional — a figure/bar graph shown above the question text
          "options": ["A", "B", "C", "D", "E"],
          "correctIndex": 2,             // 0-based index into options
          "difficulty": "medium",        // "easy" | "medium" | "hard" — feeds the analysis screen
          "marks": 1,
          "negativeMarks": 0.25,
          "explanation": "Optional — full worked solution, shown in the review screen.",
          "shortcut": "Optional — a faster way to solve it (e.g. 'just check the last digit'), shown separately in the review screen."
        }
      ]
    }
  ]
}
```

Notes:
- Questions sharing the same `passageId` within a section are grouped — the passage panel stays
  fixed while you move between them, matching the real exam UI.
- Sections are timed and sequential: once a section is submitted (manually or by the clock running
  out), you move to the next one and can't return — same as the real SBI interface.
- The navigator uses the standard exam color coding: gray = not visited, red = not answered,
  green = answered, purple = marked for review, purple-with-green-ring = answered and marked.
- After the last section, you get a results screen: overall score with negative marking applied,
  section-wise scores, correct/wrong/skipped counts, average time per question, a difficulty-level
  breakdown **per section as well as overall**, questions flagged if they took noticeably longer
  than your average for that section, and a full question-by-question review showing every option
  with your answer and the correct answer marked, plus any `explanation`/`shortcut` text.
- **Images**: use a base64 data URI (`data:image/png;base64,...`) so the test JSON stays fully
  self-contained on GitHub Pages — no separate image hosting needed. Ask me to extract a chart/table
  from a source PDF page and I'll hand you the data URI to paste in.
- **Multiple exam types**: set `examType` on each test JSON; the landing page groups tests under
  that heading automatically. Leave it out and the test falls under "SBI PO / Clerk" as before.
- **Saved results**: every completed attempt is saved to the browser's `localStorage` automatically
  (no backend, no account). Each test card on the landing page shows attempt count / best / last
  score, with a "View history" link to reopen any past attempt's full result screen — so refreshing
  the page no longer loses your results, and you can reattempt a test and compare scores over time.
  This is per-browser/per-device only (clearing browser data clears it too); say the word if you
  later want it synced across devices.

## Getting your questions into this format
Fastest path for a big batch: paste chunks of your transcribed/OCR'd text to me (Claude) and I'll
convert them into a JSON file matching this schema — just tell me the section name, time limit, and
paste the questions with their options and the answer key. For image-based pages, share photos and
I'll transcribe + structure them directly.
