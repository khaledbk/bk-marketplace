# bk-mod-context

A one-row context meter across the full width of the band above the prompt.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━●╸─────────────────────── 41%  412K/1M  ▐▛███▜▌ Opus 5.5 1M · high
```

| Part | Source | Behaviour |
| :-- | :-- | :-- |
| Fill | Tokens the last API response was answered over, after every main-loop model response and every `session.measure` | Real counts from the API, not an estimate; `--%` until the first response |
| Heat | Token position along the window | Green up to `greenUntil` (380K), then lime, yellow, orange, red at the full window; 40% of the window on windows under 2.5 times the threshold |
| Leading edge | Heat at the current fill | A rounded left cap and a square core that flickers between the heat color and flame yellow, running straight into a four-cell `▓▓▒░` pulse whose brightness licks forward while its width stays fixed. Behind the cap, three embers glow dimmer on the thin bar line; each advance stretches them into `╍` sparks back to where the ball was, which catch up at two cells a frame |
| Model mark | `$.session.model()` | One head per family: Haiku `▐▛▜▌` mint, Sonnet `▐▛█▜▌` blue, Opus `▐▛███▜▌` clay, Fable `▟▛███▜▙` violet |
| Effort | The `effort.level` Claude Code stamps on the main thread's `Stop` and `PostToolUse` hook input; a model request's own effort or a config row naming effort when present |

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
