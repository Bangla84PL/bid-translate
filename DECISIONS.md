# Technical Decisions

This document records all major technical decisions made during the development of BidTranslate.

---

## Architecture Decisions

### 1. Next.js 14 with App Router
**Decision:** Use Next.js 14 with the App Router instead of Pages Router

**Reasoning:**
- Server Components reduce client-side JavaScript
- Improved data fetching with async/await in components
- Better SEO with native RSC streaming
- Simplified routing with file-system based routing
- Future-proof - App Router is the recommended approach

**Trade-offs:**
- Learning curve for developers familiar with Pages Router
- Some third-party libraries may not be fully compatible yet

### 2. Supabase as Backend
**Decision:** Use Supabase (self-hosted on SmartCamp.AI VPS) instead of custom backend

**Reasoning:**
- All-in-one solution: Database, Auth, Storage, Realtime
- Row Level Security (RLS) provides built-in multi-tenancy
- Real-time WebSocket support for live auctions
- PostgreSQL is robust and scalable
- Already available on SmartCamp.AI infrastructure

**Trade-offs:**
- Vendor lock-in (mitigated by self-hosting)
- Learning Supabase-specific patterns

### 3. No Translator Accounts in MVP
**Decision:** Translators access auctions via magic links only (no registration required)

**Reasoning:**
- Reduces friction - translators can participate immediately
- Simpler MVP implementation
- Many translators work with multiple agencies
- Phase 2 will add optional accounts with unified dashboard

**Trade-offs:**
- No persistent translator profiles
- Can't track translator history across agencies
- Less engagement compared to account-based system

### 4. n8n for Notifications
**Decision:** Use n8n workflows instead of in-app email sending

**Reasoning:**
- Already part of SmartCamp.AI stack
- Visual workflow builder for easy modifications
- Can handle SMS, email, and webhook triggers
- Decouples notification logic from main application
- Non-technical users can modify workflows

**Trade-offs:**
- External dependency for critical notifications
- Requires n8n to be running for app to function fully

---

## Database Decisions

### 5. JSONB for Language Pairs
**Decision:** Store language pairs as JSONB array instead of separate table

**Reasoning:**
- Simpler queries - no JOINs needed
- Flexible structure for future extensions
- PostgreSQL JSONB is indexed and performant
- Language pairs are simple objects (source/target)

**Trade-offs:**
- Less normalized structure
- Can't enforce referential integrity on language codes

### 6. Separate auction_bids Table
**Decision:** Track every bid decision in a separate table instead of embedding in auction

**Reasoning:**
- Complete audit trail for transparency
- Can analyze bidding patterns
- Support dispute resolution
- Analytics on translator behavior

**Trade-offs:**
- More database rows (acceptable given auction scale)

### 7. Magic Link Tokens in Database
**Decision:** Store magic link tokens in `auction_participants` table

**Reasoning:**
- Persistent tokens allow resending links
- Can invalidate tokens after auction completes
- Track which translators confirmed participation
- Security: tokens are cryptographically random (32 bytes)

**Trade-offs:**
- Tokens must be kept secure (transmitted via HTTPS only)
- Cleanup needed after auction ends

---

## Frontend Decisions

### 8. Dark Mode Only
**Decision:** Implement dark mode only (no light mode toggle)

**Reasoning:**
- Aligns with target aesthetic (Notion/ClickUp/Linear)
- Reduces development time
- Simplifies design system
- Professional "tech" feel

**Trade-offs:**
- Some users may prefer light mode

### 9. JetBrains Mono Font
**Decision:** Use JetBrains Mono for UI elements

**Reasoning:**
- Monospace fonts convey precision/technical nature
- Matches PRD design requirements
- Good readability for numbers and prices
- Unique aesthetic

**Trade-offs:**
- Monospace can feel less approachable to non-technical users

### 10. shadcn/ui over Fully Managed Library
**Decision:** Use shadcn/ui (copy-paste components) instead of installed library

**Reasoning:**
- Full control over component code
- Easy customization for dark mode
- No bundle size bloat from unused components
- TypeScript-first with excellent DX

**Trade-offs:**
- More setup than `npm install`
- Need to manually update components

---

## Real-Time Decisions

### 11. Supabase Realtime for Auctions
**Decision:** Use Supabase Realtime (WebSockets) for live auction updates

**Reasoning:**
- Native integration with PostgreSQL
- Automatic subscription to row changes
- Low latency for 60-second decision rounds
- Fallback to polling if WebSocket fails

**Trade-offs:**
- Requires Realtime enabled on tables
- WebSocket connections can be blocked by corporate firewalls

### 12. 60-Second Round Timer
**Decision:** Fixed 60-second decision window per round

**Reasoning:**
- Creates urgency (per PRD requirements)
- Predictable auction duration
- Enough time to decide but not too long
- Industry standard for reverse auctions

**Trade-offs:**
- May be too short for complex projects (future: configurable)

---

## Security Decisions

### 13. Row Level Security (RLS)
**Decision:** Enforce all data access via Supabase RLS policies

**Reasoning:**
- Database-level security (can't bypass)
- Multi-tenancy built-in (agencies can only see their data)
- Defense in depth
- Reduces need for API-level authorization logic

**Trade-offs:**
- More complex queries (RLS adds filters)
- Debugging can be harder

### 14. Service Role for Magic Links
**Decision:** Use service role client to bypass RLS for translator access

**Reasoning:**
- Translators don't have Supabase auth accounts
- Magic link validation happens server-side
- Prevents exposing service key to client

**Trade-offs:**
- More complex authentication flow

---

## Subscription Decisions

### 15. Hard Limits on Subscription
**Decision:** Block auction/translator creation when limits reached (not soft warnings)

**Reasoning:**
- Clear monetization model
- Prevents abuse
- Encourages upgrades

**Trade-offs:**
- Can frustrate users mid-workflow

### 16. Grace Period for Active Auctions
**Decision:** Allow active auctions to complete even after subscription expires

**Reasoning:**
- Better UX - don't cancel mid-auction
- Builds trust
- Small additional cost

**Trade-offs:**
- Slightly more complex expiration logic

---

## Payment Decisions

### 17. Stripe Only (No PayPal/etc)
**Decision:** Use Stripe exclusively for payments

**Reasoning:**
- Best API/developer experience
- Strong fraud protection
- Widely trusted in Poland
- Excellent webhook system

**Trade-offs:**
- Some users may prefer PayPal/Przelewy24

### 18. Subscription-First Model
**Decision:** No per-auction pricing - only monthly/lifetime subscriptions

**Reasoning:**
- Predictable revenue
- Simpler pricing model
- Encourages regular usage

**Trade-offs:**
- Higher barrier to entry than pay-per-use

---

## Deployment Decisions

### 19. Vercel for Frontend
**Decision:** Deploy Next.js app on Vercel

**Reasoning:**
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Built by Next.js creators
- Free SSL and DDoS protection

**Trade-offs:**
- Vendor lock-in (mitigated by standard Next.js)

### 20. Self-Hosted Supabase
**Decision:** Use self-hosted Supabase on SmartCamp.AI VPS instead of cloud

**Reasoning:**
- Full control over data
- No per-user costs
- Already have VPS infrastructure
- GDPR compliance easier

**Trade-offs:**
- Need to manage backups/updates manually

---

## Future Considerations

### Deferred to Phase 2

1. **Translator Accounts** - Optional registration for unified dashboard
2. **In-App Messaging** - Currently handled externally after auction
3. **File Management** - Currently using external file sharing
4. **Payment Processing** - Currently agency handles payment to translator
5. **Multi-Language UI** - MVP is Polish only
6. **Mobile Native Apps** - PWA is sufficient for MVP

---

## Decision Process

All major decisions were made considering:
1. **PRD Requirements** - Must align with product spec
2. **Time to MVP** - Fastest path to working product
3. **SmartCamp.AI Stack** - Leverage existing infrastructure
4. **Scalability** - Handle 50-200 agencies in Year 1
5. **Developer Experience** - Modern, maintainable codebase

---

**Last Updated:** 2025-01-15
**Review Cycle:** Quarterly or when major changes occur
