# Frontend Architecture — Gamebook Engine

This document provides an in-depth guide to the presentation layer (Renderer Process) of the **Gamebook Engine** (_Silnik Gier Paragrafowych_). It details the **MVVM** pattern, modular view controllers in `View/ui/`, the interactive story graph subsystem in `Modules/Graph/` powered by **Cytoscape.js** and **Custom Web Components**, the TipTap Rich Markdown Editor, the in-app Image Editor, and the Publication & Export subsystem.

---

## 1. Frontend Architecture Overview (MVVM)

The renderer process executes inside a sandboxed Chromium instance isolated from Node.js (`contextIsolation: true`, `nodeIntegration: false`). The user interface is structured around the **Model-View-ViewModel (MVVM)** pattern with a modularized view controller architecture organized by domain.

```mermaid
graph TD
    subgraph ViewLayer["View Layer (View & UI Controllers)"]
        HTML["MainWindow.html / StartWindow.html"]
        MainController["MainWindow.js (Coordinates appContext)"]

        subgraph UIControllers["Modular Controllers (View/ui/)"]
            WorkspaceCtrl["workspace/ (Layout, Top Bar, Quick Search, Context Menus)"]
            DetailsCtrl["detailsPanel/ (Inspector, Combat, Exits, Character Sheets)"]
            DrawerCtrl["drawer/ (Drawer Lists, Search, Faceted Filters)"]
            EditorCtrl["editor/ (TipTap Toolbar, Styles, Font Browser, Mentions)"]
            GraphCtrl["graph/ (Graph Controller, Drop Zones, Zoom Controls)"]
            ModalsCtrl["modals/ (Export, Hero, NPC Folio, Playtest Simulator)"]
            ProjectCtrl["project/ (Saver, State Tracker, AutoSave)"]
            AssetsCtrl["assets/ (Modular Media Subsystem: Manager, Editor, Picker, Common)"]
            CommonCtrl["common/ (HTML Templates, Graph Validator, Avatars)"]
        end

        subgraph FeatureModules["Engine Feature Modules (Modules/)"]
            StoryGraph["Graph/ (Cytoscape Coordinator, Web Components, Layout)"]
            MarkdownEditor["Editor/ (TipTap Markdown, Fonts, Custom Styles)"]
            ImageProcessor["ImageEditor/ (Canvas 2D Processor)"]
        end
    end

    subgraph ViewModelLayer["ViewModel Layer (ViewModel/)"]
        MainVM["MainWindowViewModel.ts"]
        StartVM["StartWindowViewModel.ts"]
    end

    subgraph ModelLayer["Domain Model Layer (Model/)"]
        ProjectModel["Project.ts"]
        SceneModel["Scene.ts"]
        ParagraphModel["Paragraph.ts"]
        ChoiceModel["Choice.ts"]
        PlayerCharModel["PlayerCharacter.ts"]
        CombatModel["Combat.ts"]
        EntityModels["NPC, Location, Item, CharacterClass, Stat, Parameter, Tag..."]
    end

    subgraph FrontendServices["Frontend Services & Utilities (Services/ & Utils/)"]
        ProjectMgr["Services/project/ProjectManager.ts (Active Project Singleton)"]
        GraphVal["Services/graph/GraphValidationService.ts (Integrity & Cycle Diagnostics)"]
        ToastMgr["Utils/ui/toast.ts (Toast Notification System)"]
        TranslateMgr["Utils/i18n/translate.ts (Typed i18n Client)"]
        IconComponent["Utils/ui/icons.ts (<app-icon>)"]
    end

    HTML --> MainController
    MainController --> UIControllers
    UIControllers --> MainVM
    UIControllers --> FeatureModules
    FeatureModules --> ModelLayer
    MainVM --> ModelLayer
    MainVM --> FrontendServices
    MainController --> ProjectMgr & GraphVal
```

---

## 2. Domain Models (`Model/`)

Models located in `Model/` are strongly typed TypeScript classes that encapsulate story game entities and business invariants:

- Strict encapsulation (`private` properties with getters/setters).
- `fromJSON(data)` factory constructors to parse data from `element.json` and `project.json` (supporting Polish legacy schemas).
- `toJSON()` methods emitting clean English schemas for safe serialization to disk.

### Key Domain Relationships:

```mermaid
classDiagram
    class Project {
        +string id
        +string name
        +string author
        +string version
        +Scene[] scenes
        +Location[] locations
        +NPC[] characters
        +Item[] items
        +CharacterClass[] characterClasses
        +PlayerCharacter playerCharacter
        +Stat[] globalStats
        +Skill[] globalSkills
        +Parameter[] globalParameters
        +Feature[] globalFeatures
        +Tag[] tagList
        +fromJSON(projectData, entities)
        +toJSON()
    }

    class Scene {
        +string id
        +string name
        +string color
        +Paragraph[] paragraphs
        +fromJSON(json)
        +toJSON()
    }

    class Paragraph {
        +string id
        +string title
        +number number
        +number randomizedNumber
        +boolean isNumberLocked
        +Description description
        +Choice[] choices
        +Combat combat
        +Tag[] tags
        +fromJSON(json)
        +toJSON()
    }

    class PlayerCharacter {
        +string id
        +string name
        +Description description
        +string avatar
        +CharacterClass characterClass
        +Stat[] stats
        +Parameter[] parameters
        +Skill[] skills
        +Item[] inventory
        +Tag[] tags
        +fromJSON(json)
        +toJSON()
    }

    class NPC {
        +string id
        +string name
        +Description description
        +string avatar
        +Stat[] stats
        +Parameter[] parameters
        +Skill[] skills
        +Feature[] features
        +Item[] items
        +fromJSON(json)
        +toJSON()
    }

    class Choice {
        +string text
        +string targetParagraphId
        +Condition condition
        +fromJSON(json)
        +toJSON()
    }

    class Description {
        +string text
        +string summary
        +string filePath
        +fromJSON(json)
        +toJSON()
    }

    Project "1" *-- "many" Scene
    Project "1" *-- "1" PlayerCharacter
    Project "1" *-- "many" NPC
    Scene "1" *-- "many" Paragraph
    Paragraph "1" *-- "many" Choice
    Paragraph "1" *-- "1" Description
    PlayerCharacter "1" *-- "1" Description
    NPC "1" *-- "1" Description
```

---

## 3. ViewModel Layer (`ViewModel/`)

ViewModels isolate UI presentation state, algorithms, and event handling from direct DOM manipulation:

### 3.1. `MainWindowViewModel.ts`

Coordinates the state of the primary editor window:

- **Top Bar Toolbar & Ribbon State**:
  Tracks active views, dirty tracking status, and tool selections.
- **Navigation & Layout State**:
    - `activeLeftTab`: Selected tab in the left collapsible drawer (`paragraphs`, `scenes`, `characters`, `locations`, `stats`, `traits`, `main-character`, `tags`, `connections`, `search`, `settings`, `explorer`).
    - Drawer visibility and persisted resizable panel widths (`leftDrawerWidth`, `rightSidebarWidth`) bounded by min/max constraints.
    - Workspace view mode (`graph` for Cytoscape story canvas vs `markdown` for TipTap prose editor).
- **Faceted Search and Filtering**:
    - `searchAndFilterParagraphs(paragraphs, scenes, characters)`: Multi-attribute filtering combining full-text queries with active tag (`selectedFilterTag`), scene (`selectedFilterScene`), and character (`selectedFilterCharacter`) filters. Number-locked paragraphs are automatically sorted to the top.
    - Dedicated search and filtering methods for scenes, characters, locations, traits, and connections.
- **Selection & Breadcrumbs History**:
    - `selectedItem`: The currently inspected entity (`IHistoryItem`).
    - `history`: Breadcrumb navigation stack allowing back/forward jumps between previously inspected entities.
- **Graph Presentation Preferences**:
    - Choice line connection styles (`connectionLineStyle`: `'curved'` | `'straight'`).
    - Zoom sensitivity factor (`zoomSensitivity`).

### 3.2. `StartWindowViewModel.ts`

Manages the project launcher / welcome screen:

- Loads and formats recent projects with relative timestamps.
- Handles project creation modals, validation rules, and default templates.
- Triggers native directory picker dialogs over IPC (`window.electronAPI.chooseFolder()`).
- Coordinates reactive language switching and i18n dictionary reload.

---

## 4. Modular UI Controllers (`View/ui/`)

To maintain high code modularity and maintainability, `View/MainWindow.js` acts as an orchestrator delegating functionality to domain-based modules in `View/ui/`:

### 4.1. `workspace/` — Workspace, Toolbar, Search & Global Control

The workspace module coordinates the top-level IDE canvas, dual-mode view switching, global spotlight search, keyboard shortcuts, and workspace settings:

- **`topBar.js`**: Upper toolbar containing action groups (Project & Files, Edit & History, Views & Panels, Graph Diagnostics, Testing & Export, Tools & Settings).
- **`topBarValidation.js`**: Dedicated graph validation runner and report modal generator (`runGraphValidation`), isolated from the main toolbar controller.
- **`quickSearch.js` & Spotlight Search Subsystem**:
    - `quickSearch.js`: Spotlight modal view controller (`openQuickSearch`, `closeQuickSearch`, `renderQuickSearchResults`, keyboard navigation).
    - `quickSearchIndexer.js`: High-performance entity indexer (`getAllProjectObjects`) collecting paragraphs, scenes, characters, locations, items, traits, and tags with metadata tags, and text extraction (`getEntityText`, `highlightMatch`).
    - `quickSearchEngine.js`: Tiered search scoring engine (`scoreCandidate`, `searchProjectObjects`) prioritizing exact matches, word-prefix matches, in-word phrases, and metadata attributes.
    - `quickSearchActions.js`: Action execution handler (`executeQuickSearchAction`) focusing nodes on the graph canvas or opening detailed inspector panels.
- **`mainWindowHotkeys.js`**: Global shortcut controller handling project saving (`Ctrl+S`), paragraph deletion with confirmation modals (`Delete`/`Backspace`), and Electron drag-and-drop file navigation guards.
- **`mainWindowSettings.js`**: Settings panel controller binding application language selection, graph zoom sensitivity sliders, background auto-save toggle, and canvas grid visibility preferences.
- **`workspace.js`**: Dual workspace view switcher (Cytoscape canvas vs TipTap Markdown editor), editor tab management, and resizable layout splitters (`setupResizers`).
- **`contextMenu.js`**: Graph canvas and node context menus, color picker palette modal (`openColorPicker`), and entity tagging controls.

### 4.2. `detailsPanel/` — Property Inspector & Sub-modules

Organized into specialized subpackages to separate navigation, read-only cards, and entity-specific form editors:

- **`detailsPanel.js`**: Master inspector coordinator delegating form rendering based on the currently selected entity type.
- **`navigation/`** (`navigationController.js`, `historyBar.js`):
    - `historyBar.js`: Horizontal breadcrumb bar tracking inspected entities with backward and forward navigation.
    - `navigationController.js`: History stack management and entity selection routing.
- **`readonly/`** (`heroReadOnlyDetails.js`, `npcReadOnlyDetails.js`): Lightweight inspector cards for character previews in the right sidebar.
- **`item/`**: Modular item inspector sections (header, name, description, category, inventory requirements, usages, modifiers, tags, export options).
- **`combatModule.js` & `combat/`**: Turn-based combat parameters editor with enemy statistics, victory/defeat redirects, and TipTap markdown synchronization.
- **`choiceDetails.js` & `choice/`**: Outgoing choices, story graph branching, requirements, and dice mechanics inspector _(comprehensive guide and specification: [`CHOICE_SUBSYSTEM.md`](CHOICE_SUBSYSTEM.md))_:
    - **`choiceHeader.js`**: Header card displaying choice identity, inline choice text editor, target paragraph selector dropdown, and bidirectional source-to-target jump badges.
    - **`choiceCombatSection.js`**: Read-only combat outcome badge, opponent avatar preview, and battle details when a choice represents a post-combat branching path.
    - **`choiceConditionSection.js`**: Dynamic precondition builder with support for item requirements, stat/parameter thresholds (with mathematical operators), tag flags, and custom author text conditions.
    - **`choiceCostsSection.js`**: Choice requirements and upfront costs (inventory item consumption, stat/health deductions) with modal prompt inputs and instant removal.
    - **`choiceRewardsSection.js`**: Choice rewards and loot granted upon selection (inventory item additions, stat/parameter bonuses) with empty state rendering.
    - **`choiceDiceSection.js`**: Stat-based dice checks (d6/d20/custom formula) with threshold branches, target paragraph overrides, modifiers, and graph synchronisation.
    - **`choiceAddDropdown.js`**: Accessible popover menu for progressively adding optional choice features (Conditions, Costs, Rewards, Dice Checks) with click-outside dismissal.
    - **`choiceActionsSection.js`**: Choice deletion workflows with confirmation modals and focus-in-graph navigation buttons.
    - **`choiceDatalists.js`**: Autocomplete `<datalist>` containers for project items, character stats/parameters/skills, and narrative tags.
- **`exitsModule.js`**: Paragraph exit links overview and jump target manager.
- **`modules/`**: Additional attribute and configuration modules (entity tags, custom attributes, start node configuration).

### 4.3. `drawer/` — Left Entity Navigation

Decomposed into dedicated single-domain list renderers and search utilities:

- **Domain List Modules**:
    - `drawerListsParagraphs.js`: Paragraph cards with start/end badges, numbering locks, tag badges, and quick-add action buttons.
    - `drawerListsScenes.js`: Scene group cards with nested paragraph counts and initial paragraph designations.
    - `drawerListsConnections.js`: Global overview of all story branch choices and target paragraph jumps.
    - `drawerListsCharacters.js`: NPC list with archetype avatars and template badges.
    - `drawerListsLocations.js`: Location cards with description snippets.
    - `drawerListsItems.js`: Item catalog cards with category indicators.
    - `drawerListsTraits.js`: RPG rules overview (Stats, Skills, Parameters, Features).
    - `drawerListsTags.js`: Story tags with color swatches and usage counts.
    - `drawerListsMainCharacter.js`: Dedicated player character summary and quick-launch button.
- **`drawerSearch.js`**: Real-time multi-category search input controller.
- **`filterPopover.js`**: Faceted filter popover with multi-criteria badges (tags, scenes, characters).
- **`index.js`**: Unified barrel export consolidating the drawer API.

### 4.4. `editor/` — TipTap Rich Markdown Subsystem

Restructured into focused domain subdirectories with explicit separation of instances, toolbar, modals, and utilities:

- **`instances/` (`mainEditor.js`)**: Mounts, configures, and controls the active TipTap instance.
- **`toolbar/` (`editorToolbar.js`)**: Formatting controls (headings, bold, italic, underline, lists, quotes, dialogs, image uploads, styles).
- **`modals/`**:
    - `customStyleModal.js`: Dialog for creating and modifying project-specific CSS text styles.
    - `fontBrowserModal.js`: Google Fonts browser with offline fallback selection.
    - `entityLinkModal.js`: Popover for creating and editing bidirectional `@` entity mentions and grammatical aliases.
- **`utils/`**:
    - `editorUtils.js`: Text extraction, formatting helpers, and DOM position helpers.
    - `customStylesMenu.js`: Dropdown menu for selecting and applying project custom styles.
- **Drawers (`heroEditor.js`, `npcEditor.js`)**: Narrative chronicle drawers embedded inside character modals.
- **`index.js`**: Barrel export re-exporting the complete editor public interface.

### 4.5. `graph/` — Story Graph Coordinator

- **`storyGraphController.js`**: Wires Cytoscape events to MVVM selection and navigation.
- **`graphEventHandlers.js`**: Decoupled graph interaction handlers (node clicks, background clicks, box selection, element drag-and-drop).
- **`graphZoomControls.js`**: Floating zoom controls (`+`, `-`, fit, 100%) with explicit lifecycle teardown (`cleanupGraphZoomControls`).
- **`graphDropZone.js`**: Drag & drop target handling for visual linking between nodes.
- **Lifecycle Management**: Clean unmounting via `destroyStoryGraph()` removing event listeners and releasing Cytoscape instances.

### 4.6. `modals/` — Specialized Functional Modals

- **`export/` & `compiler/`**: Publication wizard compiling PDF, DOCX, HTML, and ZIP archives:
    - `exportModal.js`: Multi-step publication wizard UI and configuration modal.
    - `compiler/gamebookCompiler.js`: Compiler pipeline orchestrator.
    - `compiler/compilerExtractors.js`: Text extraction and player character resolving.
    - `compiler/compilerCharacterSheet.js`: Markdown character sheet table compiler.
    - `compiler/compilerCombat.js`: Combat encounter block parser and HTML renderer.
    - `compiler/compilerMarkdown.js`: Inline Markdown to HTML parser and emoji stripper.
    - `compiler/compilerPrint.js`: Print-ready HTML generator with `@page` CSS layout.
- **`playtest/`**: Interactive walkthrough debugger:
    - `playtestEngine.js`: Headless narrative engine managing state, paragraph transitions, variable changes, and dice checks.
    - `playtestMarkdown.js`: Markdown renderer tailored for playtest transcripts and choices.
    - `playtestModal.js`: Interactive UI view controller and modal bindings.
    - `index.js`: Barrel facade re-exporting engine and view.
- **`hero/` (`heroModal.js`, `heroSaver.js`, `heroSectionControllers.js`)**: Protagonist creation and configuration modal with vital parameter formula evaluator and avatar picker.
- **`npc/` (`npcModal.js`, `npcCharacterSaver.js`, `npcSectionControllers.js`)**: NPC Folio modal with archetype templates and stats.
- **`confirm/` (`confirmModal.js`)**: Application and project close confirmation modals with dirty state verification.
- **`styleEditor/` (`styleEditorModal.js`)**: Visual style customization modal.

### 4.7. `assets/` — Media & Image Subsystem

Decomposed into modular, single-responsibility subpackages with backward-compatible root facades:

- **`common/`** (`assetPathResolver.js`, `assetDropZone.js`, `assetCardTemplate.js`, `index.js`):
    - `assetPathResolver.js`: Safe project path resolution via `appContext` (`ctx.projectPath` / `ctx.getProjectPath()`) without mutating `window`.
    - `assetDropZone.js`: Drag-and-drop setup for image files with validation and auto-import.
    - `assetCardTemplate.js`: Reusable gallery cards with format badges and `formatFileSize()`.
- **`picker/`** (`assetPickerGrid.js`, `assetPickerModal.js`, `index.js`):
    - `assetPickerGrid.js`: Real-time query search and thumbnail grid rendering.
    - `assetPickerModal.js`: Reusable image picker dialog with native disk import (`importImageNative`) and `Escape` key support.
- **`manager/`** (`assetManagerModal.js`, `assetManagerGrid.js`, `assetDetailPanel.js`, `assetRenameDialog.js`, `assetDeleteDialog.js`, `index.js`):
    - `assetManagerModal.js`: Coordinator for the central asset gallery modal.
    - `assetManagerGrid.js`: Gallery filtering by category/query, sorting by date/name/size, and total library size calculation.
    - `assetDetailPanel.js`: Sidebar inspector displaying metadata, image dimensions with race-condition guard (`_currentLoadingPath`), and entity usage badges.
    - `assetRenameDialog.js`: Custom rename modal dialog with character validation and project-wide reference refactoring.
    - `assetDeleteDialog.js`: Safe asset deletion dialog with warnings when assets are actively referenced in nodes or NPCs.
- **`editor/`** (`imageEditorModal.js`, `imageEditorState.js`, `imageEditorCrop.js`, `imageEditorCanvas.js`, `imageEditorSave.js`, `index.js`):
    - `imageEditorState.js`: Pure data models for aspect ratio calculations, rotation bounds, and transformation clamping.
    - `imageEditorCrop.js`: Interactive cropping overlay with 8 handles; strictly mounts mouse listeners on drag and releases them on mouseup, eliminating memory leaks.
    - `imageEditorCanvas.js`: 2D preview canvas applying affine transforms, mirroring, and CSS color filter adjustments.
    - `imageEditorSave.js`: Detects MIME types/quality and saves modified files via IPC.
    - `imageEditorModal.js`: Coordinator managing editor lifecycle, with `setContext(ctx)` to eliminate stale context bugs.
- **Root Facades (`assetPicker.js`, `assetManagerModal.js`, `imageEditorModal.js`, `index.js`)**: Thin backward-compatible re-exports preserving existing signatures for `topBar.js`, `mainEditor.js`, and external modules.

### 4.8. `project/` — Persistence, Autosave & Project Lifecycle

- **`projectSaver.js`**: Serializes full project payload for `save-full-project` with `isSavingStatus()` and `resetProjectSaverState()`.
- **`projectStateTracker.js`**: Computes dirty state hashes to detect unsaved modifications, with `resetProjectStateTracker()`.
- **`autoSaveService.js`**: Non-blocking periodic autosave with visual debounce.
- **`mainWindowProjectActions.js`**: Project lifecycle coordinator handling `applyLoadedProject` and native IPC interactions (`open-project`, `restore-project`, `close-project`, `onAppCloseRequested`).

### 4.9. `startWindow/` — Launcher View Lifecycle

- **`StartWindowView.ts`**: Pure TypeScript presentation controller for the welcome/launcher window. Features complete lifecycle cleanup via `destroy()`:
    - Unsubscribes all ViewModel state listeners.
    - Detaches global document event listeners (`click`, `keydown`).
    - Cleans up popovers, recent project cards, and project template selections.
- **`index.ts`**: Export facade for the start window module.

### 4.10. `common/` — Shared Infrastructure & UI Helpers

- **`graphValidator.js`**: Adapter/facade for `GraphValidationService` providing validation reports on story graph structural integrity (unreachable paragraphs, broken jumps, dead ends, and cycles).
- **`htmlTemplates.js`**:
    - `escapeHtml(str)`: Centralized XSS sanitizer neutralizing HTML entities (`&`, `<`, `>`, `"`, `'`).
    - `getTypeBadgeColor(type)`: Case-insensitive Tailwind class resolver for entity badges (paragraphs, scenes, characters, items, choices, etc.).
    - `getTypeIconSvg(type, extraClasses)`: SVG icon generator for entity types.
    - `PRESET_COLORS`: Frozen array of 12 curated hexadecimal palette colors for tags and scenes.
    - `renderColorPresetButtonsHtml(presetColors, currentColor)`: Safe color picker preset button renderer with active ring indicators.
    - `renderEmptyPlaceholderHtml(iconText, message)`: Standardized empty state container with icon and escaped message.
- **`npcAvatars.js`**:
    - `FANTASY_AVATARS`: Frozen catalog of 10 classic tabletop RPG archetype avatars (Warrior, Mage, Rogue, Cleric, Ranger, Paladin, Bard, Necromancer, Druid, Merchant) with inline SVG vectors.
    - `getAvatarById(id)`: Resolves avatar definitions by ID or relative asset path (`isCustomAvatarPath`), safely generating `<img src="${escapeHtml(assetUrl)}" />` for custom portraits.
    - `getAvatarName(avatar)`: Null-safe localized display name resolver with multi-level fallbacks.

### 4.11. Root View Data Providers (`View/`)

- **`MainWindow.js`**: Master entry point for the main editor window. Coordinates `appContext` accessors, binds top-level action buttons, and orchestrates startup initialization (`initApp()`).
- **`projectData.js`**: Production project data extraction and loading provider (`extractProjectData`, `loadRealProjectData`, `loadProjectData`, `USE_MOCK`).
- **`mockData.js`**: Developer mock datasets (`createMockProjectData`, `mockFiles`) and backward-compatible re-exports.

---

## 5. Story Graph Subsystem (`Modules/Graph/`)

The visual story graph is powered by Cytoscape.js coupled with Custom Web Components, organized into focused subpackages:

- **`core/`** (`StoryGraph.ts`): Orchestrates viewport state, canvas event routing, Cytoscape pan/zoom synchronization, drag-and-drop link creation, multi-selection marquee, and typed combat outcome edges.
- **`nodes/`** (`ParagraphNode`, `SceneNode`): Custom Web Components (`<paragraph-node>`, `<scene-node>`) with HTML templates and typed DOM element factories. Fully localized via `Locales/{pl,en,de}/translation.json` (`graph.end_node_badge`, `graph.node.combat`).
- **`styles/`** (`StoryGraphStyles.ts`): Theme tokens (`GRAPH_THEME`), accessible contrast calculation (`getContrastTextColor`), unbundled bezier edge routing with dynamic fanout, and crossing prevention algorithms.
- **`types.ts` & `index.ts`**: Unified configuration interfaces and facade entry point consumed by `scripts/build-renderer.js`.

```text
┌────────────────────────────────────────────────────────┐
│ Graph Canvas Container (#graph-canvas-container)       │
│                                                        │
│  Layer 1 (Background): Cytoscape.js Canvas             │
│  - Curved bezier & straight edge routing               │
│  - Choice direction arrows & connection anchor spacing │
│  - Physics, collision prevention, pan, and zoom        │
│                                                        │
│  Layer 2 (Foreground): DOM Overlay Web Components      │
│  - <scene-node> (grouping boundaries)                  │
│  - <paragraph-node> (interactive HTML cards)           │
│    * Quick choice creation inputs                      │
│    * Real-time drag-and-drop connection handles        │
└────────────────────────────────────────────────────────┘
```

---

## 6. Frontend Testing Strategy

The presentation layer is thoroughly covered by automated unit and integration tests using **Vitest** and **happy-dom**:

- **133 test files, 1664 automated tests passing (100% pass rate).**
- **Domain Model Tests** (`tests/Model/`): Validates entity creation, mutations, choice management, and deserialization via `Project.fromJSON()`.
- **ViewModel Tests** (`tests/ViewModel/`): Validates search algorithms, drawer toggling, history navigation, and launcher validation rules without spinning up Electron windows.
- **View & DOM Tests** (`tests/View/`): Verifies Web Component lifecycle events (`<paragraph-node>`, `<scene-node>`), HTML template instantiation, and UI controller interactions.
- **Feature Module Tests** (`tests/Modules/`): Tests TipTap Markdown parsing, image processing algorithms, and custom style sanitization.
