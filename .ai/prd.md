# Dokument wymagań produktu (PRD) - 10xCards

## 1. Przegląd produktu

10xCards to aplikacja internetowa zaprojektowana, aby zrewolucjonizować proces tworzenia fiszek edukacyjnych dla studentów informatyki. Wykorzystując sztuczną inteligencję, aplikacja automatyzuje generowanie fiszek na podstawie notatek tekstowych, znacznie skracając czas potrzebny na ich przygotowanie. Użytkownicy mogą generować zestawy fiszek, zarządzać nimi, edytować je oraz uczyć się za pomocą zintegrowanego algorytmu powtórek (spaced repetition). Projekt ma charakter hobbystyczny, a jego celem jest dostarczenie prostego, ale efektywnego narzędzia do nauki.

## 2. Problem użytkownika

Głównym problemem, który rozwiązuje 10xCards, jest czasochłonność i wysiłek związany z ręcznym tworzeniem fiszek. Metoda nauki oparta na powtórkach (spaced repetition) jest niezwykle skuteczna, jednak bariera wejścia w postaci konieczności samodzielnego przygotowania materiałów często zniechęca studentów. Proces ten odciąga uwagę od samego procesu nauki i konsumuje cenny czas, który mógłby być poświęcony na przyswajanie wiedzy.

## 3. Wymagania funkcjonalne

- FW-001: System kont użytkowników: Użytkownicy muszą mieć możliwość założenia konta i logowania się w celu przechowywania i zarządzania swoimi zestawami fiszek.
- FW-002: Generowanie fiszek przez AI: Aplikacja musi pozwalać na wklejenie tekstu (do 10 000 znaków) i wygenerowanie na jego podstawie zestawu fiszek.
- FW-003: Ręczne tworzenie fiszek: Musi istnieć interfejs do manualnego dodawania, edycji i usuwania pojedynczych fiszek (awers/rewers).
- FW-004: Zarządzanie zestawami: Użytkownicy muszą mieć dostęp do pulpitu z listą wszystkich swoich zestawów, z opcjami ich edycji, usuwania oraz rozpoczynania sesji nauki.
- FW-005: System powtórek: Aplikacja musi być zintegrowana z gotową biblioteką open-source implementującą algorytm spaced repetition.
- FW-006: Interfejs nauki: Podczas sesji nauki użytkownik musi mieć prosty interfejs do oceny swojej odpowiedzi (np. przyciski "Źle" / "Dobrze").
- FW-007: Mechanizm informacji zwrotnej: Użytkownicy muszą mieć możliwość oflagowania słabej jakości fiszki wygenerowanej przez AI (np. za pomocą ikony "kciuk w dół").
- FW-008: Limit znaków wejściowych: Interfejs powinien informować użytkownika o limicie 10 000 znaków i uniemożliwić generowanie po jego przekroczeniu.

## 4. Granice produktu

### Funkcjonalności objęte MVP:
- Rejestracja i logowanie użytkowników.
- Generowanie fiszek z tekstu za pomocą AI.
- Ręczne tworzenie i edycja fiszek.
- Przeglądanie, edycja i usuwanie zestawów fiszek.
- Integracja z gotowym algorytmem powtórek (biblioteka open-source).
- Podstawowy interfejs do nauki.

### Funkcjonalności nieobjęte MVP:
- Rozbudowane, autorskie algorytmy powtórek (w stylu SuperMemo/Anki).
- Import plików w różnych formatach (PDF, DOCX, itp.).
- Współdzielenie i publiczne udostępnianie zestawów fiszek.
- Integracje z zewnętrznymi platformami edukacyjnymi.
- Dedykowane aplikacje mobilne (projekt jest wyłącznie webowy).
- Monetyzacja i funkcje komercyjne.

## 5. Historyjki użytkowników

### Zarządzanie Kontem

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto za pomocą nazwy użytkownika i hasła, aby móc zapisywać swoje zestawy fiszek.
- Kryteria akceptacji:
  - Formularz rejestracji zawiera pola na nazwę użytkownika i hasło.
  - System waliduje, czy nazwa użytkownika nie jest już zajęta.
  - Po pomyślnej rejestracji jestem automatycznie zalogowany i przekierowany do pulpitu głównego.

- ID: US-002
- Tytuł: Logowanie do aplikacji
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na swoje konto, aby uzyskać dostęp do moich zestawów fiszek.
- Kryteria akceptacji:
  - Formularz logowania zawiera pola na nazwę użytkownika i hasło.
  - Po pomyślnym zalogowaniu jestem przekierowany do pulpitu z moimi zestawami.
  - W przypadku błędnych danych logowania wyświetlany jest odpowiedni komunikat.

### Generowanie Fiszki przez AI

- ID: US-003
- Tytuł: Generowanie zestawu fiszek z tekstu
- Opis: Jako student, chcę wkleić notatki z wykładu do pola tekstowego i kliknąć przycisk "Generuj", aby szybko stworzyć zestaw fiszek do nauki.
- Kryteria akceptacji:
  - Na stronie głównej znajduje się pole tekstowe na maksymalnie 10 000 znaków.
  - Pod polem tekstowym widoczny jest przycisk: "Generuj fiszki".
  - Po kliknięciu w przycisk, system przetwarza tekst i wyświetla wygenerowane fiszki do akceptacji.
  - Użytkownik musi mieć możliwość nazwania zestawu przed jego finalnym zapisaniem.

- ID: US-004
- Tytuł: Przekroczenie limitu znaków
- Opis: Jako użytkownik, próbując wkleić tekst dłuższy niż 10 000 znaków, chcę być poinformowany o limicie i uniemożliwić generowanie.
- Kryteria akceptacji:
  - Pod polem tekstowym wyświetlany jest dynamiczny licznik znaków (np. 5 420 / 10 000).
  - Po przekroczeniu 10 000 znaków licznik zmienia kolor (np. na czerwony).
  - Przycisk "Generuj fiszki" staje się nieaktywny po przekroczeniu limitu.

- ID: US-005
- Tytuł: Przeglądanie i akceptacja wygenerowanego zestawu
- Opis: Jako użytkownik, po wygenerowaniu fiszek przez AI, chcę je przejrzeć, edytować i ostatecznie zaakceptować, aby dodać je do moich zestawów.
- Kryteria akceptacji:
  - Wygenerowane fiszki są wyświetlane w formie listy (awers/rewers).
  - Mam możliwość edycji lub usunięcia pojedynczej fiszki przed zapisaniem zestawu.
  - Po kliknięciu "Zapisz zestaw" i nadaniu mu nazwy, zestaw pojawia się na mojej liście, a ja widzę opcje "Zacznij naukę" i "Przejdź do moich zestawów".

- ID: US-006
- Tytuł: Oznaczanie fiszki niskiej jakości
- Opis: Jako użytkownik, przeglądając wygenerowany zestaw, chcę mieć możliwość oznaczenia pojedynczej fiszki jako "słabej" za pomocą ikony kciuka w dół.
- Kryteria akceptacji:
  - Każda fiszka na liście do akceptacji ma ikonę "kciuk w dół".
  - Kliknięcie ikony wizualnie potwierdza akcję (np. zmiana koloru ikony).
  - Akcja jest zapisywana w bazie danych w celach analitycznych, ale nie usuwa fiszki.

### Ręczne Tworzenie Fiszki

- ID: US-007
- Tytuł: Tworzenie nowego, pustego zestawu fiszek
- Opis: Jako użytkownik, chcę mieć możliwość stworzenia nowego, pustego zestawu, aby móc ręcznie dodawać do niego fiszki.
- Kryteria akceptacji:
  - Na pulpicie głównym znajduje się przycisk "Stwórz zestaw ręcznie".
  - Po kliknięciu przycisku jestem proszony o podanie nazwy zestawu.
  - Po nadaniu nazwy jestem przekierowywany do interfejsu edycji, gdzie mogę dodawać fiszki.

- ID: US-008
- Tytuł: Dodawanie fiszki do zestawu
- Opis: Jako użytkownik, w trybie edycji zestawu, chcę widzieć formularz z polami "Awers" i "Rewers" oraz przycisk "Dodaj fiszkę", aby móc ręcznie tworzyć zawartość.
- Kryteria akceptacji:
  - Interfejs edycji zestawu wyświetla listę istniejących fiszek oraz formularz do dodawania nowych.
  - Po wypełnieniu pól i kliknięciu "Dodaj fiszkę", nowa fiszka pojawia się na liście.
  - Pola formularza są czyszczone po dodaniu fiszki.

### Zarządzanie Zestawami

- ID: US-009
- Tytuł: Wyświetlanie listy zestawów fiszek
- Opis: Jako zalogowany użytkownik, chcę widzieć na pulpicie głównym chronologiczną listę wszystkich moich zestawów fiszek.
- Kryteria akceptacji:
  - Pulpit główny wyświetla listę wszystkich stworzonych przeze mnie zestawów.
  - Każdy element listy zawiera nazwę zestawu oraz opcje: "Ucz się", "Edytuj" i "Usuń".

- ID: US-010
- Tytuł: Stan pusty dla nowego użytkownika
- Opis: Jako nowy użytkownik, który nie stworzył jeszcze żadnego zestawu, chcę zobaczyć na pulpicie przyjazny komunikat zachęcający do stworzenia pierwszego zestawu.
- Kryteria akceptacji:
  - Jeśli lista zestawów jest pusta, wyświetlany jest komunikat (np. "Nie masz jeszcze żadnych zestawów. Stwórz swój pierwszy zestaw!") oraz wyraźnie widoczne przyciski do generowania AI i tworzenia ręcznego.

- ID: US-011
- Tytuł: Edycja istniejącego zestawu fiszek
- Opis: Jako użytkownik, chcę móc kliknąć "Edytuj" przy zestawie, aby przejść do interfejsu, w którym mogę dodawać, edytować lub usuwać pojedyncze fiszki.
- Kryteria akceptacji:
  - Kliknięcie przycisku "Edytuj" przekierowuje do widoku edycji danego zestawu.
  - W widoku edycji mogę modyfikować treść awersu i rewersu każdej fiszki.
  - Mogę również usunąć dowolną fiszkę z zestawu.

- ID: US-012
- Tytuł: Usuwanie zestawu fiszek
- Opis: Jako użytkownik, chcę móc trwale usunąć cały zestaw fiszek, którego już nie potrzebuję.
- Kryteria akceptacji:
  - Przycisk "Usuń" jest dostępny dla każdego zestawu na liście.
  - Po kliknięciu "Usuń" wyświetlane jest okno dialogowe z prośbą o potwierdzenie operacji.
  - Po potwierdzeniu zestaw jest trwale usuwany z bazy danych i znika z listy.

### Sesja Nauki

- ID: US-013
- Tytuł: Rozpoczynanie sesji nauki
- Opis: Jako użytkownik, chcę kliknąć przycisk "Ucz się" przy wybranym zestawie, aby rozpocząć sesję powtórek.
- Kryteria akceptacji:
  - Kliknięcie "Ucz się" inicjuje sesję nauki opartą na algorytmie spaced repetition.
  - Aplikacja prezentuje mi pierwszą fiszkę do powtórki (tylko awers).

- ID: US-014
- Tytuł: Ocenianie odpowiedzi
- Opis: Jako użytkownik, po zobaczeniu awersu fiszki i przypomnieniu sobie odpowiedzi, chcę odsłonić rewers i ocenić, czy odpowiedziałem poprawnie.
- Kryteria akceptacji:
  - W interfejsie nauki widoczny jest awers fiszki i przycisk "Pokaż odpowiedź".
  - Po kliknięciu przycisku odsłaniany jest rewers.
  - Pod rewersem znajdują się dwa przyciski: "Źle" i "Dobrze".
  - Wybór jednej z opcji zapisuje mój postęp i przechodzi do kolejnej fiszki zgodnie z logiką algorytmu.

## 6. Metryki sukcesu

Kluczowe metryki sukcesu dla MVP będą mierzone w następujący sposób:

1. Jakość generacji AI:
   - Cel: 75% fiszek wygenerowanych przez AI jest akceptowanych przez użytkownika (nie są oznaczane jako "słabe").
   - Sposób pomiaru: Śledzenie w bazie danych liczby fiszek oznaczonych ikoną "kciuk w dół" w stosunku do całkowitej liczby wygenerowanych fiszek.

2. Adopcja funkcjonalności AI:
   - Cel: 75% wszystkich fiszek w systemie jest tworzonych przy użyciu generatora AI.
   - Sposób pomiaru: Każda fiszka w bazie danych będzie miała znacznik pochodzenia ("manualne" vs "AI"). Metryka będzie obliczana na podstawie analizy tego znacznika w całej bazie danych.
