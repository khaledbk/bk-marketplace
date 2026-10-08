# bk-mod-prismantis: BK fork

Forked from [`NahumLitvin/prismantis`](https://github.com/NahumLitvin/prismantis) at commit `9900aaa3aeb31ac728639f692a38354ce89949da` (upstream version 0.12.0), MIT licensed; the upstream `LICENSE` is kept. BK Organization maintains this copy; upstream changes are pulled in deliberately, never automatically.

Install from the BK marketplace:

```
/plugin install bk-mod-prismantis@bk
```

## Changes from upstream

| Area | Upstream | This fork |
| :-- | :-- | :-- |
| Plugin name | `prismantis` | `bk-mod-prismantis`; the `$.prismantis` noun, the `prismantis.markdown` event and `/prismantis` are unchanged. |
| Frames | Prompt bubble, shell output, alerts and H1 banners hug their text | New `fullWidth` option, default on: they span the available width. |
| Tables and diagrams | Left-aligned | New `centerFigures` option, default on: tables and Mermaid figures are centered. Right-to-left content keeps its alignment. |
| Pressable links | Any scheme (`file:`, `vscode:`, custom app schemes) | `http` and `https` only; other links render as text. |
| Copy buttons | Raw source copied | Bidi overrides, isolates and invisible spaces stripped before copying, so a pasted command matches what was shown. The engine already refuses drawn text with control characters. |
| Prompt hint | Asked for "one small diagram" and "skip diagrams for simple answers" | Asks for a table, diagram or chart whenever a reply carries a structure, flow or series, and defers to the active output style. |
| Vendored code | prismjs 1.30.0, beautiful-mermaid 1.1.3 | Unchanged. Rebuilt from the npm tarballs (hashes match `scripts/package-lock.json`): `mermaid-text.js` byte-identical, `prism.js` identical apart from esbuild module names. |
| Upstream dev files | `.claude/` agent config and skills | Removed: project instructions from an outside author do not ship here. |

## Pulling an upstream release

1. Clone `NahumLitvin/prismantis` at the new tag into an empty scratch directory; do not run its scripts.
2. Diff it against the upstream commit above and re-apply each change in the table.
3. Re-verify any changed vendored file against its npm tarball.
4. Run `claude plugin validate`, `claude plugin test` and a type-check, then bump the version here and in `.claude-plugin/marketplace.json`.
