import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentAgency } from "@/lib/supabase/auth";
import { auctionSchema } from "@/lib/validations/auction";
import crypto from "crypto";

/**
 * GET /api/auctions
 * Fetch all auctions for the current agency
 */
export async function GET(request: NextRequest) {
  try {
    const agency = await getCurrentAgency();

    if (!agency) {
      return NextResponse.json(
        { error: "Nie znaleziono agencji" },
        { status: 404 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: auctions, error } = await supabase
      .from("auctions")
      .select("*")
      .eq("agency_id", agency.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ auctions });
  } catch (error: any) {
    console.error("Error fetching auctions:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania aukcji" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auctions
 * Create a new auction
 */
export async function POST(request: NextRequest) {
  try {
    const agency = await getCurrentAgency();

    if (!agency) {
      return NextResponse.json(
        { error: "Nie znaleziono agencji" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = auctionSchema.parse(body);

    const supabase = await createServerSupabaseClient();

    // Check subscription limits
    if (agency.auctions_used_this_month >= agency.max_auctions_per_month) {
      return NextResponse.json(
        { error: "Osiągnięto limit aukcji w tym miesiącu. Zmień plan, aby utworzyć więcej aukcji." },
        { status: 403 }
      );
    }

    // Create auction
    const { data: auction, error: auctionError } = await supabase
      .from("auctions")
      .insert({
        agency_id: agency.id,
        language_pair: validatedData.languagePair,
        specialization: validatedData.specialization || null,
        is_sworn: validatedData.isSworn,
        word_count: validatedData.wordCount,
        deadline: validatedData.deadline,
        starting_price: validatedData.startingPrice,
        current_price: validatedData.startingPrice,
        description: validatedData.description,
        file_url: validatedData.fileUrl || null,
        num_participants: validatedData.participantIds.length,
        status: "draft",
      })
      .select()
      .single();

    if (auctionError) {
      throw auctionError;
    }

    // Create participants with magic links
    const serviceSupabase = createServiceRoleClient();

    const participants = validatedData.participantIds.map((translatorId, index) => ({
      auction_id: auction.id,
      translator_id: translatorId,
      position: index + 1,
      magic_link_token: crypto.randomBytes(32).toString("hex"),
    }));

    const { error: participantsError } = await serviceSupabase
      .from("auction_participants")
      .insert(participants);

    if (participantsError) {
      throw participantsError;
    }

    // Increment auction usage
    await supabase
      .from("agencies")
      .update({
        auctions_used_this_month: agency.auctions_used_this_month + 1,
      })
      .eq("id", agency.id);

    // TODO: Trigger n8n workflow to send invitation emails

    return NextResponse.json({ auction }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating auction:", error);
    return NextResponse.json(
      { error: error.message || "Błąd podczas tworzenia aukcji" },
      { status: 500 }
    );
  }
}
