'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type WordGuessListItem = {
  href: string;
  title: string;
  subtitle: string;
};

// The list of questions or levels next to the editor.
export function WordGuessList({
  items,
  emptyText,
}: {
  items: WordGuessListItem[];
  emptyText: string;
}) {
  const pathname = usePathname();

  if (items.length === 0) {
    return <p className='px-4 py-3 text-sm text-zinc-500'>{emptyText}</p>;
  }

  return (
    <ul className='flex flex-col p-2'>
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex flex-col gap-0.5 rounded-md px-3 py-2 transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span className='truncate text-sm font-medium'>{item.title}</span>
              <span className='truncate text-xs text-zinc-500'>
                {item.subtitle}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
