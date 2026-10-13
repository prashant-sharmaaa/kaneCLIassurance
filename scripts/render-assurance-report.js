#!/usr/bin/env node
// Renders a human-readable Use Case -> AC -> Test -> Result report for the
// GitHub Actions log + job summary, from the committed test suite and a
// testrun NDJSON output file. Needs no kane-cli `.context/` store.
//
// Usage: node render-assurance-report.js <testrun-output.ndjson> [evidence-dir]

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..");
const TESTS_DIR = path.join(REPO_ROOT, ".testmuai", "tests");
const MANIFEST_PATH = path.join(REPO_ROOT, ".testmuai", "assurance-manifest.json");
const ndjsonPath = process.argv[2];
const evidenceDir = process.argv[3] || path.join(REPO_ROOT, ".testmuai", "evidence");

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
  // file basename -> {status, duration_s, test_id, source_execution_id}
  const results = {};
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
  } catch {
    return null;
  }
}

function badge(status) {
  if (status === "passed") return "🟢 PASSED";
  if (status === "failed") return "🔴 FAILED";
  if (status === "broken") return "🟠 BROKEN";
  if (!status) return "⚪ NOT RUN";
  return `⚪ ${status.toUpperCase()}`;
}

function ucBadge(provenCount, totalCount) {
  if (totalCount === 0) return "⚪ NO ACs";
  if (provenCount === totalCount) return "🟢 FULLY PROVEN";
  if (provenCount === 0) return "🔴 NOT PROVEN";
  return "🟠 PARTIALLY PROVEN";
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
  let totalProvenAcs = 0;
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalNotRun = 0;
  const ucRollup = [];

  for (const uc of manifest.use_cases) {
    // First pass: resolve every test's result + which ACs it proves.
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

    ucRollup.push({ id: uc.id, title: uc.title, acTotal, acProven, testsPassed, testsTotal });

    log(`## ${uc.id.toUpperCase()} — ${uc.title}`);
    log(`*Business use case: ${uc.business_use_case}*`);
    log("");
    log(`**Result: ${ucBadge(acProven, acTotal)}** — ${acProven}/${acTotal} ACs proven, ${testsPassed}/${testsTotal} tests passed`);
    log("");
    log(`**Acceptance criteria (${acTotal}):**`);
    for (const ac of uc.acceptance_criteria) {
      const proven = provenAcs.has(ac.id);
      log(`- ${proven ? "✅" : "⬜"} \`${ac.id}\` ${ac.title}`);
    }
    totalAcs += acTotal;
    totalProvenAcs += acProven;
    log("");
    log(`**Tests (${testsTotal}):**`);
    log("");
    log(`| Test | Verifies | Result | Execution |`);
    log(`|---|---|---|---|`);
    for (const entry of ucTests) {
      totalTests++;
      if (entry.missing) {
        log(`| \`${entry.tid}\` (missing file) | — | ⚪ NOT FOUND | — |`);
        totalNotRun++;
        continue;
      }
      const { t, r, status, link } = entry;
      if (status === "passed") totalPassed++;
      else if (status === "failed" || status === "broken") totalFailed++;
      else totalNotRun++;
      const dur = r && r.duration_s ? ` (${r.duration_s}s)` : "";
      const execLink = link ? `[▶ View execution](${link})` : "—";
      log(`| **${t.title}** | ${t.verifies.join(", ") || "—"} | ${badge(status)}${dur} | ${execLink} |`);
    }
    log("");
  }

  log(`## Coverage`);
  log("");
  log(`| Use case | ACs designed | ACs proven | Coverage | Tests passed |`);
  log(`|---|---|---|---|---|`);
  for (const r of ucRollup) {
    const pct = r.acTotal ? Math.round((r.acProven / r.acTotal) * 100) : 0;
    log(`| ${r.id.toUpperCase()} — ${r.title} | ${r.acTotal} | ${r.acProven} | ${pct}% | ${r.testsPassed}/${r.testsTotal} |`);
  }
  const overallPct = totalAcs ? Math.round((totalProvenAcs / totalAcs) * 100) : 0;
  log(`| **Overall** | **${totalAcs}** | **${totalProvenAcs}** | **${overallPct}%** | **${totalPassed}/${totalTests}** |`);
  log("");

  log(`## Summary`);
  log("");
  log(`| Metric | Value |`);
  log(`|---|---|`);
  log(`| Use cases | ${manifest.use_cases.length} |`);
  log(`| Acceptance criteria designed | ${totalAcs} |`);
  log(`| Acceptance criteria proven this run | ${totalProvenAcs} (${overallPct}%) |`);
  log(`| Tests designed | ${totalTests} |`);
  log(`| Passed this run | ${totalPassed} |`);
  log(`| Failed this run | ${totalFailed} |`);
  log(`| Not run this trigger | ${totalNotRun} |`);
  log("");
  log(`This pipeline ran the kane-cli assurance flow: **Discover → Extract → Review → Design Tests → Execute → Collect Evidence → Generate Assurance Results → Identify Proven vs Owed.** An AC counts as "proven" when at least one of its verifying tests passed this run. A failed row is either a real product defect or a test that needs re-authoring against the live UI — click **View execution** on that row for the full step-by-step run (screenshots, console/network logs, root-cause analysis) in the TestmuAI Test Manager dashboard.`);

  const report = lines.join("\n");
  process.stdout.write(report + "\n");

  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(summaryFile, report + "\n");
  }
}

main();
