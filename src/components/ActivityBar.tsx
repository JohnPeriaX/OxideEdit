import { useIDE, type NavigatorTab } from '../state/store'
import {
  FolderIcon,
  SearchIcon,
  GitBranchIcon,
  WrenchIcon,
  BugIcon,
} from './icons'

const TABS: { id: NavigatorTab; label: string; Icon: typeof FolderIcon }[] = [
  { id: 'project', label: 'Project Navigator', Icon: FolderIcon },
  { id: 'find', label: 'Find Navigator', Icon: SearchIcon },
  { id: 'git', label: 'Source Control', Icon: GitBranchIcon },
  { id: 'outline', label: 'Document Outline', Icon: WrenchIcon },
]

export function ActivityBar() {
  const navigatorTab = useIDE((s) => s.navigatorTab)
  const setNavigatorTab = useIDE((s) => s.setNavigatorTab)

  return (
    <nav className="activitybar">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`ab-btn ${navigatorTab === id ? 'active' : ''}`}
          title={label}
          aria-label={label}
          onClick={() => setNavigatorTab(id)}
        >
          <Icon size={19} />
        </button>
      ))}
      <div className="spacer" />
      <button className="ab-btn" title="Debug">
        <BugIcon size={19} />
      </button>
    </nav>
  )
}
