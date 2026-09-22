---
name: repo-audit
description: Audit a whole repository for security, dependency and structural risk.
argument-hint: "[subdirectory, optional]"
context: fork
agent: architect
background: false
disallowed-tools: Write, Edit
effort: xhigh
user-invocable: true
disable-model-invocation: false
license: LicenseRef-BK-Internal
compatibility: Any repository.
metadata:
  owner: BK Organization
  category: Workflows
---

# Repository audit

The workflow surveys the repository in isolated contexts; you decide what it means.

## 1. Gather

Call the `Workflow` tool with `name: "bk-core:repo-audit-scan"`. Pass a subdirectory as
`args` to narrow the audit; omit it to cover the repository root.

Seven tasks run — one inventory, then six checks — returning:

    { root, languages, file_count, checks_failed, total_findings,
      findings_by_check: [ { check, ran, findings: [...] } ] }

Findings are `{file, line, severity, category, issue, suggested_fix}`.

## 2. Judge

- Merge duplicates across checks; keep the highest severity of each group.
- Separate what is **wrong** from what is merely **absent**, and say which absences matter.
- Rank by consequence, not by count. Ten style nits do not outrank one exposed credential.
- Name the single change that would most reduce risk.

## 3. Report

- Findings as a table: severity, `file:line`, category, issue, suggested fix.
- A short structural read of the repository: what it is, how it is laid out, where the risk
  concentrates. Use a Mermaid `flowchart TD` if the structure warrants one.
- Name any check in `checks_failed` — that dimension is unaudited.
- End with the one change you would make first.
