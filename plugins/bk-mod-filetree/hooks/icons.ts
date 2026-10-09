import type { FileNode } from '../types'

const cp = (n: number) => String.fromCodePoint(n)

export const CHEVRON_OPEN = cp(0xf47c)
export const CHEVRON_CLOSED = cp(0xf460)

const NAMES: Record<string, number> = {
  'agents.md': 0xf0354,
  'changelog.md': 0xf0354,
  'contributing.md': 0xf0354,
  'todo.md': 0xf0354,
  'readme.md': 0xf0354,
  license: 0xe60a,
  dockerfile: 0xf0868,
  makefile: 0xf1064,
  'cmakelists.txt': 0xf1064,
  justfile: 0xf05b7,
  gemfile: 0xf0d2d,
  rakefile: 0xf0d2d,
  'cargo.toml': 0xe6b2,
  'cargo.lock': 0xe6b2,
  'pyproject.toml': 0xe6b2,
  'requirements.txt': 0xf160e,
  'go.mod': 0xf0afa,
  'go.sum': 0xf07d3,
  'package.json': 0xf0626,
  'package-lock.json': 0xf0626,
  'tsconfig.json': 0xf0626,
  '.prettierrc': 0xf0626,
  '.eslintrc': 0xf0626,
  'pnpm-lock.yaml': 0xe6a8,
  'yarn.lock': 0xe6a8,
  '.gitignore': 0xf02a2,
  '.gitmodules': 0xf0493,
  '.editorconfig': 0xe652,
}

const EXTS: Record<string, number> = {
  lua: 0xe620,
  py: 0xe606,
  pyi: 0xe606,
  js: 0xe60c,
  mjs: 0xe60c,
  cjs: 0xe60c,
  ts: 0xe628,
  jsx: 0xe625,
  tsx: 0xe7ba,
  json: 0xe60b,
  jsonc: 0xe60b,
  yaml: 0xe6a8,
  yml: 0xe6a8,
  sh: 0xe795,
  bash: 0xe795,
  zsh: 0xe795,
  fish: 0xe795,
  md: 0xf0354,
  markdown: 0xf0354,
  css: 0xe6b8,
  scss: 0xf031c,
  html: 0xe736,
  htm: 0xe736,
  go: 0xe627,
  rs: 0xe68b,
  rb: 0xe791,
  php: 0xe608,
  java: 0xe738,
  cs: 0xf031b,
  sql: 0xe706,
  graphql: 0xf20e,
  gql: 0xf20e,
  xml: 0xf05c0,
  toml: 0xe6b2,
  ini: 0xf0bc2,
  conf: 0xf0493,
  pdf: 0xeaeb,
  svg: 0xf0721,
  jpg: 0xf0225,
  jpeg: 0xf0225,
  png: 0xe60d,
  gif: 0xf0d78,
  webp: 0xf021f,
  mp4: 0xf022b,
  mkv: 0xf022b,
  mov: 0xf022b,
  mp3: 0xf0223,
  wav: 0xf0223,
  flac: 0xf0223,
  zip: 0xf05c4,
  gz: 0xf05c4,
  xz: 0xf05c4,
  tar: 0xf05c4,
  qml: 0xf375,
  cpp: 0xe61d,
  cc: 0xe61d,
  cxx: 0xe61d,
  c: 0xe61e,
  h: 0xf0af5,
  hpp: 0xf0af5,
  vue: 0xe6a0,
  svelte: 0xe697,
  csv: 0xe64a,
  txt: 0xf09aa,
}

export function fileIcon(n: FileNode, open: boolean, isRepo: boolean): string {
  if (n.kind === 'link') return cp(0xf481)
  if (n.kind === 'dir') return cp(isRepo ? 0xf02a2 : open ? 0xe5fe : 0xe5ff)
  const lower = n.name.toLowerCase()
  const named = NAMES[lower]
  if (named) return cp(named)
  const dot = lower.lastIndexOf('.')
  const ext = dot >= 0 ? lower.slice(dot + 1) : ''
  return cp(EXTS[ext] ?? 0xf0214)
}

// Material Design hues chosen to match the Material Icon Theme look, one per kind of file.
const NAME_COLORS: Record<string, string> = {
  'readme.md': '#42a5f5',
  'changelog.md': '#8bc34a',
  'agents.md': '#ff7043',
  license: '#ff5722',
  dockerfile: '#0288d1',
  makefile: '#ef5350',
  'package.json': '#8bc34a',
  'package-lock.json': '#ef5350',
  'tsconfig.json': '#0288d1',
  'yarn.lock': '#0288d1',
  'pnpm-lock.yaml': '#f9ad00',
  'cargo.toml': '#ff7043',
  'cargo.lock': '#ff7043',
  'go.mod': '#00acc1',
  'go.sum': '#00acc1',
  '.gitignore': '#e64a19',
  '.gitmodules': '#e64a19',
}

const EXT_COLORS: Record<string, string> = {
  ts: '#0288d1', mts: '#0288d1', cts: '#0288d1', tsx: '#00bcd4', jsx: '#00bcd4',
  js: '#ffca28', mjs: '#ffca28', cjs: '#ffca28',
  json: '#fbc02d', jsonc: '#fbc02d',
  py: '#3d7ab8', pyi: '#3d7ab8',
  md: '#42a5f5', markdown: '#42a5f5', txt: '#90a4ae',
  yaml: '#ff5252', yml: '#ff5252', toml: '#9e9e9e', ini: '#9e9e9e', conf: '#9e9e9e',
  sh: '#ff7043', bash: '#ff7043', zsh: '#ff7043', fish: '#ff7043',
  css: '#42a5f5', scss: '#ec407a', html: '#e44d26', htm: '#e44d26',
  go: '#00acc1', rs: '#ff7043', rb: '#f44336', php: '#7986cb', java: '#f44336', cs: '#0288d1', lua: '#42a5f5',
  c: '#0288d1', h: '#a1887f', cpp: '#0288d1', cc: '#0288d1', cxx: '#0288d1', hpp: '#a1887f',
  sql: '#ffca28', graphql: '#ec407a', gql: '#ec407a', xml: '#8bc34a', csv: '#8bc34a',
  vue: '#41b883', svelte: '#ff5722', qml: '#41cd52',
  svg: '#ffb300', png: '#26a69a', jpg: '#26a69a', jpeg: '#26a69a', gif: '#26a69a', webp: '#26a69a',
  mp4: '#ff9800', mkv: '#ff9800', mov: '#ff9800', mp3: '#ef5350', wav: '#ef5350', flac: '#ef5350',
  pdf: '#ef5350', zip: '#afb42b', gz: '#afb42b', xz: '#afb42b', tar: '#afb42b',
}

const FOLDER_COLORS: Record<string, string> = {
  src: '#4caf50', lib: '#c0ca33', test: '#00bfa5', tests: '#00bfa5', __tests__: '#00bfa5', spec: '#00bfa5',
  docs: '#0288d1', doc: '#0288d1', scripts: '#ff7043', hooks: '#ab47bc', plugins: '#ab47bc', types: '#0288d1',
  config: '#607d8b', public: '#29b6f6', assets: '#ffb300', images: '#26a69a',
  dist: '#e57373', build: '#e57373', out: '#e57373', node_modules: '#8bc34a', vendor: '#8bc34a',
  '.git': '#e64a19', '.github': '#546e7a', '.vscode': '#2196f3', '.claude': '#d97757', '.claude-plugin': '#d97757',
}

const FOLDER = '#90a4ae'
const FILE = '#90a4ae'

export function iconColor(n: FileNode, isRepo: boolean): string {
  const lower = n.name.toLowerCase()
  if (n.kind === 'link') return FILE
  if (n.kind === 'dir') return isRepo ? '#e64a19' : (FOLDER_COLORS[lower] ?? FOLDER)
  const named = NAME_COLORS[lower]
  if (named) return named
  const dot = lower.lastIndexOf('.')
  return EXT_COLORS[dot >= 0 ? lower.slice(dot + 1) : ''] ?? FILE
}

export const GIT_COLOR: Record<string, string> = {
  A: '#98c379',
  '?': '#98c379',
  R: '#61afef',
  C: '#61afef',
  M: '#e5c07b',
  T: '#e5c07b',
}

const PRIORITY = ['U', 'D', 'M', 'T', 'R', 'C', 'A', '?']

export function stronger(a: string | undefined, b: string): string {
  if (!a) return b
  return PRIORITY.indexOf(b) < PRIORITY.indexOf(a) ? b : a
}
