"use strict";

// Deterministic ROI math lives in code (not the model) so estimates are
// reproducible. The model is only used to narrate the result elsewhere.

const DEFAULT_LOADED_RATE = 75; // USD per hour, placeholder fully-loaded cost.

function num(v) {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function categorize(annualValue) {
  if (!annualValue || annualValue <= 0) return "Not yet quantified";
  if (annualValue < 100000) return "Less than $100K";
  if (annualValue < 500000) return "$100K to $500K";
  if (annualValue < 1000000) return "$500K to $1M";
  if (annualValue < 5000000) return "$1M to $5M";
  if (annualValue < 10000000) return "$5M to $10M";
  return "$10M and above";
}

/**
 * Compute a time-savings ROI estimate.
 * inputs: { users, runsPerYear, minutesNow, minutesFuture, loadedRate }
 */
function computeRoi(inputs = {}) {
  const users = num(inputs.users);
  const runsPerYear = num(inputs.runsPerYear);
  const minutesNow = num(inputs.minutesNow);
  const minutesFuture = num(inputs.minutesFuture);
  const loadedRate = num(inputs.loadedRate) || DEFAULT_LOADED_RATE;

  const minutesSavedPerRun = Math.max(0, minutesNow - minutesFuture);
  const annualHoursSaved = (users * runsPerYear * minutesSavedPerRun) / 60;
  const annualValue = annualHoursSaved * loadedRate;

  return {
    inputs: { users, runsPerYear, minutesNow, minutesFuture, loadedRate },
    minutesSavedPerRun,
    annualHoursSaved: Math.round(annualHoursSaved),
    annualValue: Math.round(annualValue),
    annualValueFormatted: formatUsd(Math.round(annualValue)),
    category: categorize(annualValue),
    isEstimate: true,
    assumptions: [
      `Fully-loaded cost of $${loadedRate}/hour (${num(inputs.loadedRate) ? "provided" : "placeholder default"}).`,
      `${users} users × ${runsPerYear} runs/year × ${minutesSavedPerRun} minutes saved per run.`,
      "Estimate only — not formally validated."
    ]
  };
}

function formatUsd(v) {
  return "$" + (v || 0).toLocaleString("en-US");
}

module.exports = { computeRoi, categorize, formatUsd, DEFAULT_LOADED_RATE };
