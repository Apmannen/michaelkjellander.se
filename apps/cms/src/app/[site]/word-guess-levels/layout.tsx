import Link from 'next/link';
import { Suspense } from 'react';

import { db } from '@/lib/db';

import { WordGuessList } from '@/components/word-guess/WordGuessList';

type Params = LayoutProps<'/[site]/word-guess-levels'>['params'];

async function Levels({ params }: { params: Params }) {
  const { site } = await params;
  const levels = await db.listWordGuessLevels(site);
  return (
    <WordGuessList
      emptyText='Inga nivåer än.'
      items={levels.map((level) => ({
        href: `/${site}/word-guess-levels/${level.id}`,
        title: `${level.number}. ${level.sentence}`,
        subtitle:
          level.question_ids.length === 1
            ? '1 fråga'
            : `${level.question_ids.length} frågor`,
      }))}
    />
  );
}

async function NewLevelLink({ params }: { params: Params }) {
  const { site } = await params;
  return (
    <Link
      href={`/${site}/word-guess-levels/new`}
      className='rounded-md px-2 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950'
    >
      + Ny
    </Link>
  );
}

export default function WordGuessLevelsLayout({
  children,
  params,
}: LayoutProps<'/[site]/word-guess-levels'>) {
  return (
    <div className='flex min-h-0 flex-1'>
      <section className='flex w-72 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800'>
        <header className='flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800'>
          <h2 className='text-sm font-semibold'>Ordspelsnivåer</h2>
          <Suspense fallback={null}>
            <NewLevelLink params={params} />
          </Suspense>
        </header>
        <div className='flex-1 overflow-y-auto'>
          <Suspense
            fallback={
              <p className='px-4 py-3 text-sm text-zinc-500'>Laddar…</p>
            }
          >
            <Levels params={params} />
          </Suspense>
        </div>
      </section>
      <main className='min-w-0 flex-1'>{children}</main>
    </div>
  );
}
