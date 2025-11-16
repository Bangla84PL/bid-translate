# Deployment Guide

Complete guide for deploying BidTranslate to production.

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                     │
│  ┌──────────────────────┐  ┌─────────────────────────┐  │
│  │ app.bidtranslate.com │  │ m.bidtranslate.com (PWA)│  │
│  └──────────────────────┘  └─────────────────────────┘  │
│              ▼                          ▼                │
└──────────────┼──────────────────────────┼───────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────────────────────────────────────┐
│        SmartCamp.AI VPS (srv867044.hstgr.cloud)          │
│  ┌────────────────┐  ┌────────────┐  ┌────────────────┐ │
│  │   Supabase     │  │    n8n     │  │    Traefik     │ │
│  │ (PostgreSQL)   │  │ (Webhooks) │  │ (Reverse Proxy)│ │
│  └────────────────┘  └────────────┘  └────────────────┘ │
└──────────────────────────────────────────────────────────┘
               ▲
               │
         ┌─────┴──────┐
         │   Stripe   │
         │  Webhooks  │
         └────────────┘
```

---

## Prerequisites

- GitHub repository with code
- Vercel account
- Domain names configured:
  - `app.bidtranslate.com`
  - `m.bidtranslate.com`
- Access to SmartCamp.AI VPS
- Stripe account (production keys)

---

## Step 1: Database Setup

### 1.1 Run Migrations in Production Supabase

1. Access Supabase Studio: https://supabase.smartcamp.ai

2. Navigate to **SQL Editor**

3. Execute migrations in order:

```bash
# Migration 1: Schema
supabase/migrations/20250115000001_initial_schema.sql

# Migration 2: RLS
supabase/migrations/20250115000002_rls_policies.sql

# Migration 3: Realtime
supabase/migrations/20250115000003_realtime_setup.sql
```

4. Verify tables created:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

Expected tables:
- agencies
- translators
- auctions
- auction_participants
- auction_bids

### 1.2 Enable Realtime

In Supabase Studio:
1. Go to **Database** → **Replication**
2. Enable replication for:
   - `auctions`
   - `auction_participants`
   - `auction_bids`

---

## Step 2: Configure n8n Workflows

Access n8n: https://n8n.smartcamp.ai

### 2.1 Create Workflows

Create these workflows (see N8N_WORKFLOWS.md for details):

1. **auction-invitation-email**
   - Webhook: `/webhook/auction-invitation`
   - Gmail integration

2. **auction-result-winner**
   - Webhook: `/webhook/auction-result-winner`

3. **auction-result-eliminated**
   - Webhook: `/webhook/auction-result-eliminated`

4. **trial-reminder**
   - Cron: `0 9 * * *` (9 AM daily)
   - Supabase query integration

5. **stripe-webhook-handler**
   - Webhook: `/webhook/stripe`
   - Stripe signature verification

### 2.2 Configure Gmail Credentials

In n8n:
1. Go to **Credentials** → **Add Credential**
2. Choose **Gmail**
3. Use credentials:
   - Email: `hello@smartcamp.ai`
   - Password: (from VPS credentials file)

### 2.3 Test Workflows

```bash
# Test invitation email
curl -X POST https://n8n.smartcamp.ai/webhook/auction-invitation \
  -H "Content-Type: application/json" \
  -d '{"translator_email":"test@example.com","translator_name":"Test","agency_name":"Test Agency","magic_link":"https://m.bidtranslate.com/auction/test","project_details":{"language_pair":"EN-PL","word_count":1000,"deadline":"2025-02-01","starting_price":500}}'
```

---

## Step 3: Stripe Configuration

### 3.1 Create Products

In Stripe Dashboard (https://dashboard.stripe.com):

1. Create products for each plan:

**Starter**
- Name: BidTranslate Starter
- Price: 100 PLN/month
- Metadata: `plan_type: starter`, `max_auctions: 25`, `max_translators: 100`

**Professional**
- Name: BidTranslate Professional
- Price: 250 PLN/month
- Metadata: `plan_type: professional`, `max_auctions: 100`, `max_translators: 1000`

**Unlimited**
- Name: BidTranslate Unlimited
- Price: 1000 PLN/month
- Metadata: `plan_type: unlimited`, `max_auctions: -1`, `max_translators: -1`

**Lifetime**
- Name: BidTranslate Lifetime
- Price: 10,000 PLN (one-time)
- Metadata: `plan_type: lifetime`, `max_auctions: -1`, `max_translators: -1`

### 3.2 Configure Webhooks

1. Go to **Developers** → **Webhooks**
2. Click **Add Endpoint**
3. URL: `https://n8n.smartcamp.ai/webhook/stripe`
4. Events to listen:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`

5. Copy **Signing Secret** → save for environment variables

---

## Step 4: Vercel Deployment

### 4.1 Connect Repository

1. Go to https://vercel.com
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 4.2 Configure Environment Variables

In Vercel Project Settings → **Environment Variables**, add:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://api.supabase.smartcamp.ai
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzUxNzk0MzAwLCJleHAiOjIwNjcxNTQzMDB9.OuEL1wHusMc323PhIe_pjbme3DSstlWn5DB0m9uorTc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTE3OTQzMDAsImV4cCI6MjA2NzE1NDMwMH0.YInoydQJtOb2cst7sAjLcHbWcx6evVf3Gy-j5x5ZgsE

# Stripe (PRODUCTION)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# n8n
N8N_WEBHOOK_BASE=https://n8n.smartcamp.ai/webhook/

# URLs
NEXT_PUBLIC_APP_URL=https://app.bidtranslate.com
NEXT_PUBLIC_MOBILE_URL=https://m.bidtranslate.com
```

**⚠️ Important:** Use production Stripe keys (`pk_live_...` and `sk_live_...`)

### 4.3 Deploy

1. Click **Deploy**
2. Wait for build to complete (~2-3 minutes)
3. Vercel will auto-assign a URL: `https://bid-translate.vercel.app`

---

## Step 5: Domain Configuration

### 5.1 Add Domains in Vercel

1. Go to **Settings** → **Domains**
2. Add domain: `app.bidtranslate.com`
3. Add domain: `m.bidtranslate.com`

### 5.2 Configure DNS

In your DNS provider (e.g., Cloudflare, OVH):

**For app.bidtranslate.com:**
- Type: `CNAME`
- Name: `app`
- Value: `cname.vercel-dns.com`
- TTL: Auto

**For m.bidtranslate.com:**
- Type: `CNAME`
- Name: `m`
- Value: `cname.vercel-dns.com`
- TTL: Auto

**SSL:** Vercel auto-provisions Let's Encrypt certificates

---

## Step 6: Post-Deployment Verification

### 6.1 Test Authentication

1. Visit https://app.bidtranslate.com/register
2. Register a test agency
3. Check email for verification link
4. Verify email works
5. Log in to dashboard

### 6.2 Test Translator Management

1. Add a translator manually
2. Import translators from CSV
3. Verify data appears in Supabase

### 6.3 Test Auction Creation

1. Create an auction
2. Verify participants receive invitation emails
3. Check auction appears in dashboard

### 6.4 Monitor Errors

- **Vercel:** Check **Deployments** → **Functions** → Logs
- **Supabase:** Check **Logs** in dashboard
- **n8n:** Check **Executions** tab

---

## Step 7: Monitoring Setup

### 7.1 UptimeRobot

1. Go to https://uptimerobot.com
2. Create monitors:
   - `https://app.bidtranslate.com` (HTTP 200 check, 5-min interval)
   - `https://api.supabase.smartcamp.ai` (HTTP 200 check, 5-min interval)
   - `https://n8n.smartcamp.ai` (HTTP 200 check, 5-min interval)

### 7.2 Sentry (Optional)

1. Create Sentry project
2. Add to `.env`:
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
   ```
3. Install Sentry:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

---

## Step 8: Backups

### 8.1 Database Backups

Supabase backups are handled by VPS scripts (see VPS_CONFIGURATION_GUIDE.md):
- **Frequency:** Every 3 days
- **Retention:** 7 backups
- **Location:** Google Drive (`gdrive:supabase-backups/`)

### 8.2 Code Backups

- Code is backed up via GitHub
- Vercel keeps deployment history

---

## Rollback Procedures

### If deployment fails:

**Option 1: Revert in Vercel**
1. Go to **Deployments**
2. Find previous working deployment
3. Click **···** → **Promote to Production**

**Option 2: Rollback Git**
```bash
git revert HEAD
git push origin main
```

### If database migration fails:

1. Restore from backup (see VPS guide)
2. Or manually rollback migration in Supabase Studio

---

## Production Checklist

Before going live:

- [ ] All migrations run successfully
- [ ] RLS policies enabled
- [ ] n8n workflows created and tested
- [ ] Stripe products configured
- [ ] Stripe webhooks configured
- [ ] Environment variables set
- [ ] Domains pointing to Vercel
- [ ] SSL certificates active
- [ ] Test registration flow
- [ ] Test auction creation
- [ ] Test emails sending
- [ ] Monitoring configured
- [ ] Backups verified
- [ ] Privacy Policy published
- [ ] Terms of Service published

---

## Scaling Considerations

### When you hit 100+ agencies:

**Database:**
- Add connection pooling (pgBouncer already available in Supabase)
- Optimize slow queries with indexes
- Consider read replicas

**Vercel:**
- Upgrade to Pro plan for better performance
- Enable Edge Functions for faster global response

**VPS:**
- Monitor disk usage (currently 51% - alert at 90%)
- Scale RAM if needed (currently 8GB)

---

## Troubleshooting

### Issue: Emails not sending

**Check:**
1. n8n workflow is active
2. Gmail credentials are correct
3. Check n8n execution logs
4. Verify SMTP limits (Gmail: 500/day)

**Solution:** Use SendGrid for higher volume

### Issue: Realtime not working

**Check:**
1. Realtime enabled on tables in Supabase
2. WebSocket connection successful (check browser console)
3. RLS policies allow realtime subscriptions

### Issue: Stripe webhook failing

**Check:**
1. Webhook signature verification
2. n8n workflow is processing correctly
3. Check Stripe webhook logs

---

## Security Hardening

**Before production:**

1. **Rotate keys:**
   - Generate new JWT secret
   - Rotate Stripe keys if exposed

2. **Rate limiting:**
   - Enable Vercel rate limiting
   - Add Cloudflare for DDoS protection

3. **Monitoring:**
   - Set up alerts for failed logins
   - Monitor unusual API usage

4. **HTTPS only:**
   - Verify all connections use HTTPS
   - Enable HSTS headers

---

## Cost Estimate

**Monthly costs (100 agencies):**

- Vercel Pro: $20/month
- Supabase: $0 (self-hosted)
- n8n: $0 (self-hosted)
- VPS: Included in SmartCamp.AI
- Stripe fees: 1.4% + 1 PLN per transaction
- Domain: ~$12/year

**Total: ~$25/month** (excluding Stripe fees)

---

## Support Contacts

- **Technical Issues:** kontakt@smartcamp.ai
- **VPS Access:** (see VPS_CONFIGURATION_GUIDE.md)
- **Emergency:** (contact SmartCamp.AI admin)

---

**Last Updated:** 2025-01-15
**Next Review:** After first production deployment
