-- Enable Realtime for auction tables
-- This allows WebSocket subscriptions for live auction updates

-- Enable Realtime on auctions table
ALTER PUBLICATION supabase_realtime ADD TABLE auctions;

-- Enable Realtime on auction_participants table
ALTER PUBLICATION supabase_realtime ADD TABLE auction_participants;

-- Enable Realtime on auction_bids table
ALTER PUBLICATION supabase_realtime ADD TABLE auction_bids;

-- Function to broadcast auction updates
CREATE OR REPLACE FUNCTION broadcast_auction_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify about auction state changes
  PERFORM pg_notify(
    'auction_update',
    json_build_object(
      'auction_id', NEW.id,
      'status', NEW.status,
      'current_round', NEW.current_round,
      'current_price', NEW.current_price,
      'updated_at', NEW.updated_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auction updates
CREATE TRIGGER auction_update_trigger
  AFTER UPDATE ON auctions
  FOR EACH ROW
  WHEN (
    OLD.status IS DISTINCT FROM NEW.status OR
    OLD.current_round IS DISTINCT FROM NEW.current_round OR
    OLD.current_price IS DISTINCT FROM NEW.current_price
  )
  EXECUTE FUNCTION broadcast_auction_update();

COMMENT ON FUNCTION broadcast_auction_update() IS 'Broadcasts auction updates via pg_notify for real-time updates';
