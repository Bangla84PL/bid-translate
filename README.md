# 🎯 BidTranslate

**Reverse Auction Platform for Polish Translation Agencies**

Transform translator sourcing into a fast, transparent auction. Reduce sourcing time from 2+ hours to <15 minutes with 10-15% cost savings.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Development](#development)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)

---

## ✨ Features

### For Translation Agencies

- ⚡ **Quick Auctions**: Create reverse auctions in minutes
- 👥 **Translator Database**: Manage translators with CSV import/export
- 📊 **Analytics Dashboard**: Track success rates and savings
- 💳 **Subscription Management**: Flexible plans with Stripe integration
- 🔒 **GDPR Compliant**: Full consent and data export features

### For Translators

- 📱 **PWA Access**: No account needed - participate via magic links
- ⏱️ **Real-time Auctions**: Live countdown timers and price updates
- 🎯 **Fair Competition**: Transparent bidding process
- 📧 **Instant Notifications**: Email/SMS invitations via n8n

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase Realtime (WebSockets)

**Backend:**
- Supabase (PostgreSQL 15)
- Supabase Auth (JWT)
- Supabase Storage
- Row Level Security (RLS)

**Infrastructure (SmartCamp.AI VPS):**
- n8n (Workflow automation)
- Traefik (Reverse proxy + SSL)
- Docker Compose

**Payments:**
- Stripe (Subscriptions + Webhooks)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Access to Supabase instance (srv867044.hstgr.cloud)
- Stripe account

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd bid-translate
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values (see [Environment Variables](#environment-variables))

4. **Run database migrations**

```bash
# Execute SQL migrations in Supabase Studio
# Or use Supabase CLI:
supabase db push
```

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://api.supabase.smartcamp.ai
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# n8n Configuration
N8N_WEBHOOK_BASE=https://n8n.smartcamp.ai/webhook/

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MOBILE_URL=http://localhost:3000
```

**Note:** Production keys are in VPS_CONFIGURATION_GUIDE.md

---

## 🗄️ Database Setup

The database schema is defined in `supabase/migrations/`.

### Running Migrations

**Option 1: Supabase Studio (Recommended)**

1. Go to https://supabase.smartcamp.ai
2. Open SQL Editor
3. Execute each migration file in order:
   - `20250115000001_initial_schema.sql`
   - `20250115000002_rls_policies.sql`
   - `20250115000003_realtime_setup.sql`

**Option 2: Supabase CLI**

```bash
# Link to project
supabase link --project-ref <project-ref>

# Push migrations
supabase db push
```

### Key Tables

- **agencies**: Translation agencies (trial/subscription management)
- **translators**: Freelance translators database
- **auctions**: Reverse auctions for projects
- **auction_participants**: Translators in specific auctions
- **auction_bids**: Bid history per round

---

## 💻 Development

### Project Commands

```bash
# Development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint
```

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js config
- Prettier for formatting (recommended)
- Dark mode by default (Notion/ClickUp style)

---

## 🌐 Deployment

### Vercel Deployment (Recommended)

1. **Connect repository to Vercel**

```bash
vercel
```

2. **Configure environment variables** in Vercel dashboard

3. **Set up domains:**
   - Main app: `app.bidtranslate.com`
   - Mobile PWA: `m.bidtranslate.com`

4. **Configure deployment branches:**
   - `main` → production
   - `develop` → staging

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## 📁 Project Structure

```
bid-translate/
├── app/
│   ├── (auth)/              # Auth pages (login, register)
│   ├── (agency)/            # Agency dashboard pages
│   ├── api/                 # API routes
│   ├── auction/[token]/     # Translator auction view
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── layout/              # Layout components
│   ├── auction/             # Auction-specific components
│   └── forms/               # Form components
├── lib/
│   ├── supabase/            # Supabase clients
│   ├── stripe/              # Stripe utilities
│   ├── utils/               # Utility functions
│   ├── hooks/               # React hooks
│   └── validations/         # Zod schemas
├── types/                   # TypeScript definitions
├── supabase/
│   └── migrations/          # SQL migrations
├── public/                  # Static assets
└── docs/                    # Documentation
```

---

## 📖 API Documentation

See [API.md](./API.md) for complete API reference.

### Key Endpoints

**Authentication**
- `POST /api/auth/register` - Register agency
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

**Translators**
- `GET /api/translators` - List translators
- `POST /api/translators` - Add translator
- `POST /api/translators/import` - Import from CSV
- `PUT /api/translators/[id]` - Update translator
- `DELETE /api/translators/[id]` - Delete translator

**Auctions**
- `GET /api/auctions` - List auctions
- `POST /api/auctions` - Create auction
- `GET /api/auctions/[id]` - Get auction details
- `POST /api/auctions/[id]/start` - Start auction

**Subscriptions**
- `POST /api/subscriptions/create-checkout` - Create Stripe checkout
- `POST /api/webhooks/stripe` - Stripe webhook handler

---

## 🔧 n8n Workflows

The platform uses n8n for email/SMS notifications. Required workflows:

1. **auction-invitation-email** - Send magic links to translators
2. **auction-result-winner** - Notify auction winner
3. **auction-result-loser** - Thank eliminated participants
4. **trial-reminder** - Remind agencies about trial expiration
5. **stripe-webhook-handler** - Process payment events

See [N8N_WORKFLOWS.md](./N8N_WORKFLOWS.md) for detailed setup.

---

## 🧪 Testing

```bash
# Run tests (coming soon)
npm test

# E2E tests (coming soon)
npm run test:e2e
```

---

## 📄 License

ISC License - © 2025 SmartCamp.AI

---

## 🙏 Credits

© Created with ❤️ by [SmartCamp.AI](https://smartcamp.ai)

**Design inspired by:** Notion, ClickUp, Linear

**Tech powered by:**
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Stripe](https://stripe.com/)
- [n8n](https://n8n.io/)

---

## 📞 Support

- Email: hello@smartcamp.ai
- Documentation: See `/docs` folder
- Issues: Contact via email

---

**Made in Poland 🇵🇱 for Polish Translation Agencies**
