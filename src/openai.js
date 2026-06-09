"use strict";

const OpenAI = require("openai");
const options = require("./options.json");

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

let client = null;
function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined
    });
  }
  return client;
}

function aiAvailable() {
  return Boolean(process.env.OPENAI_API_KEY);
}

class AiUnavailableError extends Error {
  constructor() {
    super("OpenAI is not configured. Add OPENAI_API_KEY in Replit Secrets to enable AI features.");
    this.code = "AI_UNAVAILABLE";
  }
}

async function chatJSON(system, user, { temperature = 0.2 } = {}) {
  const c = getClient();
  if (!c) throw new AiUnavailableError();
  const res = await c.chat.completions.create({
    model: MODEL,
    temperature,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  });
  const raw = res.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(raw);
  } catch {
    // Last-resort: pull the first {...} block.
    const m = raw.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : {};
  }
}

async function chatText(system, user, { temperature = 0.4 } = {}) {
  const c = getClient();
  if (!c) throw new AiUnavailableError();
  const res = await c.chat.completions.create({
    model: MODEL,
    temperature,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  });
  return (res.choices?.[0]?.message?.content || "").trim();
}

const ADVISOR_PERSONA =
  "You are the AI Intake Qualification Agent, an experienced business intake advisor. " +
  "You help requesters turn rough ideas into complete, sponsor-backed BRD/ROI packages. " +
  "You understand what a good, acceptable business submission looks like. " +
  "Never treat a proposed solution as the business problem. " +
  "Always label ROI figures as estimates unless validated. Do not invent facts not supported by the input.";

/**
 * Read an uploaded document's text and map it onto the intake fields.
 * Returns { fields: {...}, openQuestions: [...], summary: "..." }.
 */
async function extractFields(documentText) {
  const trimmed = (documentText || "").slice(0, 24000);
  const system =
    ADVISOR_PERSONA +
    " Extract structured intake information from the supplied document. " +
    "Only fill a field if the document clearly supports it; otherwise omit it. " +
    "Do not guess. Capture anything uncertain as an open question.";
  const user =
    "Allowed values for some fields:\n" +
    `requestType: ${options.requestType.join(" | ")}\n` +
    `businessArea: ${options.businessArea.join(" | ")}\n` +
    `projectSize: ${options.projectSize.join(" | ")}\n` +
    `valueTypes (array, choose any that apply): ${options.businessValueType.join(" | ")}\n\n` +
    "Return JSON with this exact shape (omit keys you cannot support):\n" +
    "{ \"fields\": { \"projectTitle\": str, \"description\": str, \"expectedOutcome\": str, " +
    "\"requestType\": str, \"businessArea\": str, \"processArea\": str, \"problemStatement\": str, " +
    "\"projectSize\": str, \"impactedUsers\": str, \"impactedTeams\": str, \"regions\": str, " +
    "\"frequency\": str, \"currentState\": str, \"systemsTools\": str, \"dataSources\": str, " +
    "\"painPoints\": str, \"processOwner\": str, \"systemOwner\": str, \"sme\": str, " +
    "\"stakeholders\": str, \"futureState\": str, \"inScope\": str, \"outOfScope\": str, " +
    "\"valueTypes\": [str], \"sponsorName\": str, \"sponsorEmail\": str, \"risks\": str, " +
    "\"assumptions\": str, \"dependencies\": str }, " +
    "\"openQuestions\": [str], \"summary\": str }\n\n" +
    "Document:\n\"\"\"\n" + trimmed + "\n\"\"\"";
  return chatJSON(system, user, { temperature: 0.1 });
}

/**
 * Improve weak wording for a single field. For the problem statement it also
 * reframes a solution into the underlying business problem.
 */
async function improveText({ field, label, text, context }) {
  const isProblem = /problem/i.test(field || "") || /problem/i.test(label || "");
  const system =
    ADVISOR_PERSONA +
    (isProblem
      ? " You are improving a PROBLEM STATEMENT. If the user described a solution, reframe it into the underlying business problem (what is broken, slow, manual, inconsistent, risky, expensive, or missing today, and the impact)."
      : " You are improving the wording of one intake field to be clear, specific, and business-ready.");
  const user =
    `Field: ${label || field}\n` +
    (context ? `Context about the request:\n${context}\n\n` : "") +
    `Current text:\n"""${text || "(empty)"}"""\n\n` +
    "Return JSON: { \"improved\": str, \"note\": str }. " +
    "\"improved\" is the rewritten text only (no preamble). " +
    "\"note\" is a one-line explanation of what you changed (or, if it was a solution, that you reframed it as a problem).";
  return chatJSON(system, user, { temperature: 0.4 });
}

/** Narrate a (pre-computed) ROI result in business language. */
async function narrateRoi(roi, context) {
  const system =
    ADVISOR_PERSONA + " Summarize a pre-computed ROI estimate in 2-3 sentences of business language. Do not change the numbers. Always call it an estimate.";
  const user =
    `Context:\n${context || "(none)"}\n\n` +
    `Computed ROI (do not alter): ${JSON.stringify(roi)}\n\n` +
    "Return JSON: { \"narrative\": str }.";
  return chatJSON(system, user, { temperature: 0.3 });
}

/** Completeness + readiness assessment over the whole record. */
async function checkCompleteness(record) {
  const system =
    ADVISOR_PERSONA +
    " Assess whether this intake request has enough information to become a presentable BRD/ROI package. " +
    "A request is incomplete if missing any of: clear business problem, project overview, impacted organization/process, " +
    "current-state description, expected future state, business value/ROI estimate, impacted users/teams, process owner or SME, " +
    "potential VP sponsor, scope, success metrics. Help, do not reject.";
  const user =
    `Readiness must be one of: ${options.readiness.join(" | ")}\n\n` +
    `Intake record:\n${JSON.stringify(record, null, 2)}\n\n` +
    "Return JSON: { \"missing\": [str], \"readiness\": str, \"summary\": str, \"nextQuestions\": [str] }. " +
    "\"summary\" is plain-language and encouraging. \"nextQuestions\" are 1-3 focused follow-ups for the biggest gaps.";
  return chatJSON(system, user, { temperature: 0.2 });
}

/** Generate the full BRD/ROI package as Markdown plus routing metadata. */
async function generateBrd(record, roi) {
  const system =
    ADVISOR_PERSONA +
    " Generate a complete, presentable Business Requirements and ROI Document. " +
    "Use only information supported by the record; mark unknowns as open questions. " +
    "Label all ROI values as estimates unless validated. Business requirements use the format " +
    "'As a [persona], I need [capability], so that [business value].'";
  const user =
    `Routing must be one of: ${options.routing.join(" | ")}\n` +
    `Readiness must be one of: ${options.readiness.join(" | ")}\n` +
    "Request classification must be one of: Run-the-Business Enhancement | Strategic Initiative | Not Ready\n\n" +
    `Intake record:\n${JSON.stringify(record, null, 2)}\n\n` +
    `Computed ROI estimate (use as-is):\n${JSON.stringify(roi || {}, null, 2)}\n\n` +
    "Produce the document with these numbered sections as Markdown headings: " +
    "1 Executive Summary, 2 Project Overview, 3 Business Context, 4 Problem Statement, 5 Current State, " +
    "6 Impacted Users and Teams, 7 Process Owner and SME, 8 Desired Future State, 9 Scope, 10 Out of Scope, " +
    "11 Business Requirements, 12 Functional Requirements, 13 Non-Functional Requirements, " +
    "14 Systems, Technologies, and Data Sources, 15 ROI and Business Value, 16 KPIs and Success Metrics, " +
    "17 Risks, Assumptions, and Dependencies, 18 Sponsor Information, 19 Readiness Assessment, " +
    "20 Recommended Routing, 21 Next Step.\n\n" +
    "Return JSON: { \"brdMarkdown\": str, \"readiness\": str, \"classification\": str, " +
    "\"routing\": str, \"routingReason\": str, \"nextStep\": str, \"openQuestions\": [str] }.";
  return chatJSON(system, user, { temperature: 0.3 });
}

module.exports = {
  MODEL,
  aiAvailable,
  AiUnavailableError,
  extractFields,
  improveText,
  narrateRoi,
  checkCompleteness,
  generateBrd
};
