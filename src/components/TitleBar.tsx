import { getCurrentWindow } from '@tauri-apps/api/window'
import { useIDE } from '../state/store'
import { isTauri } from '../lib/tauri'
import {
  GitBranchIcon,
  CubeIcon,
  PlayIcon,
  StopIcon,
  PlusIcon,
  SidebarRightIcon,
  XIcon,
  WarningIcon,
  ErrorIcon,
} from './icons'

const app = () => (isTauri ? getCurrentWindow() : null)

function TrafficLights() {
  const w = app()
  return (
    <div className="traffic">
      <button className="close" title="Close" onClick={() => w?.close()}>
        <XIcon size={9} stroke="#4a0002" strokeWidth={2.2} />
      </button>
      <button className="min" title="Minimize" onClick={() => w?.minimize()}>
        <svg width="9" height="9" viewBox="0 0 24 24">
          <path d="M5 12h14" stroke="#5a4400" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </button>
      <button className="max" title="Zoom" onClick={() => w?.toggleMaximize()}>
        <svg width="9" height="9" viewBox="0 0 24 24">
          <path d="M7 17L17 7M17 7H9M17 7v8" stroke="#0a3d00" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}

export function TitleBar() {
  const rootName = useIDE((s) => s.rootName)
  const git = useIDE((s) => s.git)
  const inspectorVisible = useIDE((s) => s.inspectorVisible)
  const togglePanel = useIDE((s) => s.togglePanel)

  return (
    <header className="titlebar">
      <TrafficLights />

      <div className="tb-left">
        <div className="tb-project">
          <GitBranchIcon size={18} style={{ color: '#cfd2d8' }} />
          <div className="col">
            <span className="name">{rootName}</span>
            <span className="branch">{git?.isRepo ? git.branch ?? 'no branch' : 'not a git repo'}</span>
          </div>
        </div>
      </div>

      <div className="tb-center">
        <div className="scheme-pill">
          <span className="dot">
            <CubeIcon size={12} />
          </span>
          <span>{rootName}</span>
        </div>
        <div className="tb-status">
          <span>Ready</span>
          <span className="tb-count err">
            <ErrorIcon size={13} /> 0
          </span>
          <span className="tb-count warn">
            <WarningIcon size={13} /> 0
          </span>
        </div>
      </div>

      <div className="tb-right">
        <button className="icon-btn" title="Stop">
          <StopIcon size={15} />
        </button>
        <button className="icon-btn play" title="Run">
          <PlayIcon size={16} />
        </button>
        <button className="icon-btn" title="New">
          <PlusIcon size={17} />
        </button>
        <button
          className={`icon-btn ${inspectorVisible ? 'active' : ''}`}
          title="Toggle Inspector"
          onClick={() => togglePanel('inspector')}
        >
          <SidebarRightIcon size={17} />
        </button>
      </div>
    </header>
  )
}
