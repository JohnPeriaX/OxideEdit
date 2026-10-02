import { useEffect, useRef } from 'react'
import Editor, { type OnMount, type BeforeMount } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { useIDE } from '../state/store'
import { writeFile, isTauri } from '../lib/tauri'
import { registerCodeEditTheme, languageForFile } from '../lib/theme'
import { EntryIcon } from './FileIcon'
import { XIcon, PlusIcon, SidebarRightIcon, TextFormatIcon } from './icons'

function TabBar() {
  const tabs = useIDE((s) => s.tabs)
  const activePath = useIDE((s) => s.activePath)
  const setActive = useIDE((s) => s.setActive)
  const closeTab = useIDE((s) => s.closeTab)
  const toggleInspector = useIDE((s) => s.togglePanel)

  return (
    <div className="tabbar">
      {tabs.map((t) => (
        <div
          key={t.path}
          className={`tab ${activePath === t.path ? 'active' : ''}`}
          onClick={() => setActive(t.path)}
        >
          <span className="ico">
            <EntryIcon entry={{ name: t.name, path: t.path, isDir: false, extension: t.name.split('.').pop() ?? null, hasChildrenDir: false }} />
          </span>
          <span>{t.name}</span>
          <button
            className="close"
            onClick={(e) => {
              e.stopPropagation()
              closeTab(t.path)
            }}
          >
            {t.isDirty ? <span className="dirty">●</span> : <XIcon size={12} />}
          </button>
        </div>
      ))}
      <div className="tabbar-actions">
        <button className="icon-btn" title="New File">
          <PlusIcon size={16} />
        </button>
        <button className="icon-btn" title="Toggle Inspector" onClick={() => toggleInspector('inspector')}>
          <SidebarRightIcon size={16} />
        </button>
      </div>
    </div>
  )
}

function EditorView({ path }: { path: string }) {
  const tab = useIDE((s) => s.tabs.find((t) => t.path === path)!)
  const updateContent = useIDE((s) => s.updateContent)
  const markSaved = useIDE((s) => s.markSaved)
  const setCursor = useIDE((s) => s.setCursor)
  const reveal = useIDE((s) => s.reveal)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  // Jump to a requested line/column (from search or outline results).
  const applyReveal = (editor: monaco.editor.IStandaloneCodeEditor) => {
    const r = useIDE.getState().reveal
    if (!r || r.path !== path) return
    editor.revealLineInCenter(r.line)
    editor.setPosition({ lineNumber: r.line, column: r.column })
    editor.focus()
  }

  useEffect(() => {
    const editor = editorRef.current
    if (editor && reveal && reveal.path === path) applyReveal(editor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal, path])

  const beforeMount: BeforeMount = (m) => {
    registerCodeEditTheme()
    void m
  }

  const mount: OnMount = (editor, m) => {
    editorRef.current = editor
    applyReveal(editor)
    editor.onDidChangeCursorPosition((e) => setCursor(e.position.lineNumber, e.position.column))
    editor.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.KeyS, async () => {
      const model = editor.getModel()
      if (!model) return
      if (isTauri) {
        try {
          await writeFile(path, model.getValue())
          markSaved(path)
        } catch {
          /* surface via a toast later */
        }
      } else {
        markSaved(path)
      }
    })
  }

  return (
    <Editor
      path={path}
      language={languageForFile(tab.name)}
      value={tab.content}
      theme="codeedit-dark"
      beforeMount={beforeMount}
      onMount={mount}
      onChange={(v) => updateContent(path, v ?? '')}
      loading={<div className="editor-empty"><span className="big">Loading editor…</span></div>}
      options={{
        fontFamily: 'var(--font-mono)',
        fontSize: 14,
        fontLigatures: true,
        minimap: { enabled: true, renderCharacters: false, maxColumn: 80 },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: 'phase',
        cursorSmoothCaretAnimation: 'on',
        padding: { top: 14, bottom: 14 },
        renderLineHighlight: 'all',
        scrollbar: {
          vertical: 'hidden',
          horizontal: 'hidden',
          handleMouseWheel: true,
          alwaysConsumeMouseWheel: false,
        },
        overviewRulerLanes: 0,
        guides: { indentation: true },
        bracketPairColorization: { enabled: true },
        automaticLayout: true,
      }}
    />
  )
}

export function EditorPane() {
  const activePath = useIDE((s) => s.activePath)
  const hasTabs = useIDE((s) => s.tabs.length > 0)
  const setWorkspace = useIDE((s) => s.setWorkspace)

  const openFolder = async () => {
    if (!isTauri) return
    const { open } = await import('@tauri-apps/plugin-dialog')
    const selected = await open({ directory: true })
    if (typeof selected === 'string') {
      const name = selected.split(/[\\/]/).filter(Boolean).pop() ?? selected
      setWorkspace(selected, name)
      const { gitStatus } = await import('../lib/tauri')
      gitStatus(selected).then((g) => useIDE.getState().setGit(g)).catch(() => {})
    }
  }

  return (
    <section className="editor-col">
      <TabBar />
      <div className="editor-host">
        {activePath && hasTabs ? (
          <EditorView key={activePath} path={activePath} />
        ) : (
          <div className="editor-empty">
            <TextFormatIcon size={40} style={{ color: '#3f434b' }} />
            <span className="big">No Editor</span>
            <span className="hint">Open a file from the Project Navigator</span>
            <button
              className="icon-btn"
              style={{ width: 'auto', padding: '6px 14px', marginTop: 8, border: '1px solid #3a3b40' }}
              onClick={openFolder}
            >
              Open Folder…
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
