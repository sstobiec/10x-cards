# Specyfikacja: Responsywna typografia i spacing dla GenerationView

## 1. Informacje ogólne

| Parametr                  | Wartość                                                |
| ------------------------- | ------------------------------------------------------ |
| **Nazwa funkcjonalności** | Responsywna typografia i spacing (Mobile-First)        |
| **Priorytet**             | Wysoki                                                 |
| **Dotyczy widoku**        | `GenerationView` (`/generate`)                         |
| **Tech Stack**            | Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui |

## 2. Cel biznesowy

Poprawa doświadczenia użytkownika (UX) na urządzeniach mobilnych poprzez adaptację typografii, odstępów i layoutu do rozmiaru ekranu. Zmiany mają na celu:

- Zwiększenie czytelności treści na małych ekranach
- Lepsze wykorzystanie dostępnej przestrzeni ekranu
- Zachowanie spójności wizualnej między urządzeniami
- Zgodność z wytycznymi WCAG 2.2 (SC 1.4.4 Resize Text)

## 3. Wymagania funkcjonalne

### 3.1 Zachowanie na desktop (bez zmian)

Obecne zachowanie komponentów na ekranach ≥1024px (breakpoint `lg`) musi pozostać **niezmienione**:

| Komponent               | Obecne zachowanie desktop             | Status       |
| ----------------------- | ------------------------------------- | ------------ |
| `GenerationView`        | `py-12`, `text-4xl`, `mb-12`          | ✅ Zachowane |
| `GenerationForm`        | `max-w-4xl`, `min-h-[300px]` textarea | ✅ Zachowane |
| `ReviewSection`         | `py-12`, `text-4xl`, `max-w-5xl`      | ✅ Zachowane |
| `FlashcardProposalItem` | `p-6`, obecny układ przycisków        | ✅ Zachowane |

### 3.2 Nowe zachowanie na mobile (< 640px)

#### Typografia

| Element             | Desktop (lg+) | Tablet (sm-lg) | Mobile (<sm) |
| ------------------- | ------------- | -------------- | ------------ |
| Nagłówek H1         | `text-4xl`    | `text-3xl`     | `text-2xl`   |
| Opis pod nagłówkiem | `text-lg`     | `text-base`    | `text-base`  |
| Etykiety formularza | `text-sm`     | `text-sm`      | `text-sm`    |

#### Spacing (padding/margin)

| Element                 | Desktop (lg+) | Tablet (sm-lg) | Mobile (<sm) |
| ----------------------- | ------------- | -------------- | ------------ |
| Container padding-y     | `py-12`       | `py-8`         | `py-6`       |
| Container padding-x     | domyślny      | `px-6`         | `px-4`       |
| Margin pod nagłówkiem   | `mb-12`       | `mb-8`         | `mb-6`       |
| Spacing między sekcjami | `space-y-6`   | `space-y-4`    | `space-y-4`  |

#### Layout formularza

| Element                   | Desktop (lg+)            | Mobile (<sm)    |
| ------------------------- | ------------------------ | --------------- |
| Textarea min-height       | `min-h-[300px]`          | `min-h-[200px]` |
| Przycisk "Generuj fiszki" | `min-w-[200px]` centered | `w-full`        |
| Przycisk "Zapisz zestaw"  | `w-full`                 | `w-full`        |

## 4. Komponenty objęte zmianami

### 4.1 Komponenty główne

| Komponent        | Ścieżka                                   | Zakres zmian                                       |
| ---------------- | ----------------------------------------- | -------------------------------------------------- |
| `GenerationView` | `src/components/views/GenerationView.tsx` | Responsywne klasy dla kontenerów i typografii      |
| `GenerationForm` | `src/components/views/GenerationForm.tsx` | Responsywna wysokość textarea, szerokość przycisku |
| `ReviewSection`  | `src/components/views/ReviewSection.tsx`  | Responsywne klasy dla kontenerów i typografii      |

### 4.2 Komponenty pomocnicze (opcjonalne)

| Komponent        | Ścieżka                                   | Zakres zmian               |
| ---------------- | ----------------------------------------- | -------------------------- |
| `LoadingSpinner` | `src/components/views/LoadingSpinner.tsx` | Weryfikacja responsywności |
| `ErrorDisplay`   | `src/components/views/ErrorDisplay.tsx`   | Weryfikacja responsywności |
| `SuccessDisplay` | `src/components/views/SuccessDisplay.tsx` | Weryfikacja responsywności |

### 4.3 Komponenty bez zmian

| Komponent               | Ścieżka                                          | Uzasadnienie                                            |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| `FlashcardProposalItem` | `src/components/views/FlashcardProposalItem.tsx` | Już posiada responsywne klasy (`sm:p-6`, `sm:flex-row`) |
| `FlashcardProposalList` | `src/components/views/FlashcardProposalList.tsx` | Kontener bez specyficznych stylów                       |

## 5. Style globalne

### 5.1 Opcjonalne: Definicja klasy container

Rozważyć dodanie w `src/styles/global.css` responsywnej klasy container z paddingami:

| Breakpoint  | Max-width | Padding-x       |
| ----------- | --------- | --------------- |
| default     | 100%      | `1rem` (16px)   |
| sm (640px)  | 640px     | `1.5rem` (24px) |
| md (768px)  | 768px     | `1.5rem` (24px) |
| lg (1024px) | 1024px    | `2rem` (32px)   |
| xl (1280px) | 1280px    | `2rem` (32px)   |

## 6. Kryteria akceptacji

### 6.1 Mobile (iPhone 12 Pro - 390x844px)

- [ ] Nagłówki są czytelne bez konieczności przybliżania
- [ ] Tekst nie wychodzi poza krawędzie ekranu
- [ ] Przycisk "Generuj fiszki" zajmuje pełną szerokość
- [ ] Textarea jest widoczna w całości bez nadmiernego scrollowania
- [ ] Odstępy są proporcjonalne do rozmiaru ekranu

### 6.2 Tablet (iPad - 768x1024px)

- [ ] Layout wykorzystuje dostępną przestrzeń
- [ ] Typografia jest powiększona względem mobile
- [ ] Przyciski zachowują rozsądną szerokość

### 6.3 Desktop (1440x900px)

- [ ] Obecny wygląd i zachowanie pozostaje **niezmienione**
- [ ] Brak regresji wizualnych

## 7. Testy

### 7.1 Testy manualne

| Scenariusz                 | Urządzenie/Viewport   | Oczekiwany rezultat                       |
| -------------------------- | --------------------- | ----------------------------------------- |
| Widok formularza generacji | iPhone 12 Pro (390px) | Responsywna typografia, full-width button |
| Widok recenzji fiszek      | iPhone 12 Pro (390px) | Czytelne karty, odpowiednie odstępy       |
| Widok formularza generacji | iPad (768px)          | Pośrednia wielkość typografii             |
| Widok formularza generacji | Desktop (1440px)      | Brak zmian względem obecnego stanu        |

### 7.2 Testy automatyczne (opcjonalne)

- Visual regression tests z Playwright dla kluczowych breakpointów
- Snapshot tests dla komponentów z różnymi viewport sizes

## 8. Poza zakresem

Następujące elementy **NIE** są objęte tą specyfikacją:

- Zmiany w komponencie `Navigation.tsx`
- Implementacja hamburger menu
- Zmiany w innych widokach aplikacji (`DashboardView`, `SetEditorView`, `ProfileView`)
- Zmiany w komponentach Shadcn/ui (`Button`, `Input`, `Textarea`)
- Implementacja dark mode
- Animacje i przejścia

## 9. Referencje

- [WCAG 2.2 - Success Criterion 1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [ui-plan.md](./ui-plan.md) - Architektura UI dla 10xCards
- [tech-stack.md](./tech-stack.md) - Stack technologiczny projektu
