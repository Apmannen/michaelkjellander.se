'use client';

import { slugify } from '@/lib/slug';

import { inputClass, secondaryButtonClass } from './field';

// source is what Generera makes the slug from, e.g. the title.
export function SlugField({
  id,
  value,
  source,
  onChange,
}: {
  id: string;
  value: string;
  source: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className='flex gap-2'>
      <input
        id={id}
        type='text'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete='off'
        className={`${inputClass} font-mono`}
      />
      <button
        type='button'
        onClick={() => onChange(slugify(source))}
        disabled={!source.trim()}
        className={secondaryButtonClass}
      >
        Generera
      </button>
    </div>
  );
}
