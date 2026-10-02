import { useIDE } from '../state/store'
import { useOpenFile } from '../hooks/useOpenFile'
import { GitBranchIcon } from './icons'

export function GitNavigator() {
  const git = useIDE((s) => s.git)
  const rootPath = useIDE((s) => s.rootPath)
  const openFile = useOpenFile()

  if (!git?.isRepo) {
    return (
      <div style={{ padding: 16 }} className="hint">
        <GitBranchIcon size={22} style={{ color: '#5a5f68', marginBottom: 8 }} />
        This workspace is not a Git repository.
      </div>
    )
  }

  const changed = git.changedFiles
  return (
    <div className="nav-tree">
      <div className="nav-header" style={{ border: 'none' }}>
        <span style={{ color: '#d6d6d6' }}>{git.branch}</span>
        <span className="hint" style={{ marginLeft: 'auto' }}>
          {git.ahead > 0 && `↑${git.ahead} `}
          {git.behind > 0 && `↓${git.behind}`}
        </span>
      </div>
      {changed.length === 0 && <div className="hint" style={{ padding: '6px 14px' }}>No changes</div>}
      {changed.map((f) => {
        const abs = rootPath ? `${rootPath}${f.path.startsWith('/') ? '' : '/'}${f.path}` : f.path
        const name = f.path.split(/[\\/]/).pop() ?? f.path
        const code = f.status.trim()
        return (
          <div key={f.path} className="tree-row" style={{ paddingLeft: 20 }} onClick={() => openFile(abs, name)}>
            <span className="ico" />
            <span className="label">{name}</span>
            <span className={`git-badge ${code}`}>{code}</span>
          </div>
        )
      })}
    </div>
  )
}
