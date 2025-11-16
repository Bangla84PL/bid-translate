import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";

/**
 * POST /api/auth/login
 * Authenticate an agency user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = loginSchema.parse(body);

    const supabase = await createServerSupabaseClient();

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      return NextResponse.json(
        { error: "Nieprawidłowy email lub hasło" },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Błąd podczas logowania" },
        { status: 401 }
      );
    }

    // Check if user has an agency
    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("id, subscription_status, trial_ends_at")
      .eq("owner_id", data.user.id)
      .single();

    if (agencyError || !agency) {
      return NextResponse.json(
        { error: "Nie znaleziono profilu agencji" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      agency: {
        id: agency.id,
        subscriptionStatus: agency.subscription_status,
        trialEndsAt: agency.trial_ends_at,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Błąd podczas logowania" },
      { status: 500 }
    );
  }
}
