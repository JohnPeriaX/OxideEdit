import { useIDE } from '../state/store'
import { languageForFile } from '../lib/theme'
import { IdentityIcon, InfoIcon, HistoryIcon, ChevronDown } from './icons'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="insp-row">
      <label>{label}</label>
      <div className="insp-field">
        <span className="val">{value}</span>
        <ChevronDown size={12} className="lock" />
      </div>
    </div>
  )
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function Inspector() {
  const active = useIDE((s) => s.tabs.find((t) => t.path === s.activePath))
  const rootPath = useIDE((s) => s.rootPath)

  const name = active?.name ?? '—'
  const lang = active ? languageForFile(active.name) : 'plaintext'
  const typeLabel =
    lang === 'plaintext' ? 'Plain Text' : `${cap(lang)} ${name.endsWith('.tsx') || name.endsWith('.jsx') ? 'File' : 'File'}`
  const location = active && rootPath && active.path.startsWith(rootPath)
    ? 'Relative to Group'
    : active
      ? 'Absolute'
      : '—'
  const full = active?.path ?? '—'

  return (
    <aside className="inspector">
      <div className="insp-header">
        <button className="icon-btn active" title="Identity and Type"><IdentityIcon size={16} /></button>
        <button className="icon-btn" title="File Inspector"><InfoIcon size={16} /></button>
        <button className="icon-btn" title="History Inspector"><HistoryIcon size={16} /></button>
      </div>
      <div className="insp-body">
        <div className="insp-group">
          <div className="insp-title">Identity and Type</div>
          <Row label="Name" value={name} />
          <Row label="Type" value={typeLabel} />
          <Row label="Location" value={location} />
          <Row label="Full Path" value={full} />
        </div>
        <div className="insp-group">
          <div className="insp-title">Text Settings</div>
          <Row label="Text Encoding" value="Unicode (UTF-8)" />
          <Row label="Line Endings" value="LF" />
          <Row label="Indent Using" value="Spaces" />
          <Row label="Widths" value="2" />
        </div>
      </div>
    </aside>
  )
}
