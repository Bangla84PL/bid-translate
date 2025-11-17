import { createServerSupabaseClient } from "./server";

/**
 * Gets the current authenticated user from Supabase
 * Returns null if no user is authenticated
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Gets the agency associated with the current user
 * Returns null if no agency exists for this user
 */
export async function getCurrentAgency() {
  const supabase = await createServerSupabaseClient();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { data: agency, error } = await supabase
    .from("bid_translate_agencies")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (error || !agency) {
    return null;
  }

  return agency;
}

/**
 * Checks if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Signs out the current user
 */
export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
}
