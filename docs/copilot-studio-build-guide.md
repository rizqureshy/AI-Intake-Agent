# Copilot Studio Build Guide

How to assemble the **AI Intake Qualification Agent** in Microsoft Copilot Studio (Agent
Builder) from the files in this repository.

---

## 1. Create the agent

1. In Copilot Studio, create a new agent named **AI Intake Qualification Agent**.
2. Open **Instructions** and paste the full content of
   [`../agent/system-prompt.md`](../agent/system-prompt.md) (from its horizontal rule onward).
3. Set the description/purpose to: *replaces the manual form-based intake process with a guided
   conversational experience that produces sponsor-backed, review-ready BRD / ROI packages.*

## 2. Set the conversation start

- Configure the greeting in [`../agent/conversation-starter.md`](../agent/conversation-starter.md)
  as the first message of the conversation-start topic.
- Enforce the pacing rule: ask **1–3 questions at a time**.

## 3. Add knowledge sources

- Follow [`../knowledge/README.md`](../knowledge/README.md). Connect the SharePoint library /
  files that contain approved BRDs, intake examples, ROI examples, triage rules, and sponsor
  expectations.
- Enable **file upload** so users can attach supporting documents mid-conversation.

## 4. Build the structured intake fields

Use a mix of node types so the experience is guided, not free-text only:

| Intake field | Node type | Source |
|--------------|-----------|--------|
| Request Type, Project Size, Business Value Type, Urgency, ROI category | **Multiple-choice question** / quick replies | [`../agent/selectable-options.md`](../agent/selectable-options.md) |
| Problem statement, current state, future state, scope | **Free-text input** | [`../agent/core-intake-questions.md`](../agent/core-intake-questions.md) |
| Richer multi-field screens | **Adaptive Cards** | optional |
| Supporting documents | **File upload** | [`../knowledge/README.md`](../knowledge/README.md) |

- Store each answer in a **variable** and persist to the table (step 6).
- Use **conditional branching** based on selected answers (e.g., "Not sure yet" → ask follow-up).

## 5. Implement the conversation logic

- **Completeness check** before generating output —
  [`../agent/routing-logic.md`](../agent/routing-logic.md#completeness-check).
- **BRD / ROI generation** using the 21-section structure —
  [`../agent/brd-roi-template.md`](../agent/brd-roi-template.md). Use document generation to
  produce the output file.
- **Readiness assessment** and **routing recommendation** —
  [`../agent/routing-logic.md`](../agent/routing-logic.md).
- **Guardrails** apply throughout — [`../agent/guardrails.md`](../agent/guardrails.md).

## 6. Create the data store

- Build a **Dataverse table** (recommended) or **SharePoint list** from
  [`../data/intake-schema.md`](../data/intake-schema.md).
- Write intake answers to it as the conversation progresses; attach uploaded documents to the
  record.
- Track lifecycle with the [`../agent/status-values.md`](../agent/status-values.md) values.

## 7. Build the VP approval flow (Power Automate)

Implement [`../agent/vp-approval-workflow.md`](../agent/vp-approval-workflow.md):

1. Triggered by the agent when the package is **Ready for VP review** and the user opts to send.
2. Notify the VP sponsor (Teams + email) and share the package.
3. Collect the sponsor decision: **Approved / Needs revision / Rejected**.
4. Branch on the decision and update status; only **VP Approved** may proceed to **Final
   Submitted** → **Routed**.
5. Send Teams notifications to requester, SME, sponsor, and triage owner as appropriate.
6. Enforce: no Final Submitted without a named VP sponsor.

## 8. Route by category

After approval, set up a **routing queue by category** using the routing options in
[`../agent/routing-logic.md`](../agent/routing-logic.md) so approved requests reach the right
delivery team.

---

## Build checklist

- [ ] Agent created and named.
- [ ] System prompt pasted into Instructions.
- [ ] Conversation-start greeting configured.
- [ ] Knowledge sources connected; file upload enabled.
- [ ] Selectable-option nodes built and bound to variables.
- [ ] Completeness check + BRD generation + readiness/routing logic implemented.
- [ ] Dataverse/SharePoint store created and wired up.
- [ ] Power Automate VP approval flow + Teams notifications built.
- [ ] Routing queue by category configured.
- [ ] Guardrails verified against [`../agent/guardrails.md`](../agent/guardrails.md).
