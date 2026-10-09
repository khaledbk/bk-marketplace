/**
 * A model family's mark: a head in the mascot's block style, wider for the
 * larger families, each in its own color.
 */
export type ModelMark = { family: string; label: string; head: string; color: string }

const FAMILIES: Record<string, { head: string; color: string }> = {
  haiku: { head: '▐▛▜▌', color: '#7fdbca' },
  sonnet: { head: '▐▛█▜▌', color: '#82aaff' },
  opus: { head: '▐▛███▜▌', color: '#d97757' },
  fable: { head: '▟▛███▜▙', color: '#c792ea' },
}

const UNKNOWN = { head: '▐▛·▜▌', color: '#808a96' }

export const EFFORT_COLORS: Record<string, string> = {
  low: '#5f8787',
  medium: '#5fd7ff',
  high: '#28fe14',
  xhigh: '#ffaf00',
  max: '#ff5f87',
}

/**
 * Reads a model as `/model` or the API names it (`claude-opus-5-5[1m]`,
 * `Opus 5.5`, `opus`) into its family's mark and a short label.
 */
export function markOf(model: string): ModelMark {
  const lower = model.toLowerCase()
  const family = Object.keys(FAMILIES).find(f => lower.includes(f))
  if (!family) return { family: '', label: model.replace(/^claude-/, '') || 'model', ...UNKNOWN }
  const version = new RegExp(`${family}[-_ ]?(\\d+)(?:[-.](\\d+))?`).exec(lower)
  const number = version ? (version[2] && version[2].length < 3 ? `${version[1]}.${version[2]}` : version[1]) : ''
  const name = family[0]!.toUpperCase() + family.slice(1)
  const wide = /\[1m\]|\b1m\b/.test(lower) ? ' 1M' : ''
  return { family, label: `${name}${number ? ` ${number}` : ''}${wide}`, ...FAMILIES[family]! }
}
