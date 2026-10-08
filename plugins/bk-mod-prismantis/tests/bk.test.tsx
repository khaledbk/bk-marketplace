import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

const reply = (text: string, columns = 120) => ({
  plugin: 'bk-mod-prismantis',
  component: 'AssistantMessage' as const,
  props: { text, isFirstOfReply: true },
  viewport: { columns, rows: 40 },
  surface: 'terminal' as const,
})

const stubClipboard = (on: On) => {
  const copied: string[] = []
  on('ui.copy', (_, e) => {
    copied.push(e.text)
    return { value: { isCopied: true as const } }
  })
  return copied
}

const TABLE = '| a | b |\n|---|---|\n| 1 | 2 |'

test('tables sit centered by default', async $ => {
  const centered = await $.ui.mount(reply(TABLE))
  expect((await centered.findAll({ type: 'Box' })).some(b => b.props.justifyContent === 'center')).toBe(true)
  await centered.unmount()
})

test('centerFigures off keeps tables on the left', { options: { centerFigures: false } }, async $ => {
  const ui = await $.ui.mount(reply(TABLE))
  expect((await ui.findAll({ type: 'Box' })).some(b => b.props.justifyContent === 'center')).toBe(false)
  await ui.unmount()
})

test('a prompt bubble and an alert span the width by default', async $ => {
  const prompt = await $.ui.mount({ plugin: 'bk-mod-prismantis', component: 'UserMessage', props: { text: 'hi', origin: { kind: 'composer' } } as any, viewport: { columns: 100, rows: 20 }, surface: 'terminal' })
  const bubble = (await prompt.findAll({ type: 'Box' })).find(b => b.props.borderStyle === 'round')
  expect(bubble?.props.flexGrow).toBe(1)
  expect(bubble?.props.alignSelf).toBeUndefined()
  await prompt.unmount()
  const alert = await $.ui.mount(reply('> [!WARNING]\n> careful'))
  expect((await alert.findAll({ type: 'Box' })).find(b => b.props.borderStyle === 'round')?.props.flexGrow).toBe(1)
  await alert.unmount()
})

test('fullWidth off hugs the text as upstream does', { options: { fullWidth: false } }, async $ => {
  const prompt = await $.ui.mount({ plugin: 'bk-mod-prismantis', component: 'UserMessage', props: { text: 'hi', origin: { kind: 'composer' } } as any, viewport: { columns: 100, rows: 20 }, surface: 'terminal' })
  expect((await prompt.findAll({ type: 'Box' })).find(b => b.props.borderStyle === 'round')?.props.alignSelf).toBe('flex-start')
  await prompt.unmount()
})

test('only http and https links are pressable', async $ => {
  const ui = await $.ui.mount(reply('[docs](https://example.com) [run](vscode://x/y) [disk](file:///etc/passwd)'))
  expect((await ui.findAll({ type: 'Link' })).map(l => l.props.href)).toEqual(['https://example.com'])
  await ui.unmount()
})

test('copies drop bidi overrides and invisible spaces but keep Arabic', async ($, on) => {
  const copied = stubClipboard(on)
  const ui = await $.ui.mount(reply('```bash\nrm\u202e -rf\u200b /tmp/x # \u062d\u0633\u0628\u064a\n```'))
  const [button] = await ui.findAll({ type: 'Button' })
  await ui.press({ key: button!.key! })
  expect(copied).toEqual(['rm -rf /tmp/x # \u062d\u0633\u0628\u064a'])
  await ui.unmount()
})
