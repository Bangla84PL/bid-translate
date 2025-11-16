import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations/auth";

/**
 * POST /api/auth/register
 * Register a new agency with email verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    const supabase = await createServerSupabaseClient();

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: {
          company_name: validatedData.companyName,
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Nie udało się utworzyć użytkownika" },
        { status: 400 }
      );
    }

    // Create agency record
    const { error: agencyError } = await supabase.from("agencies").insert({
      owner_id: authData.user.id,
      company_name: validatedData.companyName,
      nip: validatedData.nip,
      address: validatedData.address,
      subscription_status: "trial",
      plan_type: "starter",
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      max_auctions_per_month: 25,
      max_translators: 100,
    });

    if (agencyError) {
      // If agency creation fails, we should delete the user
      // For now, just return error - the user will need to contact support
      return NextResponse.json(
        { error: "Błąd podczas tworzenia profilu agencji" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Rejestracja udana. Sprawdź swoją skrzynkę email.",
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Błąd podczas rejestracji" },
      { status: 500 }
    );
  }
}
