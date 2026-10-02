// Typed wrappers over the Rust commands + events defined in src-tauri.
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

export interface FsEntry {
  name: string
  path: string
  isDir: boolean
  extension: string | null
  hasChildrenDir: boolean
}

export interface GitFile {
  path: string
  status: string
  indexStatus: string
  worktreeStatus: string
}

export interface GitStatus {
  isRepo: boolean
  branch: string | null
  detached: boolean
  changedFiles: GitFile[]
  ahead: number
  behind: number
}

export interface SyntaxInfo {
  engine: string
  active: boolean
  languages: string[]
}

export interface OutlineSymbol {
  name: string
  kind: string
  startLine: number
  endLine: number
}

export interface LspInfo {
  id: string
  server: string
}

// ---- Filesystem -----------------------------------------------------------
export const readDir = (dir: string) => invoke<FsEntry[]>('read_dir', { dir })
export const readFile = (path: string) => invoke<string>('read_file', { path })
export const writeFile = (path: string, contents: string) =>
  invoke<void>('write_file', { path, contents })

// ---- Git ------------------------------------------------------------------
export const gitStatus = (cwd: string) => invoke<GitStatus>('git_status', { cwd })
export const gitDiff = (cwd: string, path: string) =>
  invoke<string>('git_diff', { cwd, path })

// ---- Terminal (PTY) -------------------------------------------------------
export interface PtyOptions {
  cols: number
  rows: number
  cwd?: string
  command?: string
  args?: string[]
}
export const ptyCreate = (opts: PtyOptions) => invoke<string>('pty_create', { opts })
export const ptyWrite = (id: string, data: string) => invoke<void>('pty_write', { id, data })
export const ptyResize = (id: string, cols: number, rows: number) =>
  invoke<void>('pty_resize', { id, cols, rows })
export const ptyKill = (id: string) => invoke<void>('pty_kill', { id })

export interface PtyOutput {
  id: string
  data: number[]
}
export const onPtyOutput = (cb: (p: PtyOutput) => void): Promise<UnlistenFn> =>
  listen<PtyOutput>('pty-output', (e) => cb(e.payload))

// ---- LSP / Syntax ---------------------------------------------------------
export const lspRegistry = () => invoke<LspInfo[]>('lsp_registry')
export const lspStart = (serverId: string, rootUri: string) =>
  invoke<string>('lsp_start', { serverId, rootUri })
export const lspStop = (serverId: string) => invoke<void>('lsp_stop', { serverId })

export const syntaxInfo = () => invoke<SyntaxInfo>('syntax_info')
export const outline = (language: string, source: string) =>
  invoke<OutlineSymbol[]>('outline', { language, source })

// ---- Workspace search -----------------------------------------------------
export interface SearchOptions {
  caseSensitive: boolean
  wholeWord: boolean
  maxFiles: number
}
export interface LineMatch {
  line: number
  column: number
  preview: string
  matchLen: number
}
export interface FileMatch {
  path: string
  name: string
  relative: string
  matches: LineMatch[]
}
export interface SearchResults {
  query: string
  files: FileMatch[]
  totalMatches: number
  truncated: boolean
}
export const workspaceSearch = (root: string, query: string, options: SearchOptions) =>
  invoke<SearchResults>('workspace_search', { root, query, options })

// ---- Platform -------------------------------------------------------------
export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
export const platform = (): 'macos' | 'windows' | 'linux' | 'web' => {
  if (!isTauri) return 'web'
  const p = navigator.userAgent.toLowerCase()
  if (p.includes('mac')) return 'macos'
  if (p.includes('win')) return 'windows'
  return 'linux'
}
