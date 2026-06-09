# Knowledge Sources

The agent is grounded on examples of **what good looks like**. Load these as Copilot Studio
**knowledge sources** (SharePoint, Dataverse, or file uploads) so the agent can compare a
user's draft against the expected standard and identify missing or weak areas.

## What to load

- Approved BRDs
- Strong past intake submissions
- Prefill BRD templates
- ROI examples
- Business case examples
- Standard intake requirements
- Triage rules
- Sponsor approval expectations
- Sample problem statements
- Sample KPI definitions

> Place the actual reference documents in this folder (or point the knowledge source at the
> SharePoint library that holds them). Keep sensitive content access-controlled.

## How the agent uses them

- Identify missing information by comparing the request to approved examples.
- Suggest stronger wording (titles, problem statements).
- Recommend relevant KPIs.
- Help estimate ROI.
- Generate sample answers the user can accept, edit, or rewrite.
- Guide the user toward a complete and acceptable BRD / ROI package.

> **Important:** use approved BRDs as patterns for quality, structure, completeness, and
> wording — **not** as content to copy blindly. Do not copy sensitive content from prior BRDs.

## User-uploaded supporting documents

Separately from these grounding sources, users can upload their own supporting documents during
a conversation. Accepted types:

- Existing BRDs · approved BRD examples
- Design documents · process documents · workflow diagrams
- Business case documents · technical notes · screenshots
- Requirements documents · current-state documentation

When a user uploads documents, the agent reads them and extracts: **business context, current
state, problem statement, stakeholders, systems, data sources, requirements, risks,
dependencies, and existing ROI or value statements** — then uses the extracted detail to improve
the package. If uploaded documents conflict with the user's answers, the agent asks for
clarification and marks unclear items as open questions.
