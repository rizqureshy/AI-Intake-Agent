"use strict";

/* ------------------------------------------------------------------ *
 * AI Intake Qualification Agent — guided, selectable intake wizard.
 * State lives in `record`; every common field is a selectable choice.
 * ------------------------------------------------------------------ */

const state = {
  opts: {},
  aiAvailable: false,
  model: "",
  record: {},
  roi: null,
  generated: null,
  stepIndex: 0
};

// Each step is a screen. Most fields are selectable; free text only where a
// narrative is genuinely needed (and those offer an "Improve with AI" button).
const STEPS = [
  {
    id: "start",
    title: "Welcome",
    sub: "You do not need everything ready. I will guide you. Optionally upload a document and I will pre-fill what I can.",
    type: "start"
  },
  {
    id: "overview",
    title: "Project Overview",
    sub: "What is the request, and what outcome are you after?",
    fields: [
      { key: "requestType", label: "Request type", type: "single", optionsKey: "requestType" },
      { key: "projectTitle", label: "Project title", type: "text", ai: true, placeholder: "e.g. RFP response automation" },
      { key: "description", label: "High-level description", type: "textarea", placeholder: "What is the project or idea?" },
      { key: "expectedOutcome", label: "Expected outcome", type: "textarea", placeholder: "What outcome are you trying to achieve?" }
    ]
  },
  {
    id: "problem",
    title: "Problem Statement",
    sub: "Describe the business problem — not the solution.",
    fields: [
      {
        key: "problemStatement",
        label: "What business problem are we solving?",
        type: "textarea",
        ai: true,
        help: "What is broken, slow, manual, inconsistent, risky, expensive, or missing today? Who feels the pain?"
      }
    ]
  },
  {
    id: "org",
    title: "Business Area",
    sub: "Which organization and process does this touch?",
    fields: [
      { key: "businessArea", label: "Organization", type: "single", optionsKey: "businessArea" },
      { key: "processArea", label: "Business process impacted", type: "text" },
      { key: "crossFunctional", label: "Is this cross-functional?", type: "single", optionsKey: "yesNo" }
    ]
  },
  {
    id: "size",
    title: "Project Size & Reach",
    sub: "How big is the footprint?",
    fields: [
      { key: "projectSize", label: "Project size", type: "single", optionsKey: "projectSize" },
      { key: "impactedUsers", label: "Number of users impacted", type: "text", placeholder: "e.g. 120" },
      { key: "impactedTeams", label: "Teams impacted", type: "text" },
      { key: "regions", label: "Regions impacted", type: "text", placeholder: "e.g. NA, EMEA" },
      { key: "frequency", label: "How often does the process happen?", type: "text", placeholder: "e.g. 40 times/week" }
    ]
  },
  {
    id: "current",
    title: "Current State",
    sub: "How does it work today?",
    fields: [
      { key: "currentState", label: "Current process", type: "textarea", ai: true },
      { key: "systemsTools", label: "Systems, tools, technologies used today", type: "textarea" },
      { key: "dataSources", label: "Data sources used today", type: "text" },
      { key: "painPoints", label: "Main bottlenecks / pain points", type: "textarea" }
    ]
  },
  {
    id: "owners",
    title: "Ownership & SME",
    sub: "Who owns and validates this?",
    fields: [
      { key: "requesterRole", label: "Your role", type: "single", optionsKey: "requesterRole" },
      { key: "processOwner", label: "Process owner", type: "text" },
      { key: "systemOwner", label: "System / technology owner", type: "text" },
      { key: "sme", label: "Subject matter expert (SME)", type: "text" },
      { key: "stakeholders", label: "Who should be consulted?", type: "text" }
    ]
  },
  {
    id: "future",
    title: "Desired Future State",
    sub: "What should be different after this is delivered?",
    fields: [
      { key: "futureState", label: "What should the improved process look like?", type: "textarea", ai: true },
      { key: "successDefinition", label: "What does success look like?", type: "textarea" }
    ]
  },
  {
    id: "scope",
    title: "Scope",
    sub: "What is in, and what is out?",
    fields: [
      { key: "inScope", label: "In scope", type: "textarea" },
      { key: "outOfScope", label: "Out of scope (or future phase)", type: "textarea" }
    ]
  },
  {
    id: "roi",
    title: "ROI & Business Value",
    sub: "Let's quantify the value. All figures are estimates unless validated.",
    type: "roi",
    fields: [{ key: "valueTypes", label: "Business value type", type: "multi", optionsKey: "businessValueType" }]
  },
  {
    id: "sponsor",
    title: "Urgency & Sponsor",
    sub: "A named VP sponsor is required before final submission.",
    fields: [
      { key: "urgency", label: "Urgency", type: "single", optionsKey: "urgency" },
      { key: "sponsorName", label: "VP sponsor name", type: "text" },
      { key: "sponsorEmail", label: "VP sponsor email", type: "email" },
      { key: "sponsorLevel", label: "Is the sponsor VP level or above? (self-attested)", type: "single", optionsKey: "yesNo" },
      { key: "sponsorStatus", label: "Sponsor approval status", type: "single", optionsKey: "sponsorStatus" }
    ]
  },
  {
    id: "review",
    title: "Review & Generate",
    sub: "Check completeness, then generate the BRD / ROI package.",
    type: "review"
  }
];

/* ----------------------------- helpers ---------------------------- */

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, props = {}, children = []) => {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c == null) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
};

let toastTimer;
function toast(msg, isError = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast show" + (isError ? " err" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = "toast"), 3200);
}

async function api(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {})
  });
  return res.json();
}

async function apiForm(path, formData) {
  const res = await fetch(path, { method: "POST", body: formData });
  return res.json();
}

/* --------------------------- rendering ---------------------------- */

function renderNav() {
  const nav = $("#step-nav");
  nav.innerHTML = "";
  STEPS.forEach((s, i) => {
    const li = el(
      "li",
      {
        class: (i === state.stepIndex ? "active " : "") + (i < state.stepIndex ? "done" : ""),
        onclick: () => goTo(i)
      },
      [el("span", { class: "dot" }), el("span", {}, s.title)]
    );
    nav.appendChild(li);
  });
}

function renderField(f) {
  const wrap = el("div", { class: "field" });
  wrap.appendChild(el("label", { class: "q" }, f.label));
  if (f.help) wrap.appendChild(el("p", { class: "help" }, f.help));

  if (f.type === "single" || f.type === "multi") {
    const list = state.opts[f.optionsKey] || [];
    const chips = el("div", { class: "chips" });
    list.forEach((opt) => {
      const selected =
        f.type === "single"
          ? state.record[f.key] === opt
          : Array.isArray(state.record[f.key]) && state.record[f.key].includes(opt);
      const chip = el("button", { type: "button", class: "chip" + (selected ? " on" : "") }, opt);
      chip.addEventListener("click", () => {
        if (f.type === "single") {
          state.record[f.key] = state.record[f.key] === opt ? "" : opt;
        } else {
          const arr = Array.isArray(state.record[f.key]) ? state.record[f.key].slice() : [];
          const idx = arr.indexOf(opt);
          if (idx >= 0) arr.splice(idx, 1);
          else arr.push(opt);
          state.record[f.key] = arr;
        }
        renderStep();
      });
      chips.appendChild(chip);
    });
    wrap.appendChild(chips);
    return wrap;
  }

  // text / email / textarea
  const isArea = f.type === "textarea";
  const input = el(isArea ? "textarea" : "input", {
    type: isArea ? undefined : f.type === "email" ? "email" : "text",
    placeholder: f.placeholder || ""
  });
  input.value = state.record[f.key] || "";
  input.addEventListener("input", () => (state.record[f.key] = input.value));

  if (f.ai) {
    const aiBtn = el("button", { type: "button", class: "btn ai small" }, "✨ Improve");
    aiBtn.addEventListener("click", async () => {
      const original = input.value.trim();
      if (!original) return toast("Write something first, then I can improve it.");
      aiBtn.disabled = true;
      aiBtn.innerHTML = '<span class="spin"></span>';
      try {
        const r = await api("/api/improve", {
          field: f.key,
          label: f.label,
          text: original,
          context: contextSummary()
        });
        if (r.aiAvailable === false) {
          toast(r.message || "AI is not configured.", true);
        } else if (r.improved) {
          input.value = r.improved;
          state.record[f.key] = r.improved;
          const existingNote = wrap.querySelector(".note");
          if (existingNote) existingNote.remove();
          if (r.note) wrap.appendChild(el("div", { class: "note" }, "✨ " + r.note));
        }
      } catch (e) {
        toast("Could not reach the AI service.", true);
      } finally {
        aiBtn.disabled = false;
        aiBtn.textContent = "✨ Improve";
      }
    });
    wrap.appendChild(el("div", { class: "with-ai" }, [input, aiBtn]));
  } else {
    wrap.appendChild(input);
  }
  return wrap;
}

function renderStartStep(card) {
  card.appendChild(
    el("p", {}, "Hi, I am the AI Intake Qualification Agent. I will help you shape your idea or request into a complete BRD and ROI package before it moves to formal review.")
  );

  const drop = el("label", { class: "upload" }, [
    el("div", { html: "<strong>Upload a supporting document</strong> (optional)" }),
    el("div", { class: "help", html: "PDF, Word (.docx), or text. I'll read it and pre-fill the questions." }),
    el("input", { type: "file", accept: ".pdf,.docx,.txt,.md,.csv" })
  ]);
  const fileInput = drop.querySelector("input");

  const status = el("div", { class: "note", style: "display:none" });

  async function handleFile(file) {
    if (!file) return;
    if (!state.aiAvailable) {
      toast("Add OPENAI_API_KEY in Secrets to enable document extraction.", true);
    }
    status.style.display = "block";
    status.innerHTML = '<span class="spin"></span> Reading ' + file.name + "…";
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await apiForm("/api/extract", fd);
      if (r.error) {
        status.textContent = "Could not read that file: " + r.error;
        return;
      }
      if (r.aiAvailable === false) {
        status.textContent = r.message || "AI extraction is not configured.";
        return;
      }
      const applied = applyExtracted(r.fields || {});
      let msg = `Read ${r.filename} (${r.chars || 0} chars). Pre-filled ${applied} field(s).`;
      if (r.openQuestions && r.openQuestions.length) {
        msg += " Open questions: " + r.openQuestions.slice(0, 3).join("; ");
      }
      status.textContent = "✨ " + msg;
      toast("Document processed — review the pre-filled answers as you go.");
    } catch (e) {
      status.textContent = "Upload failed. " + (e.message || "");
    }
  }

  fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));
  ["dragover", "dragenter"].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.add("drag");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.remove("drag");
    })
  );
  drop.addEventListener("drop", (e) => handleFile(e.dataTransfer.files[0]));

  card.appendChild(drop);
  card.appendChild(status);
  card.appendChild(el("p", { class: "help", style: "margin-top:16px" }, "Click Next to begin, or upload a document first."));
}

function renderRoiStep(card) {
  // value-type multi-select
  card.appendChild(renderField(STEPS[state.stepIndex].fields[0]));

  card.appendChild(el("p", { class: "help" }, "Estimate time-savings value (optional but recommended):"));
  const r = state.record;
  const grid = el("div", { class: "grid2" });
  const inputs = [
    ["users", "People who perform this", r.roiUsers || r.impactedUsers || ""],
    ["runsPerYear", "Times per year (per person)", r.roiRuns || ""],
    ["minutesNow", "Minutes per run today", r.roiNow || ""],
    ["minutesFuture", "Minutes per run after", r.roiFuture || ""],
    ["loadedRate", "Loaded cost $/hour (blank = $75)", r.roiRate || ""]
  ];
  const refs = {};
  inputs.forEach(([key, label, val]) => {
    const wrap = el("div", { class: "field" });
    wrap.appendChild(el("label", { class: "q" }, label));
    const inp = el("input", { type: "number", min: "0" });
    inp.value = val;
    refs[key] = inp;
    wrap.appendChild(inp);
    grid.appendChild(wrap);
  });
  card.appendChild(grid);

  const out = el("div", { class: "roi-out", style: "display:none" });
  const calc = el("button", { type: "button", class: "btn primary" }, "Estimate ROI");
  calc.addEventListener("click", async () => {
    const payload = {
      users: refs.users.value,
      runsPerYear: refs.runsPerYear.value,
      minutesNow: refs.minutesNow.value,
      minutesFuture: refs.minutesFuture.value,
      loadedRate: refs.loadedRate.value,
      context: contextSummary()
    };
    // persist raw inputs
    Object.assign(state.record, {
      roiUsers: payload.users,
      roiRuns: payload.runsPerYear,
      roiNow: payload.minutesNow,
      roiFuture: payload.minutesFuture,
      roiRate: payload.loadedRate
    });
    calc.disabled = true;
    calc.innerHTML = '<span class="spin"></span> Calculating…';
    try {
      const roi = await api("/api/roi", payload);
      state.roi = roi;
      state.record.estimatedRoi = roi.annualValueFormatted;
      state.record.roiCategory = roi.category;
      out.style.display = "block";
      out.innerHTML = "";
      out.appendChild(el("div", { class: "big" }, roi.annualValueFormatted + " / year"));
      out.appendChild(el("div", {}, `${roi.annualHoursSaved.toLocaleString()} hours saved annually`));
      out.appendChild(el("span", { class: "cat" }, roi.category + " (estimate)"));
      if (roi.narrative) out.appendChild(el("p", { class: "help", style: "margin-top:10px" }, roi.narrative));
    } catch (e) {
      toast("Could not compute ROI.", true);
    } finally {
      calc.disabled = false;
      calc.textContent = "Estimate ROI";
    }
  });
  card.appendChild(el("div", { style: "margin-top:6px" }, [calc]));
  card.appendChild(out);

  if (state.roi) {
    out.style.display = "block";
    out.innerHTML =
      `<div class="big">${state.roi.annualValueFormatted} / year</div>` +
      `<div>${state.roi.annualHoursSaved.toLocaleString()} hours saved annually</div>` +
      `<span class="cat">${state.roi.category} (estimate)</span>`;
  }
}

function renderReviewStep(card) {
  // Summary
  const dl = el("dl", { class: "summary-list" });
  const show = (label, val) => {
    if (!val || (Array.isArray(val) && !val.length)) return;
    dl.appendChild(el("dt", {}, label));
    dl.appendChild(el("dd", {}, Array.isArray(val) ? val.join(", ") : String(val)));
  };
  const r = state.record;
  show("Request type", r.requestType);
  show("Title", r.projectTitle);
  show("Business area", r.businessArea);
  show("Project size", r.projectSize);
  show("Problem", r.problemStatement);
  show("Value types", r.valueTypes);
  show("Est. ROI", r.estimatedRoi ? r.estimatedRoi + " (" + (r.roiCategory || "estimate") + ")" : "");
  show("VP sponsor", r.sponsorName);
  show("Urgency", r.urgency);
  card.appendChild(dl);

  const actions = el("div", { style: "margin-top:18px; display:flex; gap:10px; flex-wrap:wrap" });
  const checkBtn = el("button", { type: "button", class: "btn" }, "Check completeness");
  const genBtn = el("button", { type: "button", class: "btn primary" }, "Generate BRD / ROI package");
  actions.appendChild(checkBtn);
  actions.appendChild(genBtn);
  card.appendChild(actions);

  const result = el("div", { style: "margin-top:16px" });
  card.appendChild(result);

  // Guardrail banner: no sponsor
  if (!r.sponsorName) {
    card.appendChild(
      el("div", { class: "callout warn", style: "margin-top:14px" },
        "This request can continue as a draft BRD, but it cannot move to formal submission until a VP-level sponsor is identified.")
    );
  }

  checkBtn.addEventListener("click", async () => {
    checkBtn.disabled = true;
    checkBtn.innerHTML = '<span class="spin"></span> Checking…';
    result.innerHTML = "";
    try {
      const r2 = await api("/api/completeness", state.record);
      if (r2.aiAvailable === false) return toast(r2.message, true);
      const box = el("div", { class: "callout " + (r2.missing && r2.missing.length ? "warn" : "ok") });
      box.appendChild(el("div", {}, r2.summary || ""));
      box.appendChild(el("div", { class: "help", style: "margin-top:6px" }, "Readiness: " + (r2.readiness || "—")));
      if (r2.missing && r2.missing.length) {
        const ul = el("ul", {});
        r2.missing.forEach((m) => ul.appendChild(el("li", {}, m)));
        box.appendChild(ul);
      }
      result.appendChild(box);
    } catch (e) {
      toast("Completeness check failed.", true);
    } finally {
      checkBtn.disabled = false;
      checkBtn.textContent = "Check completeness";
    }
  });

  genBtn.addEventListener("click", async () => {
    genBtn.disabled = true;
    genBtn.innerHTML = '<span class="spin"></span> Generating…';
    try {
      const g = await api("/api/generate", { record: state.record, roi: state.roi });
      if (g.aiAvailable === false) return toast(g.message, true);
      state.generated = g;
      renderGenerated(result, g);
    } catch (e) {
      toast("Generation failed.", true);
    } finally {
      genBtn.disabled = false;
      genBtn.textContent = "Generate BRD / ROI package";
    }
  });

  if (state.generated) renderGenerated(result, state.generated);
}

function renderGenerated(container, g) {
  container.innerHTML = "";
  const meta = el("div", { style: "margin:6px 0 12px" }, [
    el("span", { class: "pill" }, "Readiness: " + (g.readiness || "—")),
    el("span", { class: "pill" }, "Classification: " + (g.classification || "—")),
    el("span", { class: "pill" }, "Routing: " + (g.routing || "—"))
  ]);
  container.appendChild(meta);
  if (g.routingReason) container.appendChild(el("p", { class: "help" }, "Why this route: " + g.routingReason));
  if (g.nextStep) container.appendChild(el("p", { class: "help" }, "Next step: " + g.nextStep));

  const brd = el("div", { class: "brd", html: mdToHtml(g.brdMarkdown || "") });
  container.appendChild(brd);

  const dlBtn = el("button", { type: "button", class: "btn" }, "⬇ Download .md");
  dlBtn.addEventListener("click", () => download((state.record.projectTitle || "BRD-ROI") + ".md", g.brdMarkdown || ""));
  const copyBtn = el("button", { type: "button", class: "btn" }, "Copy");
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(g.brdMarkdown || "").then(() => toast("Copied to clipboard."));
  });
  container.appendChild(el("div", { style: "margin-top:12px; display:flex; gap:10px" }, [dlBtn, copyBtn]));
}

function renderStep() {
  renderNav();
  const step = STEPS[state.stepIndex];
  const card = $("#step");
  card.innerHTML = "";
  card.appendChild(el("h2", {}, step.title));
  if (step.sub) card.appendChild(el("p", { class: "sub" }, step.sub));

  if (step.type === "start") renderStartStep(card);
  else if (step.type === "roi") renderRoiStep(card);
  else if (step.type === "review") renderReviewStep(card);
  else step.fields.forEach((f) => card.appendChild(renderField(f)));

  $("#btn-back").disabled = state.stepIndex === 0;
  $("#btn-next").style.visibility = state.stepIndex === STEPS.length - 1 ? "hidden" : "visible";
  $("#step-counter").textContent = `Step ${state.stepIndex + 1} of ${STEPS.length}`;
}

/* --------------------------- navigation --------------------------- */

function goTo(i) {
  state.stepIndex = Math.max(0, Math.min(STEPS.length - 1, i));
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderStep();
}
function next() { goTo(state.stepIndex + 1); }
function back() { goTo(state.stepIndex - 1); }

/* ------------------------- data utilities ------------------------- */

function contextSummary() {
  const r = state.record;
  return [
    r.projectTitle && `Title: ${r.projectTitle}`,
    r.requestType && `Type: ${r.requestType}`,
    r.businessArea && `Area: ${r.businessArea}`,
    r.description && `Description: ${r.description}`,
    r.problemStatement && `Problem: ${r.problemStatement}`
  ]
    .filter(Boolean)
    .join("\n");
}

// Map extracted fields onto the record; arrays handled for valueTypes.
function applyExtracted(fields) {
  let count = 0;
  Object.entries(fields).forEach(([k, v]) => {
    if (v == null || v === "") return;
    if (k === "valueTypes" && Array.isArray(v)) {
      state.record.valueTypes = v;
    } else {
      state.record[k] = v;
    }
    count++;
  });
  return count;
}

function download(filename, text) {
  const blob = new Blob([text], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = el("a", { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Minimal Markdown -> HTML (headings, bold, lists, paragraphs, code).
function mdToHtml(md) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = String(md).split(/\r?\n/);
  let html = "";
  let inList = false;
  const inline = (s) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>");
  for (let raw of lines) {
    const line = raw.replace(/\s+$/, "");
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if (h) {
      if (inList) { html += "</ul>"; inList = false; }
      const lvl = h[1].length;
      html += `<h${lvl}>${inline(h[2])}</h${lvl}>`;
    } else if (li) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${inline(li[1])}</li>`;
    } else if (line.trim() === "") {
      if (inList) { html += "</ul>"; inList = false; }
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p>${inline(line)}</p>`;
    }
  }
  if (inList) html += "</ul>";
  return html;
}

/* ----------------------------- boot ------------------------------- */

async function boot() {
  $("#btn-next").addEventListener("click", next);
  $("#btn-back").addEventListener("click", back);
  try {
    const res = await fetch("/api/options");
    const data = await res.json();
    state.opts = data.options || {};
    state.aiAvailable = !!data.aiAvailable;
    state.model = data.model || "";
  } catch (e) {
    toast("Could not load configuration.", true);
  }
  const badge = $("#ai-status");
  if (state.aiAvailable) {
    badge.textContent = "AI: ready (" + state.model + ")";
    badge.className = "ai-status on";
  } else {
    badge.textContent = "AI: add OPENAI_API_KEY";
    badge.className = "ai-status off";
  }
  renderStep();
}

boot();
