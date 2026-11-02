# Silnik Gier Paragrafowych (SGP) — Dokumentacja Projektu

Silnik Gier Paragrafowych (SGP) to profesjonalne, nowoczesne środowisko desktopowe służące do projektowania, edycji, wizualizacji grafowej, testowania oraz publikacji nieliniowych gier książkowych (Interactive Fiction / Gamebooks). Aplikacja łączy interaktywny edytor grafu scen i paragrafów, zaawansowany edytor tekstu TipTap Markdown, kompleksowe bazy postaci (Bohater i NPC) ze statystykami i formułami, menedżer zasobów graficznych, wbudowany symulator rozgrywki oraz wieloformatowy silnik publikacji (PDF, DOCX, HTML, ZIP).

---

## Główne Funkcjonalności (Key Features)

- **Wizualny Graf Fabuły (Story Graph):**
    - Oparty o Cytoscape.js i Web Components (`<paragraph-node>`, `<scene-node>`).
    - Przeciąganie, płynny zoom, zakrzywione krawędzie bez kolizji, grupowanie paragrafów w sceny.
- **Diagnostyka i Walidacja Grafu (Graph Validator):**
    - Automatyczne wykrywanie paragrafów-sierot (brak wejść/wyjść), ślepych zaułków oraz nieosiągalnych fragmentów historii.
    - Wykrywanie pętli fabularnych z trasowaniem cykli i 1-klikiem nawigacji do problematycznych węzłów.
- **Zaawansowany Edytor TipTap Markdown:**
    - Wygodna edycja WYSIWYG z blokami dialogowymi (`— `), formatowaniem tekstu i statystykami słów.
    - System wzmianek encji (`@`) z dwukierunkowymi linkami (`entity://type/id`) i aliasami gramatycznymi.
    - Style własne (zaklęcia, myśli, szepty) z ochroną CSS/XSS oraz katalog fontów Google Fonts z trybem offline.
- **Karty Postaci i System RPG:**
    - Karta Głównego Bohatera (Protagonista) oraz Folio Postaci Niezależnych (NPC) i Szablonów (Archetypów).
    - Statystyki, cechy, dynamiczne parametry witalne z ewaluatorem formuł matematycznych (np. `Pancerz + Zręczność * 2`).
    - System umiejętności z modyfikatorami cech bazowych oraz ekwipunek przedmiotów.
- **Menedżer Mediów i Edytor Grafiki:**
    - Bezpieczny protokół `asset://` z ochroną przed Path Traversal (`Assets/Images/`).
    - Wbudowany edytor obrazów Canvas 2D: kadrowanie (Rule of Thirds), precyzyjne skalowanie, obracanie, odbicia i korekcja barw (sepia, kontrast, nasycenie).
- **Symulator i Debugger Rozgrywki (Playtester):**
    - Interaktywny podgląd gry paragraf po paragrafie z dynamicznym testowaniem warunków wyborów.
    - Podgląd na żywo stanu bohatera, ekwipunku, wbudowane rzuty kośćmi oraz historia kroków z opcją cofania.
- **Wieloformatowy Moduł Publikacji i Eksportu:**
    - **PDF:** Skład książkowy z nagłówkami, numeracją stron i stylami `@page`.
    - **DOCX:** Gotowy do edycji plik Microsoft Word ze stylami akapitów, tabelami i sekcjami.
    - **HTML:** Samodzielna wersja cyfrowa do czytania w przeglądarce.
    - **ZIP:** Kompletny backup projektu z możliwością natychmiastowego przywrócenia.
    - Opcjonalne tasowanie numeracji paragrafów z automatycznym przeliczaniem odnośników w wyborach.
    - Automatycznie generowane dodatki: Karta Postaci, Bestiariusz NPC, zasady oraz spis treści.

---

## Użyte Technologie (Tech Stack)

| Warstwa / Obszar               | Technologia / Biblioteka                  | Opis i Zastosowanie                                                                                               |
| :----------------------------- | :---------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| **Aplikacja Desktopowa**       | **Electron 41.5.0**                       | Wieloplatformowe środowisko uruchomieniowe (Chromium + Node.js) z pełną izolacją procesów.                        |
| **Język Logiki Biznesowej**    | **TypeScript 6.0.0**                      | Statycznie typowany język programowania dla modeli domenowych, serwisów i warstwy ViewModel.                      |
| **Stylizowanie UI**            | **TailwindCSS 4.3.3**                     | Nowoczesny dark mode (`#18181b`), elastyczne panele i skompilowany plik `MainWindow.generated.css`.               |
| **Wizualizacja Grafowa**       | **Cytoscape.js 3.33.3**                   | Silnik renderujący grafy powiązań scen i paragrafów z dedykowanymi Custom Web Components.                         |
| **Edytor Tekstu Markdown**     | **TipTap 2.x** (`@tiptap/core`)           | Beheadings, bloki dialogowe, system wzmianek `@`, autouzupełnianie encji i formatowanie.                          |
| **Generowanie Dokumentów**     | **docx 8.x**, **Chromium printToPDF**     | Eksport strukturyzowanych plików Microsoft Word (DOCX) oraz profesjonalnych wydruków PDF.                         |
| **Archiwizacja i Backup**      | **JSZip 3.x**                             | Pakowanie całego projektu z mediami do archiwum `.zip` oraz przywracanie projektów.                               |
| **Przetwarzanie Obrazów**      | **HTML5 Canvas 2D Engine**                | Autorski procesor obrazów (`ImageProcessor.ts`): kadrowanie, skalowanie, rotacja i filtry barwne.                 |
| **Umiędzynarodowienie (i18n)** | **i18next 26.3.6** + autorski moduł       | System obsługi wielojęzyczności (`en` domyślny, `pl`, `de`) z pełnym typowaniem kluczy w TypeScript.              |
| **Build & Bundling**           | **esbuild 0.28.2** + **tsc**              | Błyskawiczne pakowanie skryptów dla procesów Renderer (`build-renderer.js`).                                      |
| **Środowisko Testowe**         | **Vitest 1.6.1** + **happy-dom 20.11**    | Szybki framework testowy z emulacją drzewa DOM dla testów ViewModeli, modeli i serwisów.                          |
| **Kontrola Jakości & Git**     | **ESLint 8**, **Prettier 3**, **Husky 9** | Automatyczne formatowanie kodu przed commitem (`lint-staged`) oraz uruchamianie testów przed pushem (`pre-push`). |

---

## Wzorce Projektowe i Architektura (Design Patterns)

### 1. Wzorzec MVVM (Model-View-ViewModel)

- **Model (`/Model/*.ts`)**: Czyste klasy domenowe w TypeScript (`Project`, `Scene`, `Paragraph`, `Choice`, `PlayerCharacter`, `NPC`, `NPC_Template`, `Location`, `Combat`, `Condition`, `Item`, `Stat`, `Parameter`, `Skill`, `Feature`, `Tag`, `Description`).
    - Pozbawione jakichkolwiek zależności od Electrona czy drzewa DOM.
    - Posiadają prywatne pola i stosują jednoznaczną angielską konwencję nazewniczą (`getId()`, `setName()`, `toJSON()`, `fromJSON()`).
- **View (`/View/*.html`, `View/ui/`)**: Warstwa prezentacyjna zbudowana w oparciu o HTML5, TailwindCSS i modułowe kontrolery JavaScript zorganizowane w logiczne podkatalogi.
- **ViewModel (`/ViewModel/*.ts`)**: Logika prezentacji i obsługa zdarzeń użytkownika (`StartWindowViewModel.ts`, `MainWindowViewModel.ts`). Łączy zdarzenia UI z operacjami na modelach oraz komunikacją z Electron IPC.

### 2. Bezpieczny Most IPC & Izolacja Procesów (Electron Security)

- Procesy **Main Process** (`main.js`) oraz **Renderer Process** są od siebie odizolowane (`contextIsolation: true`, `nodeIntegration: false`).
- Komunikacja odbywa się bezpiecznie przez skrypt powrotny **Preload** (`preload.js`) z użyciem `contextBridge.exposeInMainWorld('electronAPI', ...)`.
- Dedykowane handlery IPC (`main/ipc/`) delegują operacje do czystych serwisów Node.js (`main/services/`).

### 3. Transakcyjny i Bezpieczny Zapis Danych

- Wszelkie operacje zapisu plików JSON i Markdown wykonywane są transakcyjnie (`atomicWriteJsonSync`, `atomicWriteStringSync` w `Utils/fs/fsSecurity.js`) z zapisem do pliku tymczasowego i atomową zamianą nazwy.
- Wszystkie ścieżki weryfikowane są funkcją `isPathInsideBase`, uniemożliwiając ataki typu Path Traversal.

### 4. Wzorzec Kontekstu Aplikacji (`appContext`)

- Moduły UI w `View/ui/` nie używają zmiennych globalnych. Wszystkie zależności i metody pomocnicze przekazywane są jawnie przez obiekt `appContext` (`ctx`).

---

## Metodyki Wytwarzania i Testowania (Testing & Quality)

1. **White-Box Testing (Testowanie Białej Skrzynki)**:
    - Wszystkie moduły logiki biznesowej (`Model/`, `Utils/`, `ViewModel/`, `Services/`, `Modules/`, `View/ui/`) są testowane w środowisku Vitest z emulacją happy-dom.
    - Aktualny stan zestawu testów: **133 pliki testowe, 1666 testów przechodzących pomyślnie (100% pass)**.
2. **Quality Gates & Automated Hooks (Husky)**:
    - **`pre-commit`**: Wymusza formatowanie Prettier oraz reguły ESLint na dodawanych plikach.
    - **`pre-push`**: Automatycznie wykonuje pełen zestaw testów jednostkowych (`pnpm test:run`) oraz weryfikację licencji.
3. **Typowana Wielojęzyczność (i18n)**:
    - Moduł `Utils/i18n/translate.ts` weryfikuje klucze tłumaczeń na etapie kompilacji TypeScript (`TranslationKey`). Domyślnym językiem interfejsu jest angielski (`en`) z pełnym wsparciem dla języka polskiego (`pl`) i niemieckiego (`de`).

---

## Struktura Katalogów Projektu

```text
SilnikGierParagrafowych/
├── main.js                     # Punkt wejścia procesu głównego Electrona
├── preload.js                  # Bezpieczny most IPC (contextBridge: electronAPI)
├── package.json                # Zależności, skrypty build i test (pnpm)
├── tsconfig.json               # Konfiguracja kompilatora TypeScript (strict)
├── vitest.config.ts            # Konfiguracja runnera testów Vitest
│
├── main/                       # Backend aplikacji (Electron Main Process)
│   ├── windowManager.js        # Zarządzanie oknami BrowserWindow
│   ├── ipc/                    # Moduły routerów IPC
│   │   ├── index.js            # Agregator rejestracji IPC
│   │   ├── projectIpc.js       # Zarządzanie projektem (tworzenie, otwieranie, zapis)
│   │   ├── entityIpc.js        # Zarządzanie encjami projektu
│   │   ├── markdownIpc.js      # Odczyt i zapis plików narracyjnych .md
│   │   ├── assetIpc.js         # Import i przeglądanie mediów
│   │   ├── exportIpc.js        # Eksport do PDF, DOCX, HTML, ZIP i przywracanie
│   │   ├── recentProjectsIpc.js# Historia ostatnich projektów
│   │   └── appIpc.js           # Ustawienia aplikacji, i18n, zamykanie
│   └── services/               # Serwisy I/O i operacje plikowe procesu głównego
│       ├── ProjectService.js   # Tworzenie struktury projektu, odczyt i zapis encji
│       ├── EntityService.js    # Tworzenie slugów, katalogów i element.json
│       ├── MarkdownService.js  # Bezpieczny odczyt i atomowy zapis plików Markdown
│       ├── AssetService.js     # Zarządzanie plikami Assets/Images/ i importem
│       ├── AssetProtocolService.js # Bezpieczny protokół niestandardowy asset://
│       ├── ExportService.js    # Kompilacja eksportów PDF, DOCX, HTML, ZIP
│       └── RecentProjectsService.js # Zapis historii projektów w userData
│
├── Model/                      # Klasy domenowe (TypeScript, nazewnictwo angielskie)
│   ├── Project.ts              # Główny agregat projektu
│   ├── Scene.ts                # Scena grupująca paragrafy
│   ├── Paragraph.ts            # Węzeł narracyjny (wybory, walka, tagi, numer)
│   ├── Choice.ts               # Odnośnik / przejście między paragrafami
│   ├── Condition.ts            # Warunki logiczne wyborów
│   ├── PlayerCharacter.ts      # Karta Głównego Bohatera (protagonisty)
│   ├── CharacterClass.ts       # Klasa postaci
│   ├── NPC.ts & NPC_Template.ts# Postacie niezależne i szablony archetypów
│   ├── Location.ts             # Lokacja w świecie gry
│   ├── Item.ts                 # Przedmiot i ekwipunek
│   ├── Stat.ts                 # Statystyka / atrybut postaci
│   ├── Parameter.ts            # Dynamiczny parametr witalny (wartość lub formuła)
│   ├── Skill.ts                # Umiejętność (wartość bazowa lub modyfikator cechy)
│   ├── Feature.ts              # Cechy specjalne i talenty
│   ├── Combat.ts               # Parametry mechaniki walki
│   ├── Tag.ts                  # Kolorowane tagi kategoryzacji
│   └── Description.ts          # Opis encji (streszczenie + ścieżka do Markdown)
│
├── Modules/                    # Dedykowane podsystemy silnika
│   ├── Graph/                  # Silnik grafu Cytoscape.js i Web Components
│   ├── Editor/                 # Edytor TipTap Markdown, style i katalog fontów
│   └── ImageEditor/            # Silnik przetwarzania obrazów Canvas 2D
│
├── ViewModel/                  # Warstwa prezentacyjna MVVM (TypeScript)
│   ├── StartWindowViewModel.ts # Logika okna powitalnego
│   └── MainWindowViewModel.ts  # Stan edytora, selekcja, filtry, historia
│
├── View/                       # Warstwa widoków (HTML, style Tailwind, kontrolery UI)
│   ├── StartWindow.html        # Szablon okna startowego
│   ├── MainWindow.html         # Główny interfejs edytora
│   ├── MainWindow.js           # Główny koordynator widoku (tworzy appContext)
│   ├── MainWindow.css          # Źródłowe style Tailwind CSS v4
│   ├── MainWindow.generated.css# Skompilowany arkusz produkcyjny
│   └── ui/                     # Zmodularyzowane kontrolery interfejsu
│       ├── assets/             # Menedżer mediów i modal edytora grafiki
│       ├── common/             # Współdzielone szablony HTML, modal potwierdzeń, awatary
│       ├── detailsPanel/       # Prawy panel właściwości, walka, historia, formularze
│       ├── drawer/             # Lewy panel encji, wyszukiwarka i popover filtrów
│       ├── editor/             # Pasek narzędzi edytora, modal stylów, fontów, linkowania
│       ├── graph/              # Kontroler grafu, strefy upuszczania, zoom
│       ├── modals/             # Dedykowane modale: NPC, Bohater, Eksport, Playtest
│       ├── project/            # Automatyczny zapis, śledzenie stanu dirty, persystencja
│       └── workspace/          # Koordynator obszaru roboczego, pasek górny, menu kontekstowe
│
├── Services/                   # Serwisy aplikacyjne renderera pogrupowane funkcjonalnie
│   ├── project/                # Singleton aktywnego projektu w pamięci UI (ProjectManager.ts)
│   ├── graph/                  # Diagnostyka grafu i numeracja paragrafów
│   ├── combat/                 # Synchronizacja i generowanie bloków walki Markdown
│   ├── markdown/               # Transkluzja opisów i aktualizacja linków encji
│   ├── export/                 # Walidacja eksportu/importu przedmiotów i zasad RPG
│   └── helpers/                # Współdzielone wzorce wyrażeń regularnych i walidatory
│
├── Utils/                      # Narzędzia pomocnicze pogrupowane funkcjonalnie
│   ├── assets/                 # Stałe i narzędzia ścieżek zasobów oraz śledzenie referencji
│   ├── fs/                     # Bezpieczeństwo ścieżek, atomowy zapis i sanityzacja nazw
│   ├── i18n/                   # Wielojęzyczność backendu (i18n.js) i frontendu (translate.ts)
│   ├── ui/                     # Rejestr ikon SVG (icons.ts) i powiadomienia (toast.ts)
│   └── common/                 # Generatory identyfikatorów (idGenerator.ts)
├── Locales/                    # Słowniki tłumaczeń JSON (en, pl, de)
├── docs/                       # Szczegółowa dokumentacja architektoniczna
└── tests/                      # Zestaw 133 plików testowych Vitest (1666 testów)
```

---

## Instalacja i Uruchomienie (Getting Started)

### Wymagania wstępne (Prerequisites)

- **Node.js**: `>= 20.0.0 < 22.0.0`
- **pnpm**: `>= 9.0.0 < 10.0.0` (zalecany menedżer pakietów; projekt wymusza użycie pnpm)

### Klonowanie i instalacja zależności

```bash
git clone https://github.com/mountain-bit/SilnikGierParagrafowych.git
cd SilnikGierParagrafowych
pnpm install
```

### Uruchomienie w trybie deweloperskim

```bash
pnpm start
```

> Polecenie to automatycznie kompiluje arkusze stylów Tailwind CSS, buduje moduły renderera za pomocą esbuild, weryfikuje typy TypeScript (`tsc --noEmit`) i uruchamia aplikację w oknie Electron.

### Budowanie paczki produkcyjnej (Windows Installer)

```bash
# Budowanie instalatora Windows (.exe) w katalogu release-builds/
pnpm run dist

# Budowanie rozpakowanej aplikacji (katalog bez instalatora)
pnpm run pack
```

---

## Skrypty Dostępne w `package.json`

- `pnpm start` – kompiluje CSS, weryfikuje typy TypeScript, buduje skrypty renderera i uruchamia aplikację w Electronie.
- `pnpm build` – pełny build: arkusze stylów Tailwind, kompilacja TS i bundling esbuild.
- `pnpm test:run` – uruchamia kompletny zestaw testów jednostkowych i integracyjnych Vitest (1666 testów).
- `pnpm test:coverage` – generuje raport pokrycia kodu (`coverage/index.html`).
- `pnpm license:check` – weryfikuje zgodność licencji wszystkich zależności z białą listą.
- `pnpm lint` / `pnpm lint:fix` – uruchamia linter ESLint z automatyczną korektą.
- `pnpm format` / `pnpm format:check` – formatuje kod przy użyciu Prettier.

---

## Licencja (License)

Projekt jest udostępniany na warunkach licencji **ISC**. Szczegóły znajdują się w pliku [LICENSE](file:///c:/Projekty/SilnikGierParagrafowych/SilnikGierParagrafowych/LICENSE).
