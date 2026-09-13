import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next 16 renamed middleware.ts to proxy.ts — same file, same job, new name.
// See node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets and images, so the session
     * cookie stays fresh on every real navigation without doing needless
     * work on requests that could never need auth state.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
