import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database";

/**
 * Creates a Supabase client for use in browser components
 * Uses environment variables from .env.local
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
