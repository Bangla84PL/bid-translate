import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAgency } from "@/lib/supabase/auth";
import { translatorSchema } from "@/lib/validations/translator";

/**
 * PUT /api/translators/[id]
 * Update a translator
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agency = await getCurrentAgency();

    if (!agency) {
      return NextResponse.json(
        { error: "Nie znaleziono agencji" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = translatorSchema.parse(body);

    const supabase = await createServerSupabaseClient();

    const { data: translator, error } = await supabase
      .from("translators")
      .update({
        email: validatedData.email,
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        phone: validatedData.phone || null,
        language_pairs: validatedData.languagePairs,
        specializations: validatedData.specializations,
        is_sworn: validatedData.isSworn,
        gdpr_consent: validatedData.gdprConsent,
      })
      .eq("id", params.id)
      .eq("agency_id", agency.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!translator) {
      return NextResponse.json(
        { error: "Nie znaleziono tłumacza" },
        { status: 404 }
      );
    }

    return NextResponse.json({ translator });
  } catch (error: any) {
    console.error("Error updating translator:", error);
    return NextResponse.json(
      { error: error.message || "Błąd podczas aktualizacji tłumacza" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/translators/[id]
 * Delete a translator
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agency = await getCurrentAgency();

    if (!agency) {
      return NextResponse.json(
        { error: "Nie znaleziono agencji" },
        { status: 404 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from("translators")
      .delete()
      .eq("id", params.id)
      .eq("agency_id", agency.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting translator:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania tłumacza" },
      { status: 500 }
    );
  }
}
