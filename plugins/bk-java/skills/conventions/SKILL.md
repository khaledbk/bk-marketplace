---
name: conventions
description: Java engineering conventions for BK Organization — the house rules for writing and reviewing Java code. Use when writing, reviewing or refactoring Java.
when_to_use: The work involves modern Java, a `.java` file, Maven or Gradle, Spring, or the JVM.
allowed-tools: Read, Grep, Glob
model: inherit
user-invocable: true
disable-model-invocation: false
license: LicenseRef-BK-Internal
compatibility: Any Java codebase.
metadata:
  owner: BK Organization
  guild: Java
  category: Intelligence
---

# Java conventions

House rules for Java at BK Organization. They describe what good looks like here; they
do not replace the judgement of the person applying them.

- Use records for data carriers. A class with six fields, a constructor, getters and `equals` is a record written longhand.
- Return `Optional` from lookups that can miss; never return `null` from a public API and never accept `Optional` as a parameter.
- Prefer sealed interfaces with pattern matching over visitor hierarchies — the compiler checks exhaustiveness for you.
- Use try-with-resources for anything closeable. A `finally` block that closes is a leak the first time it throws.
- Streams for transformation, loops for side effects. A `forEach` that mutates external state is a loop wearing a costume.
- Immutable by default: `final` fields, defensive copies at the boundary, no setters unless the type is genuinely mutable.

## Applying these

Match the surrounding code first. A file that consistently breaks one of these rules is
telling you something — either the rule does not fit this context, or the file is due a
refactor nobody has scheduled. Say which you think it is rather than silently converting
one file to a style the rest of the codebase does not share.
