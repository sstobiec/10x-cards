<tech-stack>
Frontend:
- Astro 5
- React 19
- TypeScript 5
- Tailwind 4
- Shadcn/ui

Backend i baza danych:
- Supabase

AI - Komunikacja z modelami: 
- OpenRouter.ai

Testowanie:
- Vitest (testy jednostkowe i integracyjne)
- React Testing Library (testy komponentów)
- Playwright (testy E2E)
- MSW - Mock Service Worker (mockowanie API)
- Supabase CLI (lokalna instancja bazy danych dla testów)

CI/CD i Hosting:
- GitHub Actions
- Cloudflare Pages/Workers
</tech-stack>

---

## Deployment & Releases

### Platforma hostingowa: Cloudflare Pages/Workers

**Decyzja podjęta:** 2024-12  
**Status:** Wybrana do wdrożenia

#### Uzasadnienie wyboru

Cloudflare Pages/Workers zostało wybrane jako platforma hostingowa po analizie 5 alternatyw (Vercel, Netlify, Cloudflare, DigitalOcean App Platform, Railway) pod kątem:
- Złożoności wdrażania
- Kompatybilności ze stosem technologicznym
- Konfiguracji wielu środowisk
- Planów subskrypcji i możliwości komercjalizacji

**Kluczowe zalety:**
1. **Najlepsza wartość cenowa** - Free tier: 100k requests/day, unlimited bandwidth, komercyjne użycie dozwolone
2. **Globalna dystrybucja edge** - 300+ punktów obecności na świecie
3. **Oficjalny adapter Astro** - `@astrojs/cloudflare` utrzymywany przez zespół Astro
4. **Platforma deweloperska** - dostęp do KV, D1 (baza danych), R2 (storage), AI
5. **Skalowalność** - automatyczne skalowanie bez konfiguracji

**Znane ograniczenia:**
- Workers używają V8 isolates, nie pełnego Node.js runtime
- CPU time limit: 10ms (free) / 50ms (paid) per request
- Memory limit: 128MB
- Niektóre Node.js APIs wymagają polyfilli lub refaktoryzacji

#### Wymagane zmiany w projekcie

1. **Zmiana adaptera Astro:**
   ```bash
   npx astro add cloudflare
   ```
   
2. **Aktualizacja `astro.config.mjs`:**
   ```javascript
   import cloudflare from '@astrojs/cloudflare';
   
   export default defineConfig({
     output: 'server',
     adapter: cloudflare(),
     // ... rest of config
   });
   ```

3. **Konfiguracja Wrangler** (`wrangler.toml`):
   ```toml
   name = "10x-cards"
   compatibility_date = "2024-12-01"
   
   [assets]
   directory = "./dist"
   ```

4. **Zmienne środowiskowe z `astro:env`:**
   
   Cloudflare Workers wymagają specjalnego podejścia do zmiennych środowiskowych.
   Projekt używa modułu `astro:env` dla bezpiecznego dostępu do zmiennych:
   
   ```typescript
   // Import zmiennych serwerowych (sekrety)
   import { SUPABASE_URL, SUPABASE_KEY, OPENROUTER_API_KEY } from "astro:env/server";
   
   // Import zmiennych publicznych
   import { USE_MOCK_AI } from "astro:env/server";
   ```
   
   Schema zmiennych jest zdefiniowany w `astro.config.mjs` pod kluczem `env.schema`.

#### Struktura środowisk

| Środowisko | Branch | URL | Przeznaczenie |
|------------|--------|-----|---------------|
| Production | `main` | `10x-cards.pages.dev` | Wersja produkcyjna |
| Preview | PR branches | `<hash>.10x-cards.pages.dev` | Preview deployments dla PR |
| Development | `develop` | `develop.10x-cards.pages.dev` | Środowisko deweloperskie |

#### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=10x-cards
```

#### Zmienne środowiskowe

Konfiguracja w Cloudflare Dashboard > Pages > Settings > Environment Variables:

| Zmienna | Typ | Środowisko | Opis |
|---------|-----|------------|------|
| `SUPABASE_URL` | Secret | Production, Preview | URL projektu Supabase |
| `SUPABASE_KEY` | Secret | Production, Preview | Klucz anon Supabase |
| `OPENROUTER_API_KEY` | Secret | Production | Klucz API OpenRouter (opcjonalny) |
| `USE_MOCK_AI` | Public | Preview | Użyj mock AI zamiast OpenRouter (default: false) |

**Uwaga:** Zmienne są zarządzane przez moduł `astro:env`. Sekrety nie są walidowane podczas builda (Cloudflare wstrzykuje je w runtime), ale są walidowane przy pierwszym użyciu.

#### Pricing (stan na 2024-12)

| Plan | Requests | Bandwidth | Koszt | Komercyjne użycie |
|------|----------|-----------|-------|-------------------|
| Free | 100k/day | Unlimited | $0 | ✅ Dozwolone |
| Paid | 10M+ | Unlimited | $5/mo | ✅ Dozwolone |

#### Alternatywy (backup)

W przypadku problemów z Cloudflare Workers (np. niekompatybilność runtime):
1. **Railway** - pełna kompatybilność Node.js, dobra DX, $5/mo + usage
2. **DigitalOcean App Platform** - przewidywalne koszty, pełny Node.js, $5-12/mo