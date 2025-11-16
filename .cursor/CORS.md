## Czym jest CORS?

**CORS (Cross-Origin Resource Sharing)** to mechanizm bezpieczeństwa w przeglądarkach, który kontroluje, czy strona z jednego **originu** może odczytywać odpowiedzi z innego **originu**.

Origin = **schemat + domena + port**, np.:

* `https://example.com:443`
* `http://example.com:80`

---

## Same-Origin Policy (punkt wyjścia)

Domyślna zasada:

Strona pod:

```text
https://moja-strona.pl
```

może odczytywać odpowiedzi **tylko** z:

```text
https://moja-strona.pl
```

Jeśli frontend próbuje:

```js
fetch("https://api.inna-domena.com/dane")
```

to przeglądarka **zablokuje dostęp do odpowiedzi** (dla JS), chyba że serwer `api.inna-domena.com` poprawnie skonfigurował CORS.

---

## Po co jest CORS?

CORS pozwala serwerowi **świadomie i jawnie** powiedzieć przeglądarce:

> „Zezwalam, żeby strona z originu X czytała moje odpowiedzi”.

Przeglądarka ufa **nagłówkom z serwera**, nie kodowi JS.

---

## Jak wygląda przepływ?

1. Frontend wysyła żądanie:

   ```http
   GET /dane
   Host: api.inna-domena.com
   Origin: https://moja-strona.pl
   ```
2. Serwer odpowiada:

   ```http
   HTTP/1.1 200 OK
   Access-Control-Allow-Origin: https://moja-strona.pl
   Content-Type: application/json
   ```
3. Jeśli `Access-Control-Allow-Origin`:

   * zgadza się z `Origin` → przeglądarka **wpuszcza** odpowiedź do JS,
   * nie zgadza się / brak nagłówka → przeglądarka **blokuje dostęp** (błąd CORS w konsoli).

> Uwaga: żądanie **dochodzi** do serwera nawet przy błędzie CORS; blokada jest po stronie przeglądarki.

---

## Najważniejsze nagłówki CORS

### 1. `Access-Control-Allow-Origin`

Określa, kto może czytać odpowiedzi.

Przykłady:

```http
Access-Control-Allow-Origin: https://moja-strona.pl
```

```http
Access-Control-Allow-Origin: *
```

> `*` = dowolny origin (tylko gdy nie używasz cookies / `Authorization`).

---

### 2. `Access-Control-Allow-Methods`

Jakie metody są dozwolone przy cross-origin:

```http
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
```

---

### 3. `Access-Control-Allow-Headers`

Jakie nagłówki klient może wysłać:

```http
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

### 4. `Access-Control-Allow-Credentials`

Czy wolno wysyłać ciasteczka / auth headers:

```http
Access-Control-Allow-Credentials: true
```

Ważne:

* jeśli `Allow-Credentials: true`, to **nie możesz** użyć:

  ```http
  Access-Control-Allow-Origin: *
  ```

  Musi być konkretny origin.

---

## Preflight request (OPTIONS)

Dla „nieprostych” żądań (np. `PUT`, `DELETE`, custom nagłówki) przeglądarka robi najpierw **preflight**:

### 1. Zapytanie preflight:

```http
OPTIONS /dane
Origin: https://moja-strona.pl
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: Content-Type
```

### 2. Odpowiedź serwera:

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://moja-strona.pl
Access-Control-Allow-Methods: GET, POST, PUT
Access-Control-Allow-Headers: Content-Type
```

Jeśli poprawna → dopiero wtedy właściwy `PUT` jest wykonywany.

---

## Typowe problemy

* **Brak nagłówków CORS na backendzie**
  → błąd w konsoli: `Blocked by CORS policy`.
* **Błędny origin**
  → serwer zwraca `Allow-Origin` na inną domenę niż faktyczne `Origin`.
* **Creds + gwiazdka**
  → `Access-Control-Allow-Credentials: true` + `Access-Control-Allow-Origin: *` = niedozwolone.

---

## TL;DR

CORS to:

> Zestaw nagłówków HTTP, dzięki którym serwer mówi przeglądarce, z jakich originów wolno odczytywać jego odpowiedzi; przeglądarka egzekwuje te zasady.

Jeśli chcesz, w następnym kroku mogę dorzucić gotowe snippet’y konfiguracji CORS dla konkretnego frameworka (napisz tylko którego).

---

### Dodatkowe szczegóły:

**CORS dotyczy TYLKO przeglądarek:**

* Narzędzia jak Postman, cURL, Insomnia czy requesty z backendu (Node.js, Python) **nie mają tego ograniczenia**
* Dlatego często widzisz: „w Postmanie działa, ale w przeglądarce błąd CORS”

**Same-Origin to identyczne:**

* **Protokół** (`http://` ≠ `https://`)
* **Domena** włącznie z subdomeną (`api.example.com` ≠ `example.com` ≠ `www.example.com`)
* **Port** (`:80` ≠ `:8080` ≠ `:3000`)

**Przykłady:**

```text
https://example.com:443/page1
https://example.com:443/page2     ✅ Same origin

https://example.com:443
http://example.com:443             ❌ Inny protokół

https://example.com:443
https://example.com:8080           ❌ Inny port

https://example.com
https://api.example.com            ❌ Inna subdomena
```

---