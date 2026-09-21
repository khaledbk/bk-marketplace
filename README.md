# bk-marketplace

The only approved plugin marketplace for BK Organization. Marketplace name: `bk`.

Managed settings on BK machines set `strictKnownMarketplaces` to this repository alone,
so no other marketplace — including Anthropic's official one — can be added or installed
from.

## Plugins

| Plugin | Category | Provides |
| --- | --- | --- |
| `bk-core` | Workflows | `/bk-core:code-review`, `/bk-core:repo-audit` and the two workflows behind them |
| `bk-java-ee` | Intelligence | Java EE / Jakarta EE conventions |
| `bk-typescript` | Intelligence | TypeScript conventions |
| `bk-python` | Intelligence | Python conventions |
| `bk-go` | Intelligence | Go conventions |
| `bk-ruby` | Intelligence | Ruby conventions |
| `bk-swift` | Intelligence | Swift conventions |
| `bk-java` | Intelligence | Modern Java conventions |

## bk-core

Each entry point is a **skill** that a named agent runs, backed by a **workflow** that does
the gathering. The workflow collects evidence in isolated contexts and returns raw findings;
the skill merges, ranks and delivers the verdict.

| Skill | Agent | Workflow | Tasks |
| --- | --- | --- | --- |
| `/bk-core:code-review` | `qa` | `bk-core:code-review-scan` | 1 inventory + 6 checks |
| `/bk-core:repo-audit` | `architect` | `bk-core:repo-audit-scan` | 1 inventory + 6 checks |

Both fan out to a constant seven tasks whatever the input size. Nothing is capped and
nothing is skipped; when the input is large enough that one context per check thins the
coverage, the run says so in its progress log instead of degrading quietly. A check that
fails is reported in `checks_failed` rather than passing as "no findings".

The workflows are named `*-scan` because a plugin's skills and workflows share one
namespace — `/bk-core:code-review` can only be one of them.

## Guild plugins

One skill each, `conventions`, invoked as `/bk-<language>:conventions`. They carry the house
rules for that language and nothing else: no tooling, no MCP servers, no hooks.

## Local development

    claude plugin marketplace add /path/to/bk-marketplace
    claude plugin install bk-core@bk
    # restart Claude Code

With `strictKnownMarketplaces` deployed, a local directory source is rejected unless the
allowlist also carries a matching `pathPattern` entry. Test before deploying that policy,
or add the pattern.

## Layout

    .claude-plugin/marketplace.json     marketplace "bk", pluginRoot ./plugins
    plugins/<plugin>/
      .claude-plugin/plugin.json
      skills/<skill>/SKILL.md
      workflows/<workflow>.js          bk-core only
