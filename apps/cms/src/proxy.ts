import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import { CALLBACK_PATH, LOGIN_PATH } from '@/lib/auth';
import { db } from '@/lib/db';

// Reachable without logging in.
const PUBLIC_PATHS = [LOGIN_PATH, CALLBACK_PATH];

// Keeps the whole cms behind the login, Server Actions included, and
// refreshes the session cookies before they expire. The actions check the
// user themselves too, see requireUser in src/lib/auth.ts.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        // The refreshed cookies go both to the rendering, which reads them
        // from the request, and to the browser.
        setAll: (cookiesToSet, headers) => {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    },
  );

  // Verifies the session and refreshes it if needed, so it must run on every
  // request, also the public ones.
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email;

  if (PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
    return response;
  }

  if (!email || !(await db.isCmsUser(email))) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything but Next's own files and the favicon.
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
