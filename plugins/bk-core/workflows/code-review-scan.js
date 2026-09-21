export const meta = {
  name: "code-review",
  description:
    "Review a diff for security, integrity, complexity, i18n, dependency and lint issues, merged into one ranked report",
  phases: [
    {
      title: "Inventory",
      detail: "resolve the base ref and list changed files",
    },
    {
      title: "Review",
      detail: "six checks over the diff and the repository, in parallel",
    },
  ],
};

// Seven tasks, each in its own context: 1 inventory + 6 checks. Constant, whatever the
// diff size. This workflow collects; it does not judge. Merging, ranking and the final
// verdict belong to the caller, so raw findings are returned grouped by check.
// Each check reads the whole diff, so recall falls off on a very large change.
// The workflow says so rather than degrading quietly; see LARGE_DIFF_LINES below.
const LARGE_DIFF_LINES = 20000;

const FINDINGS = {
  type: "object",
  required: ["findings"],
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        required: [
          "file",
          "line",
          "severity",
          "category",
          "issue",
          "suggested_fix",
        ],
        properties: {
          file: { type: "string" },
          line: { type: "integer" },
          severity: {
            type: "string",
            enum: ["critical", "high", "medium", "low"],
          },
          category: { type: "string" },
          issue: { type: "string" },
          suggested_fix: { type: "string" },
        },
      },
    },
  },
};

const INVENTORY = {
  type: "object",
  required: ["base", "changed_lines", "files"],
  properties: {
    base: { type: "string" },
    changed_lines: { type: "integer" },
    files: {
      type: "array",
      items: {
        type: "object",
        required: ["path", "language", "role"],
        properties: {
          path: { type: "string" },
          language: {
            type: "string",
            enum: ["python", "javascript", "typescript", "other"],
          },
          role: {
            type: "string",
            enum: ["source", "test", "config", "lockfile"],
          },
        },
      },
    },
  },
};

// Three checks read the changed source files. Three read the repository, because the
// question they answer spans files: locale key parity, dependency manifests, linters.
const CHECKS = [
  {
    key: "security",
    scope: "diff",
    task:
      "Report security problems: injection (SQL, command, template), unsafe deserialization, " +
      "hardcoded secrets or credentials, missing or wrong authorization checks, unsafe subprocess or eval use, and path traversal.",
  },
  {
    key: "integrity",
    scope: "diff",
    task:
      "Report correctness problems: error handling, null and undefined paths, unhandled exception paths, " +
      "race conditions and shared mutable state, boundary and input validation, and transaction correctness including partial commits.",
  },
  {
    key: "complexity",
    scope: "diff",
    task:
      "Report maintainability problems: functions this diff made materially harder to follow, deep nesting, " +
      "logic duplicated from elsewhere in the repository, and names that no longer describe what the code does.",
  },
  {
    key: "i18n",
    scope: "repo",
    task:
      "Report internationalization problems. Two things only:\n" +
      "1. User-facing strings introduced by this diff that bypass the locale layer.\n" +
      "2. Locale key parity: for every key this diff adds to one language file, check every sibling language file " +
      "in the same locale directory and report each file the key is missing from. Read all of the locale files, not just the changed one.",
  },
  {
    key: "dependencies",
    scope: "repo",
    task:
      "Inspect dependency manifests and lockfiles changed by this diff: requirements*.txt, pyproject.toml, package.json and their lockfiles.\n" +
      "For every package added or version-bumped, report known CVEs affecting the new version, license changes versus the previous version, " +
      "and any dependency left unpinned or on a floating range.\n" +
      "Report nothing if no manifest changed.",
  },
  {
    key: "lint",
    scope: "repo",
    task:
      "Detect which linters this repository actually configures, by reading its config files: ruff, flake8, mypy, eslint, biome, tsc, prettier.\n" +
      "A linter counts as configured only if its config exists (a pyproject.toml section, setup.cfg, .flake8, mypy.ini, an eslint config, " +
      "biome.json, tsconfig.json, a prettier config) or it is declared in the project dev dependencies.\n" +
      "Run only those linters, and only against the files changed in this diff. Report each violation at its reported line.\n" +
      "If no linter is configured, return an empty findings list and say nothing else.",
  },
];

const ref = typeof args === "string" && args.trim() !== "" ? args.trim() : "";

const baseInstruction = ref
  ? 'Use "' + ref + '" as the base ref.'
  : "Resolve the base ref yourself: read the default branch from `git symbolic-ref refs/remotes/origin/HEAD`, " +
    "falling back to main and then master, then take `git merge-base HEAD <default-branch>`.";

phase("Inventory");

const inv = await agent(
  "Inventory the changes in this repository.\n" +
    baseInstruction +
    "\nRun `git diff --name-only <base>...HEAD` for the file list, and `git diff --shortstat <base>...HEAD` for the size.\n" +
    "Tag every changed file with its language (python, javascript, typescript, or other) and its role " +
    "(source, test, config, or lockfile). Treat generated lockfiles as lockfile, not config.\n" +
    "Return the base ref you resolved, the total number of changed lines, and the tagged file list.",
  { label: "inventory", schema: INVENTORY },
);

if (!inv)
  return { error: "Inventory agent returned no result; nothing was reviewed." };

const sources = inv.files.filter((f) => f.role === "source");
log(
  "Base " +
    inv.base +
    ": " +
    inv.files.length +
    " changed files (" +
    sources.length +
    " source), " +
    inv.changed_lines +
    " changed lines.",
);

if (inv.changed_lines > LARGE_DIFF_LINES) {
  log(
    "This diff exceeds " +
      LARGE_DIFF_LINES +
      " changed lines. Each check reads the whole diff in one agent, " +
      "so findings may be less complete than on a smaller change. Consider reviewing it in slices by passing a narrower ref.",
  );
}

if (sources.length === 0) {
  log("No changed source files; running the repository-wide checks only.");
}

phase("Review");

const results = await parallel(
  CHECKS.map((check) => () => {
    const target =
      check.scope === "diff"
        ? "Review the changed source files: " +
          sources.map((f) => f.path).join(", ") +
          ".\n" +
          "Read `git diff " +
          inv.base +
          "...HEAD -- <path>` for each, and read the surrounding file for context.\n" +
          "Report only problems this diff introduces, or leaves standing in the lines it touches."
        : "Work across the whole repository, using `git diff " +
          inv.base +
          "...HEAD` to see what changed.";

    return agent(
      target +
        "\n\n" +
        check.task +
        "\n\nEvery finding needs the exact file path, the exact line number, a concrete suggested fix, " +
        "and a severity of critical, high, medium or low. Report nothing you cannot point at a line for.",
      { label: check.key, schema: FINDINGS },
    );
  }),
);

// Findings without a usable line reference are dropped here: deterministic, free, and
// guaranteed, unlike asking a model to do it. Everything else is returned untouched.
const byCheck = CHECKS.map((check, i) => {
  const r = results ? results[i] : null;
  return {
    check: check.key,
    ran: Boolean(r),
    findings: r
      ? (r.findings || []).filter((f) => Number.isInteger(f.line) && f.line > 0)
      : [],
  };
});

const total = byCheck.reduce((n, c) => n + c.findings.length, 0);
const failed = byCheck.filter((c) => !c.ran).map((c) => c.check);

log(
  total +
    " findings with a line reference, from " +
    byCheck.filter((c) => c.ran).length +
    " of " +
    CHECKS.length +
    " checks.",
);
if (failed.length > 0) {
  log(
    "These checks returned nothing and did NOT run to completion: " +
      failed.join(", ") +
      ".",
  );
}

return {
  base: inv.base,
  changed_lines: inv.changed_lines,
  files: inv.files.map((f) => f.path),
  checks_failed: failed,
  total_findings: total,
  findings_by_check: byCheck,
};
