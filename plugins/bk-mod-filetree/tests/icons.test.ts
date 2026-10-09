import { expect, test } from 'claude-code/testing'

import { iconColor } from '../hooks/icons'

const node = (name: string, kind: 'file' | 'dir' | 'link' = 'file') => ({ id: `/w/${name}`, name, kind, size: 1, mtime: 0, hidden: name.startsWith('.') }) as any

test('file icons take a color per kind, names first, then extension', () => {
  expect(iconColor(node('app.ts'), false)).toBe('#0288d1')
  expect(iconColor(node('main.go'), false)).toBe('#00acc1')
  expect(iconColor(node('package.json'), false)).toBe('#8bc34a')
  expect(iconColor(node('data.json'), false)).toBe('#fbc02d')
  expect(iconColor(node('README.md'), false)).toBe('#42a5f5')
  expect(iconColor(node('.gitignore'), false)).toBe('#e64a19')
  expect(iconColor(node('unknown.zzz'), false)).toBe('#90a4ae')
})

test('folders are blue-grey unless their name is a well-known one, and the repo root is git orange', () => {
  expect(iconColor(node('src', 'dir'), false)).toBe('#4caf50')
  expect(iconColor(node('Tests', 'dir'), false)).toBe('#00bfa5')
  expect(iconColor(node('misc', 'dir'), false)).toBe('#90a4ae')
  expect(iconColor(node('bk-marketplace', 'dir'), true)).toBe('#e64a19')
})
