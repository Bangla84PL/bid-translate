# BidTranslate - Plan Integracji Nowych Serwisów

## Spis Treści

1. [Przegląd Integracji](#przegląd-integracji)
2. [Upstash Redis](#upstash-redis)
3. [PostHog](#posthog)
4. [Sentry](#sentry)
5. [Stripe](#stripe-rozszerzenie)
6. [Loops](#loops)
7. [Kolejność Wdrożenia](#kolejność-wdrożenia)
8. [Estymacja Czasu](#estymacja-czasu)

---

## Przegląd Integracji

### Cel Integracji

Wzbogacenie platformy BidTranslate o enterprise-grade narzędzia do:
- **Cachowania i sesji** (Upstash Redis)
- **Analityki produktowej** (PostHog)
- **Monitoringu błędów** (Sentry)
- **Rozszerzenia płatności** (Stripe - już częściowo zintegrowany)
- **Email marketingu** (Loops)

### Priorytety

| Priorytet | Serwis | Powód |
|-----------|--------|-------|
| 🔴 **Wysoki** | Sentry | Monitoring błędów krytyczny dla stabilności produkcyjnej |
| 🟠 **Średni** | Upstash Redis | Poprawa wydajności i obsługa limitów API |
| 🟡 **Niski** | PostHog | Wartościowe, ale nie blokujące |
| 🟡 **Niski** | Loops | Można rozpocząć od n8n, później migrować |
| ✅ **Gotowe** | Stripe | Podstawowa integracja już zrobiona, wymaga rozszerzenia |

---

## Upstash Redis

### Opis i Korzyści

**Upstash Redis** to serverless Redis z pay-per-request pricing, idealny dla Next.js na Vercel.

**Zastosowania w BidTranslate**:
1. **Cache'owanie zapytań Supabase** - zmniejszenie obciążenia bazy
2. **Rate limiting** - ochrona API przed nadużyciami
3. **Sesje aukcji** - stan aukcji w czasie rzeczywistym (alternatywa dla Supabase Realtime)
4. **Kolejki zadań** - asynchroniczne przetwarzanie (np. wysyłka emaili)
5. **Leaderboard** - ranking tłumaczy

### Konfiguracja

#### 1. Utwórz Bazę Upstash

1. Zarejestruj się na https://upstash.com
2. Utwórz nową bazę Redis:
   - **Name**: `bidtranslate-prod`
   - **Region**: `eu-central-1` (Frankfurt - najbliżej Vercel `fra1`)
   - **Type**: Pay as you go
3. Skopiuj credentials:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

#### 2. Dodaj Zmienne Środowiskowe

```bash
# .env.local i Vercel
UPSTASH_REDIS_REST_URL=https://xxxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXXxxxxxxxxxxxxxxx
```

#### 3. Zainstaluj Zależności

```bash
npm install @upstash/redis @upstash/ratelimit
```

### Implementacja

#### Plik: `lib/redis/client.ts`

```typescript
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// TTL constants
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
}
```

#### Plik: `lib/redis/cache.ts`

```typescript
import { redis, CACHE_TTL } from './client'

/**
 * Cache wrapper for database queries
 */
export async function cacheQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  // Try cache first
  const cached = await redis.get<T>(key)
  if (cached) {
    console.log(`[CACHE HIT] ${key}`)
    return cached
  }

  // Cache miss - fetch data
  console.log(`[CACHE MISS] ${key}`)
  const data = await fetcher()

  // Store in cache
  await redis.setex(key, ttl, data)

  return data
}

/**
 * Invalidate cache by key or pattern
 */
export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
    console.log(`[CACHE INVALIDATED] ${keys.length} keys: ${pattern}`)
  }
}
```

#### Plik: `lib/redis/rate-limit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { redis } from './client'

/**
 * Rate limiter for API endpoints
 */
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
  analytics: true,
  prefix: 'ratelimit',
})

/**
 * Rate limiter for auction creation (per agency)
 */
export const auctionCreationLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 auctions per hour
  analytics: true,
  prefix: 'ratelimit:auction',
})

/**
 * Rate limiter for authentication attempts
 */
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
  analytics: true,
  prefix: 'ratelimit:auth',
})
```

### Przykłady Użycia

#### Cache dla Analytics

```typescript
// app/api/analytics/route.ts
import { cacheQuery, CACHE_TTL } from '@/lib/redis/cache'

export async function GET(request: Request) {
  const { agency } = await getCurrentAgency()
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || '30d'

  const cacheKey = `analytics:${agency.id}:${range}`

  const analytics = await cacheQuery(
    cacheKey,
    async () => {
      // Expensive Supabase query
      return await fetchAnalyticsFromSupabase(agency.id, range)
    },
    CACHE_TTL.MEDIUM // 5 minutes
  )

  return Response.json(analytics)
}
```

#### Rate Limiting na Login

```typescript
// app/api/auth/login/route.ts
import { authLimiter } from '@/lib/redis/rate-limit'

export async function POST(request: Request) {
  const body = await request.json()
  const { email } = body

  // Rate limit by email
  const { success, limit, remaining, reset } = await authLimiter.limit(email)

  if (!success) {
    return Response.json(
      {
        error: 'Too many login attempts. Please try again later.',
        retryAfter: new Date(reset).toISOString(),
      },
      { status: 429 }
    )
  }

  // Continue with login logic...
}
```

#### Invalidacja Cache po Utworzeniu Aukcji

```typescript
// app/api/auctions/route.ts
import { invalidateCache } from '@/lib/redis/cache'

export async function POST(request: Request) {
  const { agency } = await getCurrentAgency()

  // Create auction...
  const auction = await createAuction(data)

  // Invalidate related caches
  await invalidateCache(`analytics:${agency.id}:*`)
  await invalidateCache(`auctions:${agency.id}:*`)

  return Response.json(auction, { status: 201 })
}
```

### Koszty (Estymacja)

**Free Tier**: 10,000 commands/day
**Estymowane użycie** (100 agencji):
- Cache queries: ~5,000/day
- Rate limiting: ~2,000/day
- Sesje: ~1,000/day

**Wniosek**: Free tier wystarczy na MVP. W razie wzrostu: **$0.20 per 100k commands**.

---

## PostHog

### Opis i Korzyści

**PostHog** to open-source platforma analityczna z session replay, feature flags i A/B testing.

**Zastosowania w BidTranslate**:
1. **Product Analytics** - jak agencje używają platformy
2. **Feature Flags** - stopniowe rollout nowych funkcji
3. **A/B Testing** - optymalizacja UX (np. ceny planów)
4. **Session Replay** - debugging problemów użytkowników
5. **Funnels** - analiza conversion rate (rejestracja → płatność)

### Konfiguracja

#### 1. Utwórz Projekt PostHog

**Opcja A: PostHog Cloud** (polecane dla MVP)
1. Zarejestruj się na https://app.posthog.com
2. Utwórz nowy projekt: **BidTranslate**
3. Skopiuj **Project API Key**
4. Region: **EU Cloud** (GDPR compliance)

**Opcja B: Self-hosted** (dla zaawansowanych)
- Deploy na VPS obok Supabase i n8n
- Wymaga: Docker, 4GB RAM, PostgreSQL

#### 2. Dodaj Zmienne Środowiskowe

```bash
# .env.local i Vercel
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com # lub self-hosted URL
```

#### 3. Zainstaluj Zależności

```bash
npm install posthog-js posthog-node
```

### Implementacja

#### Plik: `lib/posthog/client.ts`

```typescript
import posthog from 'posthog-js'

export function initPostHog() {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com',
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') posthog.debug()
      },
      capture_pageview: false, // Manual tracking w Next.js
      capture_pageleave: true,
      autocapture: false, // Manual events only
    })
  }
}

export { posthog }
```

#### Plik: `lib/posthog/server.ts`

```typescript
import { PostHog } from 'posthog-node'

export const posthogServer = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
})
```

#### Plik: `app/providers.tsx`

```typescript
'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, posthog } from '@/lib/posthog/client'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    initPostHog()
  }, [])

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', {
        $current_url: url,
      })
    }
  }, [pathname, searchParams])

  return <>{children}</>
}
```

#### Aktualizacja: `app/layout.tsx`

```typescript
import { PostHogProvider } from './providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  )
}
```

### Przykłady Trackingu

#### Event: Utworzenie Aukcji

```typescript
// app/api/auctions/route.ts
import { posthogServer } from '@/lib/posthog/server'

export async function POST(request: Request) {
  const { agency } = await getCurrentAgency()
  const auction = await createAuction(data)

  // Track event
  posthogServer.capture({
    distinctId: agency.id,
    event: 'auction_created',
    properties: {
      auction_id: auction.id,
      language_pair: auction.language_pair,
      starting_price: auction.starting_price,
      num_participants: auction.num_participants,
      plan_type: agency.plan_type,
    },
  })

  return Response.json(auction, { status: 201 })
}
```

#### Event: Subskrypcja Wykupiona

```typescript
// app/api/webhooks/stripe/route.ts
posthogServer.capture({
  distinctId: agency.id,
  event: 'subscription_created',
  properties: {
    plan_type: metadata.plan_type,
    amount: session.amount_total / 100,
    currency: 'PLN',
    trial_converted: agency.subscription_status === 'trial',
  },
})
```

#### Identify User (po logowaniu)

```typescript
// app/api/auth/login/route.ts (frontend callback)
import { posthog } from '@/lib/posthog/client'

posthog.identify(agency.id, {
  email: user.email,
  company_name: agency.company_name,
  plan_type: agency.plan_type,
  subscription_status: agency.subscription_status,
  created_at: agency.created_at,
})
```

#### Feature Flag Example

```typescript
// Sprawdź czy włączyć nową funkcję
const showNewDashboard = posthog.isFeatureEnabled('new-dashboard-design')

if (showNewDashboard) {
  return <NewDashboard />
} else {
  return <OldDashboard />
}
```

### Koszty (Estymacja)

**PostHog Cloud Free Tier**:
- 1M events/month
- 15k session recordings/month
- Unlimited feature flags

**Estymowane użycie** (100 agencji):
- Events: ~50k/month (500 per agency)
- Session recordings: ~1k/month

**Wniosek**: Free tier wystarczy na MVP i wzrost do ~2000 agencji.

---

## Sentry

### Opis i Korzyści

**Sentry** to platforma do monitoringu błędów i performance monitoring.

**Zastosowania w BidTranslate**:
1. **Error Tracking** - automatyczne chwytanie błędów w produkcji
2. **Performance Monitoring** - slow queries, API latency
3. **Alerts** - powiadomienia o krytycznych błędach
4. **Release Tracking** - powiązanie błędów z deployment
5. **Source Maps** - debugging zminifikowanego kodu

### Konfiguracja

#### 1. Utwórz Projekt Sentry

1. Zarejestruj się na https://sentry.io
2. Utwórz organizację: **BidTranslate**
3. Utwórz projekt:
   - **Platform**: Next.js
   - **Name**: bidtranslate-production
4. Skopiuj **DSN** (Data Source Name)

#### 2. Dodaj Zmienne Środowiskowe

```bash
# .env.local i Vercel
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxx@oXXXXXX.ingest.sentry.io/XXXXXXX
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxxxxx # dla source maps
SENTRY_ORG=bidtranslate
SENTRY_PROJECT=bidtranslate-production
```

#### 3. Zainstaluj Sentry

```bash
npx @sentry/wizard@latest -i nextjs
```

Wizard automatycznie:
- Zainstaluje `@sentry/nextjs`
- Utworzy `sentry.client.config.ts`
- Utworzy `sentry.server.config.ts`
- Utworzy `sentry.edge.config.ts`
- Zaktualizuje `next.config.js`

### Implementacja (Automatyczna)

#### Plik: `sentry.client.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0, // 100% w dev, zmniejsz do 0.1 w prod

  // Session Replay (opcjonalnie)
  replaysSessionSampleRate: 0.1, // 10% sesji
  replaysOnErrorSampleRate: 1.0, // 100% sesji z błędami

  // Environment
  environment: process.env.NODE_ENV,

  // Ignore errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
})
```

#### Plik: `sentry.server.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,

  // Server-specific config
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies
      delete event.request.headers?.Authorization
    }
    return event
  },
})
```

### Przykłady Użycia

#### Manual Error Capture

```typescript
import * as Sentry from '@sentry/nextjs'

try {
  await createAuction(data)
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: 'auction-creation',
      agency_id: agency.id,
    },
    level: 'error',
  })
  throw error
}
```

#### Custom Context

```typescript
// Dodaj context do wszystkich błędów
Sentry.setUser({
  id: agency.id,
  email: user.email,
  company: agency.company_name,
})

Sentry.setContext('subscription', {
  plan_type: agency.plan_type,
  status: agency.subscription_status,
  trial_ends_at: agency.trial_ends_at,
})
```

#### Performance Monitoring

```typescript
import * as Sentry from '@sentry/nextjs'

export async function GET(request: Request) {
  const transaction = Sentry.startTransaction({
    op: 'http.server',
    name: 'GET /api/analytics',
  })

  const span = transaction.startChild({
    op: 'db.query',
    description: 'Fetch analytics from Supabase',
  })

  const analytics = await fetchAnalytics()

  span.finish()
  transaction.finish()

  return Response.json(analytics)
}
```

### Alerty i Integracje

#### Slack Alert

1. W Sentry → **Settings** → **Integrations** → **Slack**
2. Połącz z Twoim workspace
3. Utwórz alert rule:
   - **Conditions**: Error count > 10 in 1 hour
   - **Actions**: Send Slack notification to #alerts

#### Email Alerts

1. **Settings** → **Alerts** → **Create Alert**
2. **When**: First seen issue OR High error rate
3. **Then**: Send email to admin@bidtranslate.com

### Koszty (Estymacja)

**Sentry Free Tier**:
- 5,000 errors/month
- 10,000 performance units/month
- 50 replays/month

**Estymowane użycie** (produkcja stabilna):
- Errors: ~500/month
- Performance: ~2,000/month

**Wniosek**: Free tier wystarczy na MVP. Upgrade dopiero przy bardzo dużym ruchu.

---

## Stripe (Rozszerzenie)

### Obecny Stan

✅ **Już zaimplementowane**:
- Checkout sessions
- Webhook handler
- Subscription creation
- Plan metadata

### Do Dodania

#### 1. Customer Portal (Self-Service)

**Funkcjonalność**:
- Zmiana karty płatniczej
- Anulowanie subskrypcji
- Pobieranie faktur
- Historia płatności

**Implementacja**:

```typescript
// app/api/subscriptions/portal/route.ts
import { stripe } from '@/lib/stripe/config'
import { getCurrentAgency } from '@/lib/supabase/auth'

export async function POST(request: Request) {
  const { agency } = await getCurrentAgency()

  if (!agency.stripe_customer_id) {
    return Response.json({ error: 'No Stripe customer' }, { status: 400 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: agency.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  })

  return Response.json({ url: session.url })
}
```

**UI Update** (`app/(agency)/settings/page.tsx`):

```tsx
async function openCustomerPortal() {
  const response = await fetch('/api/subscriptions/portal', {
    method: 'POST',
  })
  const { url } = await response.json()
  window.location.href = url
}

// Button
<Button onClick={openCustomerPortal}>
  Zarządzaj Subskrypcją i Płatnościami
</Button>
```

#### 2. Usage-Based Billing (Opcjonalnie)

**Koncept**: Płatność za nadwyżkę ponad limit planu (np. 1 PLN za dodatkową aukcję).

**Implementacja**:

```typescript
// Przy przekroczeniu limitu aukcji
if (agency.auctions_used_this_month >= agency.max_auctions_per_month) {
  // Utwórz invoice item
  await stripe.invoiceItems.create({
    customer: agency.stripe_customer_id,
    amount: 100, // 1 PLN = 100 groszy
    currency: 'pln',
    description: 'Dodatkowa aukcja ponad limit planu',
  })
}
```

#### 3. Kody Rabatowe (Coupons)

**Use case**: Promocje, programy partnerskie, early adopters.

**Tworzenie w Stripe Dashboard**:
1. **Products** → **Coupons** → **Create coupon**
2. **EARLY50**: 50% off first month

**Użycie w checkout**:

```typescript
const session = await stripe.checkout.sessions.create({
  // ...
  discounts: [
    {
      coupon: 'EARLY50', // lub promotion_code
    },
  ],
})
```

#### 4. Fakturowanie (Tax & Invoicing)

**Stripe Tax** (automatyczne VAT):
1. Włącz w **Settings** → **Tax**
2. W checkout:

```typescript
const session = await stripe.checkout.sessions.create({
  // ...
  automatic_tax: { enabled: true },
  customer_details: {
    tax_exempt: 'none',
  },
})
```

**Generowanie faktur**:
- Stripe automatycznie generuje PDF
- Dostępne w Customer Portal
- Webhook `invoice.finalized` → zapisz w Supabase

### Koszty

- **Transaction fee**: 1.4% + 1.25 PLN per transaction (standard EU)
- **Customer Portal**: Darmowy
- **Stripe Tax**: +0.5% per transaction

---

## Loops

### Opis i Korzyści

**Loops** to nowoczesna platforma email marketingu dla SaaS, alternatywa dla n8n + Gmail.

**Zastosowania w BidTranslate**:
1. **Transactional Emails** - zaproszenia, powiadomienia (zamiennik n8n)
2. **Marketing Automation** - onboarding sequences, trial reminders
3. **Newsletters** - aktualizacje produktu, tips & tricks
4. **Segmentacja** - różne kampanie dla różnych planów
5. **Email Templates** - profesjonalne, responsywne szablony

### Dlaczego Loops zamiast n8n?

| Feature | n8n | Loops |
|---------|-----|-------|
| **Deliverability** | Zależy od SMTP (Gmail może blokować) | Profesjonalna infrastruktura (AWS SES) |
| **Templates** | Ręczne HTML | Drag-and-drop builder |
| **Analytics** | Brak | Open rate, click rate, conversions |
| **Automation** | Manualna konfiguracja | Built-in sequences |
| **Koszt** | Darmowy (self-hosted) | $0-50/month |

**Rekomendacja**: Zacznij od n8n (już gotowe), migruj do Loops gdy:
- Masz >500 aktywnych użytkowników
- Deliverability spada poniżej 95%
- Chcesz zaawansowaną segmentację

### Konfiguracja (Przyszłość)

#### 1. Utwórz Konto Loops

1. Zarejestruj się na https://loops.so
2. Zweryfikuj domenę `bidtranslate.com`:
   - Dodaj DKIM/SPF rekordy DNS
   - Poczekaj na weryfikację

#### 2. Dodaj Zmienne Środowiskowe

```bash
LOOPS_API_KEY=loops_xxxxxxxxxxxxxxxxxxxxxxxx
```

#### 3. Zainstaluj SDK

```bash
npm install loops
```

### Implementacja

#### Plik: `lib/loops/client.ts`

```typescript
import { LoopsClient } from 'loops'

export const loops = new LoopsClient(process.env.LOOPS_API_KEY!)
```

#### Email: Zaproszenie do Aukcji

```typescript
// app/api/auctions/route.ts
import { loops } from '@/lib/loops/client'

// Po utworzeniu aukcji i participants
for (const participant of participants) {
  await loops.sendTransactionalEmail({
    transactionalId: 'auction-invitation', // ID template w Loops
    email: participant.email,
    dataVariables: {
      translatorName: `${participant.first_name} ${participant.last_name}`,
      agencyName: agency.company_name,
      languagePair: `${auction.language_pair.source} → ${auction.language_pair.target}`,
      specialization: auction.specialization || 'N/A',
      wordCount: auction.word_count.toString(),
      startingPrice: auction.starting_price.toString(),
      deadline: formatDate(auction.deadline),
      description: auction.description,
      auctionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auction/${participant.magic_link_token}?auction_id=${auction.id}`,
    },
  })
}
```

#### Email: Onboarding Sequence

```typescript
// app/api/auth/register/route.ts (po rejestracji)
import { loops } from '@/lib/loops/client'

// Dodaj do listy onboarding
await loops.createContact({
  email: user.email,
  firstName: agency.company_name,
  userGroup: 'trial',
  subscribed: true,
})

// Automatycznie wyśle:
// Day 0: Welcome email + quick start guide
// Day 2: How to add translators (CSV import)
// Day 5: How to create your first auction
// Day 12: Trial ending soon (2 days before)
```

#### Email: Subscription Lifecycle

```typescript
// Webhook Stripe → update Loops contact
await loops.updateContact({
  email: user.email,
  userGroup: metadata.plan_type, // 'starter', 'professional', etc.
  customFields: {
    subscriptionStatus: 'active',
    planType: metadata.plan_type,
    billingAnniversary: new Date().toISOString(),
  },
})
```

### Email Templates w Loops

#### Template 1: Auction Invitation

**Subject**: `🎯 Nowa aukcja: {{languagePair}} - {{wordCount}} słów`

**Variables**:
- `translatorName`
- `agencyName`
- `languagePair`
- `specialization`
- `wordCount`
- `startingPrice`
- `deadline`
- `description`
- `auctionUrl`

#### Template 2: Auction Winner

**Subject**: `🎉 Wygrałeś aukcję {{languagePair}}!`

**Variables**:
- `translatorName`
- `finalPrice`
- `savings`
- `savingsPercent`
- `agencyName`
- `agencyEmail`
- `agencyPhone`

#### Template 3: Trial Reminder

**Subject**: `⏰ Twój trial wygasa za {{daysRemaining}} dni`

**Variables**:
- `companyName`
- `daysRemaining`
- `upgradeUrl`

### Koszty

**Loops Pricing**:
- **Free**: 0-2,000 contacts, 10,000 emails/month
- **Starter**: $50/month - 10,000 contacts, 50,000 emails/month

**Estymowane użycie** (100 agencji, 10,000 tłumaczy):
- Contacts: ~10,100
- Emails: ~5,000/month (aukcje + marketing)

**Wniosek**: Free tier wystarczy na start. Upgrade przy ~150 agencjach.

---

## Kolejność Wdrożenia

### Faza 1: Stabilizacja (Tydzień 1)
**Priorytet**: Wysoki
**Cel**: Bezpieczny launch produkcyjny

1. ✅ **Sentry** - monitoring błędów
   - Czas: 2-3 godziny
   - Krytyczne dla wykrywania problemów w produkcji
2. ✅ **Stripe Customer Portal** - self-service billing
   - Czas: 1-2 godziny
   - Zmniejsza support workload

### Faza 2: Optymalizacja (Tydzień 2-3)
**Priorytet**: Średni
**Cel**: Poprawa wydajności i obsługi użytkowników

3. ✅ **Upstash Redis** - cache i rate limiting
   - Czas: 4-6 godzin
   - Cache queries: -50% obciążenie Supabase
   - Rate limiting: ochrona przed abuseWykonalność
4. ✅ **PostHog** - product analytics
   - Czas: 3-4 godziny
   - Zrozumienie jak użytkownicy używają platformy
   - Feature flags dla A/B testing

### Faza 3: Growth (Miesiąc 2+)
**Priorytet**: Niski
**Cel**: Skalowanie i marketing automation

5. ⏳ **Loops** (opcjonalnie) - migracja z n8n
   - Czas: 6-8 godzin (setup + migracja templates)
   - Tylko jeśli deliverability n8n spada
   - Lub gdy zależy Ci na zaawansowanej analityce emaili

### Harmonogram Szczegółowy

```
Tydzień 1 (Launch Week)
├── Poniedziałek: Sentry setup + testing
├── Wtorek: Stripe Customer Portal
├── Środa: Final testing + monitoring setup
├── Czwartek-Piątek: Launch + obserwacja Sentry
└── Weekend: Fix critical issues (jeśli są)

Tydzień 2-3 (Optimization)
├── Tydzień 2
│   ├── Pon-Wto: Upstash Redis setup
│   ├── Śro-Czw: Implementacja cache dla analytics
│   └── Pią: Rate limiting na wszystkich endpoints
└── Tydzień 3
    ├── Pon-Śro: PostHog setup + events
    ├── Czw: Feature flags infrastructure
    └── Pią: Analytics dashboard w PostHog

Miesiąc 2+ (Growth - opcjonalnie)
└── Loops migration (jeśli potrzebne)
    ├── Tydzień 1: Setup + domain verification
    ├── Tydzień 2: Template migration
    └── Tydzień 3: A/B testing emails
```

---

## Estymacja Czasu

### Complexity Matrix

| Serwis | Złożoność | Czas Setup | Czas Integracji | Czas Testów | **Total** |
|--------|-----------|------------|-----------------|-------------|-----------|
| **Sentry** | 🟢 Niska | 30 min | 1h | 30 min | **2-3h** |
| **Stripe Portal** | 🟢 Niska | 15 min | 45 min | 30 min | **1-2h** |
| **Upstash Redis** | 🟡 Średnia | 30 min | 3h | 1h | **4-6h** |
| **PostHog** | 🟡 Średnia | 30 min | 2h | 1h | **3-4h** |
| **Loops** | 🟠 Wysoka | 1h | 4h | 2h | **6-8h** |

### Total Time: 16-23 godzin

**Realistyczny harmonogram**:
- **Z Loops**: ~3-4 dni robocze (full-time)
- **Bez Loops**: ~2-3 dni robocze

---

## Koszty Miesięczne (Estymacja)

### Dla MVP (100 agencji, 5,000 tłumaczy)

| Serwis | Plan | Koszt |
|--------|------|-------|
| **Upstash Redis** | Free tier | $0 |
| **PostHog** | Free tier | $0 |
| **Sentry** | Free tier | $0 |
| **Stripe** | Pay-as-you-go | ~$50 (fees)* |
| **Loops** | Free tier | $0 |
| **TOTAL** | | **$50/month** |

*Założenie: 20 nowych subskrypcji/miesiąc × 250 PLN avg × 1.65% fee

### Dla Scale (1,000 agencji, 50,000 tłumaczy)

| Serwis | Plan | Koszt |
|--------|------|-------|
| **Upstash Redis** | Pay-as-you-go | $10 |
| **PostHog** | Paid tier | $50 |
| **Sentry** | Team | $26 |
| **Stripe** | Pay-as-you-go | ~$500 (fees)* |
| **Loops** | Starter | $50 |
| **TOTAL** | | **$636/month** |

*Założenie: 200 subskrypcji/miesiąc × 250 PLN avg

---

## Checklist Integracji

### Pre-Integration
- [ ] Utworzone konta na wszystkich serwisach
- [ ] Zweryfikowane domeny (Loops)
- [ ] Pobrane API keys
- [ ] Dodane zmienne środowiskowe w Vercel
- [ ] Utworzony branch `feature/integrations`

### Sentry
- [ ] Zainstalowany `@sentry/nextjs`
- [ ] Skonfigurowany DSN
- [ ] Source maps działają
- [ ] Test error capture
- [ ] Alerty Slack skonfigurowane

### Upstash Redis
- [ ] Utworzona baza Redis
- [ ] Zainstalowany `@upstash/redis`
- [ ] Cache dla analytics
- [ ] Rate limiting na login
- [ ] Rate limiting na API endpoints

### PostHog
- [ ] Utworzony projekt
- [ ] Zainstalowany `posthog-js`
- [ ] Provider w `app/layout.tsx`
- [ ] Pageview tracking
- [ ] Custom events (auction, subscription)
- [ ] User identification

### Stripe
- [ ] Customer Portal URL działa
- [ ] Test anulowania subskrypcji
- [ ] Test zmiany karty
- [ ] Faktury generują się

### Loops (opcjonalnie)
- [ ] Domena zweryfikowana
- [ ] Templates utworzone
- [ ] Test transactional email
- [ ] Onboarding sequence aktywna

---

## Następne Kroki

1. **Przeczytaj** ten dokument dokładnie
2. **Zdecyduj** które integracje chcesz wdrożyć w pierwszej kolejności
3. **Utwórz** branch: `git checkout -b feature/integrations`
4. **Implementuj** według kolejności w harmonogramie
5. **Testuj** każdą integrację osobno przed merge
6. **Monitoruj** przez tydzień po wdrożeniu
7. **Optymalizuj** na podstawie danych

---

**Autor**: Claude (AI Assistant)
**Data utworzenia**: 2025-01-21
**Ostatnia aktualizacja**: 2025-01-21
**Wersja**: 1.0.0
