# Intake Data Schema

Store one record per intake request in a **Dataverse table** (recommended) or a **SharePoint
list**. The agent writes to these fields as the conversation progresses; Power Automate reads
them for the approval and routing workflows.

## Fields

| Field | Type | Notes / allowed values |
|-------|------|------------------------|
| Request ID | Autonumber / GUID | Primary key. |
| Project title | Text | Suggest a stronger title if weak. |
| Requester name | Text | |
| Requester email | Email | |
| Request type | Choice | See `Request Type` options in [`../agent/selectable-options.md`](../agent/selectable-options.md). |
| Business area | Choice | Sales, Revenue Operations, Marketing, Customer Success, Operations, Process, Data, AI, Technology, Finance, Other. |
| Process area | Text | Impacted business process. |
| Project size | Choice | Small team / Department / Regional / Global / Enterprise-wide. |
| Impacted users | Text / Number | |
| Impacted teams | Text | |
| Current-state summary | Multiline text | |
| Systems and tools involved | Multiline text | |
| Process owner | Text | |
| System owner | Text | |
| SME | Text | |
| Problem statement | Multiline text | Must be a problem, not a solution. |
| Desired future state | Multiline text | |
| Scope | Multiline text | |
| Out of scope | Multiline text | |
| Estimated ROI | Currency / Text | Always labeled as an estimate unless validated. |
| ROI category | Choice | Not yet quantified · <$100K · $100K–$500K · $500K–$1M · $1M–$5M · $5M–$10M · $10M+. |
| Business value type | Choice (multi) | See `Business Value Type` options. |
| KPIs | Multiline text | |
| Risks | Multiline text | |
| Assumptions | Multiline text | |
| Dependencies | Multiline text | |
| VP sponsor name | Text | Required before Final Submitted. |
| VP sponsor email | Email | Required before Final Submitted. |
| Sponsor approval status | Choice | Not requested · Pending · Approved · Needs revision · Rejected. |
| Readiness status | Choice | See readiness values in [`../agent/routing-logic.md`](../agent/routing-logic.md). |
| Recommended routing path | Choice | See routing options in [`../agent/routing-logic.md`](../agent/routing-logic.md). |
| Final submission status | Choice | See [`../agent/status-values.md`](../agent/status-values.md). |
| Created date | DateTime | Set on record creation. |
| Last updated date | DateTime | Set on every update. |

## Notes

- Choice fields should mirror the option sets exactly so reporting stays consistent.
- Attach uploaded supporting documents to the record (Dataverse file column or SharePoint
  attachment).
- Guard the transition to **Final Submitted**: require `VP sponsor name`, `VP sponsor email`,
  and `Sponsor approval status = Approved`.
