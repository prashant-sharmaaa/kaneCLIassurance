#!/usr/bin/env node
// Renders a standalone, self-contained HTML dashboard proving what this CI run
// actually verified: per-use-case status, acceptance-criteria checkmarks, a
// test-by-test pass/fail table with Test Manager execution links, and an
// overall coverage rollup. Built from the same committed test suite + testrun
// NDJSON output the Markdown report uses — no kane-cli `.context/` store needed.
//
// This is a separate artifact from render-assurance-report.js (which writes the
// GitHub Actions job summary). This script writes a single .html file meant to
// be uploaded as a build artifact and opened/screen-shared during a demo, so it
// is free to use real CSS (GitHub's job-summary renderer strips that).
//
// Usage: node render-assurance-dashboard.js <testrun-output.ndjson> [evidence-dir] [out-file]

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..");
const TESTS_DIR = path.join(REPO_ROOT, ".testmuai", "tests");
const MANIFEST_PATH = path.join(REPO_ROOT, ".testmuai", "assurance-manifest.json");
const ndjsonPath = process.argv[2];
const evidenceDir = process.argv[3] || path.join(REPO_ROOT, ".testmuai", "evidence");
const outPath = process.argv[4] || path.join(REPO_ROOT, "assurance-report.html");

function parseTestFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const idMatch = raw.match(/^\s*id:\s*(t-\d+)/m);
  const titleMatch = raw.match(/^#\s+(.+)$/m);
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
    verifies: Array.from(verifies),
  };
}

function loadResults(file) {
  const results = {};
  if (!file || !fs.existsSync(file)) return results;
  const lines = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
  for (const line of lines) {
    let evt;
    try { evt = JSON.parse(line); } catch { continue; }
    if (evt.type === "testrun_summary" && Array.isArray(evt.authored)) {
      for (const member of evt.authored) {
        const base = path.basename(member.path);
        results[base] = {
          ...results[base],
          status: member.status,
          test_id: member.test_id,
          source_execution_id: member.source_execution_id,
        };
      }
    }
    if (evt.type === "testrun_authored_member_end") {
      const base = path.basename(evt.path);
      results[base] = results[base] || {};
      results[base].status = results[base].status || evt.status;
      results[base].duration_s = evt.duration_s;
      results[base].test_id = results[base].test_id || evt.test_id;
    }
  }
  return results;
}

function findSharableLink(testId, sourceExecutionId) {
  if (!testId || !sourceExecutionId) return null;
  const pack = path.join(evidenceDir, `${sourceExecutionId}.evidence`);
  if (!fs.existsSync(pack)) return null;
  try {
    const yaml = execFileSync("unzip", ["-p", pack, `tests/${testId}/result.yaml`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const m = yaml.match(/sharable_link:\s*(\S+)/);
    return m ? m[1] : null;
  } catch { return null; }
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function statusWord(status) {
  if (status === "passed") return { word: "PASSED", cls: "pass" };
  if (status === "failed") return { word: "FAILED", cls: "fail" };
  if (status === "broken") return { word: "BROKEN", cls: "fail" };
  if (!status) return { word: "NOT RUN", cls: "pending" };
  return { word: status.toUpperCase(), cls: "pending" };
}

function ucStatus(provenCount, totalCount) {
  if (totalCount === 0) return { word: "NO ACs", cls: "pending" };
  if (provenCount === totalCount) return { word: "FULLY PROVEN", cls: "pass" };
  if (provenCount === 0) return { word: "NOT PROVEN", cls: "fail" };
  return { word: "PARTIALLY PROVEN", cls: "partial" };
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const testFiles = fs.readdirSync(TESTS_DIR)
    .filter((f) => f.endsWith("_test.md"))
    .map((f) => parseTestFile(path.join(TESTS_DIR, f)));
  const testsById = {};
  testFiles.forEach((t) => { if (t.id) testsById[t.id] = t; });
  const results = loadResults(ndjsonPath);

  let totalAcs = 0, totalProvenAcs = 0, totalTests = 0, totalPassed = 0, totalFailed = 0, totalNotRun = 0;
  const ucRollup = [];
  const ucSections = [];

  for (const uc of manifest.use_cases) {
    const ucTests = uc.tests.map((tid) => {
      const t = testsById[tid];
      if (!t) return { tid, missing: true };
      const r = results[t.file] || {};
      const link = findSharableLink(r.test_id, r.source_execution_id);
      return { tid, t, r, status: r.status, link };
    });

    const provenAcs = new Set();
    for (const entry of ucTests) {
      if (entry.status === "passed" && entry.t) {
        entry.t.verifies.forEach((ac) => provenAcs.add(ac));
      }
    }
    const acTotal = uc.acceptance_criteria.length;
    const acProven = uc.acceptance_criteria.filter((ac) => provenAcs.has(ac.id)).length;
    const testsPassed = ucTests.filter((e) => e.status === "passed").length;
    const testsTotal = ucTests.length;
    const pct = acTotal ? Math.round((acProven / acTotal) * 100) : 0;
    const uStatus = ucStatus(acProven, acTotal);

    ucRollup.push({ id: uc.id, title: uc.title, acTotal, acProven, pct, testsPassed, testsTotal });
    totalAcs += acTotal;
    totalProvenAcs += acProven;

    const acRows = uc.acceptance_criteria.map((ac) => {
      const proven = provenAcs.has(ac.id);
      return `<li class="${proven ? "ac-done" : "ac-pending"}"><span class="ac-mark">${proven ? "&#10003;" : ""}</span><span class="ac-id">${esc(ac.id)}</span><span class="ac-title">${esc(ac.title)}</span></li>`;
    }).join("\n");

    const testRows = ucTests.map((entry) => {
      totalTests++;
      if (entry.missing) {
        totalNotRun++;
        return `<tr class="pending"><td>${esc(entry.tid)} <span class="muted">(missing file)</span></td><td>&mdash;</td><td><span class="pill pill-pending">NOT FOUND</span></td><td>&mdash;</td></tr>`;
      }
      const { t, r, status, link } = entry;
      if (status === "passed") totalPassed++;
      else if (status === "failed" || status === "broken") totalFailed++;
      else totalNotRun++;
      const sw = statusWord(status);
      const dur = r && r.duration_s ? ` <span class="muted">(${r.duration_s}s)</span>` : "";
      const execCell = link ? `<a class="exec-link" href="${esc(link)}" target="_blank" rel="noopener">View execution &#9654;</a>` : `<span class="muted">&mdash;</span>`;
      return `<tr class="${sw.cls}"><td class="test-title">${esc(t.title)}</td><td class="muted">${esc(t.verifies.join(", ") || "—")}</td><td><span class="pill pill-${sw.cls}">${sw.word}</span>${dur}</td><td>${execCell}</td></tr>`;
    }).join("\n");

    ucSections.push(`
      <article class="uc uc-${uStatus.cls}">
        <div class="uc-head">
          <h2>${esc(uc.id.toUpperCase())} &mdash; ${esc(uc.title)}</h2>
          <span class="pill pill-${uStatus.cls}">${uStatus.word}</span>
        </div>
        <p class="business">Business use case: ${esc(uc.business_use_case)}</p>
        <div class="bar"><div class="bar-fill bar-${uStatus.cls}" style="width:${pct}%"></div></div>
        <p class="bar-label">${acProven} of ${acTotal} acceptance criteria proven (${pct}%) &middot; ${testsPassed}/${testsTotal} tests passed</p>

        <h3>Acceptance criteria</h3>
        <ul class="ac-list">
${acRows}
        </ul>

        <h3>Tests</h3>
        <table class="test-table">
          <thead><tr><th>Test</th><th>Verifies</th><th>Result</th><th>Evidence</th></tr></thead>
          <tbody>
${testRows}
          </tbody>
        </table>
      </article>`);
  }

  const overallPct = totalAcs ? Math.round((totalProvenAcs / totalAcs) * 100) : 0;
  const evidenceCount = fs.existsSync(evidenceDir)
    ? fs.readdirSync(evidenceDir).filter((f) => f.endsWith(".evidence")).length
    : 0;

  const coverageRows = ucRollup.map((r) => `
    <tr>
      <td>${esc(r.id.toUpperCase())} &mdash; ${esc(r.title)}</td>
      <td>${r.acTotal}</td>
      <td>${r.acProven}</td>
      <td><div class="bar bar-sm"><div class="bar-fill" style="width:${r.pct}%"></div></div><span class="pct">${r.pct}%</span></td>
      <td>${r.testsPassed}/${r.testsTotal}</td>
    </tr>`).join("\n");

  const runNumber = process.env.GITHUB_RUN_NUMBER || "local";
  const sha = (process.env.GITHUB_SHA || "").slice(0, 7);
  const runUrl = process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;
  const generatedAt = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Core Wealth Hub — Assurance Report</title>
<style>
  :root {
    --ink: #0a0a0a;
    --sub: #5f6368;
    --line: #e3e3e6;
    --panel: #f7f7f8;
    --pass: #1a7f37;
    --pass-bg: #daf5e3;
    --fail: #b3261e;
    --fail-bg: #fde3e1;
    --partial: #9a6700;
    --partial-bg: #fff3d6;
    --pending: #5f6368;
    --pending-bg: #eceef0;
    --accent: #0a5fd9;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, "Segoe UI", Inter, Helvetica, Arial, sans-serif;
    color: var(--ink);
    background: #fff;
    line-height: 1.5;
  }
  .wrap { max-width: 1040px; margin: 0 auto; padding: 48px 32px 80px; }
  header h1 { font-size: 30px; font-weight: 700; letter-spacing: -0.01em; margin: 0 0 6px; }
  header .meta { color: var(--sub); font-size: 14px; margin: 0 0 4px; }
  header .meta a { color: var(--accent); text-decoration: none; }
  .flow {
    margin-top: 18px;
    font-size: 13px;
    color: var(--sub);
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 10px 14px;
    font-family: "SF Mono", "Geist Mono", ui-monospace, monospace;
  }

  .hero { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 32px 0 40px; }
  .stat { border: 1px solid var(--line); border-radius: 12px; padding: 20px; background: #fff; }
  .stat .num { font-size: 36px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; }
  .stat .label { margin-top: 6px; font-size: 13px; color: var(--sub); }
  .stat .sub { margin-top: 2px; font-size: 12px; color: var(--sub); }
  .stat.highlight { border-color: var(--accent); background: #f2f7ff; }
  .stat.highlight .num { color: var(--accent); }

  .uc { border: 1px solid var(--line); border-radius: 14px; padding: 24px 28px; margin-bottom: 24px; background: #fff; }
  .uc-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .uc-head h2 { font-size: 19px; margin: 0; letter-spacing: -0.01em; }
  .business { color: var(--sub); font-size: 13px; font-style: italic; margin: 4px 0 16px; }

  .bar { height: 8px; border-radius: 4px; background: var(--pending-bg); overflow: hidden; margin: 4px 0; }
  .bar-sm { width: 120px; display: inline-block; vertical-align: middle; margin-right: 8px; }
  .bar-fill { height: 100%; background: var(--accent); border-radius: 4px; }
  .bar-fill.bar-pass { background: var(--pass); }
  .bar-fill.bar-fail { background: var(--fail); }
  .bar-fill.bar-partial { background: var(--partial); }
  .bar-label { font-size: 13px; color: var(--sub); margin: 6px 0 20px; }
  .pct { font-size: 13px; color: var(--sub); font-weight: 600; }

  h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--sub); margin: 20px 0 10px; }

  .ac-list { list-style: none; margin: 0; padding: 0; }
  .ac-list li { display: grid; grid-template-columns: 22px 56px 1fr; align-items: start; gap: 10px; padding: 6px 0; font-size: 14px; border-bottom: 1px solid #f0f0f1; }
  .ac-list li:last-child { border-bottom: none; }
  .ac-mark { color: var(--pass); font-weight: 700; }
  .ac-pending .ac-mark::before { content: "\\25CB"; color: var(--pending); }
  .ac-id { font-family: "SF Mono", "Geist Mono", ui-monospace, monospace; color: var(--sub); font-size: 12px; }
  .ac-pending .ac-title { color: var(--sub); }

  table.test-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  table.test-table th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; color: var(--sub); border-bottom: 1px solid var(--line); padding: 8px 10px; }
  table.test-table td { padding: 10px; border-bottom: 1px solid #f0f0f1; vertical-align: middle; }
  table.test-table tr:last-child td { border-bottom: none; }
  .test-title { font-weight: 600; }
  .muted { color: var(--sub); font-size: 12px; }
  .exec-link { color: var(--accent); text-decoration: none; font-weight: 600; font-size: 13px; }
  .exec-link:hover { text-decoration: underline; }

  .pill { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; }
  .pill-pass { color: var(--pass); background: var(--pass-bg); }
  .pill-fail { color: var(--fail); background: var(--fail-bg); }
  .pill-partial { color: var(--partial); background: var(--partial-bg); }
  .pill-pending { color: var(--pending); background: var(--pending-bg); }

  section.coverage { margin-top: 48px; }
  section.coverage h2 { font-size: 22px; margin-bottom: 16px; }
  table.coverage-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  table.coverage-table th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; color: var(--sub); border-bottom: 2px solid var(--line); padding: 10px; }
  table.coverage-table td { padding: 10px; border-bottom: 1px solid #f0f0f1; }
  table.coverage-table tr.total td { font-weight: 700; border-top: 2px solid var(--line); border-bottom: none; }

  footer { margin-top: 56px; padding-top: 24px; border-top: 1px solid var(--line); color: var(--sub); font-size: 13px; }
  footer .generated { margin-top: 12px; font-size: 12px; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>Core Wealth Hub — Assurance Report</h1>
    <p class="meta">Source requirements: <code>${esc(manifest.source)}</code> &middot; CI run #${esc(runNumber)} &middot; commit <code>${esc(sha)}</code>${runUrl ? ` &middot; <a href="${esc(runUrl)}" target="_blank" rel="noopener">view run</a>` : ""}</p>
    <div class="flow">Discover &rarr; Extract &rarr; Review &rarr; Design Tests &rarr; Execute &rarr; Collect Evidence &rarr; Generate Assurance Results &rarr; Identify Proven vs Owed</div>
  </header>

  <section class="hero">
    <div class="stat"><div class="num">${manifest.use_cases.length}</div><div class="label">Use cases assured</div></div>
    <div class="stat highlight"><div class="num">${overallPct}%</div><div class="label">Acceptance criteria proven</div><div class="sub">${totalProvenAcs} of ${totalAcs} ACs</div></div>
    <div class="stat"><div class="num">${totalPassed}/${totalTests}</div><div class="label">Tests passed this run</div></div>
    <div class="stat"><div class="num">${evidenceCount}</div><div class="label">Sealed evidence packs</div></div>
  </section>

  <section class="use-cases">
${ucSections.join("\n")}
  </section>

  <section class="coverage">
    <h2>Coverage</h2>
    <table class="coverage-table">
      <thead><tr><th>Use case</th><th>ACs designed</th><th>ACs proven</th><th>Coverage</th><th>Tests passed</th></tr></thead>
      <tbody>
${coverageRows}
        <tr class="total">
          <td>Overall</td>
          <td>${totalAcs}</td>
          <td>${totalProvenAcs}</td>
          <td>${overallPct}%</td>
          <td>${totalPassed}/${totalTests}</td>
        </tr>
      </tbody>
    </table>
  </section>

  <footer>
    <p>An acceptance criterion counts as <strong>proven</strong> when at least one of its verifying tests passed on this run &mdash; nothing here is asserted without a passing, evidenced test behind it. A failed row is either a real product defect or a test that needs re-authoring against the live UI; click <strong>View execution</strong> on that row for the full step-by-step run (screenshots, console/network logs, root-cause analysis) in the TestmuAI Test Manager dashboard. Every run reruns the full kane-cli assurance flow against the live application &mdash; nothing is cached or assumed from a prior run.</p>
    <p class="generated">Generated ${esc(generatedAt)}${runUrl ? ` from <a href="${esc(runUrl)}" target="_blank" rel="noopener">CI run #${esc(runNumber)}</a>` : ""}.</p>
  </footer>
</div>
</body>
</html>
`;

  fs.writeFileSync(outPath, html, "utf8");
  process.stdout.write(`Dashboard written to ${outPath}\n`);
}

main();
