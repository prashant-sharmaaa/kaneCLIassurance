# Core Wealth Hub — Assurance Flow

Independent assurance run against **Core Wealth Hub** (`https://core-wealth-hub.lovable.app/login`), produced with [kane-cli](https://testmu.ai) following the flow requested in [`bfsFile.md`](./bfsFile.md):

> Discover → Extract → Review → Design Tests → Execute → Collect Evidence → Generate Assurance Results → Identify Proven vs Owed

No behavior was assumed. Every acceptance criterion, scenario, and test below was extracted from `bfsFile.md`, approved by a human reviewer, and then authored against the **live application** in a real browser.

## Business use cases covered

| Use case | ACs | Tests | Status |
|---|---|---|---|
| Log into the Core Wealth Hub portal | 3 | 2 | 67% proven |
| Complete applicant KYC registration | 4 | 1 | **100% proven** |
| Submit a personal loan application | 10 | 7 | 0% proven (see findings) |
| Search for loan details | 10 | 6 | 50% proven |

**Overall: 33 ACs designed (96% of the discovered surface has a verifying test), 14/33 proven by a passing run as of the last execution.**

Run `kane-cli cover gaps` locally (or read the CI artifact `coverage-report-<run>`) for the live, up-to-date numbers — the table above is a snapshot, not a static claim.

## Findings from the first full run

The first execution surfaced two categories of issue, which is the point of the exercise — this is "Proven vs Owed," not a rubber stamp:

1. **Application defect** — the login page at the documented URL renders **"BankOps" branding instead of "Core Wealth Hub"**. This broke the first assertion in most tests, cascading into failures downstream. Flagged by the agent's own root-cause analysis at `major` severity, `application_issue/ui_data_defect`, confidence 0.98.
2. **Test/spec mismatches** — a few tests asserted UI wording (e.g. a "New Application" action) that doesn't match the label the live app actually shows (e.g. "Submit Application"). These are tracked as `automation_bug` findings, not product defects, and are fixed by re-running `kane-cli design tests --use-case <uc-id>` once the correct wording is confirmed.

Full per-step evidence (screenshots, console/network logs, root-cause analysis) lives in the sealed `.evidence` packs — see [Evidence](#evidence) below.

## Repo layout

```
bfsFile.md                     # original requirement doc this suite was designed from
.testmuai/tests/*_test.md      # the 16 designed, requirement-linked tests (run these)
.context/                      # kane-cli's local requirement graph (gitignored, regenerated)
.github/workflows/assurance.yml # CI: runs the full suite on a GitHub-hosted runner
```

## Running the suite

### On GitHub Actions (recommended)

The workflow at [`.github/workflows/assurance.yml`](./.github/workflows/assurance.yml) runs the entire suite on a GitHub-hosted `ubuntu-latest` runner — headless Chrome, no local machine required.

**One-time setup** — add these repository secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `KANE_CLI_USERNAME` | Your TestmuAI username |
| `KANE_CLI_ACCESS_KEY` | Your TestmuAI access key (Settings → Keys on the TestmuAI dashboard) |

**Trigger it:** push to `main`, or run manually from the Actions tab (`workflow_dispatch`). It also runs on a weekly schedule (Monday 03:00 UTC) as a regression check.

**Output:** a pass/fail per test, a `coverage-report-<run>` artifact (the same `cover` / `cover gaps` report shown above), and an `evidence-packs-<run>` artifact with every screenshot/log for debugging failures.

### Locally (for authoring/debugging one test, not the full batch)

```bash
npm install -g @testmuai/kane-cli
kane-cli login --username <user> --access-key <key>

# one test:
kane-cli testmd run .testmuai/tests/<name>_test.md --agent

# the full batch (same as CI):
kane-cli testrun run --headless --parallel 1
```

## Evidence

Every run seals an evidence pack (`.evidence` zip: test definition, per-step screenshots, console/network logs, root-cause analysis on failures). Packs are **not committed to git** (`.testmuai/evidence/` is gitignored) — they're large binaries and are instead:

- published to the KaneAI Test Manager dashboard (each result carries a `sharable_link`), and
- attached as a downloadable artifact on every CI run.

To view a pack locally: `kane-cli evidence serve <path-to-pack>`.

## Keeping this suite current

If `bfsFile.md` changes, don't re-run `context ingest` — use:

```bash
kane-cli maintain reconcile --from ./bfsFile.md --source-id bfsfile --mode agent
```

This re-versions the source and triages exactly what needs a new test, an updated test, or a human decision on stale evidence.
