'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { FIELD_TYPES, type FieldDefinition } from '@/lib/fields';

export function FieldDefinitionList({
  siteId,
  fields,
}: {
  siteId: string;
  fields: FieldDefinition[];
}) {
  const pathname = usePathname();

  if (fields.length === 0) {
    return <p className='px-4 py-3 text-sm text-zinc-500'>Inga fält än.</p>;
  }

  return (
    <ul className='flex flex-col p-2'>
      {fields.map((field) => {
        const href = `/${siteId}/fields/${field.id}`;
        const isActive = pathname === href;
        return (
          <li key={field.id}>
            <Link
              href={href}
              className={`flex flex-col gap-0.5 rounded-md px-3 py-2 transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span className='truncate text-sm font-medium'>
                {field.label}
              </span>
              <span className='flex items-baseline gap-1.5 truncate text-xs text-zinc-500'>
                <span className='font-mono'>{field.key}</span>
                <span>
                  · {FIELD_TYPES[field.type].label}
                  {field.multiple ? ', flera värden' : ''}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
