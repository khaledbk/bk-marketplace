import type { ClientModule } from 'claude-code'

export type MeterProps = {
  tokens: number
  window: number
  isKnown: boolean
  greenUntil: number
  animation: 'full' | 'calm' | 'off'
  head: string
  headColor: string
  model: string
  effort: string
  effortColor: string
  text: string
  dim: string
  track: string
  columns: number
}

type Local = { phase: number; seen: number; advancedAt: number; ref: { stop?: () => void } }

const TICK_MS = { full: 90, calm: 260, off: 0 } as const
const BREATH_TICKS = 12
const FLAME = '#ffe066'
const CAP_LEFT = '\ue0b6'
const CAP_RIGHT = '\ue0b4'
const RING = [['◜', '◞'], ['◟', '◝']] as const
const RING_TICKS = 3
const SURGE_TICKS = 10

type Rgb = [number, number, number]

const rgbOf = (hex: string): Rgb => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) || 0) as Rgb
const hexOf = (c: Rgb) => `#${c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`

export function mix(a: string, b: string, t: number): string {
  const x = rgbOf(a)
  const y = rgbOf(b)
  return hexOf([0, 1, 2].map(i => x[i]! + (y[i]! - x[i]!) * t) as Rgb)
}

/**
 * The heat color at a token count: green up to `greenUntil`, then lime,
 * yellow, orange and red at the full window.
 */
export function heatAt(tokens: number, window: number, greenUntil: number): string {
  const w = Math.max(1, window)
  // A small window never reaches a fixed threshold, so it heats from 40% of itself.
  const g = w < greenUntil * 2.5 ? w * 0.4 : greenUntil
  const stops: [number, string][] = [
    [0, '#00ff00'],
    [g, '#7dff00'],
    [g + (w - g) / 3, '#ffd700'],
    [g + ((w - g) * 2) / 3, '#ff8c00'],
    [w, '#ff2a2a'],
  ]
  const t = Math.max(0, Math.min(w, tokens))
  for (let i = 1; i < stops.length; i++) {
    const [at, color] = stops[i]!
    const [from, base] = stops[i - 1]!
    if (t <= at) return mix(base, color, at === from ? 1 : (t - from) / (at - from))
  }
  return '#ff2a2a'
}

/**
 * Tokens as a short count: 950, 41.2K, 412K, 1M, 1.5M.
 */
export const tokensText = (n: number): string => {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`
  if (n >= 100_000) return `${Math.round(n / 1_000)}K`
  if (n >= 1_000) return `${+(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}

const Meter: ClientModule<MeterProps, Local> = (props, surface) => {
  const { Box, Text } = surface.elements
  const window = Math.max(1, props.window)
  const ratio = props.isKnown ? Math.max(0, Math.min(1, props.tokens / window)) : 0
  const percent = props.isKnown ? `${Math.round(ratio * 100)}%` : '--%'
  const heat = heatAt(props.tokens, window, props.greenUntil)
  const amount = `${props.isKnown ? tokensText(props.tokens) : '--'}/${tokensText(window)}`
  const label = `${props.model}${props.effort ? ` · ${props.effort}` : ''}`
  const rightWidth = 1 + percent.length + 2 + amount.length + 2 + [...props.head].length + 1 + [...label].length
  const columns = surface.columns || props.columns
  const bar = Math.max(8, columns - rightWidth - 1)
  // The ball keeps a ring cell on each side inside the two caps.
  const lead = Math.max(2, Math.min(bar - 3, Math.round(ratio * bar)))

  let state = surface.state
  if (state === undefined) {
    state = { phase: 0, seen: props.tokens, advancedAt: -1_000, ref: {} }
    surface.setState(state)
    const ms = TICK_MS[props.animation] ?? 0
    if (ms > 0) {
      state.ref.stop = surface.every(ms, () => {
        const cur = surface.state
        if (cur) surface.setState({ ...cur, phase: cur.phase + 1 })
      })
    }
  } else if (props.tokens !== state.seen) {
    state = { ...state, seen: props.tokens, advancedAt: props.tokens > state.seen ? state.phase : state.advancedAt }
    surface.setState(state)
  }

  const still = props.animation === 'off'
  const breath = still ? 0.5 : (1 + Math.sin((state.phase / BREATH_TICKS) * Math.PI * 2)) / 2
  // Two out-of-step waves make the ball flicker like a flame rather than blink.
  const flicker = still ? 0.5 : (2 + Math.sin(state.phase * 1.7) + Math.sin(state.phase * 2.9)) / 4
  // An advance swells the wave for a moment, then it settles back.
  const surge = still ? 0 : Math.max(0, 1 - (state.phase - state.advancedAt) / SURGE_TICKS)
  const wave = (i: number) => (still ? 0 : Math.sin(i * 0.45 - state.phase * 0.6) * (0.12 + 0.1 * surge))
  const ring = RING[Math.floor(state.phase / RING_TICKS) % 2]!

  const heatOf = (i: number) => heatAt(((i + 0.5) / bar) * window, window, props.greenUntil)
  const trackOf = (i: number) => mix(props.track, heatOf(i), 0.22)
  const filledOf = (i: number) => {
    const w = wave(i)
    return w >= 0 ? mix(heatOf(i), '#ffffff', w) : mix(heatOf(i), '#000000', -w)
  }
  const glow = mix(heat, '#ffffff', 0.35 + 0.3 * breath)

  const cells = []
  for (let i = 0; i < bar; i++) {
    const filled = i < lead
    if (i === 0) cells.push(<Text color={filled ? heatOf(0) : trackOf(0)}>{CAP_LEFT}</Text>)
    else if (i === bar - 1) cells.push(<Text color={trackOf(i)}>{CAP_RIGHT}</Text>)
    else if (i === lead) cells.push(<Text color={mix(heat, FLAME, 0.3 + 0.5 * flicker)} backgroundColor={heatOf(i)} bold>●</Text>)
    else if (i === lead - 1) cells.push(<Text color={glow} backgroundColor={heatOf(i)}>{ring[0]}</Text>)
    else if (i === lead + 1) cells.push(<Text color={glow} backgroundColor={trackOf(i)}>{ring[1]}</Text>)
    else cells.push(<Text color={filled ? filledOf(i) : trackOf(i)}>█</Text>)
  }

  // The labels never shrink; a width the surface reports a few cells off only trims the bar.
  return (
    <Box flexDirection="row" height={1} overflow="hidden">
      <Box flexGrow={1} flexShrink={1} overflow="hidden">
        <Text wrap="truncate-end">{cells}</Text>
      </Box>
      <Box flexShrink={0} flexDirection="row">
        <Text> </Text>
        <Text bold color={heat}>{percent}</Text>
        <Text color={props.dim}>{`  ${amount}  `}</Text>
        <Text color={props.headColor}>{props.head}</Text>
        <Text bold color={props.text}>{` ${props.model}`}</Text>
        {props.effort ? <Text color={props.dim}> · </Text> : null}
        {props.effort ? <Text bold color={props.effortColor}>{props.effort}</Text> : null}
      </Box>
    </Box>
  )
}

export default Meter
