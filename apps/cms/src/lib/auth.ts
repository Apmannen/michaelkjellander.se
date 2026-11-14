import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { db } from '@/lib/db';

export type User = {
  email: string;
};

export const LOGIN_PATH = '/login';

// Google sends the user back here after logging in, see
// src/app/auth/callback/route.ts.
export const CALLBACK_PATH = '/auth/callback';

// Why the login failed, shown on the login page.
export const LOGIN_ERRORS = {
  denied: 'Den här e-postadressen får inte logga in.',
  failed: 'Inloggningen misslyckades. Försök igen.',
} as const;

export type LoginError = keyof typeof LOGIN_ERRORS;

// Supabase Auth with the publishable key. The session is kept in cookies, so
// it's read on the server. Not to be confused with the service role client in
// src/lib/db, which reads the data.
export const createAuthClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          // Server Components can't set cookies. The session is refreshed in
          // src/proxy.ts instead, so it's fine to skip it there.
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {}
        },
      },
    },
  );
};

// The logged in user, or undefined if nobody is logged in or the email
// address isn't in cms_users (see db/008_cms_users.sql).
export const getCurrentUser = async (): Promise<User | undefined> => {
  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.getClaims();
  const email = data?.claims.email;
  if (error || !email) {
    return undefined;
  }
  if (!(await db.isCmsUser(email))) {
    return undefined;
  }
  return { email };
};

// For Server Actions, which can be called directly and so check the user
// themselves.
export const requireUser = async (): Promise<User> => {
  const user = await getCurrentUser();
  if (!user) {
    redirect(LOGIN_PATH);
  }
  return user;
};
