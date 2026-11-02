# Nidavellir — Interactive Fiction & Gamebook Engine

[![Electron](https://img.shields.io/badge/Electron-41.5.0-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.3.3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tests-133%20suites%20%7C%201600%2B%20passed-22c55e?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D20%20%3C22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9%20%3C10-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

**Nidavellir** (*Silnik Gier Paragrafowych*) is a desktop Integrated Authoring Environment (IDE) tailored for creating, visualizing, editing, testing, and publishing non-linear gamebooks and branching interactive fiction.

It brings together an interactive Cytoscape.js story graph, an enhanced TipTap WYSIWYG Markdown editor, deep RPG character and trait sheets (Protagonist & NPC Folio), an in-app 2D media processor, an interactive playtester/simulator, and an automated multi-format publishing engine (PDF, DOCX, HTML, ZIP).

---

## Table of Contents

- [Key Features](#key-features)
- [Architecture & Design Principles](#architecture--design-principles)
- [Tech Stack](#tech-stack)
- [Project Directory Structure](#project-directory-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running in Development Mode](#running-in-development-mode)
  - [Packaging & Building Installers](#packaging--building-installers)
- [Available Scripts](#available-scripts)
- [Quality Assurance & Testing](#quality-assurance--testing)
- [Documentation Links](#documentation-links)
- [License](#license)

---

## Key Features

### 1. Visual Story Graph Editor
- **Cytoscape.js Canvas & Custom Web Components**: Custom `<paragraph-node>` and `<scene-node>` elements for visual node editing.
- **Dynamic Layout & Routing**: Collision-free curved/bezier edges, drag-and-drop node positioning, smooth pan/zoom, and hierarchical grouping of paragraphs into scenes.
- **Scene-level Isolation**: Organize complex branching narratives into manageable chapter-like scenes without losing global continuity.

### 2. Graph Diagnostics & Structural Validator
- **Integrity Validation**: Real-time detection of orphan nodes (missing incoming or outgoing connections), dead ends, and unreachable story paths.
- **Cycle & Loop Detection**: Deep path exploration identifying story loops with cycle tracing and instant one-click navigation to problematic nodes.

### 3. Advanced TipTap Markdown Editor
- **WYSIWYG Markdown**: Full prose editing featuring standard Markdown styling, dialogue blocks (`— `), and real-time word/character statistics.
- **Entity Mentions (`@`)**: Bidirectional linking to project entities (`entity://type/id`) with grammar alias resolution and hover previews.
- **Custom Stylistic Blocks**: Distinct typographic styles (whispers, thoughts, spells) equipped with CSS/XSS sanitization.
- **Typography Catalog**: Embedded Google Fonts catalog with offline caching and font switching.

### 4. RPG Mechanics & Character Sheets
- **Protagonist & NPC Folio**: Comprehensive character sheets for player characters, NPCs, and archetype templates.
- **Attributes, Stats & Vital Parameters**: Formula evaluator supporting mathematical expressions (e.g., `Armor + Agility * 2`) for dynamic derived values.
- **Skills & Inventory**: Skill trees with base modifier calculations, equipment slots, weight tracking, and inventory management.
- **Combat Integration**: Integrated combat block synchronization connecting paragraph text with structured combat encounters.

### 5. Media Asset Manager & 2D Image Editor
- **Isolated Custom Protocol**: Secure `asset://` protocol confining all image access strictly to `Assets/Images/` with path-traversal protection.
- **In-App Canvas 2D Processor (`ImageProcessor.ts`)**: Crop with Rule-of-Thirds overlay, precise scaling, 90° rotation, horizontal/vertical flipping, and real-time color filters (sepia, grayscale, contrast, brightness, saturation).
- **Asset Reference Tracking**: Track where images are referenced throughout paragraphs, characters, and items to prevent accidental deletions.

### 6. Interactive Playtester & Gamebook Simulator
- **Live Story Simulation**: Play through the gamebook paragraph-by-paragraph with dynamic evaluation of choice conditions (e.g., required stats, items, or flags).
- **State Inspector**: Live overview of hero statistics, current inventory, roll-the-dice emulator, and undoable step-by-step history log.

### 7. Multi-Format Publishing Subsystem
- **PDF Export**: Print-ready publishing layout with `@page` CSS formatting, book headers, dynamic page numbering, and table of contents.
- **DOCX Export**: Structured, editable Microsoft Word document with formatted headings, custom styles, and formatted character sheets.
- **Standalone HTML**: Self-contained web reader allowing users to play the gamebook in any modern browser without installing additional software.
- **ZIP Backup & Restore**: One-click complete project packaging into `.zip` archives with full media inclusion and automated restoration.
- **Paragraph Shuffling**: Optional paragraph renumbering/randomization with automatic recalculation of choice references and link targets.
- **Automated Appendices**: Automatic generation of Hero Sheets, NPC Bestiaries, combat rules, and entity indices.

---

## Architecture & Design Principles

```
┌──────────────────────────────────────────────────────────┐
│                   Renderer Process                       │
│  ┌────────────────────┐         ┌─────────────────────┐  │
│  │ View (HTML/CSS/JS) │ <=====> │   ViewModel (TS)    │  │
│  │ (View/ui/*)        │         │ (MainWindowVM, etc) │  │
│  └────────────────────┘         └──────────┬──────────┘  │
│                                            │             │
│                                 ┌──────────▼──────────┐  │
│                                 │   Domain Models     │  │
│                                 │   & Services (TS)   │  │
│                                 └─────────────────────┘  │
└────────────────────────────┬─────────────────────────────┘
                             │ contextBridge (window.electronAPI)
                             ▼
┌──────────────────────────────────────────────────────────┐
│                     Main Process                         │
│  ┌────────────────────┐         ┌─────────────────────┐  │
│  │  IPC Routers (CJS) │ ──────> │ Node.js Services    │  │
│  │  (main/ipc/*)      │         │ (main/services/*)   │  │
│  └────────────────────┘         └──────────┬──────────┘  │
│                                            │             │
│                                 ┌──────────▼──────────┐  │
│                                 │ File System & OS    │  │
│                                 │ (Atomic, Safe I/O)  │  │
│                                 └─────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 1. Model–View–ViewModel (MVVM)
- **Model (`Model/*.ts`)**: Pure TypeScript domain classes (`Project`, `Scene`, `Paragraph`, `Choice`, `PlayerCharacter`, `NPC`, `Item`, `Stat`, `Parameter`, `Skill`, `Location`, `Combat`, etc.). Fully decoupled from Electron APIs and DOM manipulation. Every model provides explicit getters/setters, `toJSON()`, and `static fromJSON()`.
- **ViewModel (`ViewModel/*.ts`)**: Presentation state, filter/search coordination, selection state, and history stacks.
- **View (`View/*.html`, `View/ui/**/*.js`)**: Modular ES modules in the browser. Modules communicate via an explicit application context (`appContext`) without relying on global state.

### 2. Process Isolation & Security
- **Strict Isolation**: Runs with `contextIsolation: true` and `nodeIntegration: false`.
- **Typed IPC Bridge**: The preload script (`preload.js`) exposes a secure, constrained `window.electronAPI` interface.
- **Transactional Atomic I/O**: File operations utilize atomic write patterns (`atomicWriteJsonSync`, `atomicWriteStringSync`) through temporary staging files and atomic renames. Path traversal attempts are blocked via strict boundary checks (`isPathInsideBase`).

### 3. Application Context (`appContext`) Pattern
UI controllers in `View/ui/` do not create or depend on global window variables. All shared state, view-model instances, event coordinators, and helper utilities are passed explicitly via a single context object (`ctx`).

---

## Tech Stack

| Layer / Subsystem             | Technology / Package                      | Description                                                                     |
| :---------------------------- | :---------------------------------------- | :------------------------------------------------------------------------------ |
| **Desktop Runtime**           | **Electron 41.5.0**                       | Multi-process Chromium + Node.js container with strict IPC isolation            |
| **Core Business Logic**       | **TypeScript 6.0.0**                      | Strongly-typed domain models, presentation logic, and frontend services         |
| **UI Styling**                | **Tailwind CSS 4.3.3**                    | Dark mode theme (`#18181b`), flexible utility layout, compiled via `@tailwindcss/cli` |
| **Graph Visualization**       | **Cytoscape.js 3.33.3**                   | Node-graph rendering engine with custom Web Components                          |
| **Rich Text Editor**          | **TipTap 3.x** (`@tiptap/core`, starter)  | WYSIWYG editor with Markdown integration, `@` mentions, and custom blocks       |
| **Document Publishing**       | **docx 9.11.0** & **Chromium printToPDF** | Generation of formatted Word documents (.docx) and print-ready PDFs             |
| **Packaging & Archiving**     | **archiver 8.x** & **adm-zip 0.6.x**      | Project backups, zip generation, and archive restoration                        |
| **Image Processing**          | **HTML5 Canvas 2D Engine**                | Custom `ImageProcessor.ts` for cropping, scaling, orientation, and color grading|
| **Localization (i18n)**       | **i18next 26.3.6** + `i18next-fs-backend` | Type-safe translation engine with English (`en`), Polish (`pl`), and German (`de`)|
| **Bundling & Build Pipeline** | **esbuild 0.28.2** + **tsc**              | High-performance compilation and bundling of renderer modules into `dist/`      |
| **Automated Testing**         | **Vitest 1.x** + **happy-dom 20.x**       | Comprehensive unit and integration test suite (133 suites, 1600+ test cases)    |
| **Code Quality & Linting**    | **ESLint 8**, **Prettier 3**, **Husky 9** | Enforced coding conventions, automatic import ordering, and pre-commit hooks    |

---

## Project Directory Structure

```text
SilnikGierParagrafowych/
├── main.js                      # Electron main process entry point
├── preload.js                   # Secure context bridge (window.electronAPI)
├── package.json                 # Project dependencies, build scripts, engine constraints
├── tsconfig.json                # TypeScript compiler configuration (strict mode)
├── vitest.config.ts             # Vitest test runner configuration
│
├── main/                        # Electron Main Process backend
│   ├── windowManager.js         # BrowserWindow lifecycle and window management
│   ├── ipc/                     # Modular IPC route controllers
│   │   ├── index.js             # IPC handler registration aggregator
│   │   ├── projectIpc.js        # Project CRUD (create, open, save)
│   │   ├── entityIpc.js         # Entity folder and element.json management
│   │   ├── markdownIpc.js       # Atomic read/write operations for .md narratives
│   │   ├── assetIpc.js          # Asset import, indexing, and resolution
│   │   ├── exportIpc.js         # Multi-format exports (PDF, DOCX, HTML, ZIP)
│   │   ├── recentProjectsIpc.js # Recent project history handlers
│   │   └── appIpc.js            # App lifecycle, system settings, and i18n
│   └── services/                # Pure Node.js business services
│       ├── ProjectService.js    # Project disk scaffolding and entity serialization
│       ├── EntityService.js     # Directory naming, slugs, and element metadata
│       ├── MarkdownService.js   # Safe reading and atomic writing of Markdown
│       ├── AssetService.js      # Image file management in Assets/Images/
│       ├── AssetProtocolService.js # Custom asset:// protocol security boundary
│       ├── ExportService.js     # Document compilation for PDF, DOCX, HTML, ZIP
│       └── RecentProjectsService.js # Persistent recent projects store in userData
│
├── Model/                       # Domain models (pure TypeScript, no UI/Electron imports)
│   ├── Project.ts               # Root aggregate root
│   ├── Scene.ts                 # Scene container grouping narrative paragraphs
│   ├── Paragraph.ts             # Core narrative node (text, choices, combat, tags)
│   ├── Choice.ts                # Directional link / branch between paragraphs
│   ├── Condition.ts             # Choice logic and availability criteria
│   ├── PlayerCharacter.ts       # Protagonist sheet
│   ├── CharacterClass.ts        # Character class definitions
│   ├── NPC.ts & NPC_Template.ts # Non-player characters and archetype templates
│   ├── Location.ts              # World map / scene location entity
│   ├── Item.ts                  # Inventory item and equipment definition
│   ├── Stat.ts                  # Base attribute/stat
│   ├── Parameter.ts             # Dynamic parameter (value or mathematical formula)
│   ├── Skill.ts                 # Character skill with attribute modifier
│   ├── Feature.ts               # Special traits and unique abilities
│   ├── Combat.ts                # Turn-based combat parameters
│   ├── Tag.ts                   # Colored category tags
│   └── Description.ts           # Entity summary and linked Markdown path
│
├── Modules/                     # Dedicated standalone subsystems
│   ├── Graph/                   # Cytoscape.js canvas and custom Web Components
│   ├── Editor/                  # TipTap editor, custom Markdown extensions, fonts
│   └── ImageEditor/             # Canvas 2D image processing engine
│
├── ViewModel/                   # MVVM Presentation layer (TypeScript)
│   ├── StartWindowViewModel.ts  # Logic for startup & recent projects screen
│   └── MainWindowViewModel.ts   # Main editor state, selection, filters, history
│
├── View/                        # Presentation layer (HTML, Tailwind CSS, UI controllers)
│   ├── StartWindow.html         # Startup window template
│   ├── MainWindow.html          # Main application workspace layout
│   ├── MainWindow.js            # Frontend coordinator and appContext builder
│   ├── MainWindow.css           # Tailwind CSS source styles
│   ├── MainWindow.generated.css # Compiled production stylesheet
│   └── ui/                      # Modular UI controllers
│       ├── assets/              # Media manager, asset picker, image editor modal
│       ├── common/              # Shared templates, confirmation modals, avatars
│       ├── detailsPanel/        # Right inspector panel, combat, exits, history
│       ├── drawer/              # Left entity explorer, faceted search, tag filters
│       ├── editor/              # TipTap toolbar, custom styles, font browser
│       ├── graph/               # Graph controller, zoom controls, drop zones
│       ├── modals/              # Export, Hero, NPC, and Playtester modals
│       ├── project/             # Autosave service, dirty state tracker, saver
│       └── workspace/           # Top bar, quick search palette, context menus
│
├── Services/                    # Frontend services
│   ├── project/                 # ProjectManager active project memory singleton
│   ├── graph/                   # Graph diagnostics and paragraph renumbering
│   ├── combat/                  # Markdown combat block generation and sync
│   ├── markdown/                # Entity link updates and text transclusion
│   ├── export/                  # Export validation and RPG rule compile helpers
│   └── helpers/                 # Regular expressions, validators, sanitizers
│
├── Utils/                       # Cross-cutting utility modules
│   ├── assets/                  # Asset path constants and reference checkers
│   ├── fs/                      # Path security, atomic writes, name sanitizers
│   ├── i18n/                    # Localization system (i18n.js, translate.ts)
│   ├── ui/                      # SVG icon registry and toast notifications
│   └── common/                  # Unique ID generators
│
├── Locales/                     # Localization JSON dictionaries (en, pl, de)
├── docs/                        # Deep-dive architecture and design documentation
└── tests/                       # Complete Vitest test suite (133 test files)
```

---

## Getting Started

### Prerequisites

Ensure your development environment meets the following requirements:
- **Node.js**: `>= 20.0.0 < 22.0.0`
- **pnpm**: `>= 9.0.0 < 10.0.0` (*pnpm is enforced by the project*)

### Installation

Clone the repository and install the dependencies using pnpm:

```bash
git clone https://github.com/mountain-bit/SilnikGierParagrafowych.git
cd SilnikGierParagrafowych
pnpm install
```

### Running in Development Mode

To build required assets and launch the Electron application:

```bash
pnpm start
```

> **Note:** The `pnpm start` script executes Tailwind CSS compilation (`MainWindow.generated.css`), invokes `esbuild` for the renderer bundles via `scripts/build-renderer.js`, performs a static TypeScript type check (`tsc --noEmit`), and launches Electron.

To develop with live rebuilds of CSS or renderer modules in separate terminals:

```bash
# Watch and rebuild renderer TypeScript scripts
pnpm run renderer:watch

# Watch and rebuild Tailwind CSS stylesheets
pnpm run css:watch
```

### Packaging & Building Installers

Create production-ready distributions using Electron Builder:

```bash
# Build an unpacked executable folder for testing in release-builds/
pnpm run pack

# Build the complete Windows installer (.exe)
pnpm run dist
```

---

## Available Scripts

| Command | Action |
| :--- | :--- |
| `pnpm start` | Builds styles, compiles renderer scripts, checks TypeScript types, and boots Electron. |
| `pnpm build` | Full build of Tailwind CSS styles, esbuild bundling, and static type check. |
| `pnpm renderer:watch` | Runs esbuild in watch mode to automatically rebuild renderer bundles on file changes. |
| `pnpm css:build` | Compiles and minifies `View/MainWindow.css` into `View/MainWindow.generated.css`. |
| `pnpm css:watch` | Watches for changes in HTML/JS templates and updates the generated CSS in real time. |
| `pnpm test` | Starts the Vitest test runner in interactive watch mode. |
| `pnpm test:run` | Runs the full Vitest test suite once across all 133 test files. |
| `pnpm test:coverage` | Executes tests and generates a test coverage report (`coverage/index.html`). |
| `pnpm license:check` | Verifies all runtime and build dependencies against the permitted open-source license list. |
| `pnpm lint` | Runs ESLint across all TypeScript and JavaScript files. |
| `pnpm lint:fix` | Automatically fixes ESLint errors and sorts imports via `eslint-plugin-simple-import-sort`. |
| `pnpm format` | Formats all code according to project Prettier guidelines (no semicolons, single quotes, 4-space indent). |
| `pnpm format:check` | Verifies whether all files conform to Prettier formatting rules without altering them. |
| `pnpm pack` | Compiles the project and creates an unpacked Electron executable directory. |
| `pnpm dist` | Compiles and builds the production installer for Windows. |

---

## Quality Assurance & Testing

- **Comprehensive Test Suite**: The repository maintains rigorous automated test coverage. All domain models, ViewModels, service layers, utilities, and UI adapters are tested using **Vitest** and **happy-dom**.
- **Automated Git Hooks**:
  - `pre-commit`: Executes `lint-staged` to format and lint staged files via Prettier and ESLint.
  - `pre-push`: Runs the full test suite (`pnpm test:run`) and license verification (`pnpm license:check`) before changes can be pushed to remote branches.
- **Type-Safe Internationalization**: Keys in `Locales/` (`en.json`, `pl.json`, `de.json`) are checked against the TypeScript type system (`TranslationKey`) to prevent missing string identifiers.

---

## Documentation Links

For further technical details and architectural deep dives, see the documents in the [`docs/`](docs/) directory:

- [System Architecture](docs/ARCHITECTURE.md)
- [Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md)
- [Main Process Architecture](docs/MAIN_PROCESS_ARCHITECTURE.md)
- [View Layer Modularization](docs/VIEW_LAYER_MODULARIZATION.md)
- [Choice Subsystem Specification](docs/CHOICE_SUBSYSTEM.md)
- [Editor Extensions & Custom Styles](docs/EDITOR_EXTENSIONS.md)

---
