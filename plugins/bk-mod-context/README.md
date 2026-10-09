# bk-mod-context

A one-row context meter across the full width of the band above the prompt.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━●╸──────────────────────── 41%  412K/1M  ▐▛███▜▌ Opus 5.5 1M · high
```

| Part | Source | Behaviour |
| :-- | :-- | :-- |
| Fill | Tokens the last API response was answered over, after every main-loop model response and every `session.measure` | Real counts from the API, not an estimate; `--%` until the first response |
| Heat | Token position along the window | Green up to `greenUntil` (380K), then lime, yellow, orange, red at the full window; 40% of the window on windows under 2.5 times the threshold |
| Leading edge | Heat at the current fill | A three-cell bulb (Nerd Font half-circle caps around a hot core) that breathes, trailed by a halo of `▓▒░` shades in its own color; a light sweeps the bar each time it advances |
| Model mark | `$.session.model()` | One head per family: Haiku `▐▛▜▌` mint, Sonnet `▐▛█▜▌` blue, Opus `▐▛███▜▌` clay, Fable `▟▛███▜▙` violet |
| Effort | The effort each main-loop model request is sent with; before the first request, a config row naming effort, else `CLAUDE_EFFORT` | low grey-teal, medium cyan, high green, xhigh amber, max pink |

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
