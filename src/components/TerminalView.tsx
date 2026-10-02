import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import { ptyWrite, ptyResize, onPtyOutput, isTauri } from '../lib/tauri'

// CodeEdit "Default (Dark)" terminal palette, from the .cetheme.
const TERM_THEME = {
  background: '#292a30',
  foreground: '#ffffff',
  cursor: '#ffffff',
  selectionBackground: '#646f83',
  black: '#1f2024',
  red: '#ff8170',
  green: '#78c2b3',
  yellow: '#d9c97c',
  blue: '#b281eb',
  magenta: '#ff7ab2',
  cyan: '#4eb0cc',
  white: '#d9d9d9',
  brightBlack: '#8e8e93',
  brightRed: '#ff8170',
  brightGreen: '#78c2b3',
  brightYellow: '#d9c97c',
  brightBlue: '#b281eb',
  brightMagenta: '#ff7ab2',
  brightCyan: '#4eb0cc',
  brightWhite: '#ffffff',
}

export function TerminalView({ sessionId }: { sessionId: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const term = new Terminal({
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      cursorBlink: true,
      theme: TERM_THEME,
      scrollback: 8000,
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.loadAddon(new WebLinksAddon())
    term.open(host)
    fit.fit()

    if (!isTauri) {
      term.writeln('\x1b[33mCodeEditX preview\x1b[0m — the PTY terminal needs the native shell.')
      term.writeln('Run \x1b[1mnpm run tauri dev\x1b[0m to get a real shell here.')
      return () => term.dispose()
    }

    // Stream PTY output into this session's xterm.
    let unlisten: (() => void) | undefined
    let disposed = false
    onPtyOutput((p) => {
      if (p.id === sessionId) term.write(Uint8Array.from(p.data))
    }).then((fn) => {
      if (disposed) fn()
      else unlisten = fn
    })

    // Keystrokes -> PTY.
    const dataDisp = term.onData((d) => void ptyWrite(sessionId, d))

    // Keep the PTY sized to the viewport.
    void ptyResize(sessionId, term.cols, term.rows)
    const ro = new ResizeObserver(() => {
      fit.fit()
      void ptyResize(sessionId, term.cols, term.rows)
    })
    ro.observe(host)

    return () => {
      disposed = true
      ro.disconnect()
      unlisten?.()
      dataDisp.dispose()
      term.dispose()
    }
  }, [sessionId])

  return <div className="term-host" ref={hostRef} />
}
