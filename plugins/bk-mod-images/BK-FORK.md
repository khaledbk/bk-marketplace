# bk-mod-images: BK fork

Forked from [`adamNewell/claude-mod-images`](https://github.com/adamNewell/claude-mod-images) at commit `20517c3c8e1aefb4e0457fa4c6b6a810d6a8dfb2` (upstream version 0.1.0), MIT licensed; the upstream `LICENSE` is kept. BK Organization maintains this copy; upstream changes are pulled in deliberately, never automatically.

Install from the BK marketplace:

```
/plugin install bk-mod-images@bk
```

## Changes from upstream

| Area | Upstream | This fork |
| :-- | :-- | :-- |
| Plugin name | `images` | `bk-mod-images`; `$.state` keys renamed with it. `/images` is unchanged. |
| Decode bounds | Only output size capped, after a full synchronous decode | PNG IHDR and GIF header checked before decoding: above 16 MP the picture is refused with a caption. Encoded input above 20 MiB is refused unread. JPEG decoder capped at 16 MP and 128 MB. One small hostile image can no longer hang or crash the TUI. |
| Non-kitty terminals | Reserved the picture's full box of empty rows under the alt text | Detects kitty graphics (`KITTY_WINDOW_ID`, a kitty or Ghostty `TERM`/`TERM_PROGRAM`); elsewhere draws the caption alone. |
| Vendored decoders | fast-png 8.0.0, jpeg-js 0.4.4, omggif 1.0.10 | Unchanged. Verified statement-for-statement against the npm tarballs, whose integrity hashes match the upstream `bun.lock`. |

## Pulling an upstream release

1. Clone `adamNewell/claude-mod-images` at the new tag into an empty scratch directory; do not run its scripts.
2. Diff it against the upstream commit above and re-apply each change in the table.
3. Re-verify any changed vendored file against its npm tarball.
4. Run `claude plugin validate`, `claude plugin test` and a type-check, then bump the version here and in `.claude-plugin/marketplace.json`.
