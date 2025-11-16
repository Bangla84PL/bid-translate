# API Documentation

Complete API reference for BidTranslate platform.

---

## Authentication

All agency endpoints require authentication via Supabase JWT in cookies.
Translator endpoints use magic link tokens.

---

## Authentication Endpoints

### POST /api/auth/register
Register a new agency.

**Body:**
```json
{
  "email": "kontakt@biuro.pl",
  "password": "securepassword",
  "confirmPassword": "securepassword",
  "companyName": "Biuro Tłumaczeń ABC",
  "nip": "1234567890",
  "address": "Warszawa, Polska"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Rejestracja udana. Sprawdź swoją skrzynkę email."
}
```

### POST /api/auth/login
Authenticate an agency user.

**Body:**
```json
{
  "email": "kontakt@biuro.pl",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "kontakt@biuro.pl"
  },
  "agency": {
    "id": "uuid",
    "subscriptionStatus": "trial",
    "trialEndsAt": "2025-02-01T00:00:00Z"
  }
}
```

### POST /api/auth/logout
Sign out the current user.

**Response (200):**
```json
{
  "success": true
}
```

---

## Translator Endpoints

### GET /api/translators
List all translators for the current agency.

**Response (200):**
```json
{
  "translators": [
    {
      "id": "uuid",
      "email": "jan.kowalski@example.com",
      "first_name": "Jan",
      "last_name": "Kowalski",
      "phone": "+48123456789",
      "language_pairs": [
        { "source": "EN", "target": "PL" }
      ],
      "specializations": ["medical", "legal"],
      "is_sworn": true,
      "gdpr_consent": true,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/translators
Create a new translator.

**Body:**
```json
{
  "email": "jan.kowalski@example.com",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "phone": "+48123456789",
  "languagePairs": [
    { "source": "EN", "target": "PL" }
  ],
  "specializations": ["medical", "legal"],
  "isSworn": true,
  "gdprConsent": true
}
```

**Response (201):**
```json
{
  "translator": { /* translator object */ }
}
```

### PUT /api/translators/[id]
Update a translator.

**Body:** Same as POST /api/translators

**Response (200):**
```json
{
  "translator": { /* updated translator */ }
}
```

### DELETE /api/translators/[id]
Delete a translator.

**Response (200):**
```json
{
  "success": true
}
```

### POST /api/translators/import
Import translators from CSV.

**Body:**
```json
{
  "translators": [
    {
      "email": "jan.kowalski@example.com",
      "firstName": "Jan",
      "lastName": "Kowalski",
      "phone": "+48123456789",
      "languagePairs": "EN-PL,PL-EN",
      "specializations": "medical,legal",
      "isSworn": false
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "imported": 1,
  "translators": [ /* imported translators */ ]
}
```

### GET /api/translators/[id]/export
Export translator data (GDPR).

**Response (200):**
```json
{
  "personalData": { /* all translator data */ },
  "consent": { /* GDPR consent info */ },
  "auctionHistory": [ /* participation history */ ],
  "exportedAt": "2025-01-15T10:00:00Z"
}
```

### POST /api/translators/gdpr-delete
Permanently delete translator (GDPR right to be forgotten).

**Body:**
```json
{
  "translatorId": "uuid",
  "confirmation": "DELETE"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Dane tłumacza zostały trwale usunięte",
  "deletedAt": "2025-01-15T10:00:00Z"
}
```

---

## Auction Endpoints

### GET /api/auctions
List all auctions for the current agency.

**Response (200):**
```json
{
  "auctions": [
    {
      "id": "uuid",
      "language_pair": { "source": "EN", "target": "PL" },
      "word_count": 5000,
      "starting_price": 1500,
      "current_price": 1350,
      "status": "in_progress",
      "current_round": 3,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/auctions
Create a new auction.

**Body:**
```json
{
  "languagePair": { "source": "EN", "target": "PL" },
  "specialization": "medical",
  "isSworn": true,
  "wordCount": 5000,
  "deadline": "2025-02-01",
  "startingPrice": 1500,
  "description": "Medical translation project...",
  "fileUrl": "https://...",
  "participantIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response (201):**
```json
{
  "auction": { /* created auction */ }
}
```

### GET /api/auctions/[id]
Get auction details.

**Response (200):**
```json
{
  "auction": { /* full auction data */ }
}
```

### GET /api/auctions/[id]/participants
Get auction participants.

**Response (200):**
```json
{
  "participants": [
    {
      "id": "uuid",
      "translator_id": "uuid",
      "confirmed_at": "2025-01-15T10:05:00Z",
      "eliminated_at": null,
      "is_winner": false,
      "translators": {
        "first_name": "Jan",
        "last_name": "Kowalski",
        "email": "jan.kowalski@example.com"
      }
    }
  ]
}
```

### POST /api/auctions/[id]/start
Start an auction (after confirmation window).

**Response (200):**
```json
{
  "success": true,
  "message": "Aukcja rozpoczęta",
  "participants": 5
}
```

**Error (400):**
```json
{
  "error": "Niewystarczająca liczba uczestników. Wymagane: 3, potwierdzono: 2"
}
```

### POST /api/auctions/[id]/confirm
Translator confirms participation (magic link).

**Body:**
```json
{
  "token": "magic-link-token"
}
```

**Response (200):**
```json
{
  "success": true,
  "confirmed": true,
  "totalConfirmed": 3,
  "translator": {
    "name": "Jan Kowalski",
    "email": "jan.kowalski@example.com"
  },
  "auction": {
    "id": "uuid",
    "languagePair": { "source": "EN", "target": "PL" },
    "startingPrice": 1500
  }
}
```

### POST /api/auctions/[id]/bid
Record translator bid decision.

**Body:**
```json
{
  "token": "magic-link-token",
  "decision": "accept"  // or "decline"
}
```

**Response (200):**
```json
{
  "success": true,
  "decision": "accept",
  "remainingParticipants": 3
}
```

**Response (200 - Winner):**
```json
{
  "success": true,
  "winner": true,
  "finalPrice": 1275
}
```

**Response (200 - Next Round):**
```json
{
  "success": true,
  "nextRound": true,
  "round": 4,
  "price": 1275
}
```

---

## Subscription Endpoints

### POST /api/subscriptions/create-checkout
Create Stripe checkout session.

**Body:**
```json
{
  "planType": "professional"  // starter | professional | unlimited | lifetime
}
```

**Response (200):**
```json
{
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/..."
}
```

---

## Analytics Endpoints

### GET /api/analytics?range=30d
Get analytics data.

**Query Parameters:**
- `range`: `7d` | `30d` | `90d` | `all`

**Response (200):**
```json
{
  "totalAuctions": 25,
  "completedAuctions": 20,
  "failedAuctions": 5,
  "averageSavings": 12.5,
  "totalSavings": 3750,
  "successRate": 80,
  "averageParticipants": 4.5,
  "averageRounds": 6.2,
  "translatorParticipation": [
    {
      "email": "jan.kowalski@example.com",
      "name": "Jan Kowalski",
      "totalAuctions": 15,
      "wins": 3
    }
  ]
}
```

---

## Webhooks

### POST /api/webhooks/stripe
Stripe webhook handler.

**Headers:**
- `stripe-signature`: Webhook signature

**Events Handled:**
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `customer.subscription.deleted`
- `customer.subscription.updated`

**Response (200):**
```json
{
  "received": true
}
```

---

## Error Responses

All endpoints may return the following error responses:

**401 Unauthorized:**
```json
{
  "error": "Nieautoryzowany"
}
```

**403 Forbidden:**
```json
{
  "error": "Brak uprawnień"
}
```

**404 Not Found:**
```json
{
  "error": "Nie znaleziono zasobu"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Błąd serwera"
}
```

---

**Last Updated:** 2025-01-15
