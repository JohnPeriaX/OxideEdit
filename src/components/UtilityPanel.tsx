import { useIDE, type UtilityTab } from '../state/store'
import { ptyCreate, ptyKill, isTauri } from '../lib/tauri'
import { TerminalView } from './TerminalView'
import { TerminalIcon, BugIcon, PlusIcon, XIcon } from './icons'

const TABS: { id: UtilityTab; label: string; Icon: typeof TerminalIcon }[] = [
  { id: 'terminal', label: 'Terminal', Icon: TerminalIcon },
  { id: 'debugger', label: 'Debugger', Icon: BugIcon },
  { id: 'output', label: 'Output', Icon: TerminalIcon },
]

export function UtilityPanel() {
  const utilityTab = useIDE((s) => s.utilityTab)
  const setUtilityTab = useIDE((s) => s.setUtilityTab)
  const terminals = useIDE((s) => s.terminals)
  const activeTerminalId = useIDE((s) => s.activeTerminalId)
  const addTerminal = useIDE((s) => s.addTerminal)
  const setActiveTerminal = useIDE((s) => s.setActiveTerminal)
  const removeTerminal = useIDE((s) => s.removeTerminal)
  const rootPath = useIDE((s) => s.rootPath)

  const newTerminal = async () => {
    if (!isTauri) {
      addTerminal({ id: `web-${Date.now()}`, title: 'Shell' })
      return
    }
    try {
      const id = await ptyCreate({ cols: 80, rows: 24, cwd: rootPath ?? undefined })
      addTerminal({ id, title: 'Shell' })
    } catch (e) {
      console.error('pty create failed', e)
    }
  }

  const closeTerminal = (id: string) => {
    if (isTauri) void ptyKill(id)
    removeTerminal(id)
  }

  return (
    <div className="utility">
      <div className="utility-tabs">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`utility-tab ${utilityTab === id ? 'active' : ''}`}
            onClick={() => setUtilityTab(id)}
          >
            <Icon size={13} />
            {label}
            {id === 'terminal' && terminals.length > 0 && (
              <span className="count">{terminals.length}</span>
            )}
          </button>
        ))}

        {utilityTab === 'terminal' && (
          <div className="term-sessions">
            {terminals.map((t) => (
              <button
                key={t.id}
                className={`term-chip ${t.id === activeTerminalId ? 'active' : ''}`}
                onClick={() => setActiveTerminal(t.id)}
              >
                {t.title}
                <span
                  style={{ marginLeft: 6 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTerminal(t.id)
                  }}
                >
                  <XIcon size={11} />
                </span>
              </button>
            ))}
            <button className="icon-btn" title="New Terminal" onClick={newTerminal}>
              <PlusIcon size={15} />
            </button>
          </div>
        )}
      </div>

      <div className="utility-body">
        {utilityTab === 'terminal' &&
          (activeTerminalId ? (
            <TerminalView key={activeTerminalId} sessionId={activeTerminalId} />
          ) : (
            <div className="editor-empty" style={{ gap: 6 }}>
              <span className="hint">No terminal</span>
              <button className="icon-btn" style={{ width: 'auto', padding: '4px 10px' }} onClick={newTerminal}>
                <PlusIcon size={13} /> New Terminal
              </button>
            </div>
          ))}
        {utilityTab === 'debugger' && (
          <div className="editor-empty"><span className="hint">Debugger panel — scaffolded for a DAP backend.</span></div>
        )}
        {utilityTab === 'output' && (
          <div className="editor-empty"><span className="hint">Build / LSP output log appears here.</span></div>
        )}
      </div>
    </div>
  )
}
