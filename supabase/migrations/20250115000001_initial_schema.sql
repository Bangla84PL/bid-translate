-- BidTranslate Database Schema
-- Version: 1.0
-- Date: 2025-01-15
-- NOTE: All tables and types prefixed with 'bid_translate_' for shared Supabase instance

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE bid_translate_subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled');
CREATE TYPE bid_translate_plan_type AS ENUM ('starter', 'professional', 'unlimited', 'lifetime');
CREATE TYPE bid_translate_auction_status AS ENUM ('draft', 'pending_start', 'in_progress', 'completed', 'failed', 'cancelled');
CREATE TYPE bid_translate_bid_decision AS ENUM ('accept', 'decline', 'timeout');

-- Agencies table
CREATE TABLE bid_translate_agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  nip TEXT NOT NULL,
  address TEXT NOT NULL,
  logo_url TEXT,
  subscription_status bid_translate_subscription_status NOT NULL DEFAULT 'trial',
  plan_type bid_translate_plan_type NOT NULL DEFAULT 'starter',
  trial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  max_auctions_per_month INTEGER NOT NULL DEFAULT 25,
  max_translators INTEGER NOT NULL DEFAULT 100,
  auctions_used_this_month INTEGER NOT NULL DEFAULT 0,
  billing_anniversary DATE NOT NULL DEFAULT CURRENT_DATE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(owner_id)
);

-- Translators table
CREATE TABLE bid_translate_translators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES bid_translate_agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  language_pairs JSONB NOT NULL DEFAULT '[]'::jsonb,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  is_sworn BOOLEAN NOT NULL DEFAULT false,
  gdpr_consent BOOLEAN NOT NULL DEFAULT false,
  gdpr_consent_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(agency_id, email)
);

-- Auctions table
CREATE TABLE bid_translate_auctions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES bid_translate_agencies(id) ON DELETE CASCADE,
  language_pair JSONB NOT NULL,
  specialization TEXT,
  is_sworn BOOLEAN NOT NULL DEFAULT false,
  word_count INTEGER NOT NULL CHECK (word_count > 0),
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  starting_price NUMERIC(10, 2) NOT NULL CHECK (starting_price > 0),
  description TEXT NOT NULL,
  file_url TEXT,
  num_participants INTEGER NOT NULL CHECK (num_participants >= 3 AND num_participants <= 10),
  status bid_translate_auction_status NOT NULL DEFAULT 'draft',
  current_round INTEGER NOT NULL DEFAULT 0,
  current_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  winner_id UUID REFERENCES bid_translate_translators(id),
  final_price NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Auction participants table
CREATE TABLE bid_translate_auction_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id UUID NOT NULL REFERENCES bid_translate_auctions(id) ON DELETE CASCADE,
  translator_id UUID NOT NULL REFERENCES bid_translate_translators(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  magic_link_token TEXT NOT NULL UNIQUE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  eliminated_at TIMESTAMP WITH TIME ZONE,
  eliminated_round INTEGER,
  is_winner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(auction_id, translator_id)
);

-- Auction bids table
CREATE TABLE bid_translate_auction_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id UUID NOT NULL REFERENCES bid_translate_auctions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES bid_translate_auction_participants(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  offered_price NUMERIC(10, 2) NOT NULL,
  decision bid_translate_bid_decision NOT NULL,
  decided_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_bid_translate_agencies_owner_id ON bid_translate_agencies(owner_id);
CREATE INDEX idx_bid_translate_translators_agency_id ON bid_translate_translators(agency_id);
CREATE INDEX idx_bid_translate_translators_email ON bid_translate_translators(email);
CREATE INDEX idx_bid_translate_auctions_agency_id ON bid_translate_auctions(agency_id);
CREATE INDEX idx_bid_translate_auctions_status ON bid_translate_auctions(status);
CREATE INDEX idx_bid_translate_auction_participants_auction_id ON bid_translate_auction_participants(auction_id);
CREATE INDEX idx_bid_translate_auction_participants_translator_id ON bid_translate_auction_participants(translator_id);
CREATE INDEX idx_bid_translate_auction_participants_magic_link_token ON bid_translate_auction_participants(magic_link_token);
CREATE INDEX idx_bid_translate_auction_bids_auction_id ON bid_translate_auction_bids(auction_id);
CREATE INDEX idx_bid_translate_auction_bids_participant_id ON bid_translate_auction_bids(participant_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION bid_translate_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bid_translate_agencies_updated_at
  BEFORE UPDATE ON bid_translate_agencies
  FOR EACH ROW
  EXECUTE FUNCTION bid_translate_update_updated_at_column();

CREATE TRIGGER update_bid_translate_translators_updated_at
  BEFORE UPDATE ON bid_translate_translators
  FOR EACH ROW
  EXECUTE FUNCTION bid_translate_update_updated_at_column();

CREATE TRIGGER update_bid_translate_auctions_updated_at
  BEFORE UPDATE ON bid_translate_auctions
  FOR EACH ROW
  EXECUTE FUNCTION bid_translate_update_updated_at_column();

-- Function to reset monthly auction counter
CREATE OR REPLACE FUNCTION bid_translate_reset_monthly_auction_counter()
RETURNS void AS $$
BEGIN
  UPDATE bid_translate_agencies
  SET auctions_used_this_month = 0
  WHERE billing_anniversary = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to increment auction usage
CREATE OR REPLACE FUNCTION bid_translate_increment_auction_usage(agency_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE bid_translate_agencies
  SET auctions_used_this_month = auctions_used_this_month + 1
  WHERE id = agency_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION bid_translate_check_subscription_limits(agency_id_param UUID)
RETURNS TABLE(
  can_create_auction BOOLEAN,
  can_add_translator BOOLEAN,
  auctions_used INTEGER,
  auctions_limit INTEGER,
  translators_count INTEGER,
  translators_limit INTEGER
) AS $$
DECLARE
  agency_record RECORD;
  translator_count INTEGER;
BEGIN
  -- Get agency data
  SELECT * INTO agency_record
  FROM bid_translate_agencies
  WHERE id = agency_id_param;

  -- Count translators
  SELECT COUNT(*) INTO translator_count
  FROM bid_translate_translators
  WHERE agency_id = agency_id_param;

  -- Return limits
  RETURN QUERY SELECT
    (agency_record.auctions_used_this_month < agency_record.max_auctions_per_month)::BOOLEAN,
    (translator_count < agency_record.max_translators)::BOOLEAN,
    agency_record.auctions_used_this_month,
    agency_record.max_auctions_per_month,
    translator_count,
    agency_record.max_translators;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE bid_translate_agencies IS 'Translation agencies using the platform';
COMMENT ON TABLE bid_translate_translators IS 'Freelance translators in agency databases';
COMMENT ON TABLE bid_translate_auctions IS 'Reverse auctions for translation projects';
COMMENT ON TABLE bid_translate_auction_participants IS 'Translators participating in specific auctions';
COMMENT ON TABLE bid_translate_auction_bids IS 'Bid history for each auction round';
