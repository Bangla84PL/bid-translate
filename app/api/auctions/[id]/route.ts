import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAgency } from "@/lib/supabase/auth";

/**
 * GET /api/auctions/[id]
 * Get auction details
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

    const { data: auction, error } = await supabase
      .from("bid_translate_auctions")
      .select("*")
      .eq("id", params.id)
      .eq("agency_id", agency.id)
      .single();

    if (error || !auction) {
      return NextResponse.json({ error: "Nie znaleziono aukcji" }, { status: 404 });
    }

    return NextResponse.json({ auction });
  } catch (error: any) {
    console.error("Error fetching auction:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania aukcji" },
      { status: 500 }
    );
  }
}
