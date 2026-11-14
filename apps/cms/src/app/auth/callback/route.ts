import { type NextRequest, NextResponse } from 'next/server';

import { LOGIN_PATH, type LoginError, createAuthClient } from '@/lib/auth';
import { db } from '@/lib/db';

// Google sends the user back here, via Supabase Auth, with a code that's
// exchanged for the session cookies. Supabase gives an error instead if the
// "Before User Created" hook stopped the login, see db/008_cms_users.sql.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  const toLogin = (error: LoginError) => {
    const url = new URL(LOGIN_PATH, request.nextUrl.origin);
    url.searchParams.set('error', error);
    return NextResponse.redirect(url);
  };

  if (!code) {
    // Most likely the hook, but also e.g. if the login was cancelled at
    // Google.
    const description = request.nextUrl.searchParams.get('error_description');
    console.error('Login failed', description);
    return toLogin(description ? 'denied' : 'failed');
  }

  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('exchangeCodeForSession failed', error);
    return toLogin('failed');
  }

  // The hook only stops new accounts, so someone who was removed from
  // cms_users still gets this far.
  const email = data.user.email;
  if (!email || !(await db.isCmsUser(email))) {
    await supabase.auth.signOut();
    return toLogin('denied');
  }

  return NextResponse.redirect(new URL('/', request.nextUrl.origin));
}
