'use client';

import { slugify } from '@/lib/slug';

import { inputClass, secondaryButtonClass } from './Field';

// source is what Generera makes the slug from, e.g. the title. generate
// makes it, slugify unless something else is needed, e.g. for field keys.
export function SlugField({
  id,
  value,
  source,
  onChange,
  generate = slugify,
}: {
  id: string;
  value: string;
  source: string;
  onChange: (value: string) => void;
  generate?: (source: string) => string;
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
        onClick={() => onChange(generate(source))}
        disabled={!source.trim()}
        className={secondaryButtonClass}
      >
        Generera
      </button>
    </div>
  );
}
