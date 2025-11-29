/**
 * Test Data Fixtures
 * 
 * Reusable test data for E2E tests
 */

/**
 * Sample notes for flashcard generation
 */
export const SAMPLE_NOTES = {
  SHORT: "AI to sztuczna inteligencja.",
  
  MEDIUM: `
    TypeScript to nadzbór JavaScriptu.
    Dodaje statyczne typowanie do JavaScript.
    Kompiluje się do czystego JavaScript.
  `.trim(),
  
  LONG: `
    Historia Polski w XIX wieku
    
    Rzeczpospolita Obojga Narodów upadła w wyniku trzech rozbiorów (1772, 1793, 1795).
    Ziemie polskie zostały podzielone między Rosję, Prusy i Austrię.
    
    Księstwo Warszawskie było państwem utworzonym przez Napoleona Bonaparte w 1807 roku.
    Powstało z ziem zaboru pruskiego po pokoju w Tylży.
    Trwało do 1815 roku.
    
    Kongres Wiedeński w 1815 roku podzielił na nowo ziemie polskie między mocarstwa.
    Powstało Królestwo Polskie zwane Kongresówką, które było w unii personalnej z Rosją.
    
    Powstanie Listopadowe wybuchło w 1830 roku przeciwko rządom rosyjskim.
    Trwało do września 1831 roku i zakończyło się klęską.
    
    Powstanie Styczniowe rozpoczęło się w 1863 roku.
    Było to największe powstanie narodowe w XIX wieku.
    Zakończyło się klęską w 1864 roku.
  `.trim(),
  
  MULTIPLE_TOPICS: `
    Fotosynteza to proces zamiany energii świetlnej w energię chemiczną.
    Zachodzi w chloroplastach komórek roślinnych.
    
    Mitochondria są organellami komórkowymi odpowiedzialnymi za produkcję ATP.
    Nazywane są "elektrowniami komórki".
    
    DNA to kwas dezoksyrybonukleinowy zawierający informację genetyczną.
    Ma strukturę podwójnej helisy.
  `.trim(),
  
  TECHNICAL: `
    React to biblioteka JavaScript do budowania interfejsów użytkownika.
    Wykorzystuje wirtualny DOM do efektywnego renderowania.
    Komponenty mogą być klasami lub funkcjami.
    
    Hooks to funkcje pozwalające używać stanu i innych funkcji React w komponentach funkcyjnych.
    useState zarządza lokalnym stanem komponentu.
    useEffect obsługuje efekty uboczne.
    
    Props to mechanizm przekazywania danych między komponentami.
    Przepływają jednokierunkowo - od rodzica do dziecka.
  `.trim(),
};

/**
 * Sample set names - using timestamps to avoid conflicts
 */
export const SET_NAMES = {
  HISTORY: `Historia Polski - ${Date.now()}`,
  BIOLOGY: `Biologia - Komórka - ${Date.now()}`,
  PROGRAMMING: `React - Podstawy - ${Date.now()}`,
  SCIENCE: `Nauki przyrodnicze - ${Date.now()}`,
  SHORT: `Test - ${Date.now()}`,
  LONG: "To jest bardzo długa nazwa zestawu fiszek, która może przekroczyć limit znaków w walidacji formularza",
  WITH_SPECIAL_CHARS: "Test!@#$%^&*()",
  POLISH_CHARS: "Zestaw z polskimi znakami: ąćęłńóśźż",
};

/**
 * Sample flashcard content for editing
 */
export const FLASHCARD_CONTENT = {
  SIMPLE: {
    avers: "Co to jest AI?",
    rewers: "AI (Artificial Intelligence) to sztuczna inteligencja.",
  },
  
  DETAILED: {
    avers: "Jakie są główne cechy fotosyntez?",
    rewers: `Fotosynteza to proces charakteryzujący się następującymi cechami:
1. Zachodzi w chloroplastach
2. Wymaga światła
3. Produkuje glukozę i tlen
4. Wykorzystuje CO2 i wodę`,
  },
  
  CODE_EXAMPLE: {
    avers: "Jak utworzyć komponent React?",
    rewers: `function MyComponent() {
  return <div>Hello World</div>;
}`,
  },
};

/**
 * Character limits for validation testing
 */
export const LIMITS = {
  MAX_TEXT_INPUT: 10000,
  MAX_SET_NAME: 100,
  MAX_AVERS: 200,
  MAX_REWERS: 750,
};

/**
 * Generate text of specific length
 * @param length - Desired length of the text
 * @returns Text string of specified length
 */
export function generateTextOfLength(length: number): string {
  const base = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ";
  return base.repeat(Math.ceil(length / base.length)).slice(0, length);
}

/**
 * Wait times for different operations (in milliseconds)
 */
export const WAIT_TIMES = {
  SHORT: 1000,
  MEDIUM: 5000,
  LONG: 30000,
  GENERATION_TIMEOUT: 60000,
};

