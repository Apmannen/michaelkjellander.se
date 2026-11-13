'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { Tag } from '@/lib/tags';

export function TagList({ siteId, tags }: { siteId: string; tags: Tag[] }) {
  const pathname = usePathname();

  if (tags.length === 0) {
    return <p className='px-4 py-3 text-sm text-zinc-500'>Inga taggar än.</p>;
  }

  const names = new Map(tags.map((tag) => [tag.id, tag.name]));

  return (
    <ul className='flex flex-col p-2'>
      {tags.map((tag) => {
        const href = `/${siteId}/tags/${tag.id}`;
        const isActive = pathname === href;
        const parents = tag.parent_ids.flatMap((id) => names.get(id) ?? []);
        return (
          <li key={tag.id}>
            <Link
              href={href}
              className={`flex flex-col gap-0.5 rounded-md px-3 py-2 transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span className='truncate text-sm font-medium'>{tag.name}</span>
              <span className='truncate text-xs text-zinc-500'>
                {parents.length ? `Under ${parents.join(', ')}` : tag.slug}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
