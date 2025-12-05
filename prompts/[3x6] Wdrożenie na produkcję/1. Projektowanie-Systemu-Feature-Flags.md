W mojej aplikacji chciałbym rozdzielić deploymenty od releasów wprowadzając system feature flag.

Powinien być możliwy do zastosowania:

- na poziomie endpointów api (collections, auth)
- na poziomie stron astro – @login.astro @signup.astro @reset-password.astro
- na poziomie widoczności kolekcji – @TwoPane.tsx oraz @MobileNavigation.tsx

Na poziomie wspomnianych modułów powinienem być w stanie sprawdzić stan flagi określonej funkcjonalności, wg środowiska.

Zaprojektuj uniwersalny moduł TypeScript z którego będzie można korzystać na frontendzie i backendzie (src/features), który będzie przechowywał konfigurację flag dla środowisk local, integration i production. Dodaj flagi dla "auth" i "collections".

Środowisko dostarczę jako zmienną ENV_NAME (local, integration, prod)

Integracją zajmiemy się w kolejnym kroku. Zanim rozpoczniemy, zadaj mi 5 pytań, które ułatwią ci całą implementację.