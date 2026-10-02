// Monaco theme built from CodeEdit's real `Default (Dark).cetheme` tokens.
import * as monaco from 'monaco-editor'

export const CODEEDIT_BG = '#292A30'
export const CODEEDIT_LINE_HIGHLIGHT = '#2F3239'

export function registerCodeEditTheme() {
  monaco.editor.defineTheme('codeedit-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '7F8C98', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'FF7AB2', fontStyle: 'bold' },
      { token: 'string', foreground: 'FF8170' },
      { token: 'number', foreground: 'D9C97C' },
      { token: 'constant', foreground: 'D9C97C' },
      { token: 'type', foreground: '6BDFFF' },
      { token: 'type.identifier', foreground: '6BDFFF' },
      { token: 'variable', foreground: '4EB0CC' },
      { token: 'identifier', foreground: 'FFFFFF' },
      { token: 'delimiter', foreground: 'D9D9D9' },
      { token: 'attribute', foreground: 'CC9768' },
      { token: 'predefined', foreground: 'B281EB' },
    ],
    colors: {
      'editor.background': CODEEDIT_BG,
      'editor.foreground': '#FFFFFF',
      'editor.lineHighlightBackground': CODEEDIT_LINE_HIGHLIGHT,
      'editor.selectionBackground': '#646F8380',
      'editorCursor.foreground': '#007AFF',
      'editorLineNumber.foreground': '#6A6F78',
      'editorLineNumber.activeForeground': '#C7C7CC',
      'editorIndentGuide.background1': '#3A3B40',
      'editorIndentGuide.activeBackground1': '#55565C',
      'editorGutter.background': CODEEDIT_BG,
      'editorWhitespace.foreground': '#53606E',
      'minimap.background': CODEEDIT_BG,
      'editorLineNumber.gutterBackground': CODEEDIT_BG,
      'editorWidget.background': '#232429',
      'editorWidget.border': '#3A3B40',
      'scrollbarSlider.background': '#00000000',
      'scrollbarSlider.hoverBackground': '#FFFFFF22',
      'scrollbarSlider.activeBackground': '#FFFFFF33',
      'editorOverviewRuler.border': '#00000000',
    },
  })
  monaco.editor.setTheme('codeedit-dark')
}

const EXT_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  json: 'json',
  css: 'css',
  scss: 'scss',
  html: 'html',
  md: 'markdown',
  rs: 'rust',
  py: 'python',
  go: 'go',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  yml: 'yaml',
  yaml: 'yaml',
  toml: 'ini',
  sh: 'shell',
  bash: 'shell',
  sql: 'sql',
  java: 'java',
}

export function languageForFile(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (name === 'Dockerfile') return 'dockerfile'
  if (name === 'Makefile') return 'makefile'
  return EXT_LANG[ext] ?? 'plaintext'
}
