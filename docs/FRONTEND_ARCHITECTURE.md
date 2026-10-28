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
            AssetsCtrl["assets/ (Asset Manager, Canvas Image Editor, Picker)"]
            CommonCtrl["common/ (Templates, Confirm Modal, Avatars)"]
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

### 4.1. `workspace/` — Workspace & Toolbar
- **`topBar.js`**: Upper toolbar containing action groups: Project & Files, Edit & History, Views & Panels, Graph Diagnostics, Testing & Export, Tools & Settings.
- **`workspace.js`**: Dual workspace coordinator (toggling between Cytoscape graph canvas and TipTap Markdown editor), splitter drag controllers for left and right panels.
- **`quickSearch.js`**: Fast keyboard-driven command palette (`Ctrl+K` / `Cmd+K`) searching across paragraphs, scenes, NPCs, items, locations, and markdown text content.
- **`contextMenu.js`**: Canvas and node right-click menus, color picker palette modal (`openColorPicker`).

### 4.2. `detailsPanel/` — Property Inspector & Sub-modules
- **`detailsPanel.js`**: Master inspector controller rendering forms based on active entity type.
- **`combatModule.js` & `combat/`**: Turn-based combat parameters editor with enemy statistics, victory/defeat redirects, and TipTap markdown synchronization.
- **`choiceDetails.js` & `exitsModule.js`**: Outgoing choices, targets, and condition rules editor.
- **`heroReadOnlyDetails.js` & `npcReadOnlyDetails.js`**: Quick-preview cards in right sidebar for characters.
- **`historyBar.js`**: Horizontal breadcrumb navigation bar of recently visited entities.

### 4.3. `drawer/` — Left Entity Navigation
- **`drawerLists.js`**: Searchable, categorized lists of paragraphs, scenes, protagonist, NPCs, templates, locations, items, traits, and tags.
- **`drawerSearch.js`**: Text filter and search input handlers.
- **`filterPopover.js`**: Faceted filter popover with multi-criteria badges (tags, scenes, characters).

### 4.4. `editor/` — TipTap Rich Markdown Subsystem
- **`mainEditor.js`**: Mounts and controls the active TipTap instance.
- **`editorToolbar.js`**: Formatting buttons (headings, bold, italic, underline, lists, quotes, dialogs, image upload).
- **`customStylesMenu.js` & `customStyleModal.js`**: Managing project-specific CSS text styles.
- **`fontBrowserModal.js`**: Google Fonts browser with offline fallback selection.
- **`entityLinkModal.js`**: Popover for creating and editing bidirectional `@` entity mentions and grammatical aliases.
- **`heroEditor.js` & `npcEditor.js`**: Narrative chronicle drawers embedded inside character modals.

### 4.5. `graph/` — Story Graph Coordinator
- **`storyGraphController.js`**: Wires Cytoscape events to MVVM selection and navigation.
- **`graphZoomControls.js`**: Floating zoom controls (`+`, `-`, fit, 100%).
- **`graphDropZone.js`**: Drag & drop target handling for visual linking.

### 4.6. `modals/` — Specialized Functional Modals
- **`export/` (`exportModal.js`, `gamebookCompiler.js`)**: Publication wizard compiling PDF, DOCX, HTML, and ZIP archives with character sheets and paragraph shuffling.
- **`hero/` (`heroModal.js`, `heroSaver.js`)**: Protagonist creation and configuration modal with vital parameter formula evaluator.
- **`npc/` (`npcModal.js`, `npcCharacterSaver.js`)**: NPC Folio modal with archetype templates and stats.
- **`playtest/` (`playtestModal.js`)**: Interactive walkthrough debugger with condition checking, dice roller, and rollback history.

### 4.7. `assets/` — Media & Image Subsystem
- **`assetManagerModal.js`**: Project image gallery browser.
- **`imageEditorModal.js`**: Interactive canvas image editor (cropping, scaling, rotation, color filters).
- **`assetPicker.js`**: Reusable media selection dialog.

### 4.8. `project/` — Persistence & Autosave
- **`projectSaver.js`**: Serializes full project payload for `save-full-project`.
- **`projectStateTracker.js`**: Computes dirty state hashes to detect unsaved modifications.
- **`autoSaveService.js`**: Non-blocking periodic autosave with visual debounce.

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
- **88 test files, 975 automated tests passing.**
- **Domain Model Tests** (`tests/Model/`): Validates entity creation, mutations, choice management, and deserialization via `Project.fromJSON()`.
- **ViewModel Tests** (`tests/ViewModel/`): Validates search algorithms, drawer toggling, history navigation, and launcher validation rules without spinning up Electron windows.
- **View & DOM Tests** (`tests/View/`): Verifies Web Component lifecycle events (`<paragraph-node>`, `<scene-node>`), HTML template instantiation, and UI controller interactions.
- **Feature Module Tests** (`tests/Modules/`): Tests TipTap Markdown parsing, image processing algorithms, and custom style sanitization.
