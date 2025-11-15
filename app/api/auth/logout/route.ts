import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/logout
 * Sign out the current user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Błąd podczas wylogowania" },
      { status: 500 }
    );
  }
}
