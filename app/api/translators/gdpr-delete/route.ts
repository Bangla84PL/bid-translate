import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAgency } from "@/lib/supabase/auth";

/**
 * POST /api/translators/gdpr-delete
 * Permanently delete translator data (GDPR right to be forgotten)
 */
export async function POST(request: NextRequest) {
  try {
    const agency = await getCurrentAgency();

    if (!agency) {
      return NextResponse.json({ error: "Nie znaleziono agencji" }, { status: 404 });
    }

    const body = await request.json();
    const { translatorId, confirmation } = body;

    if (confirmation !== "DELETE") {
      return NextResponse.json(
        { error: "Potwierdzenie wymagane" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Delete translator (CASCADE will handle related records)
    const { error } = await supabase
      .from("bid_translate_translators")
      .delete()
      .eq("id", translatorId)
      .eq("agency_id", agency.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Dane tłumacza zostały trwale usunięte",
      deletedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error deleting translator:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania danych" },
      { status: 500 }
    );
  }
}
