"use strict";

const path = require("path");

const TEXT_EXTS = [".txt", ".md", ".markdown", ".csv", ".json", ".log", ".rtf"];

/**
 * Extract plain text from an uploaded file buffer.
 * Supports txt/md/csv/json natively, plus PDF and DOCX via libraries.
 * Falls back to a best-effort UTF-8 decode for unknown types.
 */
async function extractText(buffer, filename) {
  const ext = (path.extname(filename || "") || "").toLowerCase();

  if (TEXT_EXTS.includes(ext)) {
    return buffer.toString("utf8");
  }

  if (ext === ".pdf") {
    // Require lazily so the app still boots if the optional dep is missing.
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    return (data.text || "").trim();
  }

  if (ext === ".docx") {
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return (result.value || "").trim();
  }

  // Unknown type: best-effort decode.
  return buffer.toString("utf8");
}

module.exports = { extractText, TEXT_EXTS };
