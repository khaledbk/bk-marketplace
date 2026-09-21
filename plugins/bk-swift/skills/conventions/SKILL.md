---
name: conventions
description: Swift engineering conventions for BK Organization — the house rules for writing and reviewing Swift code. Use when writing, reviewing or refactoring Swift.
when_to_use: The work involves Swift, a `.swift` file, SwiftUI, UIKit, or an Xcode project.
allowed-tools: Read, Grep, Glob
model: inherit
user-invocable: true
disable-model-invocation: false
license: LicenseRef-BK-Internal
compatibility: Any Swift codebase.
metadata:
  owner: BK Organization
  guild: Swift
  category: Intelligence
---

# Swift conventions

House rules for Swift at BK Organization. They describe what good looks like here; they
do not replace the judgement of the person applying them.

- Never force-unwrap outside a test. `!` is a crash you chose to ship; use `guard let` and fail meaningfully.
- Prefer value types. Reference semantics for model data turn into shared mutable state across views.
- Mark UI-touching code `@MainActor` and let the compiler enforce it, rather than dispatching to the main queue by hand.
- Adopt structured concurrency. `async let` and task groups give cancellation and error propagation that detached tasks do not.
- Break retain cycles explicitly with `[weak self]` in escaping closures that outlive their owner.
- Model absence with optionals and failure with `throws`. Sentinel values such as `-1` or empty string leak into logic.

## Applying these

Match the surrounding code first. A file that consistently breaks one of these rules is
telling you something — either the rule does not fit this context, or the file is due a
refactor nobody has scheduled. Say which you think it is rather than silently converting
one file to a style the rest of the codebase does not share.
