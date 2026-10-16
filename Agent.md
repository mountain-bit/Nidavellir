# Agent.md — Gamebook Engine (Silnik Gier Paragrafowych)

This document is the **single source of truth** for AI agents operating in this repository. Follow it precisely — deviations cause regressions.

---

## 1. Project Overview

A desktop application for **creating, editing, and managing gamebook (paragraph) games**.
Built on **Electron** with **TypeScript** domain logic, **plain JavaScript** view controllers, and **Tailwind CSS 4** styling. Features include: interactive branching storylines, scenes, paragraphs, choices, combat mechanics, NPC databases, player character sheets, items, traits (stats, skills, parameters, features), and a Cytoscape.js-powered story graph editor.

---

## 2. Tech Stack (Exact Versions)

| Layer                    | Technology                       | Details                                                                               |
| ------------------------ | -------------------------------- | ------------------------------------------------------------------------------------- |
| Desktop framework        | **Electron 41.5**                | Multi-process (Chromium + Node.js). `contextIsolation: true`, `nodeIntegration: false` |
| Runtime                  | **Node.js ≥20 <22, pnpm ≥9 <10** | Enforced via `engines` in `package.json`. **Always use `pnpm`**, never `npm`          |
| Domain logic language    | **TypeScript 6+** (`strict`)     | Pure domain models and MVVM presentation logic, compiled by esbuild                    |
| View controllers         | **Plain JavaScript (ES modules)**| `View/*.js`, `View/ui/*.js` — ESM in browser, CommonJS on main process                 |
| Main process             | **Plain JavaScript (CommonJS)**  | `main.js`, `main/**/*.js` — CommonJS `require()`                                      |
| Bundler                  | **esbuild 0.28+**                | Bundles TS→ESM for the renderer. Config: `scripts/build-renderer.js`                   |
| UI & Styling             | **HTML5 + Tailwind CSS 4.3+**    | `@tailwindcss/cli`, source `View/MainWindow.css` → `View/MainWindow.generated.css`    |
| Graph visualization      | **Cytoscape.js 3.33+**           | Node-graph renderer with custom Web Components (`<paragraph-node>`, `<scene-node>`)    |
| Testing                  | **Vitest 1.x + happy-dom 20+**   | Fast unit/integration tests. Coverage via `@vitest/coverage-v8`                        |
| Linting                  | **ESLint 8 + @typescript-eslint 7** | Type-aware rules for `.ts`, standard `espree` for `.js`                             |
| Formatting               | **Prettier 3**                   | No semicolons, single quotes, trailing commas `es5`, 100 char width, 4-space indent    |
| Import ordering          | **eslint-plugin-simple-import-sort** | Auto-sorted imports and exports in all `.ts` / `.js` files                          |
| Git hooks                | **Husky 9 + lint-staged 15**     | `pre-commit`: Prettier + ESLint fix. `pre-push`: license check + test suite            |
| Localization (i18n)      | **i18next 26 + i18next-fs-backend** | Three locales: `en` (canonical default), `pl`, `de`                                |
| License compliance       | **`scripts/check-licenses.js`**  | Allowlist: MIT, ISC, Apache-2.0, BSD-2/3, 0BSD, CC0-1.0, MPL-2.0, Python-2.0          |

---

## 3. Core Architecture & Design Patterns

### 3.1. MVVM (Model–View–ViewModel)

```
Model (pure TS)  ←→  ViewModel (TS)  ←→  View (HTML + JS controllers)
                          ↑
                     Services (TS)
```

- **Model (`Model/*.ts`)** — Pure domain classes. Private fields, public getters/setters. Each class has `toJSON()` and `static fromJSON()`. **No UI, no Electron imports.**
- **ViewModel (`ViewModel/*.ts`)** — Presentation logic, selection state, search/filter, undo history. Instantiated in View JS, never in Model.
- **View (`View/*.html`, `View/*.js`, `View/ui/*.js`)** — HTML views loaded by Electron BrowserWindows. Modular UI controllers in `View/ui/`.
- **Services (`Services/*.ts`)** — Cross-cutting concerns (e.g. `ProjectManager` singleton).

### 3.2. Modular View Controllers & Context Object Pattern

The View layer is split into focused controller modules in `View/ui/`:

| Module                              | Responsibility                                               |
| ----------------------------------- | ------------------------------------------------------------ |
| `detailsPanel/detailsPanel.js`      | Right-sidebar property inspector, entity details, history bar |
| `drawer/drawerLists.js`             | Left-drawer entity lists (paragraphs, scenes, characters, locations, tags, traits, skills, parameters, features, connections) |
| `workspace/contextMenu.js`          | Right-click context menus, section controls, color palette    |
| `drawer/filterPopover.js`           | Faceted search & filter popover for paragraphs                |
| `common/htmlTemplates.js`           | Shared HTML template builder functions                        |
| `workspace/workspace.js`            | Main workspace tabs, resizers, zoom toolbar, file editor      |
| `npcModal/npcModal.js`              | NPC creation/edit modal (orchestrator)                        |
| `npcModal/*.js`                     | NPC modal sub-modules: `npcState`, `npcTemplates`, `npcSectionControllers`, `npcCharacterSaver`, `npcDraggable`, `formulaEvaluator` |

**All controllers receive a shared `appContext` object** (defined in `MainWindow.js`) which provides:
- `vm` — the `MainWindowViewModel` instance
- `projectData` — current project data state (tags, characters, paragraphs, etc.)
- Helper methods: `selectEntity()`, `refreshActiveSection()`, bound render functions, etc.

**Rule**: Never create new global state. Thread all shared state through `appContext`. New View controllers must accept `ctx` as their first parameter.

### 3.3. Modular Main Process Architecture

```
main.js (bootstrap)
├── main/windowManager.js        — BrowserWindow creation
├── main/ipc/index.js            — registerAllIpc() aggregator
│   ├── projectIpc.js            — Project create/open handlers
│   ├── entityIpc.js             — Entity CRUD handlers
│   ├── markdownIpc.js           — Markdown file read/write
│   ├── recentProjectsIpc.js     — Recent projects
│   └── appIpc.js                — App lifecycle, i18n, system info
└── main/services/               — Pure Node.js business logic
    ├── ProjectService.js        — Project creation, entity loading
    ├── EntityService.js         — Entity folder scaffolding, element.json
    ├── MarkdownService.js       — Safe read + atomic write of .md files
    └── RecentProjectsService.js — Recent projects persistence
```

### 3.4. Electron Security Model

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- **IPC via `preload.js`**: exposes `window.electronAPI` using `contextBridge.exposeInMainWorld()`.
- All file paths validated through `Utils/fsSecurity.js` (path traversal protection) and `Utils/pathSanitizer.js` (slug generation).
- Atomic writes via `atomicWriteJsonSync()` / `atomicWriteStringSync()` — write to temp file, then rename.
- **Rule**: Never import `electron`, `fs`, `path`, or `child_process` in renderer-side code. Use only `window.electronAPI`.

### 3.5. Singleton & Aggregate Roots

- **`ProjectManager`** (`Services/ProjectManager.ts`) — Singleton (`getInstance()`) managing the current project in the renderer.
- **`Project`** (`Model/Project.ts`) — Aggregate root containing all entities (scenes, paragraphs, NPCs, items, etc.).

### 3.6. Story Graph Subsystem (`Modules/Graph/`)

| File                    | Purpose                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| `StoryGraph.ts`         | Cytoscape.js coordinator — layout, zoom, drag, edge management     |
| `ParagraphNode.ts/html` | Custom Web Component `<paragraph-node>` for graph paragraph nodes  |
| `SceneNode.ts/html`     | Custom Web Component `<scene-node>` for scene container nodes      |
| `StoryGraphStyles.ts`   | Edge styles (straight, bezier, taxi), collision prevention          |
| `types.ts`              | `IStoryGraphOptions` configuration interface                       |
| `index.ts`              | Public re-exports                                                  |

The graph subsystem is bundled by esbuild and consumed via `dist/Modules/Graph/index.js`.

### 3.7. Centralized SVG Icon System (`Utils/icons.ts`)

All UI icons are defined as inline SVG strings in `Utils/icons.ts` with typed `IconName` keys. **Never add ad-hoc SVG icons in HTML** — always add new icons to this module and reference via the `icon()` function or the `ICONS` map.

### 3.8. Toast Notification System (`Utils/toast.ts`)

Programmatic toast notifications with four severity levels: `success`, `warning`, `error`, `info`. Toast uses Tailwind classes and auto-creates a DOM container. Use `toast({ message, type, title?, duration? })`.

### 3.9. Rich Markdown Editor Subsystem (`Modules/Editor/` & `View/ui/editor/`)

The application features a TipTap-powered Rich WYSIWYG Markdown Editor that seamlessly synchronizes with standard Markdown files and Gamebook Engine project metadata:
- **`MarkdownEditor.ts`**: Core TipTap wrapper handling word/char stats, entity autocomplete via `@`, typography formatting, dialog blocks, and custom styled spans.
- **`CustomStylesService.ts` & `styleSanitizer.ts`**: Pure services managing project-specific text styling rules (thoughts, spells, whisper) with CSS injection and validation against CSS injection/XSS.
- **`CustomFontsService.ts`, `fontCatalog.ts`, `fontStacks.ts`**: Manages curated fantasy Google Fonts and offline fallback catalogs, dynamic `<link>` injection, and CSS font-stack fallbacks.
- **`EntitySyncService.ts`**: Scans document AST or markdown syntax `[Name](entity://type/id)` to auto-sync mentioned locations, characters, and tags with the active scene/paragraph/NPC.
- **UI Modularization (`View/ui/editor/`)**: Decomposed into focused ES modules: `editorToolbar.js`, `customStylesMenu.js`, `customStyleModal.js`, `fontBrowserModal.js`, and `mainEditor.js`. All UI elements utilize centralized SVG icons (`Utils/icons.ts`) and full multilingual localization (`Locales/{pl,en,de}/translation.json`).

---

## 4. Directory Structure

```text
SilnikGierParagrafowych/
├── main.js                        # Electron main process entry (CommonJS)
├── preload.js                     # ContextBridge API (CommonJS)
├── renderer.js                    # Minimal renderer bootstrap
├── index.html                     # Electron entry HTML
├── package.json                   # pnpm project config
├── tsconfig.json                  # TypeScript strict config (target ES2020, bundler resolution)
├── vitest.config.ts               # Vitest config (node env, rawHtmlPlugin, electron mock alias)
├── .eslintrc.json                 # ESLint config (type-aware TS, espree JS)
├── .prettierrc.json               # Prettier config (no semi, singleQuote, tabWidth 4)
├── styles.css                     # Global base styles
│
├── main/                          # Main process modules (CommonJS)
│   ├── windowManager.js
│   ├── ipc/                       # IPC handlers
│   │   ├── index.js               # registerAllIpc() aggregator
│   │   ├── projectIpc.js
│   │   ├── entityIpc.js
│   │   ├── markdownIpc.js
│   │   ├── recentProjectsIpc.js
│   │   └── appIpc.js
│   └── services/                  # Node.js filesystem services
│       ├── ProjectService.js
│       ├── EntityService.js
│       ├── MarkdownService.js
│       └── RecentProjectsService.js
│
├── Model/                         # Pure domain classes (TypeScript)
│   ├── constants.ts               # ENTITY_CATEGORIES, PRESET_ENTITY_COLORS, DEFAULT_*_COLOR
│   ├── Project.ts                 # Aggregate root
│   ├── Scene.ts                   # Scene container
│   ├── Paragraph.ts               # Narrative paragraph
│   ├── Choice.ts                  # Choice / jump between paragraphs
│   ├── Condition.ts               # Logical condition for choices
│   ├── TextCondition.ts           # Re-export barrel for Condition
│   ├── NPC.ts                     # Non-player character
│   ├── NPC_Template.ts            # NPC archetype template
│   ├── PlayerCharacter.ts         # Player character sheet
│   ├── CharacterClass.ts          # Character class
│   ├── Item.ts                    # Item / equipment
│   ├── Location.ts                # World location
│   ├── Description.ts             # Description model (single markdown file + summary)
│   ├── Tag.ts                     # Color-coded categorization tag
│   ├── Stat.ts                    # Character stat / attribute
│   ├── Skill.ts                   # Character skill (direct value or stat modifier)
│   ├── Parameter.ts               # Character parameter / vital (direct value or formula)
│   └── Feature.ts                 # Character feature / special trait
│
├── ViewModel/                     # Presentation logic (TypeScript)
│   ├── MainWindowViewModel.ts     # Main editor ViewModel (selection, undo, search, state)
│   └── StartWindowViewModel.ts    # Start window ViewModel (create/open/recent)
│
├── Services/                      # Cross-cutting services (TypeScript)
│   └── ProjectManager.ts          # Singleton — active project in renderer
│
├── Modules/                       # Feature modules (TypeScript)
│   ├── Graph/                     # Story graph subsystem (Cytoscape.js + Web Components)
│   │   ├── StoryGraph.ts
│   │   ├── ParagraphNode.ts/html
│   │   ├── SceneNode.ts/html
│   │   ├── ParagraphNodeTemplate.ts
│   │   ├── SceneNodeTemplate.ts
│   │   ├── StoryGraphStyles.ts
│   │   ├── types.ts
│   │   └── index.ts
│   └── Editor/                    # Rich Markdown Editor subsystem (TipTap + i18n + Fonts)
│       ├── MarkdownEditor.ts      # Core TipTap Markdown Editor implementation
│       ├── CustomStylesService.ts # Custom text style management & stylesheet injection
│       ├── CustomFontsService.ts  # Google Fonts loader, cache, offline fallback
│       ├── EntitySyncService.ts   # Document mention scanning & scene/NPC auto-sync
│       ├── styleSanitizer.ts      # CSS & XSS injection sanitizer
│       ├── fontCatalog.ts         # Curated & offline font datasets
│       ├── fontStacks.ts          # System serif/mono/sans font stack fallbacks
│       ├── constants.ts           # Editor URLs, timeouts, defaults
│       ├── types.ts               # Interfaces for formatting, styles, fonts, entities
│       ├── extensions/            # TipTap custom extensions (CustomStyleMark, DialogBlock, etc.)
│       └── ui/                    # Editor UI components (MentionSuggestionRenderer)
│
├── View/                          # HTML views & JS controllers
│   ├── StartWindow.html           # Start screen
│   ├── MainWindow.html            # Main editor
│   ├── MainWindow.js              # Main controller (creates appContext)
│   ├── MainWindow.css             # Tailwind source CSS (custom properties, component styles)
│   ├── MainWindow.generated.css   # Compiled Tailwind output (DO NOT EDIT)
│   ├── mockData.js                # Mock project data for development
│   ├── projectData.js             # Data loading (mock vs real)
│   └── ui/                        # Modular view controllers
│       ├── detailsPanel.js        # Right sidebar details inspector
│       ├── drawerLists.js         # Left drawer entity lists
│       ├── contextMenu.js         # Context menus & color picker
│       ├── filterPopover.js       # Paragraph search & filters
│       ├── htmlTemplates.js       # HTML template builders
│       ├── workspace.js           # Workspace layout, resizers, tabs, graph view
│       ├── editor/                # Rich text editor UI modules
│       │   ├── editorToolbar.js   # Toolbar click bindings & active states
│       │   ├── customStylesMenu.js # Custom styles dropdown menu
│       │   ├── customStyleModal.js # Style creation / edit modal with live preview
│       │   ├── fontBrowserModal.js # Google Fonts online/offline browser modal
│       │   ├── mainEditor.js      # Main editor instance & auto-sync trigger
│       │   └── index.js           # Editor UI aggregator
│       ├── npcAvatars.js          # NPC avatar definitions
│       ├── npcModal.js            # NPC modal orchestrator
│       └── npcModal/              # NPC modal sub-modules
│           ├── npcState.js
│           ├── npcTemplates.js
│           ├── npcSectionControllers.js
│           ├── npcCharacterSaver.js
│           ├── npcDraggable.js
│           └── formulaEvaluator.js
│
├── Utils/                         # Shared utilities
│   ├── translate.ts               # Frontend i18n (t(), setLanguage(), getLanguage())
│   ├── i18n.js                    # Backend i18n (initI18n(), Node.js)
│   ├── icons.ts                   # Centralized SVG icon registry
│   ├── idGenerator.ts             # ID generator (timestamp + random suffix)
│   ├── toast.ts                   # Toast notification system
│   ├── fsSecurity.js              # Path traversal protection & atomic writes
│   ├── pathSanitizer.js           # Slug generation (CommonJS, main process)
│   └── pathSanitizer.ts           # Slug generation (TypeScript, renderer)
│
├── types/                         # Ambient TypeScript declarations
│   ├── global.d.ts                # Window.electronAPI, IRecentProject
│   ├── ipc.d.ts                   # IPC request/response interfaces
│   ├── viewModules.d.ts           # Ambient module declarations for JS view controllers
│   └── html.d.ts                  # HTML file module declaration (for esbuild text loader)
│
├── Locales/                       # i18n translation JSON files
│   ├── en/translation.json        # English (canonical schema & default)
│   ├── pl/translation.json        # Polish
│   └── de/translation.json        # German
│
├── scripts/                       # Build & CI scripts
│   ├── build-renderer.js          # esbuild bundler (TS→ESM for renderer)
│   └── check-licenses.js          # Dependency license compliance check
│
├── __mocks__/                     # Test mocks
│   └── electron.js                # Electron app mock for Vitest (aliased in vitest.config.ts)
│
├── docs/                          # Detailed architecture documentation
│   ├── ARCHITECTURE.md
│   ├── FRONTEND_ARCHITECTURE.md
│   └── MAIN_PROCESS_ARCHITECTURE.md
│
└── tests/                         # Test suites (Vitest)
    ├── Model/                     # Domain model tests (15 files)
    ├── ViewModel/                 # ViewModel tests (2 files)
    ├── View/                      # View/UI controller tests (8 files)
    ├── IPC/                       # IPC handler tests (1 file)
    └── Utils/                     # Utility tests (6 files)
```

---

## 5. Coding Standards — MUST FOLLOW

### 5.1. TypeScript Rules

- **`strict: true`** is enabled — no implicit `any`, strict null checks, etc.
- **Target**: ES2020. **Module**: ES2020, **Module resolution**: `bundler`.
- **Naming conventions** (enforced by ESLint):
  - Classes: `PascalCase` (e.g. `NPC`, `Paragraph`, `StoryGraph`)
  - Interfaces: `PascalCase` with `I` prefix (e.g. `IStoryGraphOptions`, `IToastOptions`)
  - Type aliases: `PascalCase` without prefix (e.g. `ToastType`, `SkillMode`)
- **Explicit return types**: All functions should declare return types (`@typescript-eslint/explicit-function-return-type: warn`).
- **No `any`**: Prefer typed alternatives (`@typescript-eslint/no-explicit-any: warn`). Legacy `fromJSON(json: any)` exists but avoid adding new `any`.
- **Unused vars**: Error, except args prefixed with `_` (e.g. `_event`).
- **Import sorting**: All imports auto-sorted by `eslint-plugin-simple-import-sort`. Don't manually reorder.

### 5.2. Prettier Formatting (Auto-applied on Save / Pre-commit)

```json
{
    "semi": false,
    "singleQuote": true,
    "trailingComma": "es5",
    "printWidth": 100,
    "tabWidth": 4,
    "useTabs": false,
    "bracketSpacing": true,
    "arrowParens": "avoid",
    "endOfLine": "lf"
}
```

**Key**: No semicolons, single quotes, 4-space indent, max 100 chars, trailing commas in objects/arrays (ES5 compatible).

### 5.3. JavaScript Rules

- **Main process**: CommonJS (`require()` / `module.exports`). Parser: `espree`, sourceType: `commonjs`.
- **View JS**: ESM (`import` / `export`). Parser: `espree`, sourceType: `module`.
- **No console.log**: Only `console.warn` and `console.error` allowed (`no-console: warn`).

### 5.4. Model Class Pattern

Every domain model class in `Model/` **must** follow this exact structure:

```typescript
export class EntityName {
    // 1. Private fields with defaults
    private id: string = ''
    private name: string = ''
    private description: Description = new Description()

    // 2. Constructor with all-optional params
    constructor(id: string = '', name: string = '', description: Description = new Description()) {
        this.id = id
        this.name = name
        this.description = description
    }

    // 3. Public getters/setters (getId, setId, hasId, getName, setName, etc.)
    public getId(): string { return this.id }
    public setId(id: string): void { this.id = id }
    public hasId(): boolean { return this.id !== '' }

    // 4. Collection methods (add/remove/has) with dedup by id OR name
    public addTag(tag: Tag): void {
        if (!this.tags.some(t => t.getId() === tag.getId() || t.getName() === tag.getName())) {
            this.tags.push(tag)
        }
    }

    // 5. Static fromJSON — handles legacy keys, null safety
    public static fromJSON(json: any): EntityName {
        if (!json) return new EntityName('')
        // ... parse with fallback: json.newKey ?? json.legacyKey ?? default
    }

    // 6. toJSON — plain object, English keys only
    public toJSON(): any {
        return { id: this.id, name: this.name, description: this.description }
    }
}
```

**Critical rules**:
- `fromJSON()` must handle `null`/`undefined` input gracefully.
- `fromJSON()` must support legacy Polish JSON keys for backward compatibility.
- `toJSON()` must always emit **English keys only**.
- Collection `add*()` methods must deduplicate by **both** id and name.
- All field names and method names in **English**.

### 5.5. ID Generation

Use `defaultIdGenerator(prefix?)` from `Utils/idGenerator.ts`. Format: `{prefix}_{timestamp}_{random7}`.
For ViewModels that need testability, accept `IdGenerator` as a constructor dependency.

### 5.6. View Controller Function Signatures

All View UI module functions that need shared state **must** accept `ctx` (the `appContext` object) as parameter:

```javascript
// Correct
export function renderCharactersList(ctx) { ... }

// Wrong — accessing globals
export function renderCharactersList() {
    const vm = window.vm  // NO!
}
```

---

## 6. Build Pipeline

### 6.1. Start / Development

```bash
pnpm start   # 1) tailwindcss build  2) tsc --noEmit  3) esbuild bundle  4) electron .
```

### 6.2. Separate Dev Watchers (parallel terminals)

```bash
pnpm run css:watch        # Tailwind CSS watcher
pnpm run renderer:watch   # esbuild watcher for TS→ESM
```

### 6.3. esbuild Configuration (`scripts/build-renderer.js`)

- **Entry points**: `StartWindowViewModel.ts`, `MainWindowViewModel.ts`, `translate.ts`, `toast.ts`, `pathSanitizer.ts`, `icons.ts`, `Modules/Graph/index.ts`
- **Output**: `dist/` directory, ESM format, ES2020 target, sourcemaps enabled
- **Loaders**: `.json` → json, `.html` → text (for Web Component templates)
- **Platform**: browser

**Rule**: When adding a new TypeScript module that must run in the renderer, add its entry point to `build-renderer.js`.

---

## 7. Storage & Project File Structure

When a project is created, the engine scaffolds this directory structure on disk:

```text
<ProjectFolder>/
├── project.json                # Project metadata
├── NPC/                        # Non-player characters
│   ├── meta.json
│   └── <npc_slug>/
│       ├── element.json
│       └── Description_NPC_<name>.md
├── Paragraphs/
│   ├── meta.json
│   └── <paragraph_slug>/
│       ├── element.json
│       └── Description_Paragraph_<title>.md
├── Items/
│   ├── meta.json
│   └── <item_slug>/
│       ├── element.json
│       └── Description_Item_<name>.md
├── Locations/
│   ├── meta.json
│   └── <location_slug>/
│       ├── element.json
│       └── Description_Location_<name>.md
├── Templates/
│   └── meta.json
├── CharacterClasses/
│   └── meta.json
├── Rules/
│   └── meta.json
└── PlayerCharacter/
    └── meta.json
```

### 7.1. JSON Schemas

#### `project.json`

```json
{
    "id": "my_game",
    "name": "My Epic Adventure",
    "author": "Jane Doe",
    "version": "1.0.0",
    "descriptionPaths": [],
    "dataPaths": [
        "./NPC/meta.json",
        "./Paragraphs/meta.json",
        "./Items/meta.json",
        "./Locations/meta.json",
        "./Templates/meta.json",
        "./CharacterClasses/meta.json",
        "./Rules/meta.json",
        "./PlayerCharacter/meta.json"
    ]
}
```

#### `meta.json`

```json
{
    "description": "Folder for Locations",
    "path": "./Locations",
    "descriptionPaths": [],
    "imagePaths": [],
    "elements": ["./dark_forest/element.json"]
}
```

#### `element.json` (Example for Location)

```json
{
    "id": "loc_dark_forest",
    "name": "Dark Forest",
    "description": {
        "text": "An ancient, misty forest.",
        "summary": "Misty woods",
        "filePath": "./Locations/dark_forest/Description_Location_Dark_Forest.md"
    },
    "tags": ["wilderness", "danger"]
}
```

### 7.2. Backward Compatibility

All `fromJSON()` methods in `Model/` and filesystem loaders in `ProjectService.js` / `EntityService.js` automatically support legacy Polish keys (`nazwa`, `autor`, `wersja`, `sciezkiOpisow`, `sciezkiDanych`, `opis: { tekst, streszczenie, tekstDlaAutora, sciezkaTekst }`, etc.) and legacy folder names (`Paragrafy`, `Przedmioty`, `Lokacje`, `KlasyPostaci`, `Zasady`, `PostacGracza`).

---

## 8. Localization (i18n)

- **Default Language**: English (`en`) at startup and for new projects.
- **Canonical Schema**: `Locales/en/translation.json` defines all keys and the `Translations` type.
- **Supported**: `en` (English, default), `pl` (Polish), `de` (German).

### Frontend Usage (`Utils/translate.ts`)

```typescript
import { t, setLanguage, getLanguage } from '../Utils/translate'

const title = t('app.title')
await setLanguage('en')
```

### Backend Usage (`Utils/i18n.js`)

```javascript
const { initI18n, t, changeLanguage } = require('./Utils/i18n')
await initI18n()
const label = t('entity.npc')
```

**Rule**: When adding new UI text, first add the English key to `Locales/en/translation.json`, then add corresponding translations to `pl` and `de`.

---

## 9. Type Declarations (`types/`)

| File              | Purpose                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| `global.d.ts`     | Augments `Window` with `electronAPI` and defines `IRecentProject`        |
| `ipc.d.ts`        | IPC request/response interfaces (`IProjectData`, `ICreateEntityOptions`, etc.) |
| `viewModules.d.ts`| Ambient `declare module` declarations for JS view controllers (enables TS imports) |
| `html.d.ts`       | Ambient module declaration for `.html` imports (esbuild text loader)      |

**Rule**: When adding a new JS view controller module, add a `declare module '*/View/ui/yourModule.js'` block in `viewModules.d.ts` to expose typed exports.

---

## 10. Testing & Quality Standards

### 10.1. Running Tests

```bash
pnpm test               # Vitest in watch mode
pnpm run test:run        # Single run
pnpm run test:coverage   # With V8 coverage report
```

### 10.2. Vitest Configuration

- **Environment**: `node` (with `happy-dom` available for DOM tests)
- **Globals**: `true` (describe, it, expect available without import)
- **Electron mock**: `__mocks__/electron.js` aliased to `electron` via resolve.alias
- **HTML plugin**: Custom `rawHtmlPlugin` enables importing `.html` files as strings
- **Coverage includes**: `Model/`, `ViewModel/`, `Services/`, `Utils/`

### 10.3. Test Organization

| Directory          | What to test                                      | Example                       |
| ------------------ | ------------------------------------------------- | ----------------------------- |
| `tests/Model/`     | Domain model serialization, logic, backward compat | `NPC.test.ts`, `Scene.test.ts` |
| `tests/ViewModel/` | ViewModel state, selection, undo, search           | `MainWindowViewModel.test.ts` |
| `tests/View/`      | View controller rendering, UI interactions         | `NpcModal.test.ts`, `StoryGraphScenes.test.ts` |
| `tests/IPC/`       | IPC handler behavior, service integration          | `ipcHandlers.test.ts`         |
| `tests/Utils/`     | Utility functions, i18n, icons, toast              | `translate.test.ts`, `icons.test.ts` |


## 11. Checklists — What to Do When...

### Adding a New Domain Model

1. Create `Model/YourEntity.ts` following the pattern in §5.4.
2. Add `fromJSON()` with legacy Polish key support.
3. Add `toJSON()` with English-only keys.
4. Register in `Project.ts` if it's a top-level entity.
5. Add to `ENTITY_CATEGORIES` in `constants.ts` if applicable.
6. Add unit tests in `tests/Model/YourEntity.test.ts`.
7. Export from ViewModel if used in the View layer.

### Adding a New View Controller Module

1. Create `View/ui/yourModule.js` as ES module.
2. Export functions that accept `ctx` as first parameter.
3. Add ambient `declare module` in `types/viewModules.d.ts`.
4. Import and wire in `MainWindow.js`, adding to `appContext` if needed.
5. Add tests in `tests/View/YourModule.test.ts`.

### Adding a New TypeScript Module for Renderer

1. Create the module in `Modules/`, `Utils/`, or `Services/`.
2. Add entry point in `scripts/build-renderer.js`.
3. Import in View JS from `../dist/YourModule.js`.

### Adding a New IPC Channel

1. Add handler in `main/ipc/` or extend existing file.
2. Register in `main/ipc/index.js`.
3. Expose in `preload.js` via `contextBridge`.
4. Add types to `types/ipc.d.ts`.
5. Update `types/global.d.ts` `electronAPI` interface.
6. Add IPC handler tests in `tests/IPC/`.

### Adding a New SVG Icon

1. Add to `Utils/icons.ts` — define the SVG string in the `ICONS` map.
2. Add the icon name to the `IconName` union type.
3. Reference via `icon('your-icon-name')` in TypeScript or import in JS.

### Adding a New Translation Key

1. Add the key + English text to `Locales/en/translation.json`.
2. Add Polish translation to `Locales/pl/translation.json`.
3. Add German translation to `Locales/de/translation.json`.
4. Use `t('your.key')` in code.

---

## 12. Common Pitfalls — AVOID

| Pitfall | Correct Approach |
| ------- | ---------------- |
| Importing `electron` or `fs` in renderer code | Use `window.electronAPI` exclusively |
| Using `npm` instead of `pnpm` | Always `pnpm install`, `pnpm run`, `pnpm test` |
| Adding icons as inline SVG in HTML | Add to `Utils/icons.ts`, use `icon()` function |
| Creating global variables in View JS | Thread through `appContext` / `ctx` parameter |
| Editing `MainWindow.generated.css` | Edit `MainWindow.css` instead, then `pnpm run css:build` |
| Using `console.log` in production code | Use `console.warn` or `console.error` only |
| Forgetting Polish key backward compat | Add fallback reads in `fromJSON()`: `json.name ?? json.nazwa` |
| Adding semicolons | Prettier removes them; project convention is no-semicolon |
| Using `npm install` for dependencies | Use `pnpm add <package>` or `pnpm add -D <package>` |
| Not adding type declarations for JS modules | Add `declare module` in `types/viewModules.d.ts` |
