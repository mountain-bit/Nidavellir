# Task List & Roadmap (TODO & Development Plan)
## Gamebook Engine

This document serves as a comprehensive registry of planned features, enhancements, and modules to be implemented in the **Gamebook Engine** project. Each module includes a granular breakdown of technical tasks, related architectural components, and implementation priorities.

---

## Table of Contents
1. [NPC & Template Creation System](#1-npc--template-creation-system)
2. [Player Character Creation & Configuration System](#2-player-character-creation--configuration-system)
3. [Rich Markdown Editing System](#3-rich-markdown-editing-system)
4. [Comprehensive File Saving & Project Persistence System](#4-comprehensive-file-saving--project-persistence-system)
5. [Publication & Export System (PDF & DOCX)](#5-publication--export-system-pdf--docx)
6. [Extended Styling & Theming System](#6-extended-styling--theming-system)
7. [Story Graph Validation & Loop Detection System](#7-story-graph-validation--loop-detection-system)
8. [Additional Key Systems (Engine Extensions)](#8-additional-key-systems-engine-extensions)
   - [8.1. Interactive Playtester & Gameplay Walkthrough Debugger](#81-interactive-playtester--gameplay-walkthrough-debugger)
   - [8.2. Story Variables, Flags, and Dice Mechanics](#82-story-variables-flags-and-dice-mechanics)
   - [8.3. Media & Asset Manager](#83-media--asset-manager)
   - [8.4. Global Search & Replace](#84-global-search--replace)
   - [8.5. Import and Export of External Formats (Twine, Ink, Web Player) (Optional)](#85-import-and-export-of-external-formats-twine-ink-web-player-optional)

---

## 3. Rich Markdown Editing System
- [x] **Core TipTap Markdown Editor (`Modules/Editor/MarkdownEditor.ts`)**
  - [x] Headings 1–5, bold, italic, underline (`<u>`), strikethrough (`~~`), lists, blockquotes
  - [x] Custom Dialogue Block (`.gamebook-dialog`) with automated em-dash prefix (`— `) handling
  - [x] Entity Mention System (`@`) with autocomplete popup and bi-directional linking `[Name](entity://type/id)`
  - [x] Word and character count live statistics
- [x] **Custom Text Styles Subsystem (`Modules/Editor/CustomStylesService.ts`)**
  - [x] Style definition with colors, backgrounds, borders, typography, and font family
  - [x] Dynamic CSS stylesheet generation and injection
  - [x] CSS/XSS input sanitization (`Modules/Editor/styleSanitizer.ts`)
  - [x] Project persistence round-trip in `project.json`
- [x] **Typography & Font Management (`Modules/Editor/CustomFontsService.ts`)**
  - [x] Curated fantasy & historical Google Fonts catalog
  - [x] Offline fallback catalog with Polish diacritics support (`supportsPolish`)
  - [x] Google Fonts browser modal with live sample preview
  - [x] Robust CSS font stacks for serif, sans-serif, and monospace
- [x] **View Modularization & Internationalization (`View/ui/editor/`)**
  - [x] Toolbar controllers (`editorToolbar.js`, `customStylesMenu.js`) with `aria-pressed` accessibility
  - [x] Modal controllers (`customStyleModal.js`, `fontBrowserModal.js`, `entityLinkModal.js`)
  - [x] Entity mention badges with distinct highlight colors per type (characters, locations, tags, items) and tooltip previews
  - [x] Grammatical alias & custom word linking floating popover (`entityLinkModal.js`) allowing arbitrary text (e.g. „Jasiek”, „Jaśka”) to link to any project entity („Jan Kowalski”) with unlinking capability
  - [x] Lightweight editor context menu (PPM right-click) for fast entity linking of selected text and editing/unlinking clicked entity badges
  - [x] Full multilingual support (PL, EN, DE) across all editor elements
  - [x] Pure SVG icon integration via `<app-icon>` web component and `Utils/icons.ts` (0 emojis)
  - [x] Empty state & inactive handling: editor toolbar and mount are hidden/disabled with a clean empty state prompt and 1-click graph switch when no file is open

---

## 8.3. Media & Asset Manager (Graphics & Illustrations)
- [x] **Secure Project Asset Storage & Electron Protocol**
  - [x] Automatic `Assets/Images/` scaffolding within project directory in `ProjectService.js`
  - [x] Privileged `asset://` custom protocol handler with path traversal security (`isPathInsideBase`) in `main/services/AssetProtocolService.js`
  - [x] `AssetService.js` and IPC handlers (`asset-import-image`, `asset-list-images`) with native file dialog integration
  - [x] Context bridge exposed API in `preload.js` (`window.electronAPI.importImage`, `listImages`)
  - [x] Utility helpers in `Utils/assetUtils.ts` (`toAssetUrl`, `toRelativeAssetPath`, `isCustomAvatarPath`)
- [x] **Markdown Text Illustrations Subsystem**
  - [x] TipTap `CustomImage` Node extension (`Modules/Editor/extensions/CustomImage.ts`) with block image styling
  - [x] Portable relative path serialization (`![alt](Assets/Images/photo.png)`) and live rendering (`asset://project/...`)
  - [x] Toolbar button (`#btn-editor-image`) with centralized SVG icon (`image`) in `View/ui/editor/editorToolbar.js`
- [x] **Custom NPC Avatar & Portrait Subsystem**
  - [x] Backward-compatible model representation supporting both SVG preset IDs and relative image paths
  - [x] Hybrid portrait renderer in `View/ui/npcAvatars.js` (`getAvatarById`) generating responsive `<img>` for file paths and `<svg>` for archetypes
  - [x] NPC modal upload button (`#btn-npc-upload-custom-avatar`) in avatar picker popover (`npcSectionControllers.js`)
  - [x] Seamless propagation to details panel, drawer lists, and character sheets
- [x] **In-App Image Editor & Double-Click Modal Subsystem (`View/ui/imageEditorModal.js`, `Modules/ImageEditor/`)**
  - [x] Double-click trigger (`dblclick`) on markdown illustrations in TipTap and custom NPC avatars
  - [x] Pure Canvas 2D image processing engine (`Modules/ImageEditor/ImageProcessor.ts`) with unit tests
  - [x] Interactive Cropping tool with handles, Rule of Thirds grid, and aspect ratio presets (Free, 1:1, 16:9, 4:3, 3:2)
  - [x] Precision Scaling with pixel inputs, aspect lock toggle, and quick scaling presets (100%, 75%, 50%, 25%, 800px, 400px)
  - [x] Rotation (-90°, +90°) and mirroring (Flip Horizontal, Flip Vertical)
  - [x] Real-time Color Adjustments: Brightness, Contrast, Saturation, Sepia (Parchment), Grayscale, and Hue rotation
  - [x] Safe project persistence via `AssetService.saveEditedImage`: "Save as Copy" (non-destructive) and "Overwrite Original"
  - [x] Full multilingual localization (PL, EN, DE) and custom SVG icons in `Utils/icons.ts`
- [x] **Full Multilingual Localization (PL, EN, DE)**
  - [x] Localized toolbar tooltips, buttons, error toasts, and avatar labels in `Locales/*/translation.json`
- [x] **Asset System Fixes & Drag-and-Drop Enhancement**
  - [x] Resolved "No project selected" error on image button click via automatic fallback in `ProjectService.getCurrentProjectDir()` (recent project / default workspace directory) and Ribbon "Otwórz projekt" (`data-action="open-project"`) integration.
  - [x] Fixed NPC avatar upload button in NPC modal (`#btn-npc-upload-custom-avatar`) and added custom avatar upload button in the NPC details panel (`#btn-details-upload-avatar`).
  - [x] Implemented Drag & Drop image file handling (`asset-import-file`, `webUtils.getPathForFile`, base64 fallback) for the markdown editor (TipTap & raw) and NPC portraits with glowing visual drop zones.

