export const meta = {
  name: 'repo-audit-scan',
  description: 'Survey a whole repository across six checks and return raw findings; the caller judges them',
  phases: [
    { title: 'Inventory', detail: 'map the repository: languages, layout, entry points' },
    { title: 'Audit', detail: 'six checks over the repository, in parallel' },
  ],
}

// Seven tasks, each in its own context: 1 inventory + 6 checks. Constant, whatever the
// repository size. This workflow collects; it does not judge. Merging, ranking and the
// verdict belong to the caller, so raw findings are returned grouped by check.
const LARGE_REPO_FILES = 2000

const FINDINGS = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'line', 'severity', 'category', 'issue', 'suggested_fix'],
        properties: {
          file: { type: 'string' },
          line: { type: 'integer' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          category: { type: 'string' },
          issue: { type: 'string' },
          suggested_fix: { type: 'string' },
        },
      },
    },
  },
}

const INVENTORY = {
  type: 'object',
  required: ['root', 'file_count', 'languages'],
  properties: {
    root: { type: 'string' },
    file_count: { type: 'integer' },
    languages: { type: 'array', items: { type: 'string' } },
    entry_points: { type: 'array', items: { type: 'string' } },
    package_managers: { type: 'array', items: { type: 'string' } },
  },
}

const CHECKS = [
  {
    key: 'secrets',
    task:
      'Hunt for committed credentials: API keys, tokens, private keys, passwords, connection strings ' +
      'with embedded credentials, and .env files that are tracked rather than ignored. ' +
      'Check the .gitignore actually covers what it should. Report the file and line of each exposure. ' +
      'Do not reproduce the secret value itself in the finding — name the file, the line and the kind of secret.',
  },
  {
    key: 'dependencies',
    task:
      'Inspect every dependency manifest and lockfile. Report known CVEs affecting the pinned versions, ' +
      'dependencies on unmaintained or deprecated packages, licence incompatibilities, unpinned or floating ' +
      'ranges, and any lockfile that is missing or out of step with its manifest.',
  },
  {
    key: 'security',
    task:
      'Read the code for exploitable patterns: injection (SQL, command, template), unsafe deserialization, ' +
      'missing or wrong authorization checks, unsafe subprocess or eval use, path traversal, ' +
      'disabled TLS verification, and permissive CORS or authentication defaults.',
  },
  {
    key: 'structure',
    task:
      'Assess the architecture as it actually is. Report circular dependencies between modules, layers that ' +
      'reach past their boundary, God files, logic duplicated across modules, and dead code that is still shipped. ' +
      'Anchor each finding at a specific file and line.',
  },
  {
    key: 'tests',
    task:
      'Assess the test suite. Identify the framework and how tests are run. Report untested modules that carry ' +
      'real risk, tests that assert nothing, tests disabled or skipped without explanation, and missing coverage ' +
      'of error paths. Do not report a low coverage percentage as a finding on its own — name what is untested and why it matters.',
  },
  {
    key: 'ci-docs',
    task:
      'Assess CI configuration and documentation. Report pipelines that do not run the tests, missing lint or ' +
      'type checks, secrets referenced but never declared, jobs pinned to unmaintained actions or images, ' +
      'a README that does not say how to build or run the project, and setup instructions that contradict the code.',
  },
]

const scope = typeof args === 'string' && args.trim() !== '' ? args.trim() : ''
const scopeLine = scope
  ? 'Restrict the audit to the subdirectory "' + scope + '" and say so in every finding path.'
  : 'Audit the repository from its root.'

phase('Inventory')

const inv = await agent(
  'Map this repository before it is audited.\n' +
    scopeLine +
    '\nEstablish: the languages present, the number of tracked files (`git ls-files | wc -l`), the package ' +
    'managers and manifests in use, and the entry points — the files someone would read first to understand it.\n' +
    'Do not assess quality. Only describe what is there.',
  { label: 'inventory', schema: INVENTORY },
)

if (!inv) return { error: 'Inventory agent returned no result; nothing was audited.' }

log('Root ' + inv.root + ': ' + inv.file_count + ' tracked files, languages: ' + inv.languages.join(', ') + '.')

if (inv.file_count > LARGE_REPO_FILES) {
  log(
    'This repository exceeds ' + LARGE_REPO_FILES + ' tracked files. Each check surveys it in one context, ' +
      'so findings will be representative rather than exhaustive. Pass a subdirectory as args to audit a part of it in depth.',
  )
}

phase('Audit')

const results = await parallel(
  CHECKS.map((check) => () =>
    agent(
      'Audit this repository. ' + scopeLine + '\n' +
        'Languages present: ' + inv.languages.join(', ') + '. Tracked files: ' + inv.file_count + '.\n\n' +
        check.task +
        '\n\nEvery finding needs the exact file path, the exact line number, a concrete suggested fix, ' +
        'and a severity of critical, high, medium or low. Report nothing you cannot point at a line for. ' +
        'Prefer ten real findings over fifty speculative ones.',
      { label: check.key, schema: FINDINGS },
    ),
  ),
)

// Drop anything without a usable line reference here: deterministic, free, and guaranteed,
// unlike asking a model to do it. Everything else is returned untouched.
const byCheck = CHECKS.map((check, i) => {
  const r = results ? results[i] : null
  return {
    check: check.key,
    ran: Boolean(r),
    findings: r ? (r.findings || []).filter((f) => Number.isInteger(f.line) && f.line > 0) : [],
  }
})

const total = byCheck.reduce((n, c) => n + c.findings.length, 0)
const failed = byCheck.filter((c) => !c.ran).map((c) => c.check)

log(total + ' findings with a line reference, from ' + byCheck.filter((c) => c.ran).length + ' of ' + CHECKS.length + ' checks.')
if (failed.length > 0) {
  log('These checks returned nothing and did NOT run to completion: ' + failed.join(', ') + '.')
}

return {
  root: inv.root,
  languages: inv.languages,
  file_count: inv.file_count,
  entry_points: inv.entry_points || [],
  checks_failed: failed,
  total_findings: total,
  findings_by_check: byCheck,
}
