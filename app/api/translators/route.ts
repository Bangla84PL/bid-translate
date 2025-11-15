import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAgency } from "@/lib/supabase/auth";
import { translatorSchema } from "@/lib/validations/translator";

/**
 * GET /api/translators
 * Fetch all translators for the current agency
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

    const { data: translators, error } = await supabase
      .from("translators")
      .select("*")
      .eq("agency_id", agency.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ translators });
  } catch (error: any) {
    console.error("Error fetching translators:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania tłumaczy" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/translators
 * Create a new translator
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

    // Validate input
    const validatedData = translatorSchema.parse(body);

    // Check subscription limits
    const supabase = await createServerSupabaseClient();

    const { count: translatorCount } = await supabase
      .from("translators")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", agency.id);

    if (translatorCount !== null && translatorCount >= agency.max_translators) {
      return NextResponse.json(
        { error: "Osiągnięto limit tłumaczy w planie. Zmień plan, aby dodać więcej." },
        { status: 403 }
      );
    }

    // Create translator
    const { data: translator, error } = await supabase
      .from("translators")
      .insert({
        agency_id: agency.id,
        email: validatedData.email,
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        phone: validatedData.phone || null,
        language_pairs: validatedData.languagePairs,
        specializations: validatedData.specializations,
        is_sworn: validatedData.isSworn,
        gdpr_consent: validatedData.gdprConsent,
        gdpr_consent_date: validatedData.gdprConsent ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json(
          { error: "Tłumacz z tym adresem email już istnieje w Twojej bazie" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ translator }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating translator:", error);
    return NextResponse.json(
      { error: error.message || "Błąd podczas tworzenia tłumacza" },
      { status: 500 }
    );
  }
}
