---
name: conventions
description: TypeScript engineering conventions for BK Organization — the house rules for writing and reviewing TypeScript code. Use when writing, reviewing or refactoring TypeScript.
when_to_use: The work involves TypeScript, a `.ts` or `.tsx` file, a `tsconfig.json`, or Node and npm tooling.
allowed-tools: Read, Grep, Glob
model: inherit
user-invocable: true
disable-model-invocation: false
license: LicenseRef-BK-Internal
compatibility: Any TypeScript codebase.
metadata:
  owner: BK Organization
  guild: TypeScript
  category: Intelligence
---

# TypeScript conventions

House rules for TypeScript at BK Organization. They describe what good looks like here; they
do not replace the judgement of the person applying them.

- Make illegal states unrepresentable. A discriminated union beats an object with four optional fields and a comment.
- `unknown` at every boundary, never `any`. Parse and narrow at the edge; the interior should not defend itself.
- No `as` to silence the compiler. A cast is a claim you are right and the type system is wrong — it is usually the other way round.
- `strict` on, including `noUncheckedIndexedAccess`. Array indexing returning `T` rather than `T | undefined` is a lie.
- Every `await` sits inside something that handles rejection. A floating promise is a crash with no stack trace.
- Export types from module boundaries, not implementation. A consumer importing an internal type is coupling you will pay for later.

## Applying these

Match the surrounding code first. A file that consistently breaks one of these rules is
telling you something — either the rule does not fit this context, or the file is due a
refactor nobody has scheduled. Say which you think it is rather than silently converting
one file to a style the rest of the codebase does not share.
