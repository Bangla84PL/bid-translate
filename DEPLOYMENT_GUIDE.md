# BidTranslate - Kompletny Przewodnik Wdrożenia

## Spis Treści

1. [Wymagania Wstępne](#wymagania-wstępne)
2. [Konfiguracja Supabase](#konfiguracja-supabase)
3. [Konfiguracja Stripe](#konfiguracja-stripe)
4. [Konfiguracja n8n](#konfiguracja-n8n)
5. [Zmienne Środowiskowe](#zmienne-środowiskowe)
6. [Wdrożenie na Vercel](#wdrożenie-na-vercel)
7. [Konfiguracja Domen](#konfiguracja-domen)
8. [Weryfikacja Wdrożenia](#weryfikacja-wdrożenia)
9. [Monitoring i Logi](#monitoring-i-logi)
10. [Rozwiązywanie Problemów](#rozwiązywanie-problemów)

---

## Wymagania Wstępne

### Konta i Usługi

- [ ] **Konto Vercel** (https://vercel.com) - hosting aplikacji Next.js
- [ ] **Supabase Instance** - baza danych PostgreSQL (już skonfigurowana na VPS)
- [ ] **Konto Stripe** (https://stripe.com) - płatności i subskrypcje
- [ ] **n8n Instance** - automatyzacja (już skonfigurowana na VPS)
- [ ] **Domeny**:
  - `app.bidtranslate.com` - główna aplikacja
  - `m.bidtranslate.com` - wersja mobilna (PWA)

### Narzędzia Lokalne

- Node.js 18+ i npm
- Git
- Vercel CLI (opcjonalnie): `npm i -g vercel`
- Supabase CLI (opcjonalnie): `npm i -g supabase`

---

## Konfiguracja Supabase

### 1. Weryfikacja Połączenia z VPS

Twoja instancja Supabase działa na `https://api.supabase.smartcamp.ai`. Sprawdź dostępność:

```bash
curl https://api.supabase.smartcamp.ai/rest/v1/
```

Powinieneś otrzymać odpowiedź z informacją o API.

### 2. Uruchomienie Migracji Bazy Danych

#### Opcja A: Przez Supabase Studio

1. Otwórz Supabase Studio: `https://api.supabase.smartcamp.ai` (lub panel na VPS)
2. Przejdź do zakładki **SQL Editor**
3. Uruchom kolejno migracje z katalogu `supabase/migrations/`:
   - `20250115000001_initial_schema.sql` - tabele, typy, funkcje
   - `20250115000002_rls_policies.sql` - polityki bezpieczeństwa
   - `20250115000003_realtime_setup.sql` - konfiguracja WebSocket

#### Opcja B: Przez Supabase CLI

```bash
# Zaloguj się do swojej instancji
supabase login

# Połącz projekt (użyj swojego project-id)
supabase link --project-ref your-project-id

# Uruchom migracje
supabase db push
```

### 3. Weryfikacja Tabel

Po migracji sprawdź, czy wszystkie tabele zostały utworzone:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'bid_translate_%'
ORDER BY table_name;
```

Powinieneś zobaczyć:
- `bid_translate_agencies`
- `bid_translate_translators`
- `bid_translate_auctions`
- `bid_translate_auction_participants`
- `bid_translate_auction_bids`

### 4. Weryfikacja Row Level Security (RLS)

Sprawdź, czy polityki RLS są aktywne:

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename LIKE 'bid_translate_%';
```

### 5. Konfiguracja Realtime

W Supabase Studio:
1. Przejdź do **Database** → **Replication**
2. Włącz replikację dla tabel:
   - `bid_translate_auctions`
   - `bid_translate_auction_participants`
   - `bid_translate_auction_bids`

### 6. Konfiguracja Storage (opcjonalnie)

Jeśli planujesz przesyłanie plików projektów:

1. W Supabase Studio przejdź do **Storage**
2. Utwórz bucket `auction-files`
3. Ustaw polityki:
   ```sql
   -- Pozwól agencjom na upload plików
   CREATE POLICY "Agencies can upload files"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'auction-files' AND auth.role() = 'authenticated');

   -- Pozwól wszystkim na odczyt (translatorzy przez magic link)
   CREATE POLICY "Anyone can download files"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'auction-files');
   ```

### 7. Pobierz Klucze API

W Supabase Studio:
1. Przejdź do **Settings** → **API**
2. Skopiuj:
   - **Project URL**: `https://api.supabase.smartcamp.ai`
   - **anon public key** (zaczyna się od `eyJhbGciOiJIUzI1NiIs...`)
   - **service_role key** (zaczyna się od `eyJhbGciOiJIUzI1NiIs...`)

⚠️ **UWAGA**: `service_role` key ma pełne uprawnienia - **NIGDY** nie eksponuj go w frontendzie!

---

## Konfiguracja Stripe

### 1. Utwórz Konto Stripe

1. Zarejestruj się na https://stripe.com
2. Aktywuj tryb testowy (test mode) - przełącznik w prawym górnym rogu
3. Uzupełnij dane firmy w **Settings** → **Account details**

### 2. Stwórz Produkty i Cenniki

Przejdź do **Products** → **Add product** i utwórz 4 plany:

#### Plan 1: Starter
- **Nazwa**: BidTranslate Starter
- **Opis**: 25 aukcji/miesiąc, 100 tłumaczy
- **Cena**: 100 PLN/miesiąc
- **Billing period**: Monthly
- **Metadata** (ważne!):
  - `plan_type`: `starter`
  - `max_auctions`: `25`
  - `max_translators`: `100`

#### Plan 2: Professional
- **Nazwa**: BidTranslate Professional
- **Opis**: 100 aukcji/miesiąc, 1000 tłumaczy
- **Cena**: 250 PLN/miesiąc
- **Billing period**: Monthly
- **Metadata**:
  - `plan_type`: `professional`
  - `max_auctions`: `100`
  - `max_translators`: `1000`

#### Plan 3: Unlimited
- **Nazwa**: BidTranslate Unlimited
- **Opis**: Nielimitowane aukcje i tłumacze
- **Cena**: 1000 PLN/miesiąc
- **Billing period**: Monthly
- **Metadata**:
  - `plan_type`: `unlimited`
  - `max_auctions`: `-1`
  - `max_translators`: `-1`

#### Plan 4: Lifetime
- **Nazwa**: BidTranslate Lifetime
- **Opis**: Nielimitowany dostęp na zawsze
- **Cena**: 10000 PLN
- **Billing period**: One-time payment
- **Metadata**:
  - `plan_type`: `lifetime`
  - `max_auctions`: `-1`
  - `max_translators`: `-1`

### 3. Skonfiguruj Webhooks

1. Przejdź do **Developers** → **Webhooks**
2. Kliknij **Add endpoint**
3. **Endpoint URL**: `https://app.bidtranslate.com/api/webhooks/stripe`
4. **Events to send**:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. **Zapisz** i skopiuj **Signing secret** (zaczyna się od `whsec_`)

### 4. Pobierz Klucze API

W **Developers** → **API keys**:
- **Publishable key** (zaczyna się od `pk_test_`) - publiczny
- **Secret key** (zaczyna się od `sk_test_`) - PRYWATNY

⚠️ **Przed produkcją**: Przełącz na Live mode i wygeneruj nowe klucze!

### 5. Aktualizuj Konfigurację w Kodzie

Edytuj `lib/stripe/config.ts` i zaktualizuj Price IDs:

```typescript
export const STRIPE_PLANS = {
  starter: {
    name: 'Starter',
    priceId: 'price_XXXXXXXXX', // ← Wklej Price ID z Stripe
    // ...
  },
  // ... podobnie dla innych planów
}
```

**Jak znaleźć Price ID**:
1. W Stripe Dashboard → **Products**
2. Kliknij na produkt
3. W sekcji **Pricing** skopiuj ID (zaczyna się od `price_`)

---

## Konfiguracja n8n

### 1. Dostęp do n8n

Twoja instancja n8n działa na `https://n8n.smartcamp.ai`. Zaloguj się do panelu.

### 2. Utwórz Workflow: Zaproszenie do Aukcji

#### Krok 1: Webhook Trigger
1. Utwórz nowy workflow: **auction-invitation-email**
2. Dodaj node **Webhook**
3. Ustaw:
   - **Webhook Path**: `auction-invitation`
   - **Method**: POST
   - **Response**: Immediately
4. Skopiuj URL webhooka (np. `https://n8n.smartcamp.ai/webhook/auction-invitation`)

#### Krok 2: Email Node
1. Dodaj node **Gmail** (lub **SMTP**)
2. Połącz z webhookiem
3. Konfiguracja:
   - **From**: `hello@smartcamp.ai`
   - **To**: `{{ $json.email }}`
   - **Subject**: `🎯 Nowa aukcja tłumaczeniowa - {{ $json.languagePair }}`
   - **Body** (HTML):

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">🎯 Nowe Zaproszenie do Aukcji</h1>

    <p>Witaj <strong>{{ $json.translatorName }}</strong>,</p>

    <p>{{ $json.agencyName }} zaprasza Cię do wzięcia udziału w aukcji tłumaczeniowej:</p>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Para językowa:</strong> {{ $json.languagePair }}</p>
      <p><strong>Specjalizacja:</strong> {{ $json.specialization }}</p>
      <p><strong>Liczba słów:</strong> {{ $json.wordCount }}</p>
      <p><strong>Cena startowa:</strong> {{ $json.startingPrice }} PLN</p>
      <p><strong>Termin:</strong> {{ $json.deadline }}</p>
    </div>

    <p><strong>Opis projektu:</strong></p>
    <p>{{ $json.description }}</p>

    <div style="margin: 30px 0; text-align: center;">
      <a href="{{ $json.auctionUrl }}"
         style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
        Weź Udział w Aukcji
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">
      ⏰ Masz 10 minut na potwierdzenie udziału. Link jest ważny tylko dla tej aukcji.
    </p>

    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

    <p style="color: #666; font-size: 12px;">
      BidTranslate - Platforma aukcyjna dla biur tłumaczeń<br>
      {{ $json.agencyName }}<br>
      Ten email został wysłany automatycznie.
    </p>
  </div>
</body>
</html>
```

4. Aktywuj workflow

#### Payload Przykładowy (dla testów):

```json
{
  "email": "translator@example.com",
  "translatorName": "Jan Kowalski",
  "agencyName": "Biuro Tłumaczeń ABC",
  "languagePair": "EN → PL",
  "specialization": "medical",
  "wordCount": 5000,
  "startingPrice": 1500,
  "deadline": "2025-02-01",
  "description": "Tłumaczenie dokumentacji medycznej...",
  "auctionUrl": "https://app.bidtranslate.com/auction/abc123?token=xyz789"
}
```

### 3. Utwórz Workflow: Powiadomienie o Wygranej

#### Workflow: **auction-winner-notification**

**Webhook Path**: `auction-winner`

**Email Template**:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #10b981;">🎉 Gratulacje! Wygrałeś Aukcję!</h1>

    <p>Witaj <strong>{{ $json.translatorName }}</strong>,</p>

    <p>Gratulujemy! Wygrałeś aukcję tłumaczeniową:</p>

    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #10b981;">
      <p><strong>Para językowa:</strong> {{ $json.languagePair }}</p>
      <p><strong>Liczba słów:</strong> {{ $json.wordCount }}</p>
      <p><strong>Finalna cena:</strong> <span style="font-size: 24px; color: #10b981;">{{ $json.finalPrice }} PLN</span></p>
      <p><strong>Oszczędność:</strong> {{ $json.savings }} PLN ({{ $json.savingsPercent }}%)</p>
    </div>

    <h2>Następne Kroki</h2>
    <ol>
      <li>Skontaktuj się z agencją w ciągu 24h</li>
      <li>Potwierdź szczegóły projektu</li>
      <li>Rozpocznij pracę przed terminem: {{ $json.deadline }}</li>
    </ol>

    <h3>Kontakt do Agencji</h3>
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
      <p><strong>{{ $json.agencyName }}</strong></p>
      <p>Email: {{ $json.agencyEmail }}</p>
      <p>Telefon: {{ $json.agencyPhone }}</p>
    </div>

    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

    <p style="color: #666; font-size: 12px;">
      BidTranslate - Platforma aukcyjna dla biur tłumaczeń
    </p>
  </div>
</body>
</html>
```

### 4. Utwórz Workflow: Powiadomienie o Przegranej

#### Workflow: **auction-loser-notification**

**Webhook Path**: `auction-loser`

**Email Template**:

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #6b7280;">Dziękujemy za Udział w Aukcji</h1>

    <p>Witaj <strong>{{ $json.translatorName }}</strong>,</p>

    <p>Dziękujemy za udział w aukcji <strong>{{ $json.languagePair }}</strong>. Niestety, tym razem ktoś inny wygrał ten projekt.</p>

    <p>Nie martw się! Będziemy Cię informować o kolejnych możliwościach współpracy.</p>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Statystyki aukcji:</strong></p>
      <p>Liczba uczestników: {{ $json.totalParticipants }}</p>
      <p>Liczba rund: {{ $json.totalRounds }}</p>
      <p>Finalna cena: {{ $json.finalPrice }} PLN</p>
    </div>

    <p>Do zobaczenia w kolejnych aukcjach! 👋</p>

    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

    <p style="color: #666; font-size: 12px;">
      BidTranslate - Platforma aukcyjna dla biur tłumaczeń
    </p>
  </div>
</body>
</html>
```

### 5. Utwórz Workflow: Przypomnienie o Końcu Trialu

#### Workflow: **trial-expiration-reminder**

**Trigger**: Scheduled (codziennie o 9:00)

**SQL Query Node** (łączy się z Supabase):

```sql
SELECT
  a.id,
  a.company_name,
  a.trial_ends_at,
  u.email
FROM bid_translate_agencies a
JOIN auth.users u ON u.id = a.owner_id
WHERE a.subscription_status = 'trial'
  AND a.trial_ends_at <= NOW() + INTERVAL '3 days'
  AND a.trial_ends_at > NOW();
```

**Email Template**:

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #f59e0b;">⏰ Twój Trial Wkrótce Wygasa</h1>

    <p>Cześć {{ $json.company_name }},</p>

    <p>Twój 14-dniowy okres próbny BidTranslate wygasa za <strong>{{ $json.daysRemaining }} dni</strong>.</p>

    <p>Aby kontynuować korzystanie z platformy bez przerwy, wybierz plan subskrypcji:</p>

    <div style="margin: 30px 0; text-align: center;">
      <a href="https://app.bidtranslate.com/settings"
         style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
        Wybierz Plan Subskrypcji
      </a>
    </div>

    <p><strong>Nasze plany:</strong></p>
    <ul>
      <li>Starter: 100 PLN/miesiąc</li>
      <li>Professional: 250 PLN/miesiąc</li>
      <li>Unlimited: 1000 PLN/miesiąc</li>
      <li>Lifetime: 10 000 PLN (jednorazowo)</li>
    </ul>

    <p>Potrzebujesz pomocy? Odpowiedz na ten email!</p>

    <p>Pozdrawiamy,<br>Zespół BidTranslate</p>
  </div>
</body>
</html>
```

### 6. Zapisz URL-e Webhooków

Po utworzeniu wszystkich workflows, zapisz ich URL-e:

```bash
# Dodaj do .env (produkcja)
N8N_WEBHOOK_BASE=https://n8n.smartcamp.ai/webhook/
N8N_AUCTION_INVITATION=auction-invitation
N8N_AUCTION_WINNER=auction-winner
N8N_AUCTION_LOSER=auction-loser
N8N_TRIAL_REMINDER=trial-reminder
```

---

## Zmienne Środowiskowe

### Struktura Pliku `.env`

Utwórz plik `.env.local` (dla lokalnego devu) i dodaj w Vercel (produkcja):

```bash
# ============================================
# SUPABASE CONFIGURATION
# ============================================
# Shared Supabase instance on VPS
# All tables prefixed with 'bid_translate_'
NEXT_PUBLIC_SUPABASE_URL=https://api.supabase.smartcamp.ai
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase-dashboard

# Service Role Key - NEVER expose in frontend!
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase-dashboard

# ============================================
# STRIPE CONFIGURATION
# ============================================
# Test keys (replace with live keys before production!)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# ============================================
# N8N WEBHOOKS
# ============================================
N8N_WEBHOOK_BASE=https://n8n.smartcamp.ai/webhook/
N8N_AUCTION_INVITATION=auction-invitation
N8N_AUCTION_WINNER=auction-winner
N8N_AUCTION_LOSER=auction-loser

# ============================================
# APPLICATION URLS
# ============================================
NEXT_PUBLIC_APP_URL=https://app.bidtranslate.com
NEXT_PUBLIC_MOBILE_URL=https://m.bidtranslate.com

# ============================================
# EMAIL CONFIGURATION (for reference - handled by n8n)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hello@smartcamp.ai
SMTP_FROM=hello@smartcamp.ai
```

### ⚠️ Ważne Uwagi o Zmiennych

1. **Nigdy nie commituj plików `.env`** - są w `.gitignore`
2. **NEXT_PUBLIC_*** - dostępne w przeglądarce (tylko publiczne dane!)
3. **Bez prefiksu** - tylko server-side (API routes, middleware)
4. **Stripe Test vs Live**:
   - Dev/Staging: `pk_test_...` i `sk_test_...`
   - Produkcja: `pk_live_...` i `sk_live_...`

---

## Wdrożenie na Vercel

### Metoda 1: Przez Dashboard Vercel (Polecana)

#### Krok 1: Import Projektu

1. Zaloguj się na https://vercel.com
2. Kliknij **Add New** → **Project**
3. Zaimportuj repozytorium Git:
   - GitHub: `Bangla84PL/bid-translate`
4. Kliknij **Import**

#### Krok 2: Konfiguracja Projektu

1. **Framework Preset**: Next.js (wykryje automatycznie)
2. **Root Directory**: `./` (domyślnie)
3. **Build Command**: `npm run build` (domyślnie)
4. **Output Directory**: `.next` (domyślnie)
5. **Install Command**: `npm install` (domyślnie)

#### Krok 3: Dodaj Zmienne Środowiskowe

W sekcji **Environment Variables** dodaj WSZYSTKIE zmienne z `.env`:

```
NEXT_PUBLIC_SUPABASE_URL = https://api.supabase.smartcamp.ai
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGci...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_...
STRIPE_SECRET_KEY = sk_test_...
STRIPE_WEBHOOK_SECRET = whsec_...
N8N_WEBHOOK_BASE = https://n8n.smartcamp.ai/webhook/
NEXT_PUBLIC_APP_URL = https://app.bidtranslate.com
NEXT_PUBLIC_MOBILE_URL = https://m.bidtranslate.com
```

**Tip**: Możesz wkleić cały blok `.env` - Vercel automatycznie go sparsuje!

#### Krok 4: Deploy

1. Kliknij **Deploy**
2. Poczekaj ~2-3 minuty na build
3. Po zakończeniu otrzymasz URL: `https://bid-translate-xyz.vercel.app`

### Metoda 2: Przez Vercel CLI

```bash
# Zainstaluj CLI globalnie
npm i -g vercel

# W katalogu projektu
cd bid-translate

# Zaloguj się
vercel login

# Wdróż (development)
vercel

# Wdróż (production)
vercel --prod
```

### Krok 5: Aktualizacja Webhook URL w Stripe

Po wdrożeniu musisz zaktualizować URL webhooka w Stripe:

1. Przejdź do Stripe Dashboard → **Developers** → **Webhooks**
2. Edytuj endpoint
3. Zmień URL na: `https://app.bidtranslate.com/api/webhooks/stripe`
4. Zapisz

---

## Konfiguracja Domen

### DNS Settings

W panelu swojego dostawcy domen (np. Cloudflare, GoDaddy) dodaj rekordy CNAME:

#### Dla `app.bidtranslate.com`

```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
TTL: Auto / 300
```

#### Dla `m.bidtranslate.com` (wersja mobilna)

```
Type: CNAME
Name: m
Value: cname.vercel-dns.com
TTL: Auto / 300
```

### Dodanie Domen w Vercel

1. Otwórz projekt w Vercel Dashboard
2. Przejdź do **Settings** → **Domains**
3. Dodaj domenę: `app.bidtranslate.com`
   - Vercel automatycznie wygeneruje certyfikat SSL
4. Dodaj domenę: `m.bidtranslate.com`
5. Poczekaj na propagację DNS (~10 minut do 24h)

### Weryfikacja SSL

Po dodaniu domen sprawdź:

```bash
curl -I https://app.bidtranslate.com
```

Powinieneś zobaczyć `HTTP/2 200` z certyfikatem SSL.

---

## Weryfikacja Wdrożenia

### Checklist Po Wdrożeniu

- [ ] **Strona główna** ładuje się poprawnie: `https://app.bidtranslate.com`
- [ ] **Rejestracja** działa - spróbuj utworzyć konto testowe
- [ ] **Login** działa - zaloguj się na konto testowe
- [ ] **Dashboard** wyświetla się po zalogowaniu
- [ ] **Dodanie tłumacza** działa
- [ ] **Utworzenie aukcji** działa
- [ ] **Webhook Stripe** odpowiada (sprawdź logi w Stripe Dashboard)
- [ ] **Email z n8n** - wyślij test webhooka
- [ ] **SSL** działa na obu domenach
- [ ] **PWA Manifest** dostępny: `https://m.bidtranslate.com/manifest.json`

### Test Rejestracji End-to-End

```bash
# 1. Zarejestruj agencję
curl -X POST https://app.bidtranslate.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "confirmPassword": "Test1234!",
    "companyName": "Test Agency",
    "nip": "1234567890",
    "address": "Warszawa, ul. Testowa 1"
  }'

# 2. Sprawdź, czy agencja została utworzona w Supabase
# Przejdź do Supabase Studio → Table Editor → bid_translate_agencies
```

### Test Stripe Webhooka

1. W Stripe Dashboard → **Developers** → **Webhooks**
2. Kliknij na swój endpoint
3. Kliknij **Send test webhook**
4. Wybierz `checkout.session.completed`
5. Sprawdź w Vercel **Logs** czy webhook został odebrany

### Test n8n Webhooka

```bash
# Test zaproszenia do aukcji
curl -X POST https://n8n.smartcamp.ai/webhook/auction-invitation \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "translatorName": "Test Translator",
    "agencyName": "Test Agency",
    "languagePair": "EN → PL",
    "specialization": "medical",
    "wordCount": 5000,
    "startingPrice": 1500,
    "deadline": "2025-02-01",
    "description": "Test project",
    "auctionUrl": "https://app.bidtranslate.com/auction/test123?token=test456"
  }'
```

---

## Monitoring i Logi

### Vercel Logs

#### Real-time Logs

1. Przejdź do Vercel Dashboard → Twój projekt
2. Zakładka **Deployments** → kliknij na najnowsze wdrożenie
3. Zakładka **Logs**
4. Filtruj po:
   - **Errors**: tylko błędy
   - **Function**: konkretna funkcja (np. `/api/auth/login`)

#### CLI Logs

```bash
# Podążaj za logami na żywo
vercel logs --follow

# Tylko błędy
vercel logs --output=short

# Konkretna funkcja
vercel logs /api/webhooks/stripe
```

### Supabase Logs

1. Supabase Studio → **Logs**
2. Dostępne typy:
   - **Database**: zapytania SQL
   - **API**: requesty do REST API
   - **Auth**: logowania/rejestracje
   - **Realtime**: połączenia WebSocket

### Stripe Logs

1. Stripe Dashboard → **Developers** → **Logs**
2. Filtruj po:
   - **API calls**: wszystkie requesty
   - **Webhooks**: wysłane eventy

### n8n Execution History

1. n8n Dashboard → **Executions**
2. Sprawdź historię wszystkich uruchomień workflow
3. Kliknij na execution aby zobaczyć szczegóły

---

## Rozwiązywanie Problemów

### Problem 1: Błąd 500 przy rejestracji

**Objawy**:
```json
{ "error": "Internal Server Error" }
```

**Przyczyny**:
- Błędny `SUPABASE_SERVICE_ROLE_KEY`
- Brak tabeli `bid_translate_agencies`
- RLS blokuje operację

**Rozwiązanie**:
1. Sprawdź logi Vercel: `vercel logs /api/auth/register`
2. Zweryfikuj zmienne środowiskowe w Vercel
3. Sprawdź czy migracje zostały uruchomione
4. Testuj lokalnie z prawidłowym `.env.local`

---

### Problem 2: Stripe webhook nie działa

**Objawy**:
- W Stripe Dashboard webhook pokazuje `Failed`
- Subskrypcja nie aktywuje się po płatności

**Przyczyny**:
- Błędny URL webhooka
- Nieprawidłowy `STRIPE_WEBHOOK_SECRET`
- CORS blocking

**Rozwiązanie**:
1. Sprawdź URL w Stripe: musi być `https://app.bidtranslate.com/api/webhooks/stripe`
2. Zweryfikuj `STRIPE_WEBHOOK_SECRET` w Vercel
3. Sprawdź logi Stripe: czy request dotarł do serwera
4. Test lokalnie przez Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

---

### Problem 3: Aukcja nie wysyła emaili

**Objawy**:
- Tłumacze nie otrzymują zaproszeń
- Brak emaili po zakończeniu aukcji

**Przyczyny**:
- Błędny URL n8n webhook
- Workflow n8n nie jest aktywowany
- Błąd w konfiguracji SMTP

**Rozwiązanie**:
1. Sprawdź czy `N8N_WEBHOOK_BASE` jest poprawny w `.env`
2. Otwórz n8n Dashboard → sprawdź czy workflow **auction-invitation-email** jest **Active**
3. Testuj webhook ręcznie (curl jak w sekcji weryfikacji)
4. Sprawdź **Execution History** w n8n - czy webhook został wywołany
5. Sprawdź konfigurację Gmail SMTP w n8n

---

### Problem 4: Realtime nie działa w aukcji

**Objawy**:
- Cena nie aktualizuje się w czasie rzeczywistym
- Eliminacje nie są widoczne live

**Przyczyny**:
- Realtime nie włączony dla tabel
- Błąd połączenia WebSocket
- RLS blokuje subskrypcje

**Rozwiązanie**:
1. W Supabase Studio → **Database** → **Replication**
2. Sprawdź czy tabele `bid_translate_auctions`, `bid_translate_auction_participants`, `bid_translate_auction_bids` mają włączoną replikację
3. Sprawdź w konsoli przeglądarki czy są błędy WebSocket
4. Zweryfikuj polityki RLS - czy pozwalają na SELECT

---

### Problem 5: TypeScript errors podczas buildu

**Objawy**:
```
Type error: Property 'X' does not exist on type 'Y'
```

**Przyczyny**:
- Nieaktualne typy Supabase
- Błędy w `database.ts`

**Rozwiązanie**:
1. Tymczasowo: w `next.config.js` jest `ignoreBuildErrors: true`
2. Długoterminowo: Wygeneruj świeże typy:
   ```bash
   npx supabase gen types typescript --project-id your-project-id > types/database.ts
   ```

---

### Problem 6: CORS errors w API

**Objawy**:
```
Access to fetch at '...' has been blocked by CORS policy
```

**Przyczyny**:
- Frontend próbuje wywołać API z innej domeny
- Brak nagłówków CORS

**Rozwiązanie**:
Dodaj nagłówki CORS do `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
      ],
    },
  ]
}
```

---

### Użyteczne Komendy Debug

```bash
# Sprawdź status deploymentu
vercel inspect <deployment-url>

# Pobierz zmienne środowiskowe z Vercel
vercel env pull

# Test lokalny z produkcyjnymi zmiennymi
vercel dev

# Rollback do poprzedniego deploymentu
vercel rollback

# Lista wszystkich deploymentów
vercel ls
```

---

## Kontakt i Wsparcie

### Dokumentacja Techniczna
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Stripe: https://stripe.com/docs
- Vercel: https://vercel.com/docs
- n8n: https://docs.n8n.io

### Logi Projektu
- `PROGRESS.md` - historia rozwoju
- `DECISIONS.md` - decyzje architektoniczne
- `API.md` - dokumentacja API

---

**Ostatnia aktualizacja**: 2025-01-21
**Wersja**: 1.0.0
**Status**: Gotowe do wdrożenia
