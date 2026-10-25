# Task List & Roadmap (TODO & Development Plan)
## Gamebook Engine

This document serves as a comprehensive registry of implemented features, architectural components, and future development milestones in the **Gamebook Engine** project.

---

## Table of Contents
1. [NPC & Template Creation System](#1-npc--template-creation-system)
2. [Player Character Creation & Configuration System](#2-player-character-creation--configuration-system)
3. [Items & Inventory Management System](#3-items--inventory-management-system)
4. [Rich Markdown Editing System](#4-rich-markdown-editing-system)
5. [Comprehensive File Saving & Project Persistence System](#5-comprehensive-file-saving--project-persistence-system)
6. [Publication & Export System (PDF, DOCX, HTML, ZIP)](#6-publication--export-system-pdf-docx-html-zip)
7. [Extended Styling & Theming System](#7-extended-styling--theming-system)
8. [Story Graph Validation & Loop Detection System](#8-story-graph-validation--loop-detection-system)
9. [Additional Key Systems (Engine Extensions)](#9-additional-key-systems-engine-extensions)
   - [9.1. Interactive Playtester & Gameplay Walkthrough Debugger](#91-interactive-playtester--gameplay-walkthrough-debugger)
   - [9.2. Combat & Dice Mechanics](#92-combat--dice-mechanics)
   - [9.3. Media & Asset Manager](#93-media--asset-manager)
   - [9.4. Global Quick Search & Navigation](#94-global-quick-search--navigation)
   - [9.5. ZIP Project Backup & Restore](#95-zip-project-backup--restore)
10. [Top Bar Toolbar System (Pasek Górny)](#10-top-bar-toolbar-system-pasek-górny)
11. [Future Roadmap & Planned Enhancements](#11-future-roadmap--planned-enhancements)

---

## 1. NPC & Template Creation System
- [x] **Domain Models (`Model/NPC.ts`, `Model/NPC_Template.ts`)**
  - [x] Full model with identity, stats (`Stat[]`), parameters (`Parameter[]`), skills (`Skill[]`), features (`Feature[]`), items (`Item[]`), and tags (`Tag[]`).
  - [x] Template inheritance, merging with existing NPCs, and archetype generation.
  - [x] Deserialization backward compatibility (Polish and English keys) and JSON serialization.
- [x] **Dedicated NPC Folio Modal (`View/ui/modals/npc/`)**
  - [x] Draggable and resizable modal window with tabs and live validation.
  - [x] Preset avatar selector (`FANTASY_AVATARS`) and custom image uploads via `asset://`.
  - [x] Dynamic formula evaluator (`evaluateFormula`) for vital parameters (e.g. HP based on Strength).
  - [x] Skill modifier calculator (`stat_mod`) linking skills with parent attributes.
  - [x] Integrated chronicle and TipTap narrative editor (`npcEditor.js`).
- [x] **Left Drawer & Details Panel Integration**
  - [x] NPC and Template lists with search, filter, and avatar previews (`drawerLists.js`).
  - [x] Read-only inspector panel for characters in the right sidebar (`npcReadOnlyDetails.js`).

---

## 2. Player Character Creation & Configuration System
- [x] **Player Character Domain Model (`Model/PlayerCharacter.ts`)**
  - [x] Full model with `id`, `name`, `description` (`Description`), `avatar` (preset or custom), `characterClass` (`CharacterClass`), `stats` (`Stat[]`), `parameters` (`Parameter[]`), `skills` (`Skill[]`), `tags` (`Tag[]`), and `customAttributes`.
  - [x] Accessors for `summary`, serialization (`toJSON`, `fromJSON`), and persistence synchronization.
  - [x] Project integration in `Model/Project.ts` (`getPlayerCharacter`, `setPlayerCharacter`).
- [x] **Dedicated Player Character Creation & Editing Modal (`View/ui/modals/hero/`)**
  - [x] Floating draggable and resizable modal window (`#hero-create-modal`) matching the visual design and capabilities of the NPC Folio.
  - [x] Character portrait & avatar selector with presets (`FANTASY_AVATARS`) and custom image uploads.
  - [x] Character class selector (`hero-class-select`) with predefined archetypes.
  - [x] Identity attributes section with suggestions chip bar (Rasa, Pochodzenie, Wiek, Bóstwo, Miano).
  - [x] Base RPG stats section with suggestion chips from project pool.
  - [x] Dynamic vital parameters (HP, Mana, Kondycja) with live mathematical formula evaluator (`evaluateFormula`).
  - [x] Skills system with direct bonuses and stat modifiers (`stat_mod`).
  - [x] Tags management with color-coded chip pickers.
  - [x] Expandable Narrative Chronicle drawer with dedicated TipTap Markdown editor (`View/ui/editor/heroEditor.js`).
  - [x] Form dirty-checking, unsaved changes protection on ESC/close, and validation.
- [x] **Left Drawer & Details Panel Integration**
  - [x] Left drawer tab (`main-character` / `#main-character-container`) with empty state prompt and populated hero preview card with edit button (`#btn-drawer-edit-hero`).
  - [x] Ribbon toolbar integration (`data-action="open-hero-modal"`).
  - [x] Read-only inspector panel (`View/ui/detailsPanel/heroReadOnlyDetails.js`) for the protagonist in the right sidebar.
- [x] **Multilingual Support & Test Suite**
  - [x] Complete localization strings in `Locales/pl/translation.json`, `Locales/en/translation.json`, and `Locales/de/translation.json`.
  - [x] Vitest unit & integration test coverage (`tests/Model/PlayerCharacter.test.ts`, `tests/View/HeroModal.test.ts`).

---

## 3. Items & Inventory Management System
- [x] **Item Domain Models (`Model/Item.ts`, `Model/Inventory.ts`, `Model/Paragraph.ts`, `Model/Project.ts`)**
  - [x] Full Item domain model with `id`, `name`, `description` (`Description`), `category` (`ItemCategory`), `consumable` flag, `slotSize` (slotless/trinket vs multi-slot), `weight`, `tags` (`Tag[]`), and RPG modifiers (`ItemModifier[]`).
  - [x] Starting inventory correlation: `inStartingInventory` flag with target inventory binding (`targetInventoryId`) linking with `PlayerCharacter.inventories`.
  - [x] Narrative paragraph item integration: `givenItems` (awarded to hero), `requiredItems` (entry/choice prerequisites), and `removedItems` (consumed or surrendered).
  - [x] Backward-compatible serialization (`toJSON`, `fromJSON`) supporting legacy models, Polish key aliases, and automatic fallback defaults.
  - [x] Project registry synchronization in `Model/Project.ts` and `ViewModel/MainWindowViewModel.ts` (`projectItems`, `addItem`, `removeItem`, `getItemById`, `findItemByName`).
- [x] **Paragraph Details Panel Module (`View/ui/detailsPanel/modules/itemsModule.js`)**
  - [x] Right sidebar accordion module for narrative paragraphs displaying item counts badges (otrzymane, wymagane, tracone).
  - [x] Colored interactive item pills with quick removal (`x`) and click-to-inspect navigation.
  - [x] Item picker dropdowns populated with project items and an inline "Quick Add" trigger to create new items instantly.
  - [x] Cohesive integration with `detailsPanel.js` for paragraph inspections.
- [x] **Dedicated Item Inspector Panel (`View/ui/detailsPanel/itemDetails.js`)**
  - [x] Full-fledged inspector in the right sidebar with breadcrumb history navigation (`ctx.renderHistoryBar`).
  - [x] Item ID card with one-click clipboard copy button.
  - [x] Editable name field with real-time uniqueness validation against existing project items.
  - [x] Item category selector (Broń, Pancerz, Przedmiot użytkowy, Przedmiot fabularny, Zwój, Artefakt, Inne) and consumable toggle.
  - [x] Inventory rules: `slotSize` stepper (0 = bibelot/trinket nie zajmujący slotu, 1+ = standardowe sloty ekwipunku), `weight` counter, and starting inventory selector syncing with protagonist inventories.
  - [x] Tags management section with color-coded chip pickers, active tags list, and detachment.
  - [x] Dynamic RPG Modifiers module: list of active modifiers (stat, parameter, skill, feature, custom) with target, operator (`+`, `-`, `=`, `*`, `/`), and numeric value, plus form to add new modifiers and remove existing ones.
  - [x] Narrative description summary textarea with a button to open the markdown file in the main rich text editor.
  - [x] Paragraph citations list showing all paragraphs where the item is given, required, or removed, with one-click graph centering and paragraph navigation.
  - [x] Protagonist character sheet integration (`View/ui/detailsPanel/heroReadOnlyDetails.js`): inventory chips are interactive buttons opening the Item Inspector.
- [x] **Item Export Service & Publication Compilation (`Services/ItemExportService.ts`, `gamebookCompiler.js`)**
  - [x] Structured JSON export with complete item definitions, modifiers, tags, and optional paragraph usage citations.
  - [x] Excel-compatible CSV export with UTF-8 BOM (`\uFEFF`) and RFC 4180 escaping.
  - [x] Clean Markdown catalogue generator with overview summary table, detailed item cards, modifiers table, tags, and narrative description.
  - [x] Clipboard copy and native browser file download helpers.
  - [x] Export modal and Gamebook Compiler integration (`View/ui/modals/export/gamebookCompiler.js`) rendering item pills, modifiers, and tags in exported books and PDFs.
- [x] **Global Quick Search & Navigation Integration (`View/ui/workspace/quickSearch.js`)**
  - [x] Quick search palette (`Ctrl+K` / `Cmd+K`) indexing all items under the `items` category.
  - [x] Support for searching by item name, ID, category, tags, and RPG modifiers (Tier 5 metadata scoring).
  - [x] Direct navigation from search results to the Item Details inspector with sidebar auto-expansion.
- [x] **Multilingual Support & Test Suite**
  - [x] Complete localization in Polish, English, and German (`Locales/{pl,en,de}/translation.json`).
  - [x] Comprehensive Vitest coverage across models, UI modules, export service, and search ranking (`tests/Model/ItemWithModifiers.test.ts`, `tests/View/DetailsPanelItemsModule.test.ts`, `tests/View/ItemDetails.test.ts`, `tests/Services/ItemExportService.test.ts`, `tests/View/QuickSearch.test.ts`).

---

## 4. Rich Markdown Editing System
- [x] **Core TipTap Markdown Editor (`Modules/Editor/MarkdownEditor.ts`)**
  - [x] Headings 1–5, bold, italic, underline (`<u>`), strikethrough (`~~`), lists, blockquotes.
  - [x] Custom Dialogue Block (`.gamebook-dialog`) with automated em-dash prefix (`— `) handling.
  - [x] Entity Mention System (`@`) with autocomplete popup and bi-directional linking `[Name](entity://type/id)`.
  - [x] Word and character count live statistics.
- [x] **Custom Text Styles Subsystem (`Modules/Editor/CustomStylesService.ts`)**
  - [x] Style definition with colors, backgrounds, borders, typography, and font family.
  - [x] Dynamic CSS stylesheet generation and injection.
  - [x] CSS/XSS input sanitization (`Modules/Editor/styleSanitizer.ts`).
  - [x] Project persistence round-trip in `project.json`.
- [x] **Typography & Font Management (`Modules/Editor/CustomFontsService.ts`)**
  - [x] Curated fantasy & historical Google Fonts catalog.
  - [x] Offline fallback catalog with Polish diacritics support (`supportsPolish`).
  - [x] Google Fonts browser modal with live sample preview.
  - [x] Robust CSS font stacks for serif, sans-serif, and monospace.
- [x] **View Modularization & Internationalization (`View/ui/editor/`)**
  - [x] Toolbar controllers (`editorToolbar.js`, `customStylesMenu.js`) with `aria-pressed` accessibility.
  - [x] Modal controllers (`customStyleModal.js`, `fontBrowserModal.js`, `entityLinkModal.js`, `descriptionEmbedModal.js`).
  - [x] Entity mention badges with distinct highlight colors per type (characters, locations, tags, items) and tooltip previews.
  - [x] Grammatical alias & custom word linking floating popover (`entityLinkModal.js`) allowing arbitrary text to link to any project entity.
  - [x] Lightweight editor context menu (PPM right-click) for fast entity linking and unlinking.
  - [x] Full multilingual support (PL, EN, DE) across all editor elements.
  - [x] Pure SVG icon integration via `<app-icon>` web component and `Utils/icons.ts`.
  - [x] Empty state & inactive handling when no file is open.

---

## 5. Comprehensive File Saving & Project Persistence System
- [x] **Atomic Disk Transactions**
  - [x] Transactional writes via temporary sibling files (`*.tmp`) and atomic rename (`fs.renameSync`) in `Utils/fsSecurity.js`.
  - [x] Path traversal validation (`isPathInsideBase`) across all I/O operations.
- [x] **Dirty State Tracking & Autosave (`View/ui/project/`)**
  - [x] `projectStateTracker.js` calculating state hashes and dirty status flags across entities, story graph, and character sheets.
  - [x] `autoSaveService.js` providing periodic background saving with visual debouncing and activity detection.
  - [x] `projectSaver.js` orchestrating full project payload serialization (scenes, paragraphs, NPCs, items, hero, settings).
- [x] **Unsaved Changes Dialog**
  - [x] Modal dialog warning before project switch, window close, or app quit with options to Save, Discard, or Cancel (`confirmModal.js`).

---

## 6. Publication & Export System (PDF, DOCX, HTML, ZIP)
- [x] **Compilation Engine (`View/ui/modals/export/gamebookCompiler.js`)**
  - [x] Aggregation of narrative paragraphs sorted by natural or randomized numbering.
  - [x] Paragraph choice re-mapping when numbering is randomized/shuffled.
  - [x] Combat encounter blocks generation embedded in paragraphs.
  - [x] Entity mention formatting (names, aliases) cleaned for publication text.
  - [x] Rich protagonist character sheet appendix with stats, parameters, formulas, inventory, and skills.
  - [x] Bestiary / Dramatis Personae appendix with NPC stat blocks, portraits, and descriptions.
  - [x] Table of Contents and rules reference sheets.
  - [x] Author's Game Rules integration: automatic inclusion of `Rules/GameRules.md` in HTML, PDF, and DOCX publications, plus standalone HTML handout export via `Services/RulesExportService.ts` and editor toolbar button.
- [x] **Multi-Format Export Handlers (`main/services/ExportService.js`, `main/ipc/exportIpc.js`)**
  - [x] **HTML Standalone**: Single-file export with embedded styles, ready for web distribution.
  - [x] **PDF Export**: Print-ready layout generated via Electron Chromium `printToPDF` with `@page` styling, headers, and footers.
  - [x] **DOCX Export**: Structured Microsoft Word document generation via `docx` library with styled headings, tables, callouts, and page breaks.
  - [x] **ZIP Export**: Complete self-contained project archive with all assets, JSON models, and Markdown documents.
- [x] **Export UI Modal (`View/ui/modals/export/exportModal.js`)**
  - [x] Preset selector (Classic Gamebook, Dark Fantasy, Cyberpunk/Sci-Fi).
  - [x] Toggles for paragraph shuffling, character sheet inclusion, bestiary inclusion, and table of contents.
  - [x] Live progress indicator and native OS save-file dialog integration.

---

## 7. Extended Styling & Theming System
- [x] **Custom Text Styles Subsystem**
  - [x] Persistent custom style definitions (spells, thoughts, whispers, ancient runes) stored in `project.json`.
  - [x] Style preview and live editing modal (`customStyleModal.js`).
- [x] **Font Management Subsystem**
  - [x] Curated Google Fonts catalog with offline fallbacks.
  - [x] Typography selection for editor and export stylesheets.
- [x] **Global Application Themes**
  - [x] Modern dark theme (`#18181b` Zinc base) styled with Tailwind CSS 4.
  - [x] Parchment / sepia themes for gamebook export templates.

---

## 8. Story Graph Validation & Loop Detection System
- [x] **Graph Analysis Engine (`Services/GraphValidator.ts`)**
  - [x] Detection of orphan nodes (paragraphs without incoming or outgoing connections).
  - [x] Detection of dead-end paragraphs (leaves without choices or marked ending tags).
  - [x] Detection of unreachable paragraphs (islands disconnected from starting scenes).
  - [x] Graph cycle and infinite loop detection algorithm with loop path tracing.
- [x] **UI Validation Panel & Top Bar Integration (`View/ui/workspace/topBar.js`, `View/ui/graphValidator.js`)**
  - [x] Diagnostics badge in top bar showing error/warning counts.
  - [x] One-click zoom and pan to problematic nodes directly on the Cytoscape canvas.
  - [x] Issue details list with severity filters and clear remediation hints.

---

## 9. Additional Key Systems (Engine Extensions)

### 9.1. Interactive Playtester & Gameplay Walkthrough Debugger
- [x] **Simulation Engine & Modal (`View/ui/modals/playtest/playtestModal.js`)**
  - [x] Step-by-step gamebook reader rendering paragraphs with choice buttons.
  - [x] Real-time tracking of protagonist stats, inventory, and dynamic parameter values.
  - [x] Interactive condition evaluation (disabling or hiding choices when prerequisites are not met).
  - [x] Move history breadcrumbs with rollback / undo capability for testing alternative paths.
  - [x] Dice roller utility for combat and skill checks during playthroughs.

### 9.2. Combat & Dice Mechanics
- [x] **Combat Domain Model (`Model/Combat.ts`)**
  - [x] Opponent configuration, combat stats, victory and defeat target paragraph routing.
- [x] **Combat UI & Markdown Sync (`View/ui/detailsPanel/combat/`, `Services/CombatMarkdownService.ts`)**
  - [x] Inline combat configuration panel in paragraph inspector.
  - [x] Synchronization between combat settings and TipTap markdown combat blocks.

### 9.3. Media & Asset Manager
- [x] **Secure Project Asset Storage & Electron Protocol**
  - [x] Automatic `Assets/Images/` folder creation in project directory.
  - [x] Privileged `asset://` custom protocol handler with path traversal security in `AssetProtocolService.js`.
  - [x] Native image import and asset browser dialogs (`assetIpc.js`, `AssetService.js`).
- [x] **In-App Image Editor Subsystem (`View/ui/assets/imageEditorModal.js`, `Modules/ImageEditor/`)**
  - [x] Canvas 2D image processing engine (`ImageProcessor.ts`).
  - [x] Interactive Cropping (Rule of Thirds grid, preset aspect ratios).
  - [x] Precision Scaling with pixel lock and preset scales (100%, 75%, 50%, 25%, 800px, 400px).
  - [x] Rotation (-90°, +90°) and mirroring (Flip Horizontal, Flip Vertical).
  - [x] Real-time adjustments: Brightness, Contrast, Saturation, Sepia, Grayscale, Hue rotation.
  - [x] Non-destructive "Save as Copy" and "Overwrite Original" options.

### 9.4. Global Quick Search & Navigation
- [x] **Global Quick Search (`View/ui/workspace/quickSearch.js`)**
  - [x] Keyboard shortcut `Ctrl+K` / `Cmd+K` palette.
  - [x] Instant fuzzy search across scenes, paragraphs, NPCs, items, locations, and markdown text content.
  - [x] Direct jump to entity editor, details panel, or graph node.

### 9.5. ZIP Project Backup & Restore
- [x] **Archive Management (`main/services/ExportService.js`, `main/services/ProjectService.js`)**
  - [x] One-click packaging of entire project into `.zip` archive.
  - [x] Restoration of project from archive with integrity checks and category reconstruction.

---

## 10. Top Bar Toolbar System (Pasek Górny)
- [x] **Visual Design & Categorization (`View/ui/workspace/topBar.js`)**
  - [x] Grouped toolbar buttons: Project & Files, Edit & History, Views & Panels, Graph Diagnostics, Testing & Export, Tools & Settings.
  - [x] Clean SVG icons (`Utils/icons.ts`) and full multilingual localization (PL, EN, DE).
- [x] **Full Feature Integration**
  - [x] Quick save and dirty indicator.
  - [x] Game rules file launcher (`data-action="open-game-rules"`, shortcut `F3`) with amber book icon, active tab highlight, and starter template scaffolding.
  - [x] Graph validation trigger with badge counter.
  - [x] Playtester launcher (`data-action="open-playtest"`).
  - [x] Export modal launcher (`data-action="open-export"`).
  - [x] Quick search trigger (`data-action="open-quick-search"`).

---

## 11. Future Roadmap & Planned Enhancements
- [ ] **External Formats Importer & Exporter**
  - [ ] Twine (Harlowe/SugarCube HTML) import & export.
  - [ ] Ink (Inkle) script generator.
- [ ] **Advanced Graph Layouts & Sub-graphs**
  - [ ] Hierarchical Dagre/CoSE automatic re-layout with user layout saving.
  - [ ] Nested sub-graph collapsing for multi-chapter books.
- [ ] **Standalone Web Player Export**
  - [ ] Export ready-to-publish responsive single-page web app (PWA) with sound and save slots.
