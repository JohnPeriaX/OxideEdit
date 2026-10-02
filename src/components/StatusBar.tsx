import { useIDE } from '../state/store'
import { languageForFile } from '../lib/theme'
import { GitBranchIcon, WarningIcon, ErrorIcon, TerminalIcon } from './icons'

export function StatusBar() {
  const cursor = useIDE((s) => s.cursor)
  const active = useIDE((s) => s.tabs.find((t) => t.path === s.activePath))
  const git = useIDE((s) => s.git)
  const togglePanel = useIDE((s) => s.togglePanel)
  const utilityVisible = useIDE((s) => s.utilityVisible)

  const lang = active ? languageForFile(active.name) : '—'
  const langLabel: Record<string, string> = {
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    rust: 'Rust',
    json: 'JSON',
    css: 'CSS',
    markdown: 'Markdown',
    python: 'Python',
    plaintext: 'Plain Text',
  }

  return (
    <footer className="statusbar">
      <span className="item">
        <GitBranchIcon size={13} />
        {git?.isRepo ? git.branch ?? '—' : 'No branch'}
      </span>
      <span className="spacer" />
      <span className="item">
        <ErrorIcon size={12} /> 0
      </span>
      <span className="item">
        <WarningIcon size={12} /> 0
      </span>
      <span className="item">Ln {cursor.line}, Col {cursor.column}</span>
      <span className="item">Spaces: 2</span>
      <span className="item">UTF-8</span>
      <span className="item">LF</span>
      <span className="item">{langLabel[lang] ?? lang}</span>
      <button className="item click" onClick={() => togglePanel('utility')} title="Toggle utility area">
        <TerminalIcon size={13} />
        {utilityVisible ? '▾' : '▴'}
      </button>
    </footer>
  )
}
