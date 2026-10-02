import { create } from 'zustand'
import type { FsEntry, GitStatus } from '../lib/tauri'

export type NavigatorTab = 'project' | 'find' | 'git' | 'outline'
export type UtilityTab = 'terminal' | 'debugger' | 'output'

export interface EditorTab {
  path: string
  name: string
  content: string
  savedContent: string
  isDirty: boolean
}

export interface TerminalSession {
  id: string
  title: string
}

interface IDEState {
  // Workspace
  rootPath: string | null
  rootName: string

  // Navigator
  navigatorTab: NavigatorTab
  childrenCache: Record<string, FsEntry[]>
  expandedDirs: Record<string, boolean>
  git: GitStatus | null

  // Editor
  tabs: EditorTab[]
  activePath: string | null
  cursor: { line: number; column: number }
  reveal: { path: string; line: number; column: number; seq: number } | null

  // Panels / chrome
  navigatorVisible: boolean
  inspectorVisible: boolean
  utilityVisible: boolean
  utilityTab: UtilityTab
  terminals: TerminalSession[]
  activeTerminalId: string | null

  // Actions
  setWorkspace: (root: string, name: string) => void
  setNavigatorTab: (t: NavigatorTab) => void
  toggleDir: (path: string) => void
  setChildren: (path: string, entries: FsEntry[]) => void
  setGit: (g: GitStatus | null) => void
  openTab: (tab: EditorTab) => void
  closeTab: (path: string) => void
  setActive: (path: string) => void
  updateContent: (path: string, content: string) => void
  markSaved: (path: string) => void
  setCursor: (line: number, column: number) => void
  requestReveal: (path: string, line: number, column: number) => void
  togglePanel: (which: 'navigator' | 'inspector' | 'utility') => void
  setUtilityTab: (t: UtilityTab) => void
  addTerminal: (s: TerminalSession) => void
  setActiveTerminal: (id: string) => void
  removeTerminal: (id: string) => void
}

export const useIDE = create<IDEState>((set) => ({
  rootPath: null,
  rootName: 'Open a Folder',

  navigatorTab: 'project',
  childrenCache: {},
  expandedDirs: {},
  git: null,

  tabs: [],
  activePath: null,
  cursor: { line: 1, column: 1 },
  reveal: null,

  navigatorVisible: true,
  inspectorVisible: false,
  utilityVisible: true,
  utilityTab: 'terminal',
  terminals: [],
  activeTerminalId: null,

  setWorkspace: (root, name) =>
    set({
      rootPath: root,
      rootName: name,
      childrenCache: {},
      expandedDirs: {},
      tabs: [],
      activePath: null,
    }),

  setNavigatorTab: (t) => set({ navigatorTab: t, navigatorVisible: true }),

  toggleDir: (path) =>
    set((s) => ({ expandedDirs: { ...s.expandedDirs, [path]: !s.expandedDirs[path] } })),

  setChildren: (path, entries) =>
    set((s) => ({ childrenCache: { ...s.childrenCache, [path]: entries } })),

  setGit: (g) => set({ git: g }),

  openTab: (tab) =>
    set((s) => {
      if (s.tabs.some((t) => t.path === tab.path)) {
        return { activePath: tab.path }
      }
      return { tabs: [...s.tabs, tab], activePath: tab.path }
    }),

  closeTab: (path) =>
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.path === path)
      const tabs = s.tabs.filter((t) => t.path !== path)
      let activePath = s.activePath
      if (s.activePath === path) {
        activePath = tabs[Math.max(0, idx - 1)]?.path ?? null
      }
      return { tabs, activePath }
    }),

  setActive: (path) => set({ activePath: path }),

  updateContent: (path, content) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.path === path ? { ...t, content, isDirty: content !== t.savedContent } : t,
      ),
    })),

  markSaved: (path) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.path === path ? { ...t, savedContent: t.content, isDirty: false } : t,
      ),
    })),

  setCursor: (line, column) => set({ cursor: { line, column } }),

  requestReveal: (path, line, column) =>
    set((s) => ({ reveal: { path, line, column, seq: (s.reveal?.seq ?? 0) + 1 } })),

  togglePanel: (which) =>
    set((s) => {
      if (which === 'navigator') return { navigatorVisible: !s.navigatorVisible }
      if (which === 'inspector') return { inspectorVisible: !s.inspectorVisible }
      return { utilityVisible: !s.utilityVisible }
    }),

  setUtilityTab: (t) => set({ utilityTab: t, utilityVisible: true }),

  addTerminal: (term) =>
    set((s) => ({
      terminals: [...s.terminals, term],
      activeTerminalId: term.id,
      utilityTab: 'terminal',
      utilityVisible: true,
    })),

  setActiveTerminal: (id) => set({ activeTerminalId: id }),

  removeTerminal: (id) =>
    set((s) => {
      const terminals = s.terminals.filter((t) => t.id !== id)
      const activeTerminalId =
        s.activeTerminalId === id ? terminals[terminals.length - 1]?.id ?? null : s.activeTerminalId
      return { terminals, activeTerminalId }
    }),
}))
