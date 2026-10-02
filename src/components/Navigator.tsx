import { useCallback, useEffect } from 'react'
import { useIDE } from '../state/store'
import { readDir, isTauri, type FsEntry } from '../lib/tauri'
import { useOpenFile } from '../hooks/useOpenFile'
import { EntryIcon } from './FileIcon'
import { ChevronRight, ChevronDown, FolderIcon, GitBranchIcon } from './icons'
import { FindNavigator } from './FindNavigator'
import { GitNavigator } from './GitNavigator'
import { OutlineNavigator } from './OutlineNavigator'

/** Load a directory's children into the cache (idempotent). */
function useLoadDir() {
  const childrenCache = useIDE((s) => s.childrenCache)
  const setChildren = useIDE((s) => s.setChildren)
  return useCallback(
    async (dir: string) => {
      if (!isTauri || childrenCache[dir]) return
      try {
        const entries = await readDir(dir)
        setChildren(dir, entries)
      } catch {
        setChildren(dir, [])
      }
    },
    [childrenCache, setChildren],
  )
}

function gitBadge(path: string): string | null {
  const git = useIDE.getState().git
  if (!git?.isRepo) return null
  const rel = path.split(/[\\/]/).join('/')
  const f = git.changedFiles.find((c) => rel.endsWith(c.path.split(/[\\/]/).join('/')))
  return f ? f.status.trim() || f.status : null
}

function TreeItem({ entry, depth }: { entry: FsEntry; depth: number }) {
  const expanded = useIDE((s) => s.expandedDirs[entry.path])
  const toggleDir = useIDE((s) => s.toggleDir)
  const children = useIDE((s) => s.childrenCache[entry.path])
  const activePath = useIDE((s) => s.activePath)
  const loadDir = useLoadDir()
  const openFile = useOpenFile()
  const badge = entry.isDir ? null : gitBadge(entry.path)

  const onToggle = async () => {
    if (!entry.isDir) {
      openFile(entry.path, entry.name)
      return
    }
    if (!expanded) await loadDir(entry.path)
    toggleDir(entry.path)
  }

  return (
    <>
      <div
        className={`tree-row ${activePath === entry.path ? 'selected' : ''}`}
        style={{ paddingLeft: 6 + depth * 14 }}
        onClick={onToggle}
      >
        <span className="chev">
          {entry.isDir ? expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} /> : null}
        </span>
        <span className="ico">
          <EntryIcon entry={entry} />
        </span>
        <span className="label">{entry.name}</span>
        {badge && <span className={`git-badge ${badge}`}>{badge}</span>}
      </div>
      {entry.isDir && expanded && children?.map((c) => <TreeItem key={c.path} entry={c} depth={depth + 1} />)}
    </>
  )
}

function ProjectNavigator() {
  const rootPath = useIDE((s) => s.rootPath)
  const rootName = useIDE((s) => s.rootName)
  const children = useIDE((s) => (rootPath ? s.childrenCache[rootPath] : undefined))
  const loadDir = useLoadDir()

  useEffect(() => {
    if (rootPath) loadDir(rootPath)
  }, [rootPath, loadDir])

  if (!rootPath) {
    return (
      <div className="nav-tree">
        <div style={{ padding: 16 }} className="hint">
          <FolderIcon size={22} style={{ color: '#5a5f68', marginBottom: 8 }} />
          <div>No folder open.</div>
          <div style={{ marginTop: 6 }}>
            Use <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>O</kbd> to open a project.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="nav-tree">
      <div className="tree-row selected" style={{ paddingLeft: 6 }} onClick={() => loadDir(rootPath)}>
        <span className="chev"><ChevronDown size={12} /></span>
        <span className="ico"><FolderIcon size={15} style={{ color: '#7aa2d6' }} /></span>
        <span className="label">{rootName}</span>
      </div>
      {children ? (
        children.map((c) => <TreeItem key={c.path} entry={c} depth={1} />)
      ) : !isTauri ? (
        <div className="hint" style={{ padding: '6px 20px' }}>
          File tree needs the native app — run <kbd>npm run tauri:dev</kbd>.
        </div>
      ) : (
        <div className="hint" style={{ padding: '6px 20px' }}>Loading…</div>
      )}
    </div>
  )
}

export function Navigator() {
  const tab = useIDE((s) => s.navigatorTab)
  const rootName = useIDE((s) => s.rootName)

  const titles: Record<string, string> = {
    project: rootName,
    find: 'Find',
    git: 'Repository',
    outline: 'Outline',
  }

  return (
    <aside className="navigator">
      <div className="nav-header">
        {tab === 'git' ? <GitBranchIcon size={14} /> : <FolderIcon size={14} />}
        <span style={{ fontWeight: 600, color: '#d6d6d6' }}>{titles[tab]}</span>
      </div>
      {tab === 'project' && <ProjectNavigator />}
      {tab === 'find' && <FindNavigator />}
      {tab === 'git' && <GitNavigator />}
      {tab === 'outline' && <OutlineNavigator />}
    </aside>
  )
}
