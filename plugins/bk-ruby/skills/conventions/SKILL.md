---
name: conventions
description: Ruby house rules for BK Organization.
allowed-tools: Read, Grep, Glob
model: inherit
user-invocable: true
disable-model-invocation: false
license: LicenseRef-BK-Internal
compatibility: Any Ruby codebase.
metadata:
  owner: BK Organization
  guild: Ruby
  category: Intelligence
---

# Ruby conventions

House rules for Ruby at BK Organization. They describe what good looks like here; they
do not replace the judgement of the person applying them.

- Keep controllers thin. A controller that queries, decides and renders is three responsibilities in one place.
- Scope every ActiveRecord query you expose. An unscoped `find` on a user-supplied id is an authorization bug.
- Eager-load associations you will render. `includes` is the difference between one query and a thousand.
- Use metaprogramming only where the alternative is genuinely worse. `define_method` in a loop is a debugging session for whoever comes next.
- Prefer keyword arguments for anything with more than two parameters. Positional booleans are unreadable at the call site.
- Validations belong in the model and constraints belong in the database. Application-level uniqueness is a race, not a guarantee.

## Applying these

Match the surrounding code first. A file that consistently breaks one of these rules is
telling you something — either the rule does not fit this context, or the file is due a
refactor nobody has scheduled. Say which you think it is rather than silently converting
one file to a style the rest of the codebase does not share.
