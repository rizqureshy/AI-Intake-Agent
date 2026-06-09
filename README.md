# AI Intake Qualification Agent

A conversational intake advisor built for **Microsoft Copilot Studio (Agent Builder)** that
replaces the current manual, form-based intake process with a guided experience.

The agent helps requesters turn rough ideas, incomplete asks, and early-stage requests into
**complete, presentable BRD and ROI intake packages** that are ready for VP review.

> **Final principle:** the agent should improve intake *quality*, not just intake *speed*.
> It guides every request from **raw idea → refined business request → presentable BRD / ROI
> package → VP-approved formal submission.**

---

## What the agent does

It does **not** behave like a form filler. It behaves like an experienced business intake
advisor that understands what a good, acceptable submission looks like. It:

- Guides the user conversationally (1–3 focused questions at a time).
- Offers **selectable options** and sample wording for common intake fields.
- Reads uploaded documents and extracts relevant details.
- Checks completeness against a known standard before generating output.
- Generates a structured **BRD / ROI package**.
- Coordinates **VP sponsor approval** before formal submission.
- Recommends a **routing path** after approval.

It exists to reduce half-filled requests, vague submissions, unclear business cases, missing
sponsor information, and requests that lack the detail needed for formal review.

## Agent role

The agent acts as: **intake advisor · BRD creation assistant · ROI framing assistant ·
completeness checker · sponsor approval coordinator · triage recommendation assistant.**

It should help the user *think through* the request — not just capture what the user types.

---

## Repository layout

| File | Purpose |
|------|---------|
| [`agent/system-prompt.md`](agent/system-prompt.md) | Consolidated agent instructions — paste directly into Copilot Studio. |
| [`agent/conversation-starter.md`](agent/conversation-starter.md) | Required greeting and conversation pacing rules. |
| [`agent/core-intake-questions.md`](agent/core-intake-questions.md) | The full question set the agent collects, section by section. |
| [`agent/selectable-options.md`](agent/selectable-options.md) | Quick-reply / multiple-choice option sets for structured fields. |
| [`agent/brd-roi-template.md`](agent/brd-roi-template.md) | The 21-section BRD / ROI output document structure. |
| [`agent/routing-logic.md`](agent/routing-logic.md) | Routing paths and the completeness check. |
| [`agent/status-values.md`](agent/status-values.md) | The lifecycle status values. |
| [`agent/vp-approval-workflow.md`](agent/vp-approval-workflow.md) | Sponsor approval flow and decision handling. |
| [`agent/guardrails.md`](agent/guardrails.md) | Hard rules the agent must always follow. |
| [`data/intake-schema.md`](data/intake-schema.md) | Recommended data fields for the Dataverse table / SharePoint list. |
| [`docs/copilot-studio-build-guide.md`](docs/copilot-studio-build-guide.md) | How to assemble the agent in Copilot Studio. |
| [`knowledge/README.md`](knowledge/README.md) | What to load as grounding knowledge sources and how to use it. |

---

## How to build it

1. Read [`docs/copilot-studio-build-guide.md`](docs/copilot-studio-build-guide.md) for the
   end-to-end assembly steps.
2. Paste [`agent/system-prompt.md`](agent/system-prompt.md) into the agent's instructions.
3. Add the knowledge sources described in [`knowledge/README.md`](knowledge/README.md).
4. Create the Dataverse table / SharePoint list from [`data/intake-schema.md`](data/intake-schema.md).
5. Build the Power Automate flow and Teams notifications for the VP approval workflow.

---

## Agent identity

- **Name:** AI Intake Qualification Agent
- **Purpose:** replace the manual form-based intake process with a guided conversational
  experience that produces sponsor-backed, review-ready BRD / ROI packages.
