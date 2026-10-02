import { useEffect, useMemo, useState } from 'react'
import { useIDE } from '../state/store'
import {
  workspaceSearch,
  isTauri,
  type SearchResults,
  type FileMatch,
} from '../lib/tauri'
import { useOpenFile } from '../hooks/useOpenFile'
import { SearchIcon } from './icons'

function Toggle({
  on,
  onClick,
  title,
  children,
}: {
  on: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        padding: '2px 7px',
        borderRadius: 5,
        fontSize: 11.5,
        fontFamily: 'var(--font-mono)',
        background: on ? '#4b9eff44' : 'transparent',
        border: `1px solid ${on ? '#4b9eff66' : '#ffffff1a'}`,
        color: on ? '#dcecff' : '#9aa0aa',
      }}
    >
      {children}
    </button>
  )
}

/** Highlight every case-insensitive occurrence of `needle` in `text`. */
function Highlight({ text, needle, ci }: { text: string; needle: string; ci: boolean }) {
  const parts = useMemo(() => {
    if (!needle) return [text]
    const hay = ci ? text.toLowerCase() : text
    const ndl = ci ? needle.toLowerCase() : needle
    const out: string[] = []
    let i = 0
    for (;;) {
      const idx = hay.indexOf(ndl, i)
      if (idx === -1) {
        out.push(text.slice(i))
        break
      }
      out.push(text.slice(i, idx), text.slice(idx, idx + ndl.length))
      i = idx + ndl.length
    }
    return out
  }, [text, needle, ci])

  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} style={{ background: '#4b9eff55', color: '#fff', borderRadius: 2 }}>
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}

export function FindNavigator() {
  const rootPath = useIDE((s) => s.rootPath)
  const openFile = useOpenFile()
  const requestReveal = useIDE((s) => s.requestReveal)

  const [query, setQuery] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [searching, setSearching] = useState(false)

  const canSearch = isTauri && !!rootPath && query.length > 0

  useEffect(() => {
    if (!isTauri || !rootPath || !query) return
    const t = setTimeout(() => {
      setSearching(true)
      workspaceSearch(rootPath, query, { caseSensitive, wholeWord, maxFiles: 100 })
        .then(setResults)
        .catch(() => setResults(null))
        .finally(() => setSearching(false))
    }, 250)
    return () => clearTimeout(t)
  }, [query, caseSensitive, wholeWord, rootPath])

  const openMatch = async (file: FileMatch, line: number, column: number) => {
    await openFile(file.path, file.name)
    requestReveal(file.path, line, column)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="insp-field" style={{ padding: '4px 8px' }}>
          <SearchIcon size={13} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'inherit',
              width: '100%',
              fontSize: 12.5,
              fontFamily: 'var(--font-mono)',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Toggle on={caseSensitive} onClick={() => setCaseSensitive((v) => !v)} title="Match Case">
            Aa
          </Toggle>
          <Toggle on={wholeWord} onClick={() => setWholeWord((v) => !v)} title="Whole Word">
            \b
          </Toggle>
        </div>
      </div>

      <div className="nav-tree" style={{ borderTop: '1px solid #00000030' }}>
        {!isTauri && (
          <div className="hint" style={{ padding: '8px 14px' }}>
            Workspace search needs the native app — run <kbd>npm run tauri:dev</kbd>.
          </div>
        )}
        {isTauri && !query && (
          <div className="hint" style={{ padding: '8px 14px' }}>
            Type to search all text files in {rootPath ? 'the workspace' : 'a folder'}.
          </div>
        )}
        {canSearch && searching && <div className="hint" style={{ padding: '8px 14px' }}>Searching…</div>}
        {canSearch && !searching && results && results.totalMatches === 0 && (
          <div className="hint" style={{ padding: '8px 14px' }}>No results for “{query}”.</div>
        )}

        {canSearch && !searching && results && results.totalMatches > 0 && (
          <>
            <div
              className="hint"
              style={{ padding: '6px 14px', position: 'sticky', top: 0, background: 'var(--chrome-1)' }}
            >
              {results.totalMatches} result{results.totalMatches > 1 ? 's' : ''} in {results.files.length}{' '}
              file{results.files.length > 1 ? 's' : ''}
              {results.truncated && ' (truncated)'}
            </div>
            {results.files.map((file) => (
              <div key={file.path}>
                <div
                  className="tree-row"
                  style={{ paddingLeft: 8, fontWeight: 600, color: '#cfd2d8' }}
                  onClick={() => openMatch(file, file.matches[0].line, file.matches[0].column)}
                  title={file.relative}
                >
                  <span className="label">{file.relative}</span>
                  <span className="hint" style={{ marginLeft: 'auto' }}>
                    {file.matches.length}
                  </span>
                </div>
                {file.matches.slice(0, 50).map((m, i) => (
                  <div
                    key={`${file.path}:${m.line}:${i}`}
                    className="tree-row"
                    style={{ paddingLeft: 20, height: 'auto', minHeight: 20, alignItems: 'flex-start' }}
                    onClick={() => openMatch(file, m.line, m.column)}
                  >
                    <span
                      className="hint"
                      style={{ fontFamily: 'var(--font-mono)', flex: '0 0 auto', marginRight: 6 }}
                    >
                      {m.line}
                    </span>
                    <span className="label" style={{ whiteSpace: 'normal', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      <Highlight text={m.preview} needle={query} ci={!caseSensitive} />
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
