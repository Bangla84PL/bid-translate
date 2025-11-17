import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * POST /api/auctions/[id]/confirm
 * Translator confirms participation via magic link
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token jest wymagany" }, { status: 400 });
    }

    // Use service role to bypass RLS
    const supabase = createServiceRoleClient();

    // Verify token and get participant
    const { data: participant, error: participantError } = await supabase
      .from("bid_translate_auction_participants")
      .select("*, auctions(*), translators(*)")
      .eq("magic_link_token", token)
      .eq("auction_id", params.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: "Nieprawidłowy token dostępu" },
        { status: 403 }
      );
    }

    // Check if already confirmed
    if (participant.confirmed_at) {
      return NextResponse.json(
        { error: "Udział już został potwierdzony" },
        { status: 400 }
      );
    }

    // Check if auction is still pending
    if (participant.auctions.status !== "pending_start") {
      return NextResponse.json(
        { error: "Aukcja już się rozpoczęła lub została anulowana" },
        { status: 400 }
      );
    }

    // Confirm participation
    const { error: updateError } = await supabase
      .from("bid_translate_auction_participants")
      .update({ confirmed_at: new Date().toISOString() })
      .eq("id", participant.id);

    if (updateError) {
      throw updateError;
    }

    // Count total confirmed
    const { count: confirmedCount } = await supabase
      .from("bid_translate_auction_participants")
      .select("*", { count: "exact", head: true })
      .eq("auction_id", params.id)
      .not("confirmed_at", "is", null);

    return NextResponse.json({
      success: true,
      confirmed: true,
      totalConfirmed: confirmedCount,
      translator: {
        name: `${participant.translators.first_name} ${participant.translators.last_name}`,
        email: participant.translators.email,
      },
      auction: {
        id: participant.auctions.id,
        languagePair: participant.auctions.language_pair,
        wordCount: participant.auctions.word_count,
        startingPrice: participant.auctions.starting_price,
        deadline: participant.auctions.deadline,
      },
    });
  } catch (error: any) {
    console.error("Error confirming participation:", error);
    return NextResponse.json(
      { error: "Błąd podczas potwierdzania udziału" },
      { status: 500 }
    );
  }
}
