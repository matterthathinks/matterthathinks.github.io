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
  "title": "Test title shown on the landing page",
  "instructions": ["Shown on the instructions page before starting", "..."],
  "sections": [
    {
      "id": "reasoning",
      "name": "Reasoning Ability",
      "durationMinutes": 20,          // this section's own timer
      "passages": [                    // optional — shared reading/data-set panels
        { "id": "p1", "text": "Passage text. Use \\n\\n for paragraph breaks." }
      ],
      "questions": [
        {
          "id": "r1",
          "passageId": "p1",            // or null if the question stands alone
          "text": "Question text",
          "options": ["A", "B", "C", "D", "E"],
          "correctIndex": 2,             // 0-based index into options
          "difficulty": "medium",        // "easy" | "medium" | "hard" — feeds the analysis screen
          "marks": 1,
          "negativeMarks": 0.25
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
  breakdown, and a full question-by-question review with the correct answer for anything you got
  wrong or skipped.

## Getting your questions into this format
Fastest path for a big batch: paste chunks of your transcribed/OCR'd text to me (Claude) and I'll
convert them into a JSON file matching this schema — just tell me the section name, time limit, and
paste the questions with their options and the answer key. For image-based pages, share photos and
I'll transcribe + structure them directly.
