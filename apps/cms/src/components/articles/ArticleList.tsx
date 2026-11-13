'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { Article } from '@/lib/articles';

export function ArticleList({
  siteId,
  articles,
}: {
  siteId: string;
  articles: Article[];
}) {
  const pathname = usePathname();

  if (articles.length === 0) {
    return <p className="px-4 py-3 text-sm text-zinc-500">Inga artiklar än.</p>;
  }

  return (
    <ul className="flex flex-col p-2">
      {articles.map((article) => {
        const href = `/${siteId}/articles/${article.id}`;
        const isActive = pathname === href;
        return (
          <li key={article.id}>
            <Link
              href={href}
              className={`flex flex-col gap-0.5 rounded-md px-3 py-2 transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="truncate text-sm font-medium">
                {article.title}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    article.published ? 'bg-emerald-500' : 'bg-zinc-400'
                  }`}
                />
                {article.published ? 'Publicerad' : 'Utkast'}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
