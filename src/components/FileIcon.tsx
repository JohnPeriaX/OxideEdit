import type { FsEntry } from '../lib/tauri'
import { FileIcon, ReactAtom, CubeIcon, FolderIcon } from './icons'

const REACT = new Set(['jsx', 'tsx'])
const JS_TS = new Set(['js', 'mjs', 'cjs', 'ts'])

export function EntryIcon({ entry }: { entry: FsEntry }) {
  if (entry.isDir) return <FolderIcon size={15} style={{ color: '#7aa2d6' }} />
  const ext = entry.extension?.toLowerCase() ?? ''
  if (REACT.has(ext)) return <ReactAtom size={15} />
  if (ext === 'json') return <CubeIcon size={15} style={{ color: '#d9c97c' }} />
  if (JS_TS.has(ext)) return <CubeIcon size={15} style={{ color: '#6bdfff' }} />
  return <FileIcon size={14} style={{ color: '#8a8f98' }} />
}
