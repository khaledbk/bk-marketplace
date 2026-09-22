---
name: conventions
description: Python house rules for BK Organization.
allowed-tools: Read, Grep, Glob
model: inherit
user-invocable: true
disable-model-invocation: false
license: LicenseRef-BK-Internal
compatibility: Any Python codebase.
metadata:
  owner: BK Organization
  guild: Python
  category: Intelligence
---

# Python conventions

House rules for Python at BK Organization. They describe what good looks like here; they
do not replace the judgement of the person applying them.

- Type annotations on every public function, checked with mypy or pyright. Untyped Python is a refactor you cannot do.
- Never use a mutable default argument. `def f(x=[])` shares one list across every call for the life of the process.
- Catch the specific exception. A bare `except:` swallows `KeyboardInterrupt` and `SystemExit` along with the bug.
- Context managers for anything with a lifetime — files, locks, connections, transactions. `try/finally` by hand gets forgotten.
- Do not mix `async def` with blocking calls. One synchronous `requests.get` stalls the whole event loop.
- Pin dependencies in a lockfile. An unpinned range means the build is reproducible only until someone else publishes.

## Applying these

Match the surrounding code first. A file that consistently breaks one of these rules is
telling you something — either the rule does not fit this context, or the file is due a
refactor nobody has scheduled. Say which you think it is rather than silently converting
one file to a style the rest of the codebase does not share.
