# bk-mod-filetree: BK fork

Forked from [`data-goblin/claude-code-filetree`](https://github.com/data-goblin/claude-code-filetree) at commit `da1da65724c54541f4a0ec5ddd26641b1a0d672a` (upstream version 0.2.24), MIT licensed; the upstream `LICENSE` is kept. BK Organization maintains this copy; upstream changes are pulled in deliberately, never automatically.

Install from the BK marketplace:

```
/plugin install bk-mod-filetree@bk
```

## Changes from upstream

| Area | Upstream | This fork |
| :-- | :-- | :-- |
| Plugin name | `filetree` | `bk-mod-filetree`; `$.state` keys renamed with it. `/filetree` and the pane id are unchanged. |
| Opening files on macOS | `open -- <path>` for any file | Launchable types (`.command`, `.terminal`, `.webloc`, `.fileloc`, `.app`, `.pkg`, `.scpt` and similar) and files with the execute bit are revealed in Finder with `open -R` instead. A hostile repo cannot run code through a double-click. |
| Selected file in prompt context | Raw path appended to every prompt | Path JSON-quoted, refused when it holds control characters or exceeds 1,024 characters. A crafted file name cannot inject instructions. |
| Change marker on macOS | `touch`/`rm -f` in `$TMPDIR`, falling back to `/tmp` | `$TMPDIR` only, with `--` before paths. No shared `/tmp` fallback. |
| `HERDR_BIN_PATH` | Any binary named by the variable | Only an absolute path ending in `/herdr`; otherwise `herdr` from `PATH`. |
| Long names | Cut at the end, hiding the extension | Cut in the middle, extension kept visible. |
| Palette | Blue-grey | New `palette` option, default `bk-green`: `#28fe14` text, `#00ff00` accent, `#1f8f14` muted, `#0b4f0b` selection, terminal-black background. Git status and activity colours unchanged. |
| Icon colors | Folders in the accent color, files muted, both overridden by git status | Each icon takes a color per file type and per well-known folder name (`src`, `tests`, `docs`, `.git` ...), in Material Design hues picked to match the MIT-licensed [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme) by eye, not extracted from its files; blue-grey otherwise. Ignored files stay muted. File names, git colors and the activity shimmer are unchanged. |

## Pulling an upstream release

1. Clone `data-goblin/claude-code-filetree` at the new tag into an empty scratch directory; do not run its scripts.
2. Diff it against the upstream commit above and re-apply each change in the table.
3. Re-verify any changed vendored file against its npm tarball.
4. Run `claude plugin validate`, `claude plugin test` and a type-check, then bump the version here and in `.claude-plugin/marketplace.json`.
