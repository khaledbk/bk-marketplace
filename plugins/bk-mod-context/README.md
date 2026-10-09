# bk-mod-context

A one-row context meter across the full width of the band above the prompt.

```
███████████████████████████████████████████████████ 41%  412K/1M  ▐▛███▜▌ Opus 5.5 1M · high
```

| Part | Source | Behaviour |
| :-- | :-- | :-- |
| Fill | Tokens the last API response was answered over, after every main-loop model response and every `session.measure` | Real counts from the API, not an estimate; `--%` until the first response |
| Heat | Token position along the window | Green up to `greenUntil` (380K), then lime, yellow, orange, red at the full window; 40% of the window on windows under 2.5 times the threshold |
| Bar | Heat along the window | A full-height block with square ends: the filled part carries the heat gradient with a light wave flowing toward its edge, and an advance swells the wave for ten frames; the unreached track is a faint 12% tint of the same gradient |
| Model mark | `$.session.model()` at session start; then the `to_model` of each `PostModelSwitch` (`/model`, the picker) and the model each main-loop request names | One head per family: Haiku `▐▛▜▌` mint, Sonnet `▐▛█▜▌` blue, Opus `▐▛███▜▌` clay, Fable `▟▛███▜▙` violet |
| Effort | The `effort.level` Claude Code stamps on the main thread's `Stop` and `PostToolUse` hook input; a model request's own effort or a config row naming effort when present; at session start, `effortLevel` from the managed settings file, then `~/.claude/settings.json` |

No background color is drawn, so the band stays transparent over the terminal theme. The animation runs in a client-side surface module on the frame clock, so it costs no hook calls.

## Options

| Option | Default | Values |
| :-- | :-- | :-- |
| `greenUntil` | `380000` | Tokens that stay green |
| `animation` | `full` | `full` (90 ms frames), `calm` (260 ms), `off` |

## Install

```
/plugin install bk-mod-context@bk
```
