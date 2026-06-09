# AI Intake Qualification Agent

A guided web app that turns a rough idea into a complete, sponsor-backed **BRD & ROI package**
before it goes to formal review. Built to run and publish on **Replit**, using **OpenAI** for
the AI features.

It is **not a chatbot.** The experience is a structured wizard where every common field is a
**selectable choice** (chips / single-select / multi-select). Free text is used only where a
narrative is genuinely needed — and those fields get an **"✨ Improve"** button. You can also
**upload a document** and the app reads it to pre-fill the answers.

---

## What it does

- **Guided, selectable intake** — Request Type, Business Area, Project Size, Business Value,
  Urgency, Sponsor status, and more are all click-to-select options, not typing.
- **Document extraction** — upload a PDF / Word / text file; the server extracts the text and
  OpenAI maps it onto the intake fields to pre-fill the wizard.
- **AI wording help** — improve weak answers; the problem-statement field reframes a "solution"
  back into the underlying business problem.
- **Deterministic ROI calculator** — the math runs in code (reproducible); OpenAI only narrates
  it. Auto-classifies the value into bands and always labels it an **estimate**.
- **Completeness & readiness check** — lists what's missing and gives a plain-language verdict.
- **BRD / ROI generation** — produces the full 21-section document with routing, classification,
  and next step; view, copy, or download as Markdown.
- **Guardrail** — flags that a request cannot move to formal submission without a named VP
  sponsor.

---

## Run it on Replit

1. **Import** this repo into Replit (it auto-detects Node from `package.json` / `.replit`).
2. Open **Secrets** (lock icon) and add:
   - `OPENAI_API_KEY` — your OpenAI key *(required for the AI features).*
   - `OPENAI_MODEL` — optional, defaults to `gpt-4o`.
3. Click **Run**. Replit installs dependencies and starts `npm start`.
4. **Publish/Deploy** using Replit's Deploy button (the `.replit` file is preconfigured for
   autoscale on port 80 → 3000).

Without `OPENAI_API_KEY` the app still runs and the wizard works manually — only the AI-assisted
steps (extraction, improve, ROI narrative, generation) are disabled until the key is added.

## Run it locally

```bash
npm install
cp .env.example .env   # then put your OPENAI_API_KEY in .env
npm start              # http://localhost:3000
```

---

## How it's built

```
server.js              Express server + API routes
src/openai.js          OpenAI prompts: extract, improve, ROI narrative, completeness, generate
src/extract.js         File text extraction (pdf / docx / txt / md)
src/roi.js             Deterministic ROI math + value-band classification
src/options.json       Single source of truth for all selectable option sets
public/index.html      App shell
public/app.js          The guided wizard (selectable fields, upload, ROI, review, generate)
public/styles.css      Styling
```

### API routes

| Route | Purpose |
|-------|---------|
| `GET /api/options` | Option sets + whether AI is configured. |
| `POST /api/extract` | Upload a file → extracted field suggestions. |
| `POST /api/improve` | Improve one field's wording. |
| `POST /api/roi` | Compute ROI estimate (+ narrative). |
| `POST /api/completeness` | Missing areas + readiness assessment. |
| `POST /api/generate` | Full BRD / ROI package + routing. |
| `POST /api/save` | Optional: persist a submission to `data/submissions.json`. |

---

## Domain reference (the behavior the app implements)

The `agent/`, `data/`, and `knowledge/` folders document the intake standard the app is built
around — the question set, option lists, the 21-section BRD template, routing logic, status
values, guardrails, and the recommended data schema. They are provider-neutral reference docs,
not a chatbot script.

| File | Purpose |
|------|---------|
| [`agent/core-intake-questions.md`](agent/core-intake-questions.md) | The full question set. |
| [`agent/selectable-options.md`](agent/selectable-options.md) | Option sets (mirrors `src/options.json`). |
| [`agent/brd-roi-template.md`](agent/brd-roi-template.md) | The 21-section output structure. |
| [`agent/routing-logic.md`](agent/routing-logic.md) | Completeness, readiness, and routing. |
| [`agent/status-values.md`](agent/status-values.md) | Lifecycle statuses. |
| [`agent/vp-approval-workflow.md`](agent/vp-approval-workflow.md) | Sponsor approval flow. |
| [`agent/guardrails.md`](agent/guardrails.md) | Hard rules. |
| [`data/intake-schema.md`](data/intake-schema.md) | Recommended record fields. |

---

## Notes & next steps

- The VP approval workflow is documented but not yet wired to email/Teams — a good next addition
  (e.g. a notification step on the `/api/save` submission).
- Sponsor level/approval are self-attested via the form; treat them as unverified until a real
  approval step exists.
- Add authentication before exposing a public deployment, since submissions contain
  business-sensitive information.
