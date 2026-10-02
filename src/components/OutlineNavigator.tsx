import { useEffect, useMemo, useState } from 'react'
import { useIDE } from '../state/store'
import { outline, isTauri, type OutlineSymbol } from '../lib/tauri'
import { languageForFile } from '../lib/theme'
import { WrenchIcon } from './icons'

// Fallback heuristic mirroring the Rust scaffold, for browser preview.
function heuristic(source: string): OutlineSymbol[] {
  const out: OutlineSymbol[] = []
  const kws = ['fn ', 'function ', 'class ', 'const ', 'export ', 'struct ', 'impl ', 'interface ', 'enum ', 'def ', 'pub ']
  source.split('\n').forEach((line, i) => {
    const t = line.trimEnd()
    const indent = t.length - t.trimStart().length
    if (indent === 0 && kws.some((k) => t.startsWith(k))) {
      out.push({ name: t.trimStart(), kind: 'declaration', startLine: i + 1, endLine: i + 1 })
    }
  })
  return out
}

export function OutlineNavigator() {
  const active = useIDE((s) => s.tabs.find((t) => t.path === s.activePath))
  const setActive = useIDE((s) => s.setActive)
  const requestReveal = useIDE((s) => s.requestReveal)

  // Browser preview: derive synchronously.
  const webSymbols = useMemo(() => (active ? heuristic(active.content) : []), [active])
  // Tauri: async, grammar-backed (or Rust heuristic) outline.
  const [nativeSymbols, setNativeSymbols] = useState<OutlineSymbol[]>([])

  useEffect(() => {
    if (!active || !isTauri) return
    let alive = true
    outline(languageForFile(active.name), active.content)
      .then((s) => alive && setNativeSymbols(s))
      .catch(() => alive && setNativeSymbols(heuristic(active.content)))
    return () => {
      alive = false
    }
  }, [active])

  const symbols = isTauri ? nativeSymbols : webSymbols

  if (!active) {
    return (
      <div style={{ padding: 16 }} className="hint">
        <WrenchIcon size={22} style={{ color: '#5a5f68', marginBottom: 8 }} />
        Open a file to see its outline.
      </div>
    )
  }

  return (
    <div className="nav-tree">
      {symbols.length === 0 && <div className="hint" style={{ padding: '6px 14px' }}>No symbols</div>}
      {symbols.map((s, i) => (
        <div
          key={`${s.startLine}-${i}`}
          className="tree-row"
          style={{ paddingLeft: 20 }}
          onClick={() => {
            setActive(active.path)
            requestReveal(active.path, s.startLine, 1)
          }}
        >
          <span className="ico"><WrenchIcon size={13} style={{ color: '#8a8f98' }} /></span>
          <span className="label">{s.name}</span>
          <span className="hint" style={{ marginLeft: 'auto' }}>{s.startLine}</span>
        </div>
      ))}
    </div>
  )
}
