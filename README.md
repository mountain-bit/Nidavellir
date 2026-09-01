# Silnik Gier Paragrafowych (SGP) — Dokumentacja Projektu

Silnik Gier Paragrafowych (SGP) to zaawansowane środowisko desktopowe służące do projektowania, edycji oraz zarządzania grami paragrafowymi (ang. _gamebook games_). Aplikacja umożliwia tworzenie struktury scen, paragrafów i wyborów/przeskoków, tworzenie kart postaci gracza i NPC, projektowanie systemów cech, umiejętności, przedmiotów oraz mechanik walki.

---

## Użyte Technologie (Tech Stack)

| Warstwa / Obszar               | Technologia / Biblioteka                  | Opis i Zastosowanie                                                                                               |
| :----------------------------- | :---------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| **Aplikacja Desktopowa**       | **Electron 41.5.0**                       | Wieloplatformowe środowisko uruchomieniowe łączące Chromium i Node.js.                                            |
| **Język Logiki Biznesowej**    | **TypeScript 6.0.0**                      | Statycznie typowany język programowania dla modeli domenowych i warstwy ViewModel.                                |
| **Stylizowanie UI**            | **TailwindCSS 4.3.3**                     | Architektura Utility-First CSS ze skompresowanym plikiem produkcyjnym `MainWindow.generated.css`.                 |
| **Wizualizacja Grafowa**       | **Cytoscape.js 3.33.3**                   | Silnik renderujący grafy dla wizualizacji połączeń między paragrafami i scenami.                                  |
| **Umiędzynarodowienie (i18n)** | **i18next 26.3.6** + autorski moduł       | System obsługi wielojęzyczności (`en` domyślny, `pl`, `de`) z pełnym typowaniem kluczy w TypeScript.              |
| **Build & Bundling**           | **esbuild 0.28.2** + **tsc**              | Błyskawiczne pakowanie skryptów dla procesów Renderer (`build-renderer.js`).                                      |
| **Środowisko Testowe**         | **Vitest 1.6.1** + **happy-dom 20.11**    | Szybki framework testowy z emulacją drzewa DOM dla testów ViewModeli i modeli.                                    |
| **Kontrola Jakości & Git**     | **ESLint 8**, **Prettier 3**, **Husky 9** | Automatyczne formatowanie kodu przed commitem (`lint-staged`) oraz uruchamianie testów przed pushem (`pre-push`). |

---

## Wzorce Projektowe i Architektura (Design Patterns)

W projekcie zastosowano wzorce architektoniczne gwarantujące czytelność, skalowalność i łatwość testowania:

### 1. Wzorzec MVVM (Model-View-ViewModel)

Główny wzorzec podziału odpowiedzialności w aplikacji:

- **Model (`/Model/*.ts`)**: Czyste klasy domenowe w TypeScript (np. `Project`, `Scene`, `Paragraph`, `Choice`, `PlayerCharacter`, `NPC`, `Location`, `Combat`, `Condition`, `Item`, `Stat`, `Skill`, `Feature`).
    - Pozbawione jakichkolwiek zależności od Electrona czy drzewa DOM.
    - Posiadają prywatne pola i stosują jednoznaczną angielską konwencję nazewniczą (`getId()`, `setName()`, `addTag()`, `removeTag()`, `hasTag()`).
- **View (`/View/*.html`, `MainWindow.css`)**: Warstwa prezentacyjna zbudowana w oparciu o HTML5 i TailwindCSS. Deklaruje elementy interfejsu oraz atrybuty tłumaczeniowe (`data-i18n`, `data-i18n-placeholder`).
- **ViewModel (`/ViewModel/*.ts`)**: Logika prezentacji i obsługa zdarzeń użytkownika (np. `StartWindowViewModel.ts`, `MainWindowViewModel.ts`). Łączy zdarzenia UI z operacjami na modelach oraz komunikacją z Electron IPC.

### 2. Wzorzec Singleton

- **`ProjectManager` (`Services/ProjectManager.ts`)**: Pojedyncza instancja zarządza aktualnie otwartym projektem w procesie Renderer. Gwarantuje spójny dostęp do stanu aplikacji z dowolnego miejsca.

### 3. Wzorzec Fabryki / Deserializacji (`fromJSON`)

- Każda klasa domenowa w folderze `Model/` posiada statyczną metodę fabrykującą `.fromJSON(data)`. Pozwala to na bezpieczne przekształcanie surowych obiektów JSON odebranych z IPC Electrona w pełnoprawne instancje klas TypeScript z działającymi metodami, wspierając formaty polskie i angielskie.

### 4. Wzorzec IPC Bridge & Context Isolation (Bezpieczeństwo Electrona)

- Procesy **Main Process** (`main.js`) oraz **Renderer Process** są od siebie odizolowane (`contextIsolation: true`, `nodeIntegration: false`).
- Komunikacja odbywa się bezpiecznie przez skrypt powrotny **Preload** (`preload.js`) z użyciem `contextBridge.exposeInMainWorld('electronAPI', ...)`.

### 5. Architektura Reagująca na Zdarzenia (Event-Driven & Guard Pattern)

- Komponenty UI defensywnie sprawdzają obecność elementów DOM i reagują na zdarzenia (np. zamykanie okna, wybór folderu, zmiana języka), nie powodując błędów w przypadku braku pojedynczych węzłów DOM.

---

## Metodyki Wytwarzania i Testowania (Methodologies)

1. **White-Box Testing (Testowanie Białej Skrzynki)**:
    - Wszystkie moduły logiki biznesowej (`Model/`, `Utils/`, `ViewModel/`) są poddawane testom strukturalnym w Vitest z raportowaniem pokrycia V8 (`pnpm test:coverage`).
    - Pokrycie kodu dla kluczowych komponentów wynosi do **99.38%** (w tym 100% dla `ProjectManager` i `StartWindowViewModel`).

2. **Quality Gates & Automated Hooks (Husky)**:
    - **`pre-commit`**: Wymusza automatyczne formatowanie Prettier oraz automatyczne poprawki ESLint na dodawanych plikach TypeScript/JavaScript.
    - **`pre-push`**: Automatycznie wykonuje wszystkie testy jednostkowe (`pnpm test:run`). Jeśli którykolwiek test nie przejdzie, wysłanie kodu do Git jest blokowane.

3. **System Wielojęzyczności (i18n & Type Safety)**:
    - Moduł `Utils/translate.ts` weryfikuje klucze tłumaczeń na etapie kompilacji TypeScript (`TranslationKey`). Zapobiega to użyciu nieistniejących kluczy w kodzie aplikacji. Domyślnym językiem interfejsu jest angielski (`en`).

---

## Struktura Katalogów Projektu

```
SilnikGierParagrafowych/
├── main.js                   # Główny proces Electrona (okna, obsługa IPC, pliki recent)
├── preload.js                # Skrypt Preload (bezpieczny most IPC via ContextBridge)
├── package.json              # Zależności projektu, skrypty build i test
├── vitest.config.ts          # Konfiguracja runnera testów Vitest
├── tsconfig.json             # Konfiguracja kompilatora TypeScript
│
├── Model/                    # Klasy domenowe (TypeScript, nazewnictwo angielskie)
│   ├── Project.ts            # Główny kontener projektu
│   ├── Scene.ts              # Kontener paragrafów
│   ├── Paragraph.ts          # Jednostka fabularna
│   ├── Choice.ts             # Połączenie między paragrafami
│   ├── PlayerCharacter.ts    # Statystyki i ekwipunek gracza
│   ├── CharacterClass.ts     # Klasa postaci
│   ├── NPC.ts                # Postacie niezależne
│   ├── NPC_Template.ts       # Szablon postaci NPC
│   ├── Location.ts           # Lokacja w świecie gry
│   ├── Item.ts               # Przedmiot w grze
│   ├── Stat.ts               # Cecha/statystyka postaci (np. Siła)
│   ├── Skill.ts              # Umiejętność postaci
│   ├── Feature.ts            # Przymiot postaci (cecha szczególna)
│   ├── Combat.ts             # System i mechnika walki
│   ├── Condition.ts          # Warunki logiczne dla przeskoków
│   ├── Tag.ts                # Tag kategoryzacji
│   └── Description.ts        # Obiekt opisu z referencjami do plików markdown
│
├── ViewModel/                # Logika prezentacyjna i reagowanie na zdarzenia UI
│   ├── StartWindowViewModel.ts # Logika panelu startowego
│   └── MainWindowViewModel.ts  # Logika głównego edytora
│
├── View/                     # Pliki HTML i style
│   ├── StartWindow.html      # Okno startowe (tworzenie/otwieranie projektów)
│   ├── MainWindow.html       # Główny interfejs edytora
│   └── MainWindow.css        # Style źródłowe TailwindCSS
│
├── Services/                 # Usługi aplikacyjne (Singletony)
│   └── ProjectManager.ts     # Zarządzanie załadowanym projektem
│
├── Utils/                    # Narzędzia pomocnicze
│   ├── translate.ts          # Moduł i18n dla procesu Renderer (TypeScript)
│   └── i18n.js               # Moduł i18n dla procesu Main (Node.js)
│
├── Locales/                  # Pliki słowników JSON
│   ├── en/translation.json   # Słownik angielski (kanoniczny i domyślny)
│   ├── pl/translation.json   # Słownik polski
│   └── de/translation.json   # Słownik niemiecki
│
└── tests/                    # Testy jednostkowe i integracyjne (Vitest)
    ├── Model/                # Testy modeli domenowych
    ├── Utils/                # Testy modułów tłumaczeń
    └── ViewModel/            # Testy interfejsów i logiki UI (happy-dom)
```

---

## Skrypty Dostępne w `package.json`

- `pnpm start` – kompiluje CSS, weryfikuje typy TypeScript, buduje skrypty renderera i uruchamia aplikację w Electronie.
- `pnpm build` – buduje arkusze stylów, sprawdza typy TypeScript oraz pakuje pliki renderera (`build-renderer.js`).
- `pnpm test:run` – uruchamia zestaw testów jednostkowych i integracyjnych w trybie jednorazowym (Vitest).
- `pnpm test:coverage` – generuje szczegółowy raport pokrycia kodu (`coverage/index.html`).
- `pnpm lint` / `pnpm lint:fix` – uruchamia linter ESLint dla plików TypeScript i JavaScript.
- `pnpm format` / `pnpm format:check` – uruchamia formatowanie kodu przy użyciu Prettier.
