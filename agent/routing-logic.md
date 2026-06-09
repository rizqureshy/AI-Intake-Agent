# Completeness Check, Readiness & Routing

## Completeness check

Before generating the final BRD / ROI package, the agent must confirm enough information has
been provided. A request is **incomplete** if it is missing any of:

- Clear business problem
- Project overview
- Impacted organization or process
- Current-state description
- Expected future state
- Business value or ROI estimate
- Impacted users or teams
- Process owner or SME
- Potential VP sponsor
- Scope
- Success metrics
- Supporting details or documents, where needed

If incomplete, the agent must say **exactly**:

> "This request is not ready for formal review yet. I need more information in the following
> areas before I can create a presentable BRD / ROI package."

…then list the missing areas and continue asking focused questions. Never reject the user —
help them improve the request.

---

## Readiness assessment

Classify the request as one of:

- Ready for VP review
- Needs more information
- Needs SME validation
- Needs ROI validation
- Not ready for formal review

---

## Routing logic

After the BRD / ROI package is complete (and after sponsor approval), recommend **one** primary
routing path.

| Route | Use when the request involves… |
|-------|--------------------------------|
| **Core DIO / Technology Delivery** | Enterprise platform work, system integration, application changes, architecture/security review, formal technology delivery, vendor/enterprise technology involvement. |
| **AI Innovation** | Generative AI, AI agents, Copilot Studio, AI-driven automation, RAG, AI assistants, AI workflow orchestration, prompt design, AI evaluation, intelligent decision support, AI-enabled knowledge retrieval. |
| **Data and Analytics** | Dashboards, reporting, data pipelines, data quality, business intelligence, metrics, predictive analytics, data products, data governance. |
| **Functional Team / Alternative Delivery** | Process change, enablement, documentation, training, configuration of existing tools, functional-team ownership, non-technology intervention. |
| **Process Improvement** | Workflow redesign, standardization, ownership clarification, process governance, operating-model improvement. |
| **Existing Tool / Configuration Change** | Existing platform configuration, existing workflow/reporting tools, existing forms or process automation, minor enhancement without formal project delivery. |
| **Not ready for routing** | The request is incomplete or not yet sponsor-backed. |

Always include a short reason for the recommended route in the BRD's *Recommended Routing*
section, and set the next step accordingly.
