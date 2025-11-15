-- BidTranslate Database Schema
-- Version: 1.0
-- Date: 2025-01-15

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled');
CREATE TYPE plan_type AS ENUM ('starter', 'professional', 'unlimited', 'lifetime');
CREATE TYPE auction_status AS ENUM ('draft', 'pending_start', 'in_progress', 'completed', 'failed', 'cancelled');
CREATE TYPE bid_decision AS ENUM ('accept', 'decline', 'timeout');

-- Agencies table
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  nip TEXT NOT NULL,
  address TEXT NOT NULL,
  logo_url TEXT,
  subscription_status subscription_status NOT NULL DEFAULT 'trial',
  plan_type plan_type NOT NULL DEFAULT 'starter',
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
CREATE TABLE translators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
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
CREATE TABLE auctions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  language_pair JSONB NOT NULL,
  specialization TEXT,
  is_sworn BOOLEAN NOT NULL DEFAULT false,
  word_count INTEGER NOT NULL CHECK (word_count > 0),
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  starting_price NUMERIC(10, 2) NOT NULL CHECK (starting_price > 0),
  description TEXT NOT NULL,
  file_url TEXT,
  num_participants INTEGER NOT NULL CHECK (num_participants >= 3 AND num_participants <= 10),
  status auction_status NOT NULL DEFAULT 'draft',
  current_round INTEGER NOT NULL DEFAULT 0,
  current_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  winner_id UUID REFERENCES translators(id),
  final_price NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Auction participants table
CREATE TABLE auction_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  translator_id UUID NOT NULL REFERENCES translators(id) ON DELETE CASCADE,
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
CREATE TABLE auction_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES auction_participants(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  offered_price NUMERIC(10, 2) NOT NULL,
  decision bid_decision NOT NULL,
  decided_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_agencies_owner_id ON agencies(owner_id);
CREATE INDEX idx_translators_agency_id ON translators(agency_id);
CREATE INDEX idx_translators_email ON translators(email);
CREATE INDEX idx_auctions_agency_id ON auctions(agency_id);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auction_participants_auction_id ON auction_participants(auction_id);
CREATE INDEX idx_auction_participants_translator_id ON auction_participants(translator_id);
CREATE INDEX idx_auction_participants_magic_link_token ON auction_participants(magic_link_token);
CREATE INDEX idx_auction_bids_auction_id ON auction_bids(auction_id);
CREATE INDEX idx_auction_bids_participant_id ON auction_bids(participant_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translators_updated_at
  BEFORE UPDATE ON translators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auctions_updated_at
  BEFORE UPDATE ON auctions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to reset monthly auction counter
CREATE OR REPLACE FUNCTION reset_monthly_auction_counter()
RETURNS void AS $$
BEGIN
  UPDATE agencies
  SET auctions_used_this_month = 0
  WHERE billing_anniversary = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to increment auction usage
CREATE OR REPLACE FUNCTION increment_auction_usage(agency_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE agencies
  SET auctions_used_this_month = auctions_used_this_month + 1
  WHERE id = agency_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limits(agency_id_param UUID)
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
  FROM agencies
  WHERE id = agency_id_param;

  -- Count translators
  SELECT COUNT(*) INTO translator_count
  FROM translators
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
COMMENT ON TABLE agencies IS 'Translation agencies using the platform';
COMMENT ON TABLE translators IS 'Freelance translators in agency databases';
COMMENT ON TABLE auctions IS 'Reverse auctions for translation projects';
COMMENT ON TABLE auction_participants IS 'Translators participating in specific auctions';
COMMENT ON TABLE auction_bids IS 'Bid history for each auction round';
