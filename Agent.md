# Agent.md — Silnik Gier Paragrafowych

Dokument dla agenta AI opisujący architekturę, konwencje i procesy w tym projekcie.

---

## Opis projektu

Aplikacja desktopowa do **tworzenia i zarządzania grami paragrafowymi** (gamebook engine).  
Zbudowana na **Electron** z TypeScript w warstwie logiki. Umożliwia projektowanie scen, paragrafów, przeskoków, postaci, lokacji i walki.

---

## Stack technologiczny

| Warstwa | Technologia |
|---|---|
| Aplikacja desktopowa | Electron 41+ |
| Język logiki | TypeScript 6+ |
| Wizualizacja grafów | Cytoscape.js |
| Testy | Vitest 1.x |
| Linter | ESLint 8 + @typescript-eslint |
| Formatter | Prettier 3 |
| Git hooks | Husky 9 + lint-staged 15 |
| Lokalizacja | własny moduł translate.ts |

---

## Wzorce projektowe

### MVVM (Model–View–ViewModel)

Projekt stosuje wzorzec **MVVM**:

- **Model** (`/Model/*.ts`) — czyste klasy domenowe bez zależności od UI. Każda klasa ma prywatne pola i publiczne gettery/settery w stylu polskim (`pobierzX`, `ustawX`, `dodajX`, `usunX`).
- **ViewModel** (`/ViewModel/*.ts`) — logika prezentacji, stan widoku, obsługa zdarzeń UI. Nie wie nic o DOM bezpośrednio.
- **View** (`/View/*.html`) — pliki HTML ładowane przez Electron. Komunikują się z ViewModel przez renderer.

### Inne wzorce w projekcie

- **Repository-like pattern** — klasa `Projekt` pełni rolę agregatu i repozytorium dla wszystkich encji (sceny, NPC, przedmioty...).
- **Singleton (opcjonalnie)** — `translate.ts` przechowuje stan aktywnego języka jako moduł-singleton.
- **Lazy loading** — pliki językowe ładowane są dynamicznie przez `import()` tylko gdy potrzeba.

---

## Struktura katalogów

```
/
├── main.js               # Electron main process — tworzy okno BrowserWindow
├── preload.js            # Electron preload — bezpieczny bridge przez contextBridge
├── renderer.js           # Electron renderer — punkt wejścia dla UI
├── index.html            # Główny HTML (dev entry)
│
├── Model/                # Klasy domenowe (czyste TypeScript)
│   ├── Projekt.ts        # Agregat projektu — główny kontener
│   ├── Scena.ts          # Kontener na paragrafy
│   ├── Paragraf.ts       # Jednostka narracyjna z przeskokami
│   ├── Przeskok.ts       # Połączenie między paragrafami
│   ├── Lokacja.ts        # Lokacja w świecie gry
│   ├── NPC.ts            # Postać niezależna
│   ├── NPC_Template.ts   # Szablon NPC
│   ├── PostacGracza.ts   # Postać gracza
│   ├── KlasaPostaci.ts   # Klasa/archetyp postaci
│   ├── Przedmiot.ts      # Przedmiot w inwentarzu
│   ├── Cecha.ts          # Cecha postaci (np. Siła)
│   ├── Umiejetnosc.ts    # Umiejętność postaci
│   ├── Przymiot.ts       # Przymiot/właściwość
│   ├── Walka.ts          # Mechanika walki
│   ├── Warunek.ts        # Warunek logiczny (do przeskoków)
│   └── Opis.ts           # Obiekt opisu tekstowego (może mieć wiele wersji językowych)
│
├── ViewModel/            # Logika prezentacji
│   └── MainWindowViewModel.ts
│
├── View/                 # Szablony HTML
│   └── MainWindow.html
│
├── Services/             # Serwisy (I/O, persystencja, logika aplikacji)
│   └── (np. ProjektService.ts, FileService.ts)
│
├── Utils/                # Narzędzia pomocnicze
│   ├── translate.ts      # Moduł i18n — główne API tłumaczeń
│   └── i18n/
│       ├── pl.ts         # Polski (domyślny, eksportuje typ Translations)
│       ├── en.ts         # Angielski
│       └── de.ts         # Niemiecki
│
├── Modules/              # Opcjonalne moduły rozszerzeń silnika
│
└── tests/                # Testy jednostkowe (Vitest)
    ├── Model/
    │   └── Projekt.test.ts
    └── Utils/
        └── translate.test.ts
```

---

## Lokalizacja (i18n)

### Jak działa

Moduł `Utils/translate.ts` eksportuje:

- `t(key: TranslationKey): string` — główna funkcja tłumaczenia
- `setLanguage(lang)` — asynchronicznie ładuje plik językowy
- `getLanguage()` — zwraca aktualny język
- `availableLanguages` — lista dostępnych kodów języków

Klucze są zagnieżdżone i w pełni typowane (TypeScript wyrzuci błąd przy złym kluczu).

### Jak dodać nowy język

1. Utwórz `Utils/i18n/xx.ts` (gdzie `xx` to kod ISO języka)
2. Zaimportuj i zaimplementuj typ `Translations` z `pl.ts`
3. Dodaj loader do mapy `loaders` w `translate.ts`
4. Dodaj kod do tablicy `availableLanguages`

### Użycie w kodzie

```typescript
import { t, setLanguage } from '../Utils/translate'

await setLanguage('en')
console.log(t('przyciski.zapisz')) // "Save"
console.log(t('projekt.nowy'))     // "New project"
```

---

## Konwencje kodu

### Nazewnictwo (Model)

Projekt używa **polskich nazw** w klasach domenowych (nazwy polskie są intencjonalne — odzwierciedlają domenę gry paragrafowej):

| Wzorzec | Przykład |
|---|---|
| Getter | `pobierzID()`, `pobierzNazwe()` |
| Setter | `ustawNazwe(nazwa)`, `nadajID(id)` |
| Sprawdzenie | `czymaID()`, `czymaScene(id)` |
| Dodawanie | `dodajScene(scena)` |
| Usuwanie | `usunScene(id)` |
| Szukanie | `pobierzScene(id): Scena | undefined` |

### Formatowanie

Prettier stosuje:
- `singleQuote: true`
- `semi: false`
- `tabWidth: 4`
- `printWidth: 100`
- `trailingComma: "es5"`

### Nowe klasy domenowe

Każda nowa klasa w `/Model` powinna:
- Mieć prywatne pola z typami
- Eksponować pola przez `pobierz/ustaw` metody
- Być testowalną (bez zależności od Electron/DOM)
- Być dodana do `tsconfig.json` jeśli wyjdzie poza istniejące foldery

---

## Git hooks (Husky)

### pre-commit

Uruchamia **lint-staged** — dla zmienionych plików `*.ts`:
1. `prettier --write` — formatuje plik
2. `eslint --fix` — naprawia problemy z linterem

### pre-push

Uruchamia **wszystkie testy**: `vitest run`  
Push nie przejdzie jeśli jakikolwiek test nie przechodzi.

### Jak ominąć (tylko w nagłych sytuacjach)

```bash
git commit --no-verify
git push --no-verify
```

---

## Testy

Framework: **Vitest 1.x**  
Lokalizacja testów: `tests/**/*.test.ts`

### Uruchamianie

```bash
npm run test          # tryb watch (development)
npm run test:run      # jednorazowo (CI, pre-push)
npm run test:coverage # raport pokrycia kodu
```

### Konwencje testów

- Pliki testów w `tests/` w strukturze odzwierciedlającej źródło (`tests/Model/` → `Model/`)
- Nazwy plików: `NazwaKlasy.test.ts`
- Używaj `describe` dla grupowania, `it` dla przypadków
- Opisy testów po polsku (spójność z domeną)
- `beforeEach` do resetowania stanu między testami

---

## Electron — bezpieczeństwo

- `nodeIntegration: false` — renderer nie ma dostępu do Node API
- `contextIsolation: true` — izolacja kontekstu JS
- Cała komunikacja main ↔ renderer przez `contextBridge` w `preload.js`
- Nowe API wystawiane przez `preload.js` jako `window.electronAPI.*`

---

## Dodawanie nowych funkcji — checklist

1. [ ] Nowa klasa domenowa w `/Model` z metodami `pobierz/ustaw`
2. [ ] Testy jednostkowe w `tests/Model/`
3. [ ] Logika prezentacji w `/ViewModel`
4. [ ] Nowe klucze tłumaczeń w `Utils/i18n/pl.ts` (i pozostałych językach)
5. [ ] Jeśli potrzeba IPC — dodaj handler w `main.js` i ekspozycję w `preload.js`
6. [ ] Uruchom `npm run build` (sprawdzenie TypeScript) i `npm run test:run`
