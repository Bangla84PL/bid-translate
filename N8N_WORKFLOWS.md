# n8n Workflow Specifications

This document provides complete specifications for all n8n workflows required by BidTranslate.

**n8n Instance:** https://n8n.smartcamp.ai
**Base Webhook URL:** https://n8n.smartcamp.ai/webhook/

---

## Workflow 1: Auction Invitation Email

**Trigger:** Webhook POST
**URL:** `https://n8n.smartcamp.ai/webhook/auction-invitation`

### Workflow Steps

1. **Webhook** (Trigger)
   - Method: POST
   - Path: `/auction-invitation`
   - Response: Return 200 OK immediately

2. **Set Variables** (Set Node)
   - Extract data from webhook:
     - `translator_email`
     - `translator_name`
     - `agency_name`
     - `agency_logo`
     - `magic_link`
     - `project_details` (language pair, word count, deadline, price)
     - `auction_id`

3. **Send Email** (Gmail Node)
   - To: `{{$node["Webhook"].json["translator_email"]}}`
   - From: `hello@smartcamp.ai`
   - Subject: `Nowa aukcja od {{$node["Webhook"].json["agency_name"]}}`
   - Body (HTML):

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
    .header { background: #0F0F0F; padding: 20px; text-align: center; }
    .logo { max-height: 60px; }
    .content { padding: 30px; background: #FFFFFF; }
    .button { display: inline-block; padding: 15px 30px; background: #3B82F6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .details { background: #F3F4F6; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <img src="{{$node["Webhook"].json["agency_logo"]}}" alt="Logo" class="logo">
  </div>
  <div class="content">
    <h2>Dzień dobry {{$node["Webhook"].json["translator_name"]}}!</h2>
    <p>Firma <strong>{{$node["Webhook"].json["agency_name"]}}</strong> zaprasza Cię do udziału w aukcji reverse na projekt tłumaczenia.</p>

    <div class="details">
      <h3>Szczegóły projektu:</h3>
      <ul>
        <li><strong>Para językowa:</strong> {{$node["Webhook"].json["project_details"]["language_pair"]}}</li>
        <li><strong>Liczba słów:</strong> {{$node["Webhook"].json["project_details"]["word_count"]}}</li>
        <li><strong>Termin:</strong> {{$node["Webhook"].json["project_details"]["deadline"]}}</li>
        <li><strong>Cena początkowa:</strong> {{$node["Webhook"].json["project_details"]["starting_price"]}} PLN</li>
      </ul>
    </div>

    <p>Masz <strong>10 minut</strong> na potwierdzenie uczestnictwa. Aukcja rozpocznie się po zebraniu minimum 3 potwierdzonych uczestników.</p>

    <div style="text-align: center;">
      <a href="{{$node["Webhook"].json["magic_link"]}}" class="button">Potwierdź udział</a>
    </div>

    <p><em>Link jest ważny tylko dla tego projektu. Nie udostępniaj go innym osobom.</em></p>
  </div>
  <div class="footer">
    <p>© Created with ❤️ by <a href="https://smartcamp.ai">SmartCamp.AI</a></p>
    <p>BidTranslate - Platforma aukcji reverse dla biur tłumaczeń</p>
  </div>
</body>
</html>
```

4. **Log** (Webhook Response/Function Node)
   - Log successful send to console

### API Call Example

```bash
curl -X POST https://n8n.smartcamp.ai/webhook/auction-invitation \
  -H "Content-Type: application/json" \
  -d '{
    "translator_email": "jan.kowalski@example.com",
    "translator_name": "Jan Kowalski",
    "agency_name": "Biuro Tłumaczeń ABC",
    "agency_logo": "https://api.supabase.smartcamp.ai/storage/v1/object/public/logos/abc.png",
    "magic_link": "https://m.bidtranslate.com/auction/a1b2c3d4e5f6...",
    "project_details": {
      "language_pair": "EN → PL",
      "word_count": 5000,
      "deadline": "2025-01-20",
      "starting_price": 1500
    },
    "auction_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

---

## Workflow 2: Auction Result - Winner

**Trigger:** Webhook POST
**URL:** `https://n8n.smartcamp.ai/webhook/auction-result-winner`

### Workflow Steps

1. **Webhook** (Trigger)
2. **Send Email to Winner** (Gmail Node)
   - Subject: `Gratulacje! Wygrałeś aukcję`
   - Body: Include final price, agency contact details, next steps

3. **Send Email to Agency** (Gmail Node)
   - Subject: `Aukcja zakończona - zwycięzca wyłoniony`
   - Body: Winner details, final price, magic link to approve

### API Call Example

```bash
curl -X POST https://n8n.smartcamp.ai/webhook/auction-result-winner \
  -H "Content-Type: application/json" \
  -d '{
    "winner_email": "jan.kowalski@example.com",
    "winner_name": "Jan Kowalski",
    "final_price": 1200,
    "agency_email": "kontakt@abc.pl",
    "agency_name": "Biuro ABC",
    "project_details": {...},
    "auction_id": "..."
  }'
```

---

## Workflow 3: Auction Result - Eliminated

**Trigger:** Webhook POST
**URL:** `https://n8n.smartcamp.ai/webhook/auction-result-eliminated`

### Workflow Steps

1. **Webhook** (Trigger)
2. **Send Email** (Gmail Node)
   - Subject: `Dziękujemy za udział w aukcji`
   - Body: Thank you message, encourage future participation

---

## Workflow 4: Trial Reminder

**Trigger:** Cron (daily at 9 AM)
**Schedule:** `0 9 * * *`

### Workflow Steps

1. **Cron** (Trigger)
2. **Supabase Query** (HTTP Request Node)
   - Query agencies where trial ends in 7, 3, or 1 days
   - Endpoint: `https://api.supabase.smartcamp.ai/rest/v1/agencies`
   - Filter: `trial_ends_at.gte=<today>&trial_ends_at.lte=<today+7days>`

3. **Split by Days Remaining** (Switch Node)
   - Case 1: 7 days
   - Case 2: 3 days
   - Case 3: 1 day

4. **Send Email** (Gmail Node per case)
   - Customize urgency based on days remaining

---

## Workflow 5: Stripe Webhook Handler

**Trigger:** Webhook POST
**URL:** `https://n8n.smartcamp.ai/webhook/stripe`

### Workflow Steps

1. **Webhook** (Trigger)
   - Verify Stripe signature

2. **Switch on Event Type** (Switch Node)
   - `checkout.session.completed` → Update agency subscription
   - `invoice.payment_succeeded` → Extend subscription
   - `customer.subscription.deleted` → Mark as cancelled

3. **Update Supabase** (HTTP Request Node)
   - Update `agencies` table with new subscription status

4. **Send Confirmation Email** (Gmail Node)

---

## Email Configuration

All workflows use the same Gmail SMTP configuration:

**SMTP Server:** smtp.gmail.com
**Port:** 587
**Username:** hello@smartcamp.ai
**Password:** (from VPS credentials file)
**From Name:** BidTranslate
**From Email:** hello@smartcamp.ai

---

## Monitoring & Logs

All workflows should:
- Log to n8n execution history
- Send failures to monitoring email (kontakt@smartcamp.ai)
- Retry failed sends (max 3 attempts)

---

## Setup Instructions

1. Log in to https://n8n.smartcamp.ai
2. Create each workflow using the specifications above
3. Configure Gmail credentials in n8n credentials manager
4. Test each webhook with example payloads
5. Activate all workflows

---

## Testing

Use the following curl commands to test workflows:

```bash
# Test invitation email
curl -X POST https://n8n.smartcamp.ai/webhook/auction-invitation \
  -H "Content-Type: application/json" \
  -d @test-payloads/invitation.json

# Test winner notification
curl -X POST https://n8n.smartcamp.ai/webhook/auction-result-winner \
  -H "Content-Type: application/json" \
  -d @test-payloads/winner.json
```

Test payloads are in `/test-payloads/` directory.

---

**Last Updated:** 2025-01-15
**n8n Version:** Latest (as of VPS configuration)
