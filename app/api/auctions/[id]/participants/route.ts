import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAgency } from "@/lib/supabase/auth";

/**
 * GET /api/auctions/[id]/participants
 * Get all participants for an auction
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agency = await getCurrentAgency();

    if (!agency) {
      return NextResponse.json({ error: "Nie znaleziono agencji" }, { status: 404 });
    }

    const supabase = await createServerSupabaseClient();

    // Verify auction belongs to agency
    const { data: auction } = await supabase
      .from("auctions")
      .select("id")
      .eq("id", params.id)
      .eq("agency_id", agency.id)
      .single();

    if (!auction) {
      return NextResponse.json({ error: "Nie znaleziono aukcji" }, { status: 404 });
    }

    // Get participants with translator details
    const { data: participants, error } = await supabase
      .from("auction_participants")
      .select(`
        *,
        translators (
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq("auction_id", params.id)
      .order("position");

    if (error) {
      throw error;
    }

    return NextResponse.json({ participants });
  } catch (error: any) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania uczestników" },
      { status: 500 }
    );
  }
}
