# OxideEdit

**TH:** โปรแกรมแก้ไขโค้ดข้ามแพลตฟอร์ม สร้างด้วย Rust, Tauri 2 และ TypeScript ได้แรงบันดาลใจจาก CodeEdit และ Xcode รองรับ Windows, Linux และ macOS

**EN:** A cross-platform code editor built with Rust, Tauri 2, and TypeScript, inspired by CodeEdit and Xcode, for Windows, Linux, and macOS.

[ภาษาไทย](#ภาษาไทย) | [English](#english)

## ภาษาไทย

OxideEdit เป็น Code Editor แบบ Cross-Platform ที่พัฒนาขึ้นใหม่โดยใช้ **Rust + Tauri 2** เป็นแกนหลัก และใช้ **HTML / CSS / TypeScript (React)** เป็น UI

เป้าหมายคือสร้างประสบการณ์การพัฒนาโค้ดที่ใกล้เคียง IDE สมัยใหม่ โดยเน้น:

- Windows, Linux และ macOS
- Native WebView ของแต่ละระบบ
- Monaco Editor เป็น editor component
- Integrated Terminal ด้วย xterm.js + PTY
- โครงสร้างพร้อมต่อยอด LSP, Tree-sitter และ Git
- สถาปัตยกรรมที่แยก frontend และ native backend อย่างชัดเจน

### Platform

| Platform | WebView |
| --- | --- |
| Windows | WebView2 |
| Linux | WebKitGTK |
| macOS | WKWebView |

### Editor

OxideEdit ไม่เขียน text editor จากศูนย์ แต่ใช้ **Monaco Editor** เป็น component หลัก

รองรับหรือวางโครงไว้สำหรับ:

- Syntax highlighting
- Tabs และ split editor
- Search / Replace
- Multiple cursors
- Code folding
- Minimap
- Themes
- Code completion

### Native backend

Rust/Tauri รับผิดชอบงาน native เช่น:

- Filesystem
- Git
- Integrated Terminal / PTY
- LSP process management
- Workspace search
- Platform integration

### LSP / Tree-sitter / Git

ระบบ LSP และ Tree-sitter ถูกเตรียมเป็น subsystem แยกเพื่อให้พัฒนาต่อได้โดยไม่ผูกติดกับ UI

Git รองรับสถานะ repository, branch, diff และการทำงานต่อยอดอื่น ๆ ผ่าน Rust backend

### Project structure
    src/
      components/        React UI
      hooks/             Frontend hooks
      lib/               Tauri, Monaco, theme helpers
      state/             Zustand application state

    src-tauri/
      src/
        fs.rs             Filesystem commands
        git.rs            Git integration
        lsp.rs            LSP scaffold
        syntax.rs         Tree-sitter scaffold
        term.rs           PTY terminal
        search.rs         Workspace search
        lib.rs            Tauri application entry

    .github/workflows/
      build.yml           Windows / Linux / macOS CI

## การพัฒนา

### Requirements

- Rust stable
- Node.js 22+
- npm
- Tauri 2 prerequisites
- Windows: WebView2
- Linux: WebKitGTK development packages
- macOS: Xcode Command Line Tools

### Run

    npm install
    npm run tauri:dev

สำหรับดู UI ใน browser:

    npm run dev
### Build

    npm run build
    npm run tauri:build

## English

OxideEdit is an independently developed cross-platform code editor built on **Rust + Tauri 2**, with a UI written in **HTML / CSS / TypeScript (React)**.

The project is designed for Windows, Linux, and macOS and uses the platform WebView provided by Tauri.

### Platform

| Platform | WebView |
| --- | --- |
| Windows | WebView2 |
| Linux | WebKitGTK |
| macOS | WKWebView |

### Editor

OxideEdit does not implement a text editor from scratch. It uses **Monaco Editor** as the editor component.

Planned and supported editor capabilities include syntax highlighting, tabs, split views, search/replace, multiple cursors, code folding, minimap, themes, and code completion.

### Native backend

Rust/Tauri provides the native application layer for filesystem access, Git, PTY terminal sessions, LSP process management, workspace search, and platform integration.

### LSP / Tree-sitter / Git
The project contains dedicated scaffolding for LSP and Tree-sitter so language tooling can evolve independently from the UI.

Git integration is provided through the Rust backend and is intended to grow into a first-class source-control experience.

## Inspiration

OxideEdit is an independent implementation inspired by the developer experience, workflow, and interface ideas of **CodeEdit, Xcode, and modern IDEs**.

It does not copy source code from CodeEdit or Xcode and is not affiliated with Apple or CodeEdit.

Referenced names and trademarks belong to their respective owners.

## License

OxideEdit is licensed under the **GNU Affero General Public License v3.0 or later (AGPLv3-or-later)**.

SPDX:

    AGPL-3.0-or-later

See `LICENSE` for the full license text. For a plain-language explanation before forking or distributing OxideEdit, see [`LICENSING.md`](LICENSING.md).

Copyright © 2026 OxideEdit contributors.
