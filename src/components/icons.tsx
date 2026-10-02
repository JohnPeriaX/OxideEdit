// Minimal SF-Symbols-style inline SVG icons used across the chrome.
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }
const base = (size = 16): P => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export const FolderIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l1.7 2H19.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
  </svg>
)
export const ChevronRight = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M9 6l6 6-6 6" />
  </svg>
)
export const ChevronDown = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)
export const FileIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4" />
  </svg>
)
export const ReactAtom = ({ size, ...p }: P) => (
  <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 24 24" fill="none" {...p}>
    <circle cx="12" cy="12" r="1.7" fill="#61DAFB" />
    <ellipse cx="12" cy="12" rx="10" ry="4.2" stroke="#61DAFB" strokeWidth="1.1" />
    <ellipse cx="12" cy="12" rx="10" ry="4.2" stroke="#61DAFB" strokeWidth="1.1" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4.2" stroke="#61DAFB" strokeWidth="1.1" transform="rotate(120 12 12)" />
  </svg>
)
export const CubeIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
    <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
  </svg>
)
export const SearchIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </svg>
)
export const GitBranchIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="7" cy="6" r="2.2" />
    <circle cx="7" cy="18" r="2.2" />
    <circle cx="17" cy="8" r="2.2" />
    <path d="M7 8.2v7.6M17 10.2c0 3.5-3 4-6 4.3" />
  </svg>
)
export const WrenchIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M15.5 6.5a3.5 3.5 0 0 0-4.6 4.2L4 17.6 6.4 20l6.9-6.9a3.5 3.5 0 0 0 4.2-4.6l-2 2-1.9-.5-.5-1.9z" />
  </svg>
)
export const TerminalIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 9l3 3-3 3M12.5 15H17" />
  </svg>
)
export const PlayIcon = ({ size, ...p }: P) => (
  <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M8 5v14l11-7z" />
  </svg>
)
export const StopIcon = ({ size, ...p }: P) => (
  <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <rect x="6" y="6" width="12" height="12" rx="1.5" />
  </svg>
)
export const BugIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="8" y="7" width="8" height="12" rx="4" />
    <path d="M8 11H4M20 11h-4M8 15H4.5M20 15h-3.5M9 6l-1.5-2M15 6l1.5-2" />
  </svg>
)
export const WarningIcon = ({ size, ...p }: P) => (
  <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 3l9 16H3zM12 9v5M12 16.5v.6" stroke="#000" strokeWidth="0" />
  </svg>
)
export const ErrorIcon = ({ size, ...p }: P) => (
  <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#2b2b2b" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
export const PlusIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const XIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)
export const SidebarLeftIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </svg>
)
export const SidebarRightIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M15 4v16" />
  </svg>
)
export const IdentityIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
  </svg>
)
export const InfoIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8v.5" />
  </svg>
)
export const HistoryIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v3h3" />
    <path d="M12 8v4l3 2" />
  </svg>
)
export const TextFormatIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M5 6h14M5 6l1-2M19 6l-1-2M12 6v12M9 18h6" />
  </svg>
)
