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
  expect((await ui.findAll({ type: 'Box' })).filter(b => b.props.width !== undefined)).toEqual([])
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

test('the effort comes from the live request and survives a measurement that cannot name it', async ($, on) => {
  world(on, { tokens: 10_000, window: 1_000_000, percent: 1 }, 'claude-opus-5-5', '')
  on('turn.step', async function* () {
    return { turnId: 't', index: 0, answer: '', toolUses: [], stopReason: 'end_turn', usage: { model: 'claude-opus-5-5', input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 20_000, cache_creation_input_tokens: 0 } } as any
  } as any)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(band())
  const step = $.turn.step({ turnId: 't', index: 0, model: 'claude-opus-5-5', effort: 'xhigh', messageCount: 1 } as any) as any
  for await (const _ of step) void _
  await step.result
  await $.session.measure({ context: { tokens: 20_002, window: 1_000_000, percent: 2 }, rateLimits: [], changed: ['context'] } as any)
  const drawn = JSON.stringify(await ui.drawn({ in: 'meter' }))
  expect(drawn).toContain('xhigh')
  expect(drawn).toContain('20K/1M')
  await ui.unmount()
})

const barCells = async (ui: any) => {
  const meter = (await ui.drawn({ in: 'meter' })) as any
  return meter.children[0].children[0].children.map((c: any) => ({ ch: c.children[0] as string, color: c.props.color as string, bg: c.props.backgroundColor as string | undefined }))
}

for (const tokens of [0, 500_000, 1_000_000]) {
  test(`the bar is a square full-height block with no ball at ${tokens} tokens`, async ($, on) => {
    world(on, { tokens, window: 1_000_000, percent: tokens / 10_000 })
    await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true } as any)
    const ui = await $.ui.mount(band())
    const cells = await barCells(ui)
    expect(cells.length).toBeGreaterThan(8)
    expect(cells.every((c: any) => c.ch === '█' && c.bg === undefined)).toBe(true)
    await ui.unmount()
  })
}

test('the fill carries the heat and the unreached track is a faint tint of it', async ($, on) => {
  world(on, { tokens: 500_000, window: 1_000_000, percent: 50 })
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(band())
  const cells = await barCells(ui)
  const half = Math.round(cells.length / 2)
  const brightness = (hex: string) => [1, 3, 5].reduce((sum, i) => sum + parseInt(hex.slice(i, i + 2), 16), 0)
  expect(brightness(cells[half - 2].color)).toBeGreaterThan(brightness(cells[half + 2].color) * 2)
  await ui.unmount()
})

test('the effort comes from the hook input Claude Code stamps on Stop', async ($, on) => {
  world(on, { tokens: 10_000, window: 1_000_000, percent: 1 }, 'claude-opus-5-5', '')
  on('classic.Stop', () => ({}) as any)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(band())
  await $.classic.Stop({ effort: { level: 'high' } } as any)
  expect(JSON.stringify(await ui.drawn({ in: 'meter' }))).toContain('high')
  await ui.unmount()
})

test('the labels keep their width and the bar takes what is left', async ($, on) => {
  world(on, { tokens: 435_000, window: 1_000_000, percent: 44 }, 'claude-opus-5-5', 'high')
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(band())
  const meter = (await ui.drawn({ in: 'meter' })) as any
  expect(meter.children[0].props.flexGrow).toBe(1)
  expect(meter.children[0].children[0].props.wrap).toBe('truncate-end')
  expect(meter.children[1].props.flexShrink).toBe(0)
  expect(meter.children[1].children).toHaveLength(1)
  expect(meter.children[1].children[0].props.wrap).toBe('truncate-end')
  expect(JSON.stringify(meter.children[1])).toContain('high')
  await ui.unmount()
})


test('a model request with an empty effort keeps the label it had', async ($, on) => {
  world(on, { tokens: 10_000, window: 1_000_000, percent: 1 }, 'claude-opus-5-5', 'high')
  on('turn.step', async function* () {
    return { turnId: 't', index: 0, answer: '', toolUses: [], stopReason: 'end_turn', usage: { model: 'claude-opus-5-5', input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } } as any
  } as any)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(band())
  for (const effort of ['', null]) {
    const step = $.turn.step({ turnId: 't', index: 0, model: 'claude-opus-5-5', effort, messageCount: 1 } as any) as any
    for await (const _ of step) void _
    await step.result
  }
  const drawn = JSON.stringify(await ui.drawn({ in: 'meter' }))
  expect(drawn).toContain('high')
  expect(drawn).not.toContain('null')
  await ui.unmount()
})

test('before any request the effort comes from the managed settings file', async ($, on) => {
  world(on, { tokens: 10_000, window: 1_000_000, percent: 1 }, 'claude-opus-5-5', '')
  on('env.get', (_$, e: any) => ({ value: e.name === 'HOME' ? '/Users/k' : undefined }) as any)
  on('fs.read', (_$, e: any) => {
    if (e.path === '/Library/Application Support/ClaudeCode/managed-settings.json') return { value: JSON.stringify({ effortLevel: 'xhigh' }) } as any
    throw new Error('ENOENT')
  })
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(band())
  expect(JSON.stringify(await ui.drawn({ in: 'meter' }))).toContain('xhigh')
  await ui.unmount()
})

test('a model switch redraws the model and the window before the next prompt', async ($, on) => {
  let model = 'claude-opus-5-5[1m]'
  let window = 1_000_000
  on('session.start', (_$, e) => ({ cwd: e.cwd }) as any)
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine band</Text>
  })
  on('session.model', () => ({ value: model }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { tokens: 40_000, window, percent: 4 }, rateLimits: [] } }) as any)
  on('config.list', () => ({ value: [{ key: 'effortLevel', label: 'Effort', kind: 'choice', value: 'high' }] }) as any)
  on('classic.PostModelSwitch', () => ({}) as any)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true } as any)
  const ui = await $.ui.mount(band())
  expect(JSON.stringify(await ui.drawn({ in: 'meter' }))).toContain('Opus 5.5 1M')
  model = 'claude-sonnet-5-5'
  window = 200_000
  await $.classic.PostModelSwitch({ from_model: 'claude-opus-5-5[1m]', to_model: model, requested_model: 'sonnet', source: 'command' } as any)
  const drawn = JSON.stringify(await ui.drawn({ in: 'meter' }))
  expect(drawn).toContain('Sonnet 5.5')
  expect(drawn).toContain('40K/200K')
  expect(drawn).not.toContain('Opus')
  await ui.unmount()
})
