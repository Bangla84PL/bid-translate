import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAgency } from "@/lib/supabase/auth";
import { parseLanguagePairs, parseSpecializations } from "@/lib/utils/csv";

/**
 * POST /api/translators/import
 * Import translators from CSV data
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
    const { translators } = body;

    if (!Array.isArray(translators) || translators.length === 0) {
      return NextResponse.json(
        { error: "Brak danych do importu" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Check subscription limits
    const { count: existingCount } = await supabase
      .from("translators")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", agency.id);

    const totalAfterImport = (existingCount || 0) + translators.length;

    if (totalAfterImport > agency.max_translators) {
      return NextResponse.json(
        {
          error: `Import przekroczy limit tłumaczy w planie (${agency.max_translators}). Aktualnie masz ${existingCount}, próbujesz dodać ${translators.length}.`,
        },
        { status: 403 }
      );
    }

    // Process and insert translators
    const translatorRecords = translators.map((t: any) => ({
      agency_id: agency.id,
      email: t.email,
      first_name: t.firstName,
      last_name: t.lastName,
      phone: t.phone || null,
      language_pairs: parseLanguagePairs(t.languagePairs),
      specializations: parseSpecializations(t.specializations || ""),
      is_sworn: t.isSworn || false,
      gdpr_consent: true, // Assumed consent for CSV import
      gdpr_consent_date: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("translators")
      .insert(translatorRecords)
      .select();

    if (error) {
      console.error("Import error:", error);
      return NextResponse.json(
        { error: "Błąd podczas importu. Sprawdź czy email nie jest duplikatem." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imported: data?.length || 0,
      translators: data,
    });
  } catch (error: any) {
    console.error("Error importing translators:", error);
    return NextResponse.json(
      { error: error.message || "Błąd podczas importu tłumaczy" },
      { status: 500 }
    );
  }
}
