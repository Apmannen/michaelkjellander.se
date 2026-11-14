import { Suspense } from 'react';

import { LOGIN_ERRORS, type LoginError } from '@/lib/auth';

import { logIn } from '@/components/auth/actions';

// Set by src/app/auth/callback/route.ts when the login failed.
async function ErrorMessage({
  searchParams,
}: {
  searchParams: PageProps<'/login'>['searchParams'];
}) {
  const { error } = await searchParams;
  const message =
    typeof error === 'string' && error in LOGIN_ERRORS
      ? LOGIN_ERRORS[error as LoginError]
      : undefined;
  if (!message) {
    return null;
  }
  return <p className='text-red-600 dark:text-red-400'>{message}</p>;
}

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <main className='flex flex-1 flex-col items-center justify-center gap-4 text-sm'>
      <form action={logIn}>
        <button
          type='submit'
          className='rounded-md bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-700'
        >
          Logga in med Google
        </button>
      </form>
      <Suspense fallback={null}>
        <ErrorMessage searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
