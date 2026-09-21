---
name: conventions
description: Java EE engineering conventions for BK Organization — the house rules for writing and reviewing Java EE code. Use when writing, reviewing or refactoring Java EE.
when_to_use: The work involves Jakarta EE, Java EE, CDI, JPA, JAX-RS, EJB, servlets, or an application server such as WildFly, Payara or WebSphere.
allowed-tools: Read, Grep, Glob
model: inherit
user-invocable: true
disable-model-invocation: false
license: LicenseRef-BK-Internal
compatibility: Any Java EE codebase.
metadata:
  owner: BK Organization
  guild: Java EE
  category: Intelligence
---

# Java EE conventions

House rules for Java EE at BK Organization. They describe what good looks like here; they
do not replace the judgement of the person applying them.

- Prefer CDI constructor injection over field injection — it makes the dependency graph testable without a container.
- Keep JPA entities free of business logic. A managed entity that calls a service is a transaction boundary you cannot see.
- Set the fetch strategy explicitly. `LAZY` by default; an `EAGER` collection is an N+1 query waiting for production data.
- Declare transaction boundaries at the service layer, never in a JAX-RS resource. Resources translate HTTP, nothing more.
- Return DTOs from JAX-RS, never entities — serializing a managed entity leaks the schema and triggers lazy loads outside the transaction.
- Treat `@ApplicationScoped` beans as shared mutable state. They are singletons; anything stored on them must be thread-safe.

## Applying these

Match the surrounding code first. A file that consistently breaks one of these rules is
telling you something — either the rule does not fit this context, or the file is due a
refactor nobody has scheduled. Say which you think it is rather than silently converting
one file to a style the rest of the codebase does not share.
