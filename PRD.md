# Product Requirements Document: BidTranslate

**Version:** 1.0 | **Date:** November 16, 2025 | **Status:** Ready for Development

---

## 1. Executive Summary

**BidTranslate** is a reverse auction platform for Polish translation agencies to efficiently source freelance translators at competitive prices. The system addresses two critical pain points: difficult price negotiations and lack of transparency in translator availability.

**Key Features:**
- Web app for agencies to create/manage auctions
- PWA for translators to participate (no accounts in MVP)
- Real-time reverse auction (descending price, 5% reduction per round)
- 3-10 participants per auction, 1-minute decision rounds
- Subscription-based monetization (100-1000 PLN/month or 10k PLN lifetime)

**Tech Stack:**
- Frontend: Next.js 14 + Vercel
- Backend: SmartCamp.AI VPS (Supabase + n8n)
- Payments: Stripe
- Design: Minimalist dark mode (Notion/ClickUp inspired), JetBrains Mono font

---

## 2. Problem & Solution

### Problem
Translation agencies spend hours contacting translators, negotiating prices individually, and dealing with availability uncertainty.

### Solution
Transform sourcing into a fast, transparent auction where 3-10 pre-qualified translators compete by accepting progressively lower prices.

**Value Proposition:**
- Agencies: Reduce sourcing time from 2+ hours to <15 minutes, 10-15% cost savings
- Translators: Fair competition, instant opportunities, no lengthy negotiations

---

## 3. Target Users

**Primary: Translation Agency Administrators**
- Project managers/coordinators responsible for translator assignment
- Small to large agencies (1-100+ employees)
- Pain points: Database management, quick turnaround, budget constraints

**Secondary: Freelance Translators**
- Mixed experience (junior to 20+ year veterans)
- Both sworn and non-sworn translators
- Various specializations (medical, legal, technical)
- Variable technical proficiency

---

## 4. Core User Stories

### Agency - Onboarding
- Register agency with company details, email verification, 14-day trial
- Choose subscription plan (Starter/Professional/Unlimited)
- Upload custom logo (shown to translators during auctions)

### Agency - Translator Database
- Import translators from CSV/Excel (email, name, language pairs, specializations, sworn status)
- Manually add/edit/delete translators
- GDPR compliance: consent checkbox, export/delete data
- View collaboration history per translator

### Agency - Auction Management
- Create auction: language pair, specialization, sworn required, word count, deadline, starting price, description, participants (3-10)
- Auto-filter translators by criteria, manual selection from filtered list
- Launch auction → 10-minute notification window → minimum 3 confirmations to start
- Monitor live status: current price, participants remaining, round number
- Approve/reject winner (no reassignment to 2nd place)
- View history, analytics, restart failed auctions

### Translator - Participation (No Account)
- Receive email/SMS invitation with magic link
- View project details, confirm participation within 10 minutes
- Real-time auction view: countdown timer, current price, decision buttons (Accept/Decline)
- Automatic elimination on timeout (1 minute) or decline
- Winner notification: "Awaiting agency approval"
- Receive agency contact details after approval

### Subscription Management
- Trial expiration notifications (7d, 3d, 1d)
- Stripe payment processing
- Plan limits enforcement (auctions/month, translators in database)
- Grace period: active auctions complete after subscription expires

---

## 5. Functional Requirements (MVP)

### Authentication
- **Agency:** Email/password with JWT (Supabase Auth), email verification required
- **Translator:** Magic links only (no accounts), valid 24 hours per auction

### Auction Flow
1. **Creation:** Multi-step wizard (project details → pricing → description → translator selection → review)
2. **Invitation:** n8n sends email/SMS to selected translators, 10-minute window
3. **Confirmation:** Minimum 3 translators must confirm, else auction cancelled
4. **Execution:** Randomized participant order, round-based bidding (60s per decision), price reduces 5% each round
5. **Completion:** Last remaining participant wins, agency approves/rejects
6. **Handoff:** Contact details shared, communication/files handled externally

### Real-time Features (Supabase Realtime)
- Translator view: Live countdown timer (animated progress bar), current price updates, round status
- Agency view: Live auction status, current price, participants remaining
- Updates via WebSockets

### Subscription Plans
| Plan | Price | Auctions/Month | Translators |
|------|-------|---------------|------------|
| Starter | 100 PLN | 25 | 100 |
| Professional | 250 PLN | 100 | 1,000 |
| Unlimited | 1,000 PLN | ∞ | ∞ |
| Lifetime | 10,000 PLN | ∞ | ∞ |

**Limit Enforcement:**
- Hard block when limit reached → upgrade prompt
- Counter resets on billing anniversary

---

## 6. Data Model

### Core Tables

**agencies**
```sql
id, owner_id (FK auth.users), company_name, nip, address, logo_url,
subscription_status (trial/active/expired), plan_type, trial_ends_at,
max_auctions_per_month, max_translators, auctions_used_this_month,
stripe_customer_id, stripe_subscription_id
```

**translators**
```sql
id, agency_id (FK), email, first_name, last_name, phone,
language_pairs (JSONB), specializations (text[]), is_sworn (boolean),
gdpr_consent (boolean), gdpr_consent_date
UNIQUE(agency_id, email) -- same translator can exist in multiple agencies
```

**auctions**
```sql
id, agency_id (FK), language_pair (JSONB), specialization, is_sworn,
word_count, deadline, starting_price, description, file_url,
num_participants, status (draft/pending_start/in_progress/completed/failed),
current_round, current_price, winner_id (FK translators), final_price,
created_at, started_at, completed_at
```

**auction_participants**
```sql
id, auction_id (FK), translator_id (FK), position (randomized order),
magic_link_token (unique), confirmed_at, eliminated_at, eliminated_round,
is_winner (boolean)
```

**auction_bids**
```sql
id, auction_id (FK), participant_id (FK), round_number,
offered_price, decision (accept/decline/timeout), decided_at
```

**Row Level Security (RLS):**
- All tables filtered by agency_id to ensure data isolation
- Translators access auctions via magic link validation (service role bypass)

---

## 7. Technical Architecture

### Infrastructure

**Frontend (Vercel):**
- Next.js 14 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui components
- Deployment: Auto from GitHub (dev/staging/main branches)
- Domains: `app.bidtranslate.com` (agency), `m.bidtranslate.com` (translator PWA)

**Backend (SmartCamp.AI VPS - srv867044.hstgr.cloud):**
- **Supabase:** PostgreSQL 15, Auth (JWT), Storage (logos/files), Realtime (WebSockets)
  - URL: `https://api.supabase.smartcamp.ai`
  - Database: `postgres:40ff78fadfcd119c14d1d5818107d1aa@db:5432/postgres`
- **n8n:** Workflow automation (emails, SMS, Stripe webhooks, cron jobs)
  - URL: `https://n8n.smartcamp.ai`
- **Traefik:** Reverse proxy, automatic SSL (Let's Encrypt)

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://api.supabase.smartcamp.ai
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzUxNzk0MzAwLCJleHAiOjIwNjcxNTQzMDB9.OuEL1wHusMc323PhIe_pjbme3DSstlWn5DB0m9uorTc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTE3OTQzMDAsImV4cCI6MjA2NzE1NDMwMH0.YInoydQJtOb2cst7sAjLcHbWcx6evVf3Gy-j5x5ZgsE

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# n8n
N8N_WEBHOOK_BASE=https://n8n.smartcamp.ai/webhook/
```

### n8n Workflows (To Create)

1. **auction-invitation-email:** Send magic link to translators
2. **auction-result-winner:** Notify winner + agency
3. **auction-result-loser:** Thank participants
4. **trial-reminder:** 7/3/1 days before expiry
5. **stripe-webhook-handler:** Process payment events

### Integrations

**Stripe:**
- Checkout for subscriptions
- Webhooks: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`

**Email (n8n + Gmail SMTP):**
- Server: `smtp.gmail.com:587`
- From: `hello@smartcamp.ai` (password in VPS docs)

---

## 8. UI/UX Requirements

### Design System

**Style:** Minimalist, dark mode, inspired by Notion/ClickUp/Linear

**Colors (Dark Mode):**
```css
--bg-primary: #0F0F0F
--bg-secondary: #1A1A1A
--text-primary: #FFFFFF
--text-secondary: #A0A0A0
--accent-primary: #3B82F6 (blue)
--accent-success: #10B981 (green)
--accent-error: #EF4444 (red)
```

**Typography:**
- UI elements: JetBrains Mono (monospace)
- Body text: System fonts

**Components (shadcn/ui):**
- Buttons, inputs, tables, modals, cards, badges, tooltips, progress bars

### Key Screens

**Agency Dashboard:**
- Overview cards: Active auctions, monthly usage, avg savings, success rate
- Active auctions list (live status)
- Recent completions

**Auction Creation Wizard:**
- Step 1: Project details (language, specialization, word count, deadline)
- Step 2: Pricing (starting price, participants)
- Step 3: Description (rich text)
- Step 4: Translator selection (filtered + manual)
- Step 5: Review & launch

**Live Auction View (Agency):**
- Current price (large, prominent)
- Participants remaining
- Round timeline (who accepted/declined)

**Translator Auction View (PWA):**
- Project details
- Countdown timer (60s) with falling progress bar animation
- Accept/Decline buttons (large, touch-friendly)
- Previous round results

### Animations
- **Timer:** Progress bar empties top-to-bottom, color changes (blue→orange→red)
- **Price Updates:** Animated number counter
- **Confetti:** On auction win (translator view)

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation, screen reader support, 4.5:1 color contrast
- Minimum 44x44px touch targets

### Global Footer (Required)
```html
© Created with ❤️ by <a href="https://smartcamp.ai">SmartCamp.AI</a>
| Privacy Policy | Terms of Service | Contact
```

---

## 9. Non-Functional Requirements

### Performance
- Page load: LCP <2.5s, FCP <1.5s
- API response: <200ms (p95)
- WebSocket latency: <500ms

### Security
- TLS 1.3 (Let's Encrypt via Traefik)
- RLS policies on all tables
- JWT tokens (1-hour expiry)
- Rate limiting: 5 req/min (auth), 10 req/min (auction creation)
- GDPR compliance: consent tracking, export/delete functions

### Scalability
- Expected Year 1: 50-200 agencies, 5k-10k translators, 1k-3k auctions/month
- VPS capacity: 8GB RAM, 96GB storage (currently 51% used)
- Database: Connection pooling (pgBouncer), indexes on foreign keys

### Monitoring
- Vercel Analytics (page views, Core Web Vitals)
- Sentry (error tracking)
- UptimeRobot (API health checks, 5-min intervals)
- Supabase Dashboard (query performance, connection pool)

---

## 10. Development Phases

### Phase 1: MVP (Months 1-4)

**Month 1: Foundation**
- Set up repos, Vercel deployment, Next.js project
- Database schema + RLS policies
- Agency registration + trial logic
- Dashboard skeleton

**Month 2: Core Features**
- Translator database (import CSV, manual CRUD)
- Auction creation wizard
- Magic link generation
- n8n email workflows

**Month 3: Auction Execution**
- Auction state machine
- Supabase Realtime integration
- Translator PWA (auction view, countdown timer)
- Round-based bidding logic

**Month 4: Polish & Launch**
- Stripe integration (Checkout, webhooks)
- Subscription limits enforcement
- Analytics dashboard
- Landing page
- Beta testing with 3-5 agencies
- **🚀 MVP Launch**

### Phase 2: Translator Accounts (Months 5-7)
- Optional translator registration
- Unified dashboard (all auctions from all agencies)
- Notification preferences
- Push notifications (PWA)
- Translator ratings

### Phase 3: Collaboration (Months 8-11)
- In-app messaging
- File upload/download
- Project milestones (status tracking)
- Dispute resolution workflow

### Phase 4: AI & Automation (Months 12-15)
- ML price recommendations
- Smart translator matching
- Auto-categorization (NLP on descriptions)
- Chatbot support (Flowise)

---

## 11. Out of Scope (MVP)

❌ Translator self-registration  
❌ In-platform messaging  
❌ File management within platform  
❌ Payment processing for translation fees  
❌ Rating/review system  
❌ Push notifications  
❌ Multi-language UI (Polish only)  
❌ Mobile native apps  
❌ API access  
❌ Multi-currency (PLN only)  

---

## 12. Success Metrics

**MVP Success (Month 4):**
- ✅ 5+ paying agencies
- ✅ 50+ completed auctions
- ✅ 99% uptime
- ✅ 85%+ auction success rate

**6-Month Success:**
- 🎯 20+ agencies (5k PLN MRR)
- 🎯 200+ auctions
- 🎯 70%+ translator participation rate
- 🎯 <5% monthly churn

**12-Month Success:**
- 🎯 50+ agencies (50k PLN MRR)
- 🎯 1000+ auctions
- 🎯 500+ active translators
- 🎯 Phase 2 launched

---

## 13. Deployment Checklist

### Pre-Launch
- [ ] Run database migrations in production Supabase
- [ ] Configure Stripe products + webhooks
- [ ] Create n8n workflows (5 workflows)
- [ ] Set Vercel environment variables
- [ ] Configure DNS (app.bidtranslate.com, m.bidtranslate.com)
- [ ] Test email sending (SMTP limits)
- [ ] Enable RLS policies
- [ ] Test PWA installation (iOS/Android)
- [ ] Write Privacy Policy + Terms of Service
- [ ] Set up UptimeRobot monitoring
- [ ] E2E test: Registration → Trial → Auction → Winner approval

### Post-Launch Monitoring
- [ ] Monitor VPS disk usage (alert at 90%)
- [ ] Track auction success rate
- [ ] Monitor email deliverability
- [ ] Review Sentry errors daily
- [ ] Check subscription renewals

---

## 14. Risk Mitigation

**Technical Risks:**
- VPS downtime → Daily backups to Google Drive, documented restoration
- Supabase Realtime issues → Fallback to 1s polling
- Email spam → Authenticated SMTP, SPF/DKIM/DMARC

**Business Risks:**
- Low adoption → Beta testing validates demand, free trial
- Translator resistance → Emphasize fairness, optional participation

---

## 15. Appendix

### Key Reference Documents
- **VPS Docs:** `/mnt/project/VPS_TECHNICAL_DOCUMENTATION.md`
- **Quick Start:** `/mnt/project/DEVELOPER_QUICK_START.md`

### Stripe Products
```
Starter: 100 PLN/month (25 auctions, 100 translators)
Professional: 250 PLN/month (100 auctions, 1000 translators)
Unlimited: 1000 PLN/month (unlimited)
Lifetime: 10,000 PLN one-time (unlimited)
```

### n8n Workflow: Auction Invitation
```
Trigger: Webhook POST /webhook/auction-invitation
Payload: {translator_email, agency_name, magic_link, project_details}
Nodes: Webhook → Gmail → Log
```

### Analytics Queries
```sql
-- Success rate
SELECT COUNT(*) FILTER (WHERE status='completed')::float / COUNT(*) * 100
FROM auctions WHERE agency_id=:id AND created_at >= NOW() - INTERVAL '30 days';

-- Average savings
SELECT AVG((starting_price - final_price) / starting_price * 100)
FROM auctions WHERE status='completed' AND agency_id=:id;
```

---

**Document Status:** Ready for Development  
**Estimated MVP:** March 2026 (4 months)  
**Owner:** Bangla (bangla.unlimited@gmail.com)

© Created with ❤️ by [SmartCamp.AI](https://smartcamp.ai)
