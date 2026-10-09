import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionContextUsage } from 'claude-code'

import type { ContextFill, ModelSetting } from '../types'
import { EFFORT_COLORS, markOf } from './look'
import type { MeterProps } from './meter'

const FILL = atom({ plugin: 'bk-mod-context', key: 'fill' } as const, { tokens: 0, window: 200_000, isKnown: false })
const SETTING = atom({ plugin: 'bk-mod-context', key: 'setting' } as const, { model: '', effort: '' })

// The Homebrew terminal profile: green on black, with no background so the band stays transparent.
const TEXT = '#28fe14'
const DIM = '#1f8f14'
const TRACK = '#173d17'

const fillOf = (context: SessionContextUsage): ContextFill => ({
  tokens: context.tokens ?? 0,
  window: context.window,
  isKnown: typeof context.tokens === 'number',
})

async function effortOf($: EngineInterface): Promise<string> {
  try {
    const row = (await $.config.list()).find(r => /effort/i.test(r.key))
    if (typeof row?.value === 'string' && row.value) return row.value
  } catch {
    // A host without a config menu still has the variable the engine exports.
  }
  return (await $.env.get('CLAUDE_EFFORT')) ?? ''
}

async function measure($: EngineInterface, context?: SessionContextUsage): Promise<void> {
  const fill = fillOf(context ?? (await $.session.usage()).context)
  await update($, FILL, () => fill)
  const setting: ModelSetting = { model: await $.session.model(), effort: await effortOf($) }
  await update($, SETTING, () => setting)
}

export const register: Register = (on, options) => {
  const greenUntil = typeof options.greenUntil === 'number' && options.greenUntil > 0 ? options.greenUntil : 380_000
  const animation = options.animation === 'calm' || options.animation === 'off' ? options.animation : 'full'

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await measure($).catch(() => undefined)
    return started
  })

  on('session.measure', async ($, e, next) => {
    await measure($, e.context).catch(() => undefined)
    return next(e)
  })

  // Moves the bar after every model response of the main loop, not only when the turn ends.
  on('turn.step', async function* ($, e, next) {
    const response = yield* next(e)
    if (!e.agentId && response.usage) {
      const used = response.usage.input_tokens + response.usage.cache_read_input_tokens + response.usage.cache_creation_input_tokens + response.usage.output_tokens
      await update($, FILL, fill => ({ ...fill, tokens: used, isKnown: true }))
    }
    return response
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const rest = await next(e)
    if (e.props.hasSurvey || (e.surface !== 'terminal' && e.surface !== 'desktop')) return rest
    const fill = await read($, FILL)
    const setting = await read($, SETTING)
    const mark = markOf(setting.model)
    const props: MeterProps = {
      ...fill,
      greenUntil,
      animation,
      head: mark.head,
      headColor: mark.color,
      model: mark.label,
      effort: setting.effort,
      effortColor: EFFORT_COLORS[setting.effort] ?? DIM,
      text: TEXT,
      dim: DIM,
      track: TRACK,
      columns: e.props.bodyColumns,
    }
    const { Box, Client } = $.ui.resolve(e)
    return (
      // The engine refuses its own band node under a sized Box, so only the meter carries the width.
      <Box flexDirection="column">
        <Client key="meter" module="./meter.tsx" props={props} width={e.props.bodyColumns} height={1} />
        {rest ?? null}
      </Box>
    )
  })
}
