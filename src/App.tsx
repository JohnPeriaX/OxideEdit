import { useEffect } from 'react'
import { TitleBar } from './components/TitleBar'
import { ActivityBar } from './components/ActivityBar'
import { Navigator } from './components/Navigator'
import { EditorPane } from './components/EditorPane'
import { UtilityPanel } from './components/UtilityPanel'
import { Inspector } from './components/Inspector'
import { StatusBar } from './components/StatusBar'
import { useIDE } from './state/store'
import { gitStatus, isTauri } from './lib/tauri'
import './App.css'

async function openFolderDialog() {
  if (!isTauri) return
  const { open } = await import('@tauri-apps/plugin-dialog')
  const selected = await open({ directory: true })
  if (typeof selected !== 'string') return
  const name = selected.split(/[\\/]/).filter(Boolean).pop() ?? selected
  const store = useIDE.getState()
  store.setWorkspace(selected, name)
  gitStatus(selected).then(store.setGit).catch(() => {})
}

function App() {
  const navigatorVisible = useIDE((s) => s.navigatorVisible)
  const inspectorVisible = useIDE((s) => s.inspectorVisible)
  const utilityVisible = useIDE((s) => s.utilityVisible)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      const store = useIDE.getState()
      if (e.key.toLowerCase() === 'o') {
        e.preventDefault()
        void openFolderDialog()
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault()
        store.togglePanel('navigator')
      } else if (e.key.toLowerCase() === 'j') {
        e.preventDefault()
        store.togglePanel('utility')
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault()
        store.togglePanel('inspector')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Browser preview only: seed a demo file so Monaco/tabs are explorable
  // without the native folder picker. Never runs inside the Tauri shell.
  useEffect(() => {
    if (isTauri) return
    const store = useIDE.getState()
    if (store.tabs.length === 0) {
      store.setWorkspace('demo://todo-list-app', 'todo-list-app')
      const sample = `// Created by Austin Condiff on 02/16/2022
import React, { useState, useCallback } from "react";
import TodoList from "./TodoList";
import "./styles.css";

const mockData = [
  {
    id: 1,
    label: "Sample Todo",
    done: false
  }
];

export default function App() {
  const [todos, setTodos] = useState(mockData);

  const createTodo = useCallback(() => {
    setTodos((todos) => {
      let updatedTodos = [
        ...todos,
        {
          id: todos.length + 1,
          label: "",
          done: false
        }
      ];
      return updatedTodos;
    });
  }, [setTodos]);

  return <TodoList todos={todos} onCreate={createTodo} />;
}
`
      store.openTab({
        path: 'demo://todo-list-app/src/App.jsx',
        name: 'App.jsx',
        content: sample,
        savedContent: sample,
        isDirty: false,
      })
    }
  }, [])

  return (
    <div className="app">
      <TitleBar />
      <div className="body">
        <ActivityBar />
        {navigatorVisible && <Navigator />}
        <div className="editor-stack">
          <EditorPane />
          {utilityVisible && <UtilityPanel />}
        </div>
        {inspectorVisible && <Inspector />}
      </div>
      <StatusBar />
    </div>
  )
}

export default App
