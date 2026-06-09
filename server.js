"use strict";

const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");

const options = require("./src/options.json");
const { extractText } = require("./src/extract");
const { computeRoi } = require("./src/roi");
const ai = require("./src/openai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB
});

// --- Small helper to wrap async route handlers ---------------------------
function wrap(handler) {
  return (req, res) => {
    Promise.resolve(handler(req, res)).catch((err) => {
      if (err && err.code === "AI_UNAVAILABLE") {
        return res.status(200).json({ aiAvailable: false, message: err.message });
      }
      console.error(err);
      res.status(500).json({ error: err.message || "Unexpected error" });
    });
  };
}

// --- Config / options ----------------------------------------------------
app.get("/api/options", (req, res) => {
  res.json({ options, aiAvailable: ai.aiAvailable(), model: ai.MODEL });
});

// --- Document upload -> extracted field suggestions ----------------------
app.post(
  "/api/extract",
  upload.single("file"),
  wrap(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });
    const text = await extractText(req.file.buffer, req.file.originalname);
    if (!text || text.trim().length < 10) {
      return res.json({
        aiAvailable: ai.aiAvailable(),
        fields: {},
        openQuestions: [],
        summary: "The document did not contain enough readable text to extract.",
        filename: req.file.originalname,
        chars: text ? text.length : 0
      });
    }
    const result = await ai.extractFields(text);
    res.json({
      aiAvailable: true,
      filename: req.file.originalname,
      chars: text.length,
      fields: result.fields || {},
      openQuestions: result.openQuestions || [],
      summary: result.summary || ""
    });
  })
);

// --- Improve wording for one field ---------------------------------------
app.post(
  "/api/improve",
  wrap(async (req, res) => {
    const { field, label, text, context } = req.body || {};
    const result = await ai.improveText({ field, label, text, context });
    res.json({ aiAvailable: true, ...result });
  })
);

// --- ROI: deterministic math + optional narrative ------------------------
app.post(
  "/api/roi",
  wrap(async (req, res) => {
    const roi = computeRoi(req.body || {});
    let narrative = "";
    if (ai.aiAvailable()) {
      try {
        const n = await ai.narrateRoi(roi, (req.body && req.body.context) || "");
        narrative = n.narrative || "";
      } catch {
        /* narrative is best-effort */
      }
    }
    res.json({ ...roi, narrative });
  })
);

// --- Completeness + readiness --------------------------------------------
app.post(
  "/api/completeness",
  wrap(async (req, res) => {
    const result = await ai.checkCompleteness(req.body || {});
    res.json({ aiAvailable: true, ...result });
  })
);

// --- Generate the BRD / ROI package --------------------------------------
app.post(
  "/api/generate",
  wrap(async (req, res) => {
    const record = (req.body && req.body.record) || {};
    const roi = (req.body && req.body.roi) || null;
    const result = await ai.generateBrd(record, roi);
    res.json({ aiAvailable: true, ...result });
  })
);

// --- Optional lightweight persistence ------------------------------------
app.post(
  "/api/save",
  wrap(async (req, res) => {
    const dir = path.join(__dirname, "data");
    const file = path.join(dir, "submissions.json");
    fs.mkdirSync(dir, { recursive: true });
    let all = [];
    try {
      all = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      all = [];
    }
    const entry = {
      id: "REQ-" + Date.now().toString(36).toUpperCase(),
      createdDate: new Date().toISOString(),
      ...(req.body || {})
    };
    all.push(entry);
    fs.writeFileSync(file, JSON.stringify(all, null, 2));
    res.json({ saved: true, id: entry.id });
  })
);

app.get("/healthz", (req, res) => res.json({ ok: true, aiAvailable: ai.aiAvailable() }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI Intake Qualification Agent running on http://0.0.0.0:${PORT}`);
  if (!ai.aiAvailable()) {
    console.warn("OPENAI_API_KEY not set — AI features are disabled until you add it to Secrets.");
  }
});
