---
name: code-review
description: Review a diff, branch or PR for bugs, security and quality issues.
argument-hint: "[git ref, optional]"
context: fork
agent: qa
background: false
disallowed-tools: Write, Edit
effort: high
user-invocable: true
disable-model-invocation: false
license: LicenseRef-BK-Internal
compatibility: Git repositories.
metadata:
  owner: BK Organization
  category: Workflows
---

# Code review

You are the only reviewer. The workflow gathers evidence in isolated contexts; you judge it.
Do not inspect the diff yourself before running it.

## 1. Gather

Call the `Workflow` tool with `name: "bk-core:code-review-scan"`. Pass the git ref as `args`
if one was given; otherwise omit `args` and the workflow resolves the merge base with the
default branch itself.

Seven tasks run — one inventory, then six checks — returning:

    { base, changed_lines, files, checks_failed, total_findings,
      findings_by_check: [ { check, ran, findings: [...] } ] }

Findings are `{file, line, severity, category, issue, suggested_fix}`, already stripped of
anything lacking a line reference.

## 2. Merge

The six checks overlap and none saw the others' output:

- Merge findings describing the same defect at the same file and line. Keep the clearest
  issue text, the most specific fix, and the highest severity of the group.
- Drop anything you cannot tie to a concrete failure — an input or state, and the wrong
  output or crash that follows.
- Rank critical, high, medium, low.
- Invent nothing. Every finding must trace to one the workflow returned.

## 3. Report

- A table: severity, `file:line`, category, issue, suggested fix.
- Say plainly if `checks_failed` is non-empty — that dimension was **not** reviewed.
- Say plainly if `changed_lines` is large; coverage thins on a big diff.
- End with the verdict: merge, or fix first and which fixes block.
