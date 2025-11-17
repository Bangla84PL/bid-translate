# BidTranslate - Supabase Setup Guide

This guide will walk you through setting up the Supabase database for the BidTranslate project.

## Important Notes

⚠️ **This project uses a SHARED Supabase instance on VPS**

All database tables, types, and functions are prefixed with `bid_translate_` to avoid conflicts with other projects on the same Supabase instance.

## Database Resources Created

### Tables (all prefixed with `bid_translate_`)
- `bid_translate_agencies` - Translation agencies using the platform
- `bid_translate_translators` - Freelance translators in agency databases
- `bid_translate_auctions` - Reverse auctions for translation projects
- `bid_translate_auction_participants` - Translators participating in specific auctions
- `bid_translate_auction_bids` - Bid history for each auction round

### Custom Types (all prefixed with `bid_translate_`)
- `bid_translate_subscription_status` - ('trial', 'active', 'expired', 'cancelled')
- `bid_translate_plan_type` - ('starter', 'professional', 'unlimited', 'lifetime')
- `bid_translate_auction_status` - ('draft', 'pending_start', 'in_progress', 'completed', 'failed', 'cancelled')
- `bid_translate_bid_decision` - ('accept', 'decline', 'timeout')

### Functions (all prefixed with `bid_translate_`)
- `bid_translate_update_updated_at_column()` - Automatically updates the updated_at timestamp
- `bid_translate_reset_monthly_auction_counter()` - Resets monthly auction counter
- `bid_translate_increment_auction_usage()` - Increments auction usage counter
- `bid_translate_check_subscription_limits()` - Checks subscription limits for agencies
- `bid_translate_broadcast_auction_update()` - Broadcasts real-time auction updates

## Setup Instructions

### Step 1: Environment Variables

You need to set the following environment variables in your `.env.local` file:

```bash
# Required Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://api.supabase.smartcamp.ai
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>

# Optional: Other configurations
NEXT_PUBLIC_APP_URL=https://app.bidtranslate.com
NEXT_PUBLIC_MOBILE_URL=https://m.bidtranslate.com
```

**Keys you need:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase instance URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous key (safe to expose in frontend)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (NEVER expose in frontend!)

### Step 2: Run Database Migrations

The migrations are located in the `supabase/migrations/` directory. You need to run them in order:

#### Option A: Using Supabase CLI (Recommended)

If you have the Supabase CLI installed locally:

```bash
# Initialize Supabase in your project (if not already done)
supabase init

# Link to your remote project
supabase link --project-ref <your-project-ref>

# Push migrations to your database
supabase db push
```

#### Option B: Using SQL Editor in Supabase Studio

1. Access your Supabase Studio at your VPS URL
2. Navigate to the SQL Editor
3. Run each migration file in order:
   - `20250115000001_initial_schema.sql` - Creates tables, types, and functions
   - `20250115000002_rls_policies.sql` - Sets up Row Level Security policies
   - `20250115000003_realtime_setup.sql` - Enables real-time subscriptions

#### Option C: Using psql (Direct Database Access)

If you have direct PostgreSQL access:

```bash
# Connect to your database
psql "postgresql://postgres:<password>@<your-vps-url>:5432/postgres"

# Run each migration file
\i supabase/migrations/20250115000001_initial_schema.sql
\i supabase/migrations/20250115000002_rls_policies.sql
\i supabase/migrations/20250115000003_realtime_setup.sql
```

### Step 3: Verify Installation

After running the migrations, verify that everything is set up correctly:

#### Check Tables

Run this query in the SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'bid_translate_%'
ORDER BY table_name;
```

You should see 5 tables:
- bid_translate_agencies
- bid_translate_auction_bids
- bid_translate_auction_participants
- bid_translate_auctions
- bid_translate_translators

#### Check Custom Types

```sql
SELECT typname
FROM pg_type
WHERE typname LIKE 'bid_translate_%'
ORDER BY typname;
```

You should see 4 custom types.

#### Check Functions

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'bid_translate_%'
ORDER BY routine_name;
```

You should see 5 functions.

#### Check RLS Policies

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename LIKE 'bid_translate_%'
ORDER BY tablename, policyname;
```

You should see multiple RLS policies for each table.

### Step 4: Enable Realtime (if not automatically enabled)

Ensure Realtime is enabled for the auction tables:

```sql
-- Check if tables are in the realtime publication
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename LIKE 'bid_translate_%';
```

If the tables are not listed, the migration should have added them automatically.

### Step 5: Test Authentication

The project uses Supabase Auth. Make sure:

1. Email provider is configured in your Supabase Authentication settings
2. Email templates are set up for:
   - Confirmation emails
   - Password reset emails
   - Magic link emails (for translators)

### Step 6: Configure Email Templates (Optional)

You can customize the email templates in Supabase Studio under Authentication → Email Templates.

## Maintenance

### Monthly Auction Counter Reset

The `bid_translate_reset_monthly_auction_counter()` function should be called on each agency's billing anniversary. You can set up a cron job or use pg_cron:

```sql
-- Example: Reset counters daily (checks billing anniversary)
SELECT cron.schedule('reset-monthly-counters', '0 0 * * *',
  'SELECT bid_translate_reset_monthly_auction_counter();'
);
```

## Security Notes

1. **Row Level Security (RLS)** is enabled on all tables
2. Agencies can only access their own data
3. Service role key bypasses RLS - use with caution and only in server-side code
4. Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code

## Storage (Future Enhancement)

Currently, the `file_url` field in the `bid_translate_auctions` table exists but no storage bucket is configured. When you need file uploads:

1. Create a storage bucket named `bid-translate-auction-files`
2. Set up appropriate storage policies
3. Update the bucket name in your application code

## Troubleshooting

### Tables not created
- Check that you have proper permissions
- Verify you're connected to the correct database
- Check PostgreSQL logs for errors

### RLS blocking queries
- Service role key bypasses RLS - use it for admin operations
- Check that auth.uid() returns the expected user ID
- Verify RLS policies match your use case

### Realtime not working
- Check that tables are added to supabase_realtime publication
- Verify WebSocket connection in browser DevTools
- Check that client is subscribed to the correct channel

## Support

For issues specific to BidTranslate, check the project repository.
For Supabase-related issues, consult the [Supabase documentation](https://supabase.com/docs).
