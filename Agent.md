# Agent.md — Gamebook Engine (Silnik Gier Paragrafowych)

This document describes the architecture, project structure, conventions, and workflows for AI agents working in this repository.

---

## 1. Project Overview

A desktop application for **creating, editing, and managing gamebook games** (*Silnik Gier Paragrafowych*).  
Built on **Electron** with **TypeScript** for the domain/business logic and presentation layers. It provides tools for crafting interactive branching storylines: scenes, paragraphs, choices, combat mechanics, player character sheets, NPC databases, items, traits, and skills.

---

## 2. Tech Stack

| Layer | Technology | Description |
|---|---|---|
| Desktop framework | **Electron 41+** | Multi-process desktop architecture (Chromium + Node.js). |
| Business logic language | **TypeScript 6+** | Pure domain models and MVVM presentation logic. |
| UI & Styling | **HTML5 + Tailwind CSS 4+** | Modern dark-theme desktop UI compiled via esbuild/Tailwind. |
| Graph visualization | **Cytoscape.js** | Node-graph renderer for visualizing paragraph transitions and scene flows. |
| Testing | **Vitest 1.x + happy-dom** | Fast unit and integration tests with DOM emulation. |
| Code quality | **ESLint 8 + Prettier 3** | Code linting and formatting. |
| Git hooks | **Husky 9 + lint-staged 15** | `pre-commit` formatting and `pre-push` test validation. |
| Localization (i18n) | **i18next** + typed wrappers | Multi-language support (`en` default, `pl`, `de`). |

---

## 3. Core Architecture & Design Patterns

### 3.1. MVVM (Model–View–ViewModel)

- **Model (`/Model/*.ts`)**: Pure domain classes with no UI or Electron dependencies. Each class encapsulates private fields and exposes domain accessors (e.g. `getId()`, `setName()`, `addTag()`). Models serialize to/from JSON (`toJSON()`, `fromJSON()`).
- **ViewModel (`/ViewModel/*.ts`)**: Presentation logic, state management, search/filter logic, and UI event binding (e.g. `StartWindowViewModel.ts`, `MainWindowViewModel.ts`).
- **View (`/View/*.html`, `/View/*.js`, `MainWindow.generated.css`)**: HTML views loaded by Electron browser windows communicating with ViewModels.

### 3.2. Modular Main Process Architecture

The Electron main process is structured into decoupled layers:
- **`main.js`**: Application bootstrap and lifecycle management.
- **`main/windowManager.js`**: BrowserWindow instantiation with secure preload configurations.
- **`main/ipc/`**: IPC route handlers (`projectIpc.js`, `entityIpc.js`, `markdownIpc.js`, `recentProjectsIpc.js`, `appIpc.js`).
- **`main/services/`**: Pure Node.js filesystem services (`ProjectService.js`, `EntityService.js`, `MarkdownService.js`, `RecentProjectsService.js`).
- **`Utils/fsSecurity.js` & `Utils/pathSanitizer.js`**: Path traversal protection, slug generation, and atomic writes (`atomicWriteJsonSync`, `atomicWriteStringSync`).

### 3.3. Singleton & Aggregate Roots
- **`ProjectManager` (`Services/ProjectManager.ts`)**: Singleton managing the currently open project instance in the renderer process.
- **`Project` (`Model/Project.ts`)**: Aggregate root containing all project entities.

---

## 4. Directory Structure

```text
SilnikGierParagrafowych/
├── main.js                     # Electron main process entry point
├── preload.js                  # Electron preload bridge (ContextBridge / electronAPI)
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript compiler configuration
├── vitest.config.ts            # Vitest test runner configuration
│
├── main/                       # Main process modular architecture
│   ├── windowManager.js        # BrowserWindow creation & configuration
│   ├── ipc/                    # IPC route dispatchers
│   │   ├── index.js            # Aggregator (registerAllIpc)
│   │   ├── projectIpc.js       # Project creation & opening handlers
│   │   ├── entityIpc.js        # Entity creation & persistence handlers
│   │   ├── markdownIpc.js      # Narrative markdown file handlers
│   │   ├── recentProjectsIpc.js# Recent projects handlers
│   │   └── appIpc.js           # App lifecycle & i18n IPC handlers
│   └── services/               # Main process business logic services
│       ├── ProjectService.js   # Project creation and entity loading
│       ├── EntityService.js    # Scaffolding entity folders and element.json
│       ├── MarkdownService.js  # Safe reading & atomic writing of .md files
│       └── RecentProjectsService.js # Recent projects persistence in userData
│
├── Model/                      # Domain classes (pure TypeScript - English naming)
│   ├── constants.ts            # Category and tag constants
│   ├── Project.ts              # Aggregate root project container
│   ├── Scene.ts                # Scene container
│   ├── Paragraph.ts            # Narrative paragraph
│   ├── Choice.ts               # Choice / jump connection between paragraphs
│   ├── Location.ts             # Location entity
│   ├── NPC.ts                  # Non-player character
│   ├── NPC_Template.ts         # Archetype / template for NPC
│   ├── PlayerCharacter.ts      # Player character sheet
│   ├── CharacterClass.ts       # Character class
│   ├── Item.ts                 # Item / equipment
│   ├── Stat.ts                 # Character stat / attribute (e.g. Strength)
│   ├── Skill.ts                # Character skill
│   ├── Feature.ts              # Character feature / special trait
│   ├── Combat.ts               # Combat encounter mechanics
│   ├── Condition.ts            # Logical condition for choices
│   ├── Tag.ts                  # Color-coded categorization tag
│   └── Description.ts          # Rich description object with markdown references
│
├── ViewModel/                  # Presentation logic & UI event handlers
│   ├── StartWindowViewModel.ts # Start window logic (create/open/recent)
│   └── MainWindowViewModel.ts  # Main editor workspace logic
│
├── View/                       # HTML views & client-side scripts
│   ├── StartWindow.html        # Start screen UI
│   ├── MainWindow.html         # Main editor UI
│   ├── MainWindow.js           # Client-side UI bindings
│   └── MainWindow.css          # Source Tailwind styles
│
├── Locales/                    # Translation files (JSON)
│   ├── en/translation.json     # English (canonical schema & default)
│   ├── pl/translation.json     # Polish translation
│   └── de/translation.json     # German translation
│
├── Utils/                      # Utility modules
│   ├── translate.ts            # Frontend typed i18n module
│   ├── i18n.js                 # Backend Node.js i18n module
│   ├── fsSecurity.js           # Filesystem security & atomic writes
│   ├── pathSanitizer.js        # Safe slug generation
│   ├── toast.ts                # UI toast notification helper
│   └── idGenerator.ts          # Unique ID generator
│
└── tests/                      # Unit and integration test suites (Vitest)
    ├── IPC/                    # Main process services & IPC tests
    ├── Model/                  # Domain model serialization tests
    ├── Utils/                  # Utilities & i18n tests
    └── ViewModel/              # UI ViewModel tests (happy-dom)
```

---

## 5. Storage & Project File Structure (English Standard)

When a project is created, the engine scaffolds the following directory and file structure on disk:

```text
<ProjectFolder>/
├── project.json                # Project metadata
├── NPC/                        # Non-player characters
│   ├── meta.json
│   └── <npc_slug>/
│       ├── element.json
│       ├── text.md
│       └── author.md
├── Paragraphs/                 # Paragraphs and scenes
│   ├── meta.json
│   └── <paragraph_slug>/
│       ├── element.json
│       ├── text.md
│       └── author.md
├── Items/                      # Inventory items
│   ├── meta.json
│   └── <item_slug>/
│       ├── element.json
│       └── text.md
├── Locations/                  # World locations
│   ├── meta.json
│   └── <location_slug>/
│       ├── element.json
│       └── text.md
├── Templates/                  # Character templates
│   └── meta.json
├── CharacterClasses/           # Character classes
│   └── meta.json
├── Rules/                      # Global traits, skills, and rules
│   └── meta.json
└── PlayerCharacter/            # Player character configuration
    └── meta.json
```

### 5.1. JSON Schemas

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
  "elements": [
    "./dark_forest/element.json"
  ]
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
    "authorNotes": "Player needs a torch here.",
    "textPath": "./Locations/dark_forest/text.md",
    "authorNotesPath": "./Locations/dark_forest/author.md"
  },
  "tags": ["wilderness", "danger"]
}
```

### 5.2. Backward Compatibility
All `fromJSON()` methods in `Model/` and filesystem loaders in `ProjectService.js` and `EntityService.js` automatically support legacy Polish keys (`nazwa`, `autor`, `wersja`, `sciezkiOpisow`, `sciezkiDanych`, `opis: { tekst, streszczenie, tekstDlaAutora, sciezkaTekst }`, etc.) and legacy folder names (`Paragrafy`, `Przedmioty`, `Lokacje`, `KlasyPostaci`, `Zasady`, `PostacGracza`).

---

## 6. Localization (i18n)

- **Default Language**: **English (`en`)** is the default language upon startup and when creating new projects.
- **Canonical Schema**: `Locales/en/translation.json` defines the canonical schema and `Translations` TypeScript type.
- **Supported Locales**: `en` (English, default), `pl` (Polish), `de` (German).

### Frontend Usage (`Utils/translate.ts`)
```typescript
import { t, setLanguage, getLanguage } from '../Utils/translate'

// Translate typed keys
const title = t('app.title')
const errorMsg = t('error.project_not_found')

// Change language dynamically
await setLanguage('en')
```

---

## 7. Testing & Quality Standards

- **Test Suite**: Vitest (`npm test` or `npx vitest run`).
- **TypeScript Checking**: `npx tsc --noEmit`.
- **Pre-commit**: Automated formatting via Prettier and ESLint.
- **Pre-push**: Automated test execution via Husky.

When adding new features or modifying models:
1. Ensure models expose both `toJSON()` and `fromJSON()`.
2. Keep JSON field names and class methods in English.
3. Verify backward compatibility with existing Polish projects.
4. Add unit tests under `tests/` and ensure all tests pass.
