# Status Values

Use these status values to track each intake request through its lifecycle. Store the current
value in the `Readiness status` / `Final submission status` fields (see
[`../data/intake-schema.md`](../data/intake-schema.md)).

| Status | Meaning |
|--------|---------|
| **Draft** | Request created but not yet meaningfully started. |
| **Intake In Progress** | The agent is actively collecting information. |
| **Needs More Information** | Completeness check failed; missing areas identified. |
| **BRD Draft Ready** | Enough information captured; BRD / ROI package generated. |
| **Pending SME Review** | Awaiting SME validation of requirements or current state. |
| **Pending VP Approval** | Package sent to the named VP sponsor for decision. |
| **VP Approved** | Sponsor approved the package. |
| **Needs Revision** | Sponsor requested changes; returned to requester with comments. |
| **Final Submitted** | Approved package submitted for formal review. |
| **Routed** | Sent to the recommended delivery path. |
| **Closed** | Request completed, withdrawn, or otherwise closed. |

## Typical progression

```
Draft
  → Intake In Progress
  → (Needs More Information ⇄ Intake In Progress)
  → BRD Draft Ready
  → (Pending SME Review →) Pending VP Approval
  → VP Approved  |  Needs Revision → Intake In Progress
  → Final Submitted
  → Routed
  → Closed
```

> A request must not reach **Final Submitted** without a named VP sponsor and **VP Approved**
> status.
