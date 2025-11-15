-- Row Level Security (RLS) Policies for BidTranslate
-- Ensures data isolation between agencies

-- Enable RLS on all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE translators ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;

-- =====================
-- AGENCIES POLICIES
-- =====================

-- Agencies can view their own data
CREATE POLICY "Agencies can view own data"
  ON agencies
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Agencies can update their own data
CREATE POLICY "Agencies can update own data"
  ON agencies
  FOR UPDATE
  USING (auth.uid() = owner_id);

-- Agencies can insert their own data (during registration)
CREATE POLICY "Agencies can insert own data"
  ON agencies
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- =====================
-- TRANSLATORS POLICIES
-- =====================

-- Agencies can view their own translators
CREATE POLICY "Agencies can view own translators"
  ON translators
  FOR SELECT
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = auth.uid()
    )
  );

-- Agencies can insert translators
CREATE POLICY "Agencies can insert translators"
  ON translators
  FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = auth.uid()
    )
  );

-- Agencies can update their own translators
CREATE POLICY "Agencies can update own translators"
  ON translators
  FOR UPDATE
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = auth.uid()
    )
  );

-- Agencies can delete their own translators
CREATE POLICY "Agencies can delete own translators"
  ON translators
  FOR DELETE
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = auth.uid()
    )
  );

-- =====================
-- AUCTIONS POLICIES
-- =====================

-- Agencies can view their own auctions
CREATE POLICY "Agencies can view own auctions"
  ON auctions
  FOR SELECT
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = auth.uid()
    )
  );

-- Agencies can insert auctions
CREATE POLICY "Agencies can insert auctions"
  ON auctions
  FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = auth.uid()
    )
  );

-- Agencies can update their own auctions
CREATE POLICY "Agencies can update own auctions"
  ON auctions
  FOR UPDATE
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = auth.uid()
    )
  );

-- Agencies can delete their own auctions
CREATE POLICY "Agencies can delete own auctions"
  ON auctions
  FOR DELETE
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = auth.uid()
    )
  );

-- =====================
-- AUCTION PARTICIPANTS POLICIES
-- =====================

-- Agencies can view participants of their auctions
CREATE POLICY "Agencies can view own auction participants"
  ON auction_participants
  FOR SELECT
  USING (
    auction_id IN (
      SELECT id FROM auctions WHERE agency_id IN (
        SELECT id FROM agencies WHERE owner_id = auth.uid()
      )
    )
  );

-- Agencies can insert participants
CREATE POLICY "Agencies can insert participants"
  ON auction_participants
  FOR INSERT
  WITH CHECK (
    auction_id IN (
      SELECT id FROM auctions WHERE agency_id IN (
        SELECT id FROM agencies WHERE owner_id = auth.uid()
      )
    )
  );

-- Agencies can update participants
CREATE POLICY "Agencies can update participants"
  ON auction_participants
  FOR UPDATE
  USING (
    auction_id IN (
      SELECT id FROM auctions WHERE agency_id IN (
        SELECT id FROM agencies WHERE owner_id = auth.uid()
      )
    )
  );

-- Translators can view their own participation via magic link
-- Note: This is handled via service role in the API, bypassing RLS

-- =====================
-- AUCTION BIDS POLICIES
-- =====================

-- Agencies can view bids from their auctions
CREATE POLICY "Agencies can view own auction bids"
  ON auction_bids
  FOR SELECT
  USING (
    auction_id IN (
      SELECT id FROM auctions WHERE agency_id IN (
        SELECT id FROM agencies WHERE owner_id = auth.uid()
      )
    )
  );

-- System can insert bids (via service role)
CREATE POLICY "System can insert bids"
  ON auction_bids
  FOR INSERT
  WITH CHECK (true);

-- System can update bids (via service role)
CREATE POLICY "System can update bids"
  ON auction_bids
  FOR UPDATE
  USING (true);

-- Comments
COMMENT ON POLICY "Agencies can view own data" ON agencies IS 'Ensures agencies can only see their own agency data';
COMMENT ON POLICY "Agencies can view own translators" ON translators IS 'Ensures data isolation - agencies can only access their own translator database';
COMMENT ON POLICY "Agencies can view own auctions" ON auctions IS 'Ensures agencies can only view and manage their own auctions';
