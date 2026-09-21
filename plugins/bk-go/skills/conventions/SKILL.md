---
name: conventions
description: Go engineering conventions for BK Organization — the house rules for writing and reviewing Go code. Use when writing, reviewing or refactoring Go.
when_to_use: The work involves Go, a `.go` file, `go.mod`, or Go tooling.
allowed-tools: Read, Grep, Glob
model: inherit
user-invocable: true
disable-model-invocation: false
license: LicenseRef-BK-Internal
compatibility: Any Go codebase.
metadata:
  owner: BK Organization
  guild: Go
  category: Intelligence
---

# Go conventions

House rules for Go at BK Organization. They describe what good looks like here; they
do not replace the judgement of the person applying them.

- Handle every error where it happens. `_ = err` is a decision to ship a silent failure.
- Wrap errors with `fmt.Errorf("...: %w", err)` so the chain survives, and compare with `errors.Is` or `errors.As`.
- Accept interfaces, return structs. Define the interface where it is consumed, not where it is implemented.
- Every goroutine has an owner who knows how it exits. A goroutine with no exit path is a leak.
- Pass `context.Context` as the first parameter through anything that blocks, and honour cancellation.
- Guard shared state with a mutex or a channel, never both for the same data. Run the race detector in CI.

## Applying these

Match the surrounding code first. A file that consistently breaks one of these rules is
telling you something — either the rule does not fit this context, or the file is due a
refactor nobody has scheduled. Say which you think it is rather than silently converting
one file to a style the rest of the codebase does not share.
