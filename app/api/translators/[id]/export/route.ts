import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAgency } from "@/lib/supabase/auth";

/**
 * GET /api/translators/[id]/export
 * Export all translator data (GDPR compliance)
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

    // Get translator with all related data
    const { data: translator, error } = await supabase
      .from("translators")
      .select(`
        *,
        auction_participants (
          auction_id,
          confirmed_at,
          eliminated_at,
          is_winner,
          auctions (
            language_pair,
            word_count,
            starting_price,
            final_price,
            created_at
          )
        )
      `)
      .eq("id", params.id)
      .eq("agency_id", agency.id)
      .single();

    if (error || !translator) {
      return NextResponse.json({ error: "Nie znaleziono tłumacza" }, { status: 404 });
    }

    // Format data for export
    const exportData = {
      personalData: {
        email: translator.email,
        firstName: translator.first_name,
        lastName: translator.last_name,
        phone: translator.phone,
        languagePairs: translator.language_pairs,
        specializations: translator.specializations,
        isSworn: translator.is_sworn,
      },
      consent: {
        gdprConsent: translator.gdpr_consent,
        gdprConsentDate: translator.gdpr_consent_date,
      },
      auctionHistory: translator.auction_participants || [],
      exportedAt: new Date().toISOString(),
      exportedBy: agency.company_name,
    };

    return NextResponse.json(exportData);
  } catch (error: any) {
    console.error("Error exporting translator data:", error);
    return NextResponse.json(
      { error: "Błąd podczas eksportu danych" },
      { status: 500 }
    );
  }
}
