# VP Approval Workflow

After the BRD / ROI package is ready, the agent coordinates sponsor approval before anything
moves to final submission.

## Trigger

Once the package is generated and the readiness assessment is **Ready for VP review**, the agent
asks:

> "Would you like to send this BRD / ROI package to the named VP sponsor for review and
> approval?"

## If the user says yes

1. **Notify the VP sponsor** (Teams message and/or email via Power Automate).
2. **Share the BRD / ROI package** with the sponsor.
3. **Request a decision:** Approved · Needs revision · Rejected / Not ready.
4. Set status to **Pending VP Approval** and hold there until the sponsor responds.

## Sponsor decision handling

| Decision | Agent action | Resulting status |
|----------|--------------|------------------|
| **Approved** | Move the request forward; recommend routing and state the next step. | `VP Approved` → `Final Submitted` → `Routed` |
| **Needs revision** | Return the request to the requester **with the sponsor's comments**; reopen the relevant questions. | `Needs Revision` |
| **Rejected / Not ready** | Keep as a draft; explain what would be needed to revisit. | `Draft` / `Needs More Information` |

> **Only after VP approval** may the request move to **Final Submitted** status.

## Guardrails specific to this workflow

- Do not allow final submission without a **named VP sponsor**.
- Do not approve or reject the request on behalf of leadership — only the sponsor decides.
- Do not send the request to final review **before** VP approval.
- Do not promise delivery timelines or commit resources during approval coordination.

## Power Automate / notification notes

Implement the notify → collect-decision → branch loop as a Power Automate flow triggered by the
agent. Send Teams notifications to the requester, SME, sponsor, and triage owner as appropriate.
See [`../docs/copilot-studio-build-guide.md`](../docs/copilot-studio-build-guide.md).
