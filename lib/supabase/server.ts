import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Called from a Server Component (read-only) or a Server Action/Route Handler (read-write).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component render, where cookies are read-only. The
          // proxy below refreshes the session on every request, so this is safe to ignore.
        }
      },
    },
  });
}
