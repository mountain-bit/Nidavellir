# Rozszerzenia Edytora TipTap (`Modules/Editor/extensions/`)

Katalog `Modules/Editor/extensions/` zawiera autorskie rozszerzenia TipTap (węzły `Node` i znaczniki `Mark`) edytora tekstu w aplikacji. Odpowiadają one za wizualne renderowanie elementów w edytorze WYSIWYG oraz ich dwukierunkową konwersję (parse/serialize) pomiędzy drzewem DOM a formatem Markdown.

---

## Szybka ściągawka (Cheatsheet)

| Plik                  | Typ TipTap            | Składnia Markdown                           | Opis / Rola                                                                         |
| --------------------- | --------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `CombatBlock.ts`      | `Node` (block, atom)  | `### Starcie: ...` + tabela + `#### Wyniki` | Karta bloku walki (przeciwnicy, statystyki, warunki przejścia).                     |
| `CustomImage.ts`      | `Node` (block)        | `![alt](<src> "title")`                     | Obrazki z obsługą spacji w ścieżkach zasobów i brakiem duplikacji kontenerów.       |
| `CustomStyleMark.ts`  | `Mark` (inline)       | `<span data-custom-style="id">`             | Własne style tekstu użytkownika (kolor, tło, czcionka) z walidacją identyfikatorów. |
| `CustomUnderline.ts`  | `Mark` (inline)       | `<u>tekst</u>`                              | Podkreślenie tekstu (obsługa `<u>`, `<ins>` i stylów CSS `text-decoration`).        |
| `DescriptionEmbed.ts` | `Node` (inline, atom) | `[Opis: Nazwa](embed://type/id)`            | Wstawka narracyjna transkludująca opis przedmiotu, lokacji lub postaci.             |
| `DialogBlock.ts`      | `Node` (block)        | `<p class="gamebook-dialog">`               | Kwestie dialogowe ze stylizacją, automatyczną pauzą `— ` i wsparciem skrótu.        |
| `EntityMention.ts`    | `Node` (inline, atom) | `[Etykieta](entity://type/id)`              | Odznaki wzmianek encji (`@`) projektu (postacie, lokacje, przedmioty, tagi, cechy). |

---

## Krótkie opisy plików

### 1. `CombatBlock.ts`

- **Co robi:** Renderuje w edytorze interaktywną, zablokowaną do edycji bezpośredniej (atomową) kartę starcia z tabelą przeciwników oraz listą możliwych wyników walki.
- **Kluczowe cechy:** Uniwersalne parsowanie strukturalne Markdown bez sztywnych słowników językowych, wektorowa ikona walki SVG (brak emotek), pełne i18n etykiet.

### 2. `CustomImage.ts`

- **Co robi:** Odpowiada za wstawianie, wyświetlanie i edycję obrazów w tekście paragrafu.
- **Kluczowe cechy:** Obsługuje ścieżki ze spacjami (`<assets/obrazek.png>`), zapobiega powielaniu kontenera `gamebook-image-container` przy wklejaniu, wspiera leniwe ładowanie (`loading="lazy"`).

### 3. `CustomStyleMark.ts`

- **Co robi:** Umożliwia nakładanie na zaznaczony tekst zdefiniowanych w projekcie stylów CSS (kolor tekstu, tło, czcionka, obramowanie).
- **Kluczowe cechy:** Walidacja każdego identyfikatora za pomocą `isSafeStyleId`, izolacja klas `gamebook-custom-style-{id}`, bezpieczna serializacja HTML do Markdown.

### 4. `CustomUnderline.ts`

- **Co robi:** Rozszerza bazowe podkreślenie TipTap o kompatybilność ze standardem Markdown i formatami zewnętrznymi.
- **Kluczowe cechy:** Parsuje znaczniki `<u>`, `<ins>` oraz style CSS, wypycha spacje krawędziowe na zewnątrz znaczników (`expelEnclosingWhitespace`).

### 5. `DescriptionEmbed.ts`

- **Co robi:** Obsługuje transkluzję opisów encji (wstawki narracyjne z plików opisów przedmiotów, postaci czy lokacji) w wariantach: pełny opis lub skrót.
- **Kluczowe cechy:** Uniwersalne usuwanie prefiksów przed dwukropkiem (`extractEntityName`), uciekanie nawiasów kwadratowych w etykietach linków, pełna integracja z `t(...)`.

### 6. `DialogBlock.ts`

- **Co robi:** Formatuje akapit jako kwestię dialogową (specjalny styl lewego paska, tła i kursywy).
- **Kluczowe cechy:** Automatycznie dodaje lub usuwa wiodącą pauzę dialogową (`— `), obsługuje warianty pauz (`—`, `–`, `―`, `-`), bezpieczna obsługa transakcji ProseMirror/TipTap.

### 7. `EntityMention.ts`

- **Co robi:** Zapewnia obsługę wzmianek encji wywoływanych znakiem `@` lub łączonych z menu kontekstowego.
- **Kluczowe cechy:** Wstawia klikalną odznakę encji z ikoną i typem (lokacja, postać, przedmiot, cecha, tag), bezpiecznie koduje/dekoduje URI (`entity://type/id`), oczyszcza nawiasy kwadratowe.

---

## Komponenty UI Edytora (`Modules/Editor/ui/`)

### 1. `MentionSuggestionRenderer.ts`

- **Co robi:** Zarządza cyklem życia, interfejsem DOM oraz obsługą zdarzeń popupu podpowiedzi encji wywoływanego przy wpisywaniu `@` (używany przez `EntityMention.ts`).
- **Kluczowe cechy:**
    - **Dynamiczne pozycjonowanie:** Precyzyjnie oblicza i koryguje pozycję okienka względem kursora i krawędzi okna aplikacji (`viewportHeight`, `viewportWidth`).
    - **Nawigacja klawiaturą:** Pełna obsługa klawiszy `ArrowUp`/`ArrowDown` z cyklicznym przełączaniem (wrap-around), zatwierdzanie przez `Enter` lub `Tab`, natychmiastowe zamykanie przez `Escape`.
    - **Bezpieczeństwo i sanitizacja:** Automatyczne uciekanie encji HTML (`escapeHtml` z obsługą znaków specjalnych i apostrofów), bezpieczne wywołanie przewijania (`scrollIntoView?.()`).
    - **Prezentacja typów encji:** Dedykowane ikony SVG, uniwersalne techniczne odznaki typów (`LOCATION`, `CHARACTER`, `ITEM`, `TRAIT`, `TAG`) oraz komunikat o braku pasujących słów.
