'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { CALLBACK_PATH, LOGIN_PATH, createAuthClient } from '@/lib/auth';

// Goes to Google, which comes back to src/app/auth/callback/route.ts.
export async function logIn() {
  const origin = (await headers()).get('origin');
  if (!origin) {
    redirect(`${LOGIN_PATH}?error=failed`);
  }

  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}${CALLBACK_PATH}` },
  });

  if (error) {
    console.error('signInWithOAuth failed', error);
    redirect(`${LOGIN_PATH}?error=failed`);
  }

  redirect(data.url);
}

export async function logOut() {
  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('signOut failed', error);
  }
  redirect(LOGIN_PATH);
}
