# View Layer Modularization & Architecture Guide

This document provides a comprehensive technical reference for the architectural refactoring and modularization of the presentation layer (`View/` and `View/ui/`) in the **Gamebook Engine** (_Silnik Gier Paragrafowych_).

---

## 1. Executive Summary & Goals

Before this refactoring cycle, several core modules in the `View/` and `View/ui/` directory contained monolithic files exceeding 800–1800 lines of code (`playtestModal.js`, `gamebookCompiler.js`, `drawerLists.js`, `quickSearch.js`, `MainWindow.js`). These monoliths combined multiple disparate concerns: state calculation, DOM manipulation, business logic, IPC orchestration, and markdown parsing.

### Key Objectives:

1. **Single Responsibility Principle (SRP)**: Each submodule is strictly scoped to one cohesive domain task.
2. **Backward Compatibility via Barrel Exports**: All root directory files and `index.js` barrels maintain identical public APIs, ensuring zero breaking changes for existing unit tests, Electron IPC flows, and peer modules.
3. **Strict TypeScript Typing**: Every submodule is declared with detailed function and interface signatures in `types/viewModules.d.ts`.
4. **Lifecycle & Memory Management**: Added explicit unmount/teardown methods (`destroy()`, `resetState()`, listener detachment) to prevent memory leaks in Electron.
5. **Zero Linter & Type Errors**: 0 ESLint errors/warnings, 0 TypeScript compiler errors, and 100% test pass rate across all suites.

---

## 2. Directory Structure Map

```text
View/
├── MainWindow.html                  # Main editor HTML markup
├── MainWindow.css                   # Custom theme styling & Tailwind directives
├── MainWindow.generated.css         # Compiled Tailwind CSS v4 bundle
├── MainWindow.js                    # Lean entry point & appContext orchestrator (540 lines)
├── projectData.js                   # Production project data extraction & loading provider
├── mockData.js                      # Dev/demo fixtures & backward-compatible re-exports
│
└── ui/
    ├── workspace/                   # Workspace layout, spotlight search, toolbars & hotkeys
    │   ├── contextMenu.js           # Right-click context menus & color picker dialog
    │   ├── mainWindowHotkeys.js     # Global shortcuts (Ctrl+S, Delete node) & drag/drop guard
    │   ├── mainWindowSettings.js    # Settings panel bindings (language, zoom, auto-save, grid)
    │   ├── quickSearch.js           # Spotlight modal DOM view & keyboard navigation
    │   ├── quickSearchActions.js    # Quick search jump & selection action executor
    │   ├── quickSearchEngine.js     # Tier-based fuzzy scoring & sorting algorithms
    │   ├── quickSearchIndexer.js    # Entity data collector & text extraction/highlighting
    │   ├── topBar.js                # Upper toolbar action groups & ribbon coordinators
    │   ├── topBarValidation.js      # Story graph validation runner & report modal generator
    │   ├── workspace.js             # Dual view switcher (Graph vs Markdown) & layout resizers
    │   └── index.js                 # Unified workspace barrel export
    │
    ├── detailsPanel/                # Entity inspector in right sidebar
    │   ├── detailsPanel.js          # Master inspector coordinator
    │   ├── choice/                  # Branching choices, dice mechanics, costs/rewards (9 modules)
    │   ├── combat/                  # Turn-based combat parameters & markdown sync
    │   ├── common/                  # Shared inspector helpers
    │   ├── item/                    # Item catalog forms (10 section modules)
    │   ├── modules/                 # Custom attributes, tags, paragraph numbers, start node
    │   ├── navigation/              # History bar & breadcrumb navigation stack
    │   ├── readonly/                # Lightweight character preview cards
    │   └── index.js                 # Barrel export
    │
    ├── drawer/                      # Left collapsible entity navigation
    │   ├── drawerListsCharacters.js # NPC cards with archetype avatars
    │   ├── drawerListsConnections.js# Global story jump connections list
    │   ├── drawerListsItems.js      # Item catalog list
    │   ├── drawerListsLocations.js  # Locations list
    │   ├── drawerListsMainCharacter.js # Protagonist summary card
    │   ├── drawerListsParagraphs.js # Paragraph list with numbering locks & start/end badges
    │   ├── drawerListsScenes.js     # Scene groups with nested paragraph counts
    │   ├── drawerListsTags.js       # Narrative tags with color swatches
    │   ├── drawerListsTraits.js     # RPG rules (Stats, Skills, Parameters, Features)
    │   ├── drawerSearch.js          # Multi-category live search input
    │   ├── filterPopover.js         # Faceted multi-criteria filter popover
    │   └── index.js                 # Drawer barrel export
    │
    ├── editor/                      # TipTap rich markdown prose authoring
    │   ├── instances/               # TipTap editor mounting & active instance holder
    │   ├── modals/                  # Custom CSS styles, Google Fonts browser, @ mentions
    │   ├── toolbar/                 # Rich text formatting buttons
    │   ├── utils/                   # Text formatting utilities & custom style dropdowns
    │   ├── heroEditor.js            # Protagonist chronicle drawer
    │   ├── npcEditor.js             # NPC chronicle drawer
    │   └── index.js                 # Editor barrel export
    │
    ├── graph/                       # Story Graph visualization (Cytoscape.js)
    │   ├── storyGraphController.js  # Main Cytoscape canvas coordinator
    │   ├── graphEventHandlers.js    # Canvas click, drag, box-select, and edge event handlers
    │   ├── graphZoomControls.js     # Floating zoom toolbar with lifecycle cleanup
    │   ├── graphDropZone.js         # Visual connection linking drag & drop target
    │   └── index.js                 # Story graph barrel export with destroyStoryGraph()
    │
    ├── modals/                      # High-level functional dialogs & publication
    │   ├── confirm/                 # Unsaved changes & close confirmation modals
    │   ├── export/                  # Publication wizard
    │   │   ├── exportModal.js       # Multi-step export UI modal
    │   │   └── compiler/            # Decomposed gamebook compilation pipeline
    │   │       ├── compilerExtractors.js      # Text extraction & protagonist resolver
    │   │       ├── compilerCharacterSheet.js  # Character sheet markdown/HTML compiler
    │   │       ├── compilerCombat.js          # Combat encounter block parser & renderer
    │   │       ├── compilerMarkdown.js        # Inline markdown parser & emoji sanitizer
    │   │       ├── compilerPrint.js           # Print-ready HTML generator with @page CSS
    │   │       └── gamebookCompiler.js        # Compiler pipeline coordinator
    │   ├── hero/                    # Protagonist creator modal, formulas & avatar selector
    │   ├── npc/                     # NPC Folio modal, template archetypes & traits
    │   ├── playtest/                # Interactive walkthrough simulation engine
    │   │   ├── playtestEngine.js    # Headless gamebook state machine & dice roller
    │   │   ├── playtestMarkdown.js  # Markdown choices & combat transcript renderer
    │   │   ├── playtestModal.js     # Playtest modal DOM view & user input coordinator
    │   │   └── index.js             # Barrel facade
    │   └── styleEditor/             # Story graph visual theme editor
    │
    ├── project/                     # Project persistence & state tracking
    │   ├── autoSaveService.js       # Non-blocking debounced auto-save service
    │   ├── mainWindowProjectActions.js # Project loading (applyLoadedProject) & IPC handlers
    │   ├── projectSaver.js          # Project serialization payload builder
    │   ├── projectStateTracker.js   # Dirty state hashing & unsaved indicators
    │   └── index.js                 # Project barrel export
    │
    ├── startWindow/                 # Launcher & welcome screen
    │   ├── StartWindow.html         # Template markup
    │   ├── StartWindowView.ts       # Typed view controller with complete destroy() lifecycle
    │   └── index.ts                 # Export facade
    │
    ├── assets/                      # Media asset library & canvas image editor
    │   ├── common/                  # Path resolvers, drop zones, card templates
    │   ├── editor/                  # Canvas 2D crop, transform, filters, and persistence
    │   ├── manager/                 # Asset gallery modal, detail inspector, rename/delete
    │   ├── picker/                  # Image picker dialog with disk import
    │   └── index.js                 # Comprehensive assets barrel export
    │
    └── common/                      # Shared infrastructure & utilities
        ├── graphValidator.js        # Adapter for GraphValidationService diagnostics
        ├── htmlTemplates.js         # XSS sanitizer (escapeHtml), color palettes, badges
        ├── npcAvatars.js            # Predefined fantasy RPG archetypes & custom avatar resolver
        └── index.js                 # Common barrel export
```

---

## 3. Detailed Subsystem Breakdown

### 3.1. `View/ui/workspace/`

Previously, `quickSearch.js` (904 lines) and `topBar.js` (835 lines) combined indexing, search heuristics, validation reporting, and UI rendering into single scripts.

- **`quickSearchIndexer.js`**: Pure indexing module.
    - `getAllProjectObjects(ctx)`: Gathers paragraphs, scenes, characters, locations, items, traits, and tags into normalized `ISearchCandidate` records.
    - `getEntityText(desc)`: Extracts plain strings from Description objects or strings.
    - `highlightMatch(text, query)`: XSS-safe highlight wrapper using `<mark class="...">`.
- **`quickSearchEngine.js`**: Decoupled matching engine.
    - `scoreCandidate(candidate, rawQuery)`: 5-tier fuzzy ranking:
        1. Exact match / word-prefix match in Title or Paragraph Number (highest priority).
        2. In-word phrase match in Title.
        3. Word-prefix match in Description.
        4. In-word phrase match in Description.
        5. Secondary metadata matches (ID, tags, locations, attribute modifiers).
    - `searchProjectObjects(ctx, query, categoryFilter)`: Filters and sorts candidates deterministically.
- **`quickSearchActions.js`**: Execution handler.
    - `executeQuickSearchAction(item, ctx)`: Focuses nodes on the Cytoscape graph canvas, selects entities in `MainWindowViewModel`, expands the properties sidebar, and updates the history bar.
- **`topBarValidation.js`**: Extracted from `topBar.js`.
    - `runGraphValidation(ctx)`: Executes `validateStoryGraph(ctx)`, updates the topbar badge count, and renders an interactive report card list with buttons that jump directly to problematic nodes or scene containers on the graph canvas.
- **`mainWindowHotkeys.js` & `mainWindowSettings.js`**:
    - Encapsulate global window hotkeys (`Ctrl+S`, `Delete`) and settings drawer bindings (locale switching, zoom sensitivity, auto-save, grid toggle).

---

### 3.2. `View/ui/modals/playtest/` & `View/ui/modals/export/`

Previously, `playtestModal.js` was 1627 lines long and `gamebookCompiler.js` was 1818 lines long.

- **Playtest Simulation Subsystem**:
    - **`playtestEngine.js`** (380 lines): Headless narrative engine. Maintains visited paragraph history, checks choice conditions against character inventories/stats, evaluates dice roll checks, and supports step-back rollback (`stepBack()`, `stepToIndex()`).
    - **`playtestMarkdown.js`** (330 lines): Pure rendering engine. Formats narrative text, choices, dynamic conditions, and dice result banners into safe HTML.
    - **`playtestModal.js`**: Pure DOM view controller handling modal visibility, input events, scroll anchoring, and god-mode teleportation.
- **Gamebook Compiler Subsystem (`modals/export/compiler/`)**:
    - **`compilerExtractors.js`**: Resolves player characters and extracts plain narrative strings.
    - **`compilerCharacterSheet.js`**: Formats protagonist statistics, parameters, skills, and equipment into markdown/HTML tables.
    - **`compilerCombat.js`**: Parses combat blocks and renders standalone battle encounters.
    - **`compilerMarkdown.js`**: Converts TipTap inline markdown syntax to clean HTML and strips emojis.
    - **`compilerPrint.js`**: Generates print-ready HTML with page breaks, cover pages, and CSS print margins.
    - **`gamebookCompiler.js`** (reduced to 367 lines): High-level compilation coordinator assembling the output document.

---

### 3.3. `View/ui/drawer/`

Previously, `drawerLists.js` was a 1213-line file responsible for rendering all 9 drawer categories.

- Decomposed into 9 domain list renderers:
    - `drawerListsParagraphs.js` (start/end badges, number locking, tags)
    - `drawerListsScenes.js` (scene groupings, paragraph counts)
    - `drawerListsConnections.js` (story choices and graph transitions)
    - `drawerListsCharacters.js` (NPC cards, archetype badges)
    - `drawerListsLocations.js` (location cards)
    - `drawerListsItems.js` (item cards, category indicators)
    - `drawerListsTraits.js` (stats, skills, parameters, features)
    - `drawerListsTags.js` (tags with color badges)
    - `drawerListsMainCharacter.js` (protagonist summary)
- Retained full public API in `drawer/index.js` for zero disruption to `MainWindow.js`.

---

### 3.4. `View/ui/startWindow/`

Previously, `StartWindowView.ts` attached global event listeners to `document` and subscribed to `StartWindowViewModel` events without unmount mechanics, causing potential listener accumulation.

- **Lifecycle Teardown (`destroy()`)**:
    - Unsubscribes all ViewModel event listeners (`onProjectsChanged`, `onLanguageChanged`, etc.).
    - Removes global document event listeners (`click`, `keydown`).
    - Cleans up template selection cards and modal DOM wrappers.
- **Export Facade**: Added `View/ui/startWindow/index.ts`.

---

### 3.5. Root `View/` Architecture (`MainWindow.js`, `projectData.js`, `mockData.js`)

Previously, `MainWindow.js` was 1069 lines and handled IPC event bindings, hotkeys, and settings directly in the root file. Furthermore, `mockData.js` mixed development mock fixtures with production project data loading.

- **`View/projectData.js`**:
    - Dedicated production data provider: `extractProjectData()`, `loadRealProjectData()`, `loadProjectData()`, and `USE_MOCK = false`.
- **`View/mockData.js`**:
    - Dedicated mock fixtures: `createMockProjectData()`, `mockFiles`, with re-exports from `projectData.js` for 100% backward compatibility with test suites.
- **`View/MainWindow.js`** (reduced to 540 lines):
    - Retains shared application context definition (`appContext`).
    - Delegates project IPC actions to `mainWindowProjectActions.js`.
    - Delegates hotkeys to `mainWindowHotkeys.js`.
    - Delegates settings to `mainWindowSettings.js`.
    - Coordinates startup sequence in `initApp()`.

---

## 4. Quality Assurance & Verification Metrics

Every refactoring phase followed a strict verification pipeline:

| Metric / Check                            | Target               | Result                            | Status |
| :---------------------------------------- | :------------------- | :-------------------------------- | :----- |
| **ESLint Static Analysis**                | 0 errors, 0 warnings | 0 errors, 0 warnings              | Passed |
| **TypeScript Typecheck (`tsc --noEmit`)** | 0 errors             | 0 errors                          | Passed |
| **Prettier Formatting**                   | 100% compliant       | 100% compliant                    | Passed |
| **Vitest Test Suite**                     | 100% pass rate       | **133 files, 1664 tests passing** | Passed |
| **esbuild Production Bundle**             | Code 0, < 2000 ms    | Done in 1436 ms                   | Passed |

---

## 5. Summary of Best Practices Applied

1. **Thin Barrel Facades**: Every refactored folder provides an `index.js` (or `index.ts`) barrel that cleanly re-exports the public interface.
2. **Defensive DOM Manipulation**: Every element query verifies element existence before attaching listeners or mutating innerHTML.
3. **XSS Protection**: All user-provided names, descriptions, and file paths are sanitized via `escapeHtml()`.
4. **Decoupled Architecture**: Domain logic (engines, compilers, indexers) is kept strictly headless and free of DOM dependencies, making it directly testable in NodeJS/Vitest environments.
