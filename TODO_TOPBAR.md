# Plan i Lista Zadań: Pasek Górny (Top Bar / Toolbar)
## Silnik Gier Paragrafowych (Gamebook Engine)

Niniejszy dokument definiuje strukturę, podział na kategorie, zestaw przycisków oraz harmonogram wdrożenia **Paska Górnego (Top Bar)** aplikacji. 

Prace podzielono na dwa etapy:
- **Etap 1 (Bieżący):** Warstwa wizualna i układ – dodanie przycisków, grupowanie, ikony SVG, etykiety, obsługa i18n oraz stany wizualne (hover, active, disabled) bez pełnej logiki biznesowej.
- **Etap 2 (Kolejny):** Podpięcie logiki biznesowej, obsługa zdarzeń, integracja z `MainWindowViewModel`, procesem głównym (IPC) oraz modalnymi oknami narzędziowymi.

---

## 1. Architektura i Koncepcja Układu Paska Górnego

Pasek górny stanowi centralne miejsce kontroli projektu i obszaru roboczego. Zgodnie ze standardami nowoczesnych aplikacji desktopowych (VS Code, Obsidian, Figma) pasek podzielony jest na trzy strefy:

```
+------------------------------------------------------------------------------------------------------------------------+
| [SEKTOR LEWY: PROJEKT & HISTORIA]   |        [SEKTOR ŚRODKOWY: WIDOKI & WALIDACJA & GRA]       | [SEKTOR PRAWY: PANELE & SYSTEM] |
| Nazwa Gry [*] | Zapisz | Zamknij     | Graf / Edytor (Toggle) | Waliduj Graf | Testuj Grę (Play) | Panele L/P | Eksport | Opcje |
+------------------------------------------------------------------------------------------------------------------------+
```

### Wytyczne Projektowe i Standardy UI:
- **Czyste ikony wektorowe:** Wszystkie przyciski korzystają wyłącznie z komponentu `<app-icon name="...">` zdefiniowanego w [`Utils/icons.ts`](file:///c:/Projekty/SilnikGierParagrafowych/SilnikGierParagrafowych/Utils/icons.ts) (0 emoji).
- **Wielojęzyczność (i18n):** Każdy przycisk posiada atrybuty `data-i18n` (tekst) lub `data-i18n-title` (tooltip) w trzech językach (`pl`, `en`, `de`).
- **Skróty klawiszowe:** Tooltipy prezentują przypisane skróty klawiszowe (np. `Ctrl+S`, `Ctrl+B`, `F5`).
- **Separatory i grupy:** Przyciski powiązane tematycznie są pogrupowane w wizualne segmenty oddzielone subtelnymi separatorami (`border-[#333338]`).

---

## 2. Podział na Kategorie i Zestawienie Przycisków

Poniżej znajduje się kompletne zestawienie przycisków: elementy wskazane bezpośrednio przez użytkownika oraz kluczowe uzupełnienia zwiększające ergonomię pracy z silnikiem gier paragrafowych.

### Kategoria 1: Zarządzanie Projektem i Plikami (Project & File)
Odpowiada za cykl życia projektu, stan zapisu i bezpieczeństwo danych.

| Element / Przycisk | ID / Akcja (`data-action`) | Ikona SVG | Skrót | Opis i Rola | Status |
|---|---|---|---|---|:---:|
| **Wskaźnik projektu & Stan zapisu** *(Uzupełnienie)* | `#topbar-project-indicator` | `paragraph` | — | Wyświetla nazwę projektu oraz kropkę informującą o niezapisanych zmianach (`*` / dirty indicator). | `[x]` |
| **Zapisz projekt** *(Wymagane)* | `topbar-save` | `save` | `Ctrl+S` | Wywołuje natychmiastowy atomowy zapis stanu projektu i otwartych plików Markdown. | `[x]` |
| **Zapisz jako...** *(Uzupełnienie)* | `topbar-save-as` | `save` | `Ctrl+Shift+S` | Pozwala zapisać kopię projektu w nowej lokalizacji lub pod nową nazwą. | `[x]` |
| **Zamknij projekt** *(Wymagane)* | `topbar-close-project` | `close` | `Ctrl+W` | Zamyka bieżący projekt z weryfikacją niezapisanych zmian i powraca do okna startowego (`StartWindow`). | `[x]` |
| **Otwórz inny projekt** *(Uzupełnienie)* | `topbar-open-project` | `open` | `Ctrl+O` | Szybki dialog otwarcia innego projektu z dysku bez konieczności restartu aplikacji. | `[x]` |

---

### Kategoria 2: Edycja i Historia Operacji (Edit & History)
Szybki dostęp do cofania/ponawiania zmian i nawigacji po treści.

| Element / Przycisk | ID / Akcja (`data-action`) | Ikona SVG | Skrót | Opis i Rola | Status |
|---|---|---|---|---|:---:|
| **Cofnij (Undo)** *(Uzupełnienie)* | `topbar-undo` | `undo` | `Ctrl+Z` | Cofa ostatnią akcję na grafie lub w aktywnym edytorze. | `[x]` |
| **Ponów (Redo)** *(Uzupełnienie)* | `topbar-redo` | `redo` | `Ctrl+Y` | Ponawia cofniętą akcję. | `[x]` |
| **Szybkie wyszukiwanie** *(Uzupełnienie)* | `topbar-quick-search` | `search` | `Ctrl+P` / `Ctrl+F` | Otwiera paletę szybkiego skoku do paragrafu, sceny, NPC lub lokacji. | `[x]` |

---

### Kategoria 3: Widoki Obszaru Roboczego i Panele (Workspace & Views)
Zarządza przełączaniem głównej przestrzeni roboczej oraz widocznością bocznych paneli inspekcyjnych.

| Element / Przycisk | ID / Akcja (`data-action`) | Ikona SVG | Skrót | Opis i Rola | Status |
|---|---|---|---|---|:---:|
| **Widok: Graf Historii** *(Wymagane)* | `topbar-view-graph` | `graph` | `Ctrl+1` | Przełącza centralny obszar roboczy na interaktywny węzłowy graf Cytoscape.js. | `[x]` |
| **Widok: Edytor Markdown** *(Wymagane)* | `topbar-view-editor` | `markdown` | `Ctrl+2` | Przełącza centralny obszar roboczy na edytor tekstu TipTap dla wybranego pliku. | `[x]` |
| **Przełącznik lewego paska (Eksplorator)** *(Wymagane)* | `topbar-toggle-left-sidebar` | `arrow-left` / `sidebar-left` | `Ctrl+B` | Zwija lub rozwija lewy panel nawigacyjny (paragrafy, sceny, encje, tagi). | `[x]` |
| **Przełącznik prawego paska (Właściwości)** *(Wymagane)* | `topbar-toggle-right-sidebar` | `arrow-right` / `sidebar-right` | `Ctrl+Alt+B` | Zwija lub rozwija prawy panel inspektora właściwości zaznaczonego elementu. | `[x]` |
| **Dopasuj widok grafu (Fit to View)** *(Uzupełnienie)* | `topbar-zoom-fit` | `zoom-reset` | `Ctrl+0` | Automatycznie skaluje i centruje graf tak, aby objąć wszystkie sceny i paragrafy. | `[x]` |
| **Uporządkuj graf (Auto-Layout)** *(Uzupełnienie)* | `topbar-layout-graph` | `sparkles` | — | Automatycznie rozmieszcza węzły grafu za pomocą algorytmu hierarchicznego. | `[x]` |

---

### Kategoria 4: Walidacja i Diagnostyka Grafu (Graph Validation & Quality)
Weryfikacja integralności narracyjnej, logicznej i mechanicznej książki paragrafowej.

| Element / Przycisk | ID / Akcja (`data-action`) | Ikona SVG | Skrót | Opis i Rola | Status |
|---|---|---|---|---|:---:|
| **Waliduj graf** *(Wymagane)* | `topbar-validate-graph` | `check` / `alert-triangle` | `F7` | Uruchamia pełną walidację: wykrywa osierocone węzły, pętle bez wyjścia, błędne cele przeskoków i brak węzła startowego. | `[x]` |
| **Wskaźnik błędów / Badge walidacji** *(Uzupełnienie)* | `#topbar-validation-badge` | — | — | Dyskretna pigułka z liczbą wykrytych ostrzeżeń/błędów (np. zielony check przy 0 problemach, czerwona cyfra przy błędach). | `[x]` |

---

### Kategoria 5: Testowanie i Publikacja (Playtest & Export)
Symulacja gry w środowisku deweloperskim oraz generowanie plików końcowych.

| Element / Przycisk | ID / Akcja (`data-action`) | Ikona SVG | Skrót | Opis i Rola | Status |
|---|---|---|---|---|:---:|
| **Testuj grę (Playtest)** *(Uzupełnienie)* | `topbar-playtest` | `play` | `F5` | Otwiera okno interaktywnego symulatora gry, pozwalając przejść fabułę od początku lub od zaznaczonego paragrafu. | `[x]` |
| **Eksportuj projekt** *(Wymagane)* | `topbar-export` | `export` | `Ctrl+E` | Otwiera kreator publikacji gry: eksport do PDF (gotowy do druku), DOCX, interaktywnej strony HTML (Web Player) lub formatu JSON. | `[x]` |

---

### Kategoria 6: Narzędzia, Ustawienia i Pomoc (Tools & Settings)
Konfiguracja środowiska pracy, zasobów graficznych i wsparcie użytkownika.

| Element / Przycisk | ID / Akcja (`data-action`) | Ikona SVG | Skrót | Opis i Rola | Status |
|---|---|---|---|---|:---:|
| **Menadżer zasobów graficznych** *(Uzupełnienie)* | `topbar-asset-manager` | `image` | `Ctrl+Shift+I` | Szybki podgląd galerii grafik i ilustracji projektu (`Assets/Images/`). | `[x]` |
| **Ustawienia aplikacji** *(Wymagane)* | `topbar-settings` | `settings` | `Ctrl+,` | Otwiera okno ustawień (wybór języka PL/EN/DE, motyw kolorystyczny, interwały autozapisu, preferencje edytora). | `[x]` |
| **Skróty klawiszowe i Pomoc** *(Uzupełnienie)* | `topbar-help` | `flag` / `help` | `F1` | Wyświetla ściągawkę ze skrótami klawiszowymi oraz dokumentację silnika. | `[x]` |

---

## 3. Plan Zadań Technicznych do Wdrożenia (TODO Checklist)

### Etap 1: Warstwa UI i Szablon HTML (Ukończony)
- [x] **1.1. Utworzenie / Refaktoryzacja Kontenera Paska Górnego (`View/MainWindow.html`)**
  - [x] Wprowadzenie semantycznego znacznika `<header id="main-topbar">` zoptymalizowanego pod nowoczesny horyzontalny układ jedno-wierszowy.
  - [x] Implementacja kontenera lewego (Brand §, Nazwa Projektu + dirty indicator, Zapisz, Otwórz, Zamknij, Historia: Cofnij/Ponów/Szukaj).
  - [x] Implementacja kontenera centralnego (Segmented Toggle: Graf / Edytor, Przycisk Walidacji z plakietką 0 błędów, Dopasuj widok, Przycisk Testuj Grę).
  - [x] Implementacja kontenera prawego (Przełączniki pasków bocznych L/P, Eksport, Multimedia/Assety, Ustawienia, Pomoc).
- [x] **1.2. Rejestr Ikon SVG (`Utils/icons.ts`)**
  - [x] Rozszerzenie `ICON_REGISTRY` o dedykowane ikony `sidebar-left`, `sidebar-right` oraz `help` w wektorowym formacie SVG bez żadnych emoji.
- [x] **1.3. Style CSS i Komponenty Tailwind (`View/MainWindow.css`)**
  - [x] Definicja klas pomocniczych dla paska górnego (`.topbar-header`, `.topbar-group`, `.topbar-divider`, `.topbar-btn`, `.topbar-segmented`, `.topbar-badge`).
  - [x] Zapewnienie stanów `:hover`, `:active`, `:disabled` oraz `.active` (dla przycisków typu toggle/segmented).
  - [x] Dopasowanie spójnej palety ciemnego motywu (`bg-[#202023]`, `border-[#333338]`, akcenty i cienie).
- [x] **1.4. Tłumaczenia i Lokalizacja (`Locales/{pl,en,de}/translation.json`)**
  - [x] Dodanie dedykowanej sekcji kluczy `topbar.*` w słownikach językowych (PL, EN, DE).
  - [x] Uzupełnienie etykiet i podpowiedzi (tooltipów) dla wszystkich przycisków w 3 językach.
- [x] **1.5. Podstawowy Kontroler Prezentacji (`View/ui/topBar.js` i testy `tests/View/TopBar.test.ts`)**
  - [x] Moduł inicjalizujący stan przycisków przełączających (active state dla aktywnego widoku i paneli bocznych).
  - [x] Rejestracja kliknięć emitujących powiadomienia toast lub wywołujących akcje widoku.
  - [x] Zintegrowanie z `MainWindow.js` przy starcie aplikacji i zmianach widoków.

---

### Etap 2: Logika Biznesowa i Funkcjonalność (Ukończony)
- [x] **2.1. Obsługa Zapisywania i Zamykania Projektu**
  - [x] Zintegrowanie przycisku zapisu z `saveFullProject()` i systemem atomowego zapisu.
  - [x] Sprawdzenie dirty-state i dialog potwierdzenia przed zamknięciem projektu.
- [x] **2.2. Przełączanie Widoków i Stanów Paneli Bocznych**
  - [x] Synchronizacja przełącznika Graf ⟷ Markdown z `workspace.js` i `MainWindowViewModel`.
  - [x] Pełna obsługa zwijania/rozwijania panelu lewego (`#left-drawer`) oraz prawego (`#details-panel`) z aktualizacją klas CSS przycisków.
- [x] **2.3. System Walidacji Grafu**
  - [x] Integracja z modułem wykrywania pętli i martwych punktów w grafie Cytoscape.js (`View/ui/graphValidator.js`).
  - [x] Dynamiczna aktualizacja badge'a z liczbą problemów oraz modal raportu walidacji (`#modal-validation-report`) ze skokiem do paragrafu.
- [x] **2.4. System Eksportu i Publikacji**
  - [x] Wywołanie modalu eksportu (wybór formatu: PDF, DOCX, Web Player HTML, JSON).
  - [x] Generowanie samodzielnego pliku HTML (Web Player) oraz pełnego eksportu strukturalnego JSON.
- [x] **2.5. Uruchamianie Symulatora Gry (Playtest)**
  - [x] Podłączenie okna testowego podglądu gry od wybranego węzła lub węzła startowego (`#modal-playtest`).
  - [x] Interaktywny wybór ścieżek i opcji narracyjnych oraz restart rozgrywki.
- [x] **2.6. Modal Ustawień i Narzędzia Pomocnicze**
  - [x] Przełączanie do panelu ustawień edytora, motywu oraz zmiany języka z paska górnego (`Ctrl+,`).
  - [x] Skrót do menadżera zasobów graficznych (`Ctrl+Shift+I`) oraz modal pomocy i skrótów klawiszowych (`F1`).
  - [x] Obsługa globalnych skrótów klawiszowych dla wszystkich funkcji paska górnego.
