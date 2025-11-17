import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAgency } from "@/lib/supabase/auth";
import { canStartAuction, MIN_PARTICIPANTS } from "@/lib/auction/state-machine";

/**
 * POST /api/auctions/[id]/start
 * Start an auction after confirmation window
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agency = await getCurrentAgency();

    if (!agency) {
      return NextResponse.json({ error: "Nie znaleziono agencji" }, { status: 404 });
    }

    const supabase = await createServerSupabaseClient();

    // Get auction
    const { data: auction, error: auctionError } = await supabase
      .from("bid_translate_auctions")
      .select("*")
      .eq("id", params.id)
      .eq("agency_id", agency.id)
      .single();

    if (auctionError || !auction) {
      return NextResponse.json({ error: "Nie znaleziono aukcji" }, { status: 404 });
    }

    if (auction.status !== "pending_start") {
      return NextResponse.json(
        { error: "Aukcja nie jest w stanie oczekiwania" },
        { status: 400 }
      );
    }

    // Count confirmed participants
    const { count: confirmedCount } = await supabase
      .from("bid_translate_auction_participants")
      .select("*", { count: "exact", head: true })
      .eq("auction_id", params.id)
      .not("confirmed_at", "is", null);

    if (!canStartAuction(confirmedCount || 0)) {
      // Mark as failed
      await supabase
        .from("bid_translate_auctions")
        .update({ status: "failed" })
        .eq("id", params.id);

      return NextResponse.json(
        { error: `Niewystarczająca liczba uczestników. Wymagane: ${MIN_PARTICIPANTS}, potwierdzono: ${confirmedCount}` },
        { status: 400 }
      );
    }

    // Start auction
    const { error: updateError } = await supabase
      .from("bid_translate_auctions")
      .update({
        status: "in_progress",
        started_at: new Date().toISOString(),
        current_round: 1,
      })
      .eq("id", params.id);

    if (updateError) {
      throw updateError;
    }

    // TODO: Trigger n8n workflow to notify participants auction is starting

    return NextResponse.json({
      success: true,
      message: "Aukcja rozpoczęta",
      participants: confirmedCount,
    });
  } catch (error: any) {
    console.error("Error starting auction:", error);
    return NextResponse.json(
      { error: "Błąd podczas rozpoczynania aukcji" },
      { status: 500 }
    );
  }
}
