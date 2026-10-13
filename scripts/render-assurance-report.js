#!/usr/bin/env node
// Renders a human-readable Use Case -> AC -> Test -> Result report for the
// GitHub Actions log + job summary, from the committed test suite and a
// testrun NDJSON output file. Needs no kane-cli `.context/` store.

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const TESTS_DIR = path.join(REPO_ROOT, ".testmuai", "tests");
const MANIFEST_PATH = path.join(REPO_ROOT, ".testmuai", "assurance-manifest.json");
const ndjsonPath = process.argv[2]; // path to captured testrun stdout, optional

function parseTestFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const idMatch = raw.match(/^\s*id:\s*(t-\d+)/m);
  const titleMatch = raw.match(/^#\s+(.+)$/m);
  const descMatch = raw.match(/^>\s*(.+)$/m);
  const verifies = new Set();
  const stepRe = /^##\s+Step\s+\d+.*@verifies\s+([a-z0-9,\s-]+)$/gim;
  let m;
  while ((m = stepRe.exec(raw))) {
    m[1].split(",").forEach((ac) => verifies.add(ac.trim()));
  }
  return {
    id: idMatch ? idMatch[1] : null,
    file: path.basename(filePath),
    title: titleMatch ? titleMatch[1].trim() : path.basename(filePath),
    description: descMatch ? descMatch[1].trim() : "",
    verifies: Array.from(verifies),
  };
}

function loadResults(file) {
  const results = {}; // file basename -> {status, duration_s}
  if (!file || !fs.existsSync(file)) return results;
  const lines = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
  for (const line of lines) {
    let evt;
    try {
      evt = JSON.parse(line);
    } catch {
      continue;
    }
    if (evt.type === "testrun_summary" && Array.isArray(evt.authored)) {
      for (const member of evt.authored) {
        results[path.basename(member.path)] = { status: member.status };
      }
    }
    if (evt.type === "testrun_authored_member_end") {
      const base = path.basename(evt.path);
      results[base] = results[base] || {};
      results[base].status = results[base].status || evt.status;
      results[base].duration_s = evt.duration_s;
    }
  }
  return results;
}

function badge(status) {
  if (status === "passed") return "🟢 PASSED";
  if (status === "failed") return "🔴 FAILED";
  if (status === "broken") return "🟠 BROKEN";
  if (!status) return "⚪ NOT RUN";
  return `⚪ ${status.toUpperCase()}`;
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const testFiles = fs
    .readdirSync(TESTS_DIR)
    .filter((f) => f.endsWith("_test.md"))
    .map((f) => parseTestFile(path.join(TESTS_DIR, f)));
  const testsById = {};
  testFiles.forEach((t) => {
    if (t.id) testsById[t.id] = t;
  });
  const results = loadResults(ndjsonPath);

  const lines = [];
  const log = (s = "") => lines.push(s);

  log(`# Core Wealth Hub — Assurance Run`);
  log("");
  log(`Source requirements: \`${manifest.source}\` — discovered, extracted, reviewed, designed, and executed via the kane-cli assurance flow (no behavior invented).`);
  log("");

  let totalAcs = 0;
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalNotRun = 0;

  for (const uc of manifest.use_cases) {
    log(`## ${uc.id.toUpperCase()} — ${uc.title}`);
    log(`*Business use case: ${uc.business_use_case}*`);
    log("");
    log(`**Acceptance criteria (${uc.acceptance_criteria.length}):**`);
    for (const ac of uc.acceptance_criteria) {
      log(`- \`${ac.id}\` ${ac.title}`);
    }
    totalAcs += uc.acceptance_criteria.length;
    log("");
    log(`**Tests (${uc.tests.length}):**`);
    log("");
    log(`| Test | Verifies | Result |`);
    log(`|---|---|---|`);
    for (const tid of uc.tests) {
      const t = testsById[tid];
      totalTests++;
      if (!t) {
        log(`| \`${tid}\` (missing file) | — | ⚪ NOT FOUND |`);
        totalNotRun++;
        continue;
      }
      const r = results[t.file];
      const status = r && r.status;
      if (status === "passed") totalPassed++;
      else if (status === "failed" || status === "broken") totalFailed++;
      else totalNotRun++;
      const dur = r && r.duration_s ? ` (${r.duration_s}s)` : "";
      log(`| **${t.title}** | ${t.verifies.join(", ") || "—"} | ${badge(status)}${dur} |`);
    }
    log("");
  }

  log(`## Summary`);
  log("");
  log(`| Metric | Value |`);
  log(`|---|---|`);
  log(`| Use cases | ${manifest.use_cases.length} |`);
  log(`| Acceptance criteria designed | ${totalAcs} |`);
  log(`| Tests designed | ${totalTests} |`);
  log(`| Passed this run | ${totalPassed} |`);
  log(`| Failed this run | ${totalFailed} |`);
  log(`| Not run this trigger | ${totalNotRun} |`);
  log("");
  log(`This pipeline ran the kane-cli assurance flow: **Discover → Extract → Review → Design Tests → Execute → Collect Evidence → Generate Assurance Results → Identify Proven vs Owed.** The table above is the "Proven vs Owed" result for this execution — a failed row is either a real product defect or a test that needs re-authoring against the live UI, both surfaced in the evidence pack for the matching test.`);

  const report = lines.join("\n");
  process.stdout.write(report + "\n");

  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(summaryFile, report + "\n");
  }
}

main();
