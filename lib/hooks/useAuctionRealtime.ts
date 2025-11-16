"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AuctionUpdate {
  id: string;
  status: string;
  current_round: number;
  current_price: number;
  winner_id: string | null;
  final_price: number | null;
}

/**
 * Hook to subscribe to real-time auction updates
 */
export function useAuctionRealtime(auctionId: string) {
  const [auction, setAuction] = useState<AuctionUpdate | null>(null);
  const [participantsRemaining, setParticipantsRemaining] = useState<number>(0);

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to auction updates
    const auctionChannel = supabase
      .channel(`auction-${auctionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "auctions",
          filter: `id=eq.${auctionId}`,
        },
        (payload) => {
          setAuction(payload.new as AuctionUpdate);
        }
      )
      .subscribe();

    // Subscribe to participant changes
    const participantsChannel = supabase
      .channel(`participants-${auctionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "auction_participants",
          filter: `auction_id=eq.${auctionId}`,
        },
        async () => {
          // Recount remaining participants
          const { count } = await supabase
            .from("auction_participants")
            .select("*", { count: "exact", head: true })
            .eq("auction_id", auctionId)
            .is("eliminated_at", null);

          setParticipantsRemaining(count || 0);
        }
      )
      .subscribe();

    // Initial load
    const loadInitialData = async () => {
      const { data: auctionData } = await supabase
        .from("auctions")
        .select("*")
        .eq("id", auctionId)
        .single();

      if (auctionData) {
        setAuction(auctionData as AuctionUpdate);
      }

      const { count } = await supabase
        .from("auction_participants")
        .select("*", { count: "exact", head: true })
        .eq("auction_id", auctionId)
        .is("eliminated_at", null);

      setParticipantsRemaining(count || 0);
    };

    loadInitialData();

    return () => {
      supabase.removeChannel(auctionChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [auctionId]);

  return { auction, participantsRemaining };
}
