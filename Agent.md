# Agent.md — Gamebook Engine

This document describes the architecture, conventions, and processes of this project for AI agents.

---

## Project Overview

A desktop application for **creating and managing gamebook games** (gamebook engine).  
Built on **Electron** with TypeScript for the business logic layer. Supports designing scenes, paragraphs, jumps, characters, locations, and combat.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop application | Electron 41+ |
| Business logic language | TypeScript 6+ |
| Graph visualization | Cytoscape.js |
| Testing | Vitest 1.x |
| Linter | ESLint 8 + @typescript-eslint |
| Formatter | Prettier 3 |
| Git hooks | Husky 9 + lint-staged 15 |
| Localization | Custom translate.ts module |

---

## Design Patterns

### MVVM (Model–View–ViewModel)

The project follows the **MVVM** pattern:

- **Model** (`/Model/*.ts`) — pure domain classes with no UI dependencies. Each class has private fields and public getters/setters using Polish naming (`pobierzX`, `ustawX`, `dodajX`, `usunX`).
- **ViewModel** (`/ViewModel/*.ts`) — presentation logic, view state, UI event handling. Has no direct knowledge of the DOM.
- **View** (`/View/*.html`) — HTML files loaded by Electron. They communicate with the ViewModel through the renderer.

### Other Patterns Used

- **Repository-like pattern** — the `Projekt` class acts as an aggregate root and repository for all entities (scenes, NPCs, items, etc.).
- **Singleton (optional)** — `translate.ts` holds the active language state as a module-level singleton.
- **Lazy loading** — language files are loaded dynamically via `import()` only when needed.

---

## Directory Structure

```
/
├── main.js               # Electron main process — creates the BrowserWindow
├── preload.js            # Electron preload — secure bridge via contextBridge
├── renderer.js           # Electron renderer — UI entry point
├── index.html            # Main HTML (dev entry)
│
├── Model/                # Domain classes (pure TypeScript)
│   ├── Projekt.ts        # Project aggregate — main container
│   ├── Scena.ts          # Container for paragraphs (scene)
│   ├── Paragraf.ts       # Narrative unit with jumps (paragraph)
│   ├── Przeskok.ts       # Connection between paragraphs (jump)
│   ├── Lokacja.ts        # Location in the game world
│   ├── NPC.ts            # Non-player character
│   ├── NPC_Template.ts   # NPC template
│   ├── PostacGracza.ts   # Player character
│   ├── KlasaPostaci.ts   # Character class/archetype
│   ├── Przedmiot.ts      # Inventory item
│   ├── Cecha.ts          # Character trait (e.g. Strength)
│   ├── Umiejetnosc.ts    # Character skill
│   ├── Przymiot.ts       # Character attribute/property
│   ├── Walka.ts          # Combat mechanics
│   ├── Warunek.ts        # Logical condition (used for jumps)
│   └── Opis.ts           # Text description object (supports multiple language versions)
│
├── ViewModel/            # Presentation logic
│   └── MainWindowViewModel.ts
│
├── View/                 # HTML templates
│   └── MainWindow.html
│
├── Services/             # Services (I/O, persistence, application logic)
│   └── (e.g. ProjektService.ts, FileService.ts)
│
├── Locales/              # Translation files (JSON)
│   ├── pl/
│   │   └── translation.json  # Polish (canonical — defines the Translations type)
│   ├── en/
│   │   └── translation.json  # English
│   └── de/
│       └── translation.json  # German
│
├── Utils/                # Helper utilities
│   ├── translate.ts      # i18n module — primary translation API
│   └── i18n.js           # i18n module for Electron main process (main.js)
│
├── Modules/              # Optional engine extension modules
│
└── tests/                # Unit tests (Vitest)
    ├── Model/
    │   └── Projekt.test.ts
    └── Utils/
        └── translate.test.ts
```

---

## Localization (i18n)

### How It Works

The `Utils/translate.ts` module exports:

- `t(key: TranslationKey): string` — primary translation function
- `setLanguage(lang)` — asynchronously loads a language file
- `getLanguage()` — returns the currently active language
- `availableLanguages` — list of supported language codes

Keys are nested and fully typed — TypeScript will throw an error for invalid keys.

### Adding a New Language

1. Create `Locales/xx/translation.json` (where `xx` is the ISO language code)
2. Copy the structure from `Locales/pl/translation.json` and translate the values
3. Add a loader to the `loaders` map in `Utils/translate.ts`
4. Add the code to the `availableLanguages` array in `Utils/translate.ts`

### Usage in Code

```typescript
import { t, setLanguage } from '../Utils/translate'

await setLanguage('en')
console.log(t('przyciski.zapisz')) // "Save"
console.log(t('projekt.nowy'))     // "New project"
```

---

## Code Conventions

### Naming (Model)

The project uses **Polish names** in domain classes — this is intentional and reflects the gamebook domain:

| Pattern | Example |
|---|---|
| Getter | `pobierzID()`, `pobierzNazwe()` |
| Setter | `ustawNazwe(nazwa)`, `nadajID(id)` |
| Check | `czymaID()`, `czymaScene(id)` |
| Add | `dodajScene(scena)` |
| Remove | `usunScene(id)` |
| Find | `pobierzScene(id): Scena | undefined` |

### Formatting

Prettier is configured with:
- `singleQuote: true`
- `semi: false`
- `tabWidth: 4`
- `printWidth: 100`
- `trailingComma: "es5"`

### New Domain Classes

Every new class in `/Model` should:
- Have private fields with types
- Expose fields through `pobierz/ustaw` methods
- Be testable (no dependencies on Electron or the DOM)
- Be added to `tsconfig.json` if placed outside existing folders

---

## Git Hooks (Husky)

### pre-commit

Runs **lint-staged** — for staged `*.ts` files:
1. `prettier --write` — formats the file
2. `eslint --fix` — fixes linter issues

### pre-push

Runs **all tests**: `vitest run`  
The push will be rejected if any test fails.

### Bypassing Hooks (emergency only)

```bash
git commit --no-verify
git push --no-verify
```

---

## Tests

Framework: **Vitest 1.x**  
Test location: `tests/**/*.test.ts`

### Running Tests

```bash
npm run test          # watch mode (development)
npm run test:run      # single run (CI, pre-push)
npm run test:coverage # code coverage report
```

### Test Conventions

- Test files live in `tests/` mirroring the source structure (`tests/Model/` → `Model/`)
- File names: `ClassName.test.ts`
- Use `describe` for grouping, `it` for individual cases
- Test descriptions are written in Polish (consistency with the domain)
- Use `beforeEach` to reset state between tests

---

## Electron — Security

- `nodeIntegration: false` — the renderer has no access to Node APIs
- `contextIsolation: true` — JavaScript context isolation is enabled
- All main ↔ renderer communication goes through `contextBridge` in `preload.js`
- New APIs are exposed via `preload.js` as `window.electronAPI.*`

---

## Adding New Features — Checklist

1. [ ] New domain class in `/Model` with `pobierz/ustaw` methods
2. [ ] Unit tests in `tests/Model/`
3. [ ] Presentation logic in `/ViewModel`
4. [ ] New translation keys in `Locales/pl/translation.json` (and other languages)
5. [ ] If IPC is needed — add a handler in `main.js` and expose it in `preload.js`
6. [ ] Run `npm run build` (TypeScript check) and `npm run test:run`
