import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  canAcceptBid,
  calculateNextPrice,
  getNextAuctionStatus
} from "@/lib/auction/state-machine";

/**
 * POST /api/auctions/[id]/bid
 * Record a bid decision from translator (via magic link)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { token, decision } = body; // decision: "accept" | "decline"

    if (!token || !decision) {
      return NextResponse.json(
        { error: "Token i decyzja są wymagane" },
        { status: 400 }
      );
    }

    // Use service role to bypass RLS (translator has no auth)
    const supabase = createServiceRoleClient();

    // Verify magic link token
    const { data: participant, error: participantError } = await supabase
      .from("bid_translate_auction_participants")
      .select("*, auctions(*)")
      .eq("magic_link_token", token)
      .eq("auction_id", params.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: "Nieprawidłowy token dostępu" },
        { status: 403 }
      );
    }

    const auction = participant.auctions;

    // Check if auction is in progress
    if (!canAcceptBid(auction.status)) {
      return NextResponse.json(
        { error: "Aukcja nie jest aktywna" },
        { status: 400 }
      );
    }

    // Check if participant is already eliminated
    if (participant.eliminated_at) {
      return NextResponse.json(
        { error: "Już zostałeś wyeliminowany z aukcji" },
        { status: 400 }
      );
    }

    // Record bid
    const { error: bidError } = await supabase
      .from("bid_translate_auction_bids")
      .insert({
        auction_id: params.id,
        participant_id: participant.id,
        round_number: auction.current_round,
        offered_price: auction.current_price,
        decision,
        decided_at: new Date().toISOString(),
      });

    if (bidError) {
      throw bidError;
    }

    // If declined, eliminate participant
    if (decision === "decline") {
      await supabase
        .from("bid_translate_auction_participants")
        .update({
          eliminated_at: new Date().toISOString(),
          eliminated_round: auction.current_round,
        })
        .eq("id", participant.id);
    }

    // Count remaining participants
    const { count: remainingCount } = await supabase
      .from("bid_translate_auction_participants")
      .select("*", { count: "exact", head: true })
      .eq("auction_id", params.id)
      .is("eliminated_at", null);

    // Check if we have a winner (only 1 remaining)
    if (remainingCount === 1) {
      // Get the winner
      const { data: winner } = await supabase
        .from("bid_translate_auction_participants")
        .select("*")
        .eq("auction_id", params.id)
        .is("eliminated_at", null)
        .single();

      if (winner) {
        // Mark as winner and complete auction
        await supabase
          .from("bid_translate_auction_participants")
          .update({ is_winner: true })
          .eq("id", winner.id);

        await supabase
          .from("bid_translate_auctions")
          .update({
            status: "completed",
            winner_id: winner.translator_id,
            final_price: auction.current_price,
            completed_at: new Date().toISOString(),
          })
          .eq("id", params.id);

        // TODO: Trigger n8n workflow to notify winner and agency

        return NextResponse.json({
          success: true,
          winner: true,
          finalPrice: auction.current_price,
        });
      }
    }

    // Check if everyone declined (auction failed)
    if (remainingCount === 0) {
      await supabase
        .from("bid_translate_auctions")
        .update({ status: "failed" })
        .eq("id", params.id);

      return NextResponse.json({
        success: true,
        auctionFailed: true,
      });
    }

    // Check if all remaining participants have bid in this round
    const { count: pendingDecisions } = await supabase
      .from("bid_translate_auction_participants")
      .select("id", { count: "exact", head: true })
      .eq("auction_id", params.id)
      .is("eliminated_at", null)
      .not("id", "in",
        supabase
          .from("bid_translate_auction_bids")
          .select("participant_id")
          .eq("auction_id", params.id)
          .eq("round_number", auction.current_round)
      );

    // If all have decided, advance to next round
    if (pendingDecisions === 0) {
      const nextPrice = calculateNextPrice(auction.current_price);
      const nextRound = auction.current_round + 1;

      await supabase
        .from("bid_translate_auctions")
        .update({
          current_round: nextRound,
          current_price: nextPrice,
        })
        .eq("id", params.id);

      return NextResponse.json({
        success: true,
        nextRound: true,
        round: nextRound,
        price: nextPrice,
      });
    }

    return NextResponse.json({
      success: true,
      decision,
      remainingParticipants: remainingCount,
    });
  } catch (error: any) {
    console.error("Error recording bid:", error);
    return NextResponse.json(
      { error: "Błąd podczas zapisywania decyzji" },
      { status: 500 }
    );
  }
}
