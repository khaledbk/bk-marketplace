import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { markOf } from '../hooks/look'
import { heatAt, tokensText } from '../hooks/meter'

const world = (on: On, context: { tokens?: number; window: number; percent?: number }, model = 'claude-opus-5-5[1m]', effort = 'high') => {
  on('session.start', (_$, e) => ({ cwd: e.cwd }) as any)
  on('session.measure', (_$, e) => ({ changed: e.changed }) as any)
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine band</Text>
  })
  on('session.usage', () => ({ value: { startedAt: 0, context, rateLimits: [] } }) as any)
  on('session.model', () => ({ value: model }))
  on('config.list', () => ({ value: [{ key: 'effortLevel', label: 'Effort', kind: 'choice', value: effort }] }) as any)
}

const band = (hasSurvey = false) =>
  ({
    plugin: 'bk-mod-context',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey, isWorking: false, maxRows: 10, bodyColumns: 100, scroll: { offset: 0, bodyRows: 10 } },
  }) as any

test('heat stays green to the threshold, then runs through yellow and orange to red', () => {
  expect(heatAt(0, 1_000_000, 380_000)).toBe('#00ff00')
  expect(heatAt(380_000, 1_000_000, 380_000)).toBe('#7dff00')
  expect(heatAt(1_000_000, 1_000_000, 380_000)).toBe('#ff2a2a')
  const reds = [0, 200_000, 380_000, 500_000, 700_000, 900_000].map(t => parseInt(heatAt(t, 1_000_000, 380_000).slice(1, 3), 16))
  expect(reds).toEqual([...reds].sort((a, b) => a - b))
})

test('a 200K window heats from 40% of itself, not from a threshold it never reaches', () => {
  expect(heatAt(80_000, 200_000, 380_000)).toBe('#7dff00')
  expect(heatAt(200_000, 200_000, 380_000)).toBe('#ff2a2a')
})

test('each family has its own head and color, and the label reads as /model does', () => {
  const marks = ['claude-haiku-4-5-20251001', 'claude-sonnet-5-5', 'claude-opus-5-5[1m]', 'claude-fable-5-1'].map(markOf)
  expect(marks.map(m => m.label)).toEqual(['Haiku 4.5', 'Sonnet 5.5', 'Opus 5.5 1M', 'Fable 5.1'])
  expect(new Set(marks.map(m => m.head)).size).toBe(4)
  expect(new Set(marks.map(m => m.color)).size).toBe(4)
  expect(markOf('opus').label).toBe('Opus')
  expect(markOf('some-other-model').family).toBe('')
})

test('token counts read short', () => {
  expect([950, 41_234, 412_345, 1_000_000, 1_500_000].map(tokensText)).toEqual(['950', '41.2K', '412K', '1M', '1.5M'])
})

test('the band draws the fill, the model and the effort across the full width', async ($, on) => {
  world(on, { tokens: 412_000, window: 1_000_000, percent: 41 })
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(band())
  const client = await ui.find({ type: 'Client' })
  expect(client?.props.width).toBe(100)
  expect(await ui.find({ type: 'Text', text: 'engine band' })).toBeDefined()
  const drawn = JSON.stringify(await ui.drawn({ in: 'meter' }))
  for (const word of ['41%', '412K/1M', '▐▛███▜▌', 'Opus 5.5 1M', 'high']) expect(drawn).toContain(word)
  await ui.unmount()
})

test('a measurement moves the bar', async ($, on) => {
  world(on, { window: 1_000_000 })
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(band())
  expect(JSON.stringify(await ui.drawn({ in: 'meter' }))).toContain('--%')
  await $.session.measure({ context: { tokens: 700_000, window: 1_000_000, percent: 70 }, rateLimits: [], changed: ['context'] } as any)
  expect(JSON.stringify(await ui.drawn({ in: 'meter' }))).toContain('70%')
  await ui.unmount()
})

test('a survey keeps the band to itself', async ($, on) => {
  world(on, { tokens: 1_000, window: 200_000, percent: 1 })
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(band(true))
  expect(await ui.find({ type: 'Client' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: 'engine band' })).toBeDefined()
  await ui.unmount()
})
