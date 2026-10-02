import { useCallback } from 'react'
import { useIDE } from '../state/store'
import { readFile, isTauri } from '../lib/tauri'

// Demo content used when running outside Tauri (plain `vite dev` in a browser).
const WEB_SAMPLE = `// CodeEditX preview — running in a browser, not Tauri.
// Filesystem, Git and the PTY terminal need the native shell.
// Run:  npm run tauri dev

export default function App() {
  const [todos, setTodos] = useState(mockData)
  return <main className="app"><h1>Hello, CodeEditX</h1></main>
}
`

export function useOpenFile() {
  const openTab = useIDE((s) => s.openTab)

  return useCallback(
    async (path: string, name: string) => {
      let content = WEB_SAMPLE
      if (isTauri) {
        try {
          content = await readFile(path)
        } catch (e) {
          content = `// Unable to open ${name}\n// ${(e as Error).message ?? e}`
        }
      }
      openTab({ path, name, content, savedContent: content, isDirty: false })
    },
    [openTab],
  )
}
