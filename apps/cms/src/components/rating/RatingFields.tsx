'use client';

import { RATING_MAX, RATING_MIN, RATINGS, type Rating } from '@/lib/rating';

import { inputClass } from '../editor/Field';

// Lines are kept as typed, including empty ones, so that Enter can start a new
// line. parseLines cleans them up when saving.
const toText = (lines?: string[]) => (lines ?? []).join('\n');

const toLines = (text: string) => (text ? text.split(/\r\n?|\n/) : undefined);

// Edits a rating and its pros and cons. id goes to the rating's select, and
// the pros and cons get ids based on it.
export function RatingFields({
  id,
  value,
  onChange,
  autoFocus = false,
}: {
  id: string;
  value: Rating;
  onChange: (patch: Rating) => void;
  autoFocus?: boolean;
}) {
  return (
    <div className='flex flex-col gap-4'>
      <select
        id={id}
        value={value.rating ?? ''}
        onChange={(event) =>
          onChange({
            rating: event.target.value ? Number(event.target.value) : undefined,
          })
        }
        autoFocus={autoFocus}
        aria-label={`Betyg från ${RATING_MIN} till ${RATING_MAX}`}
        className={inputClass}
      >
        <option value=''>Inget betyg</option>
        {RATINGS.map((rating) => (
          <option key={rating} value={rating}>
            {rating}
          </option>
        ))}
      </select>

      <div className='grid gap-4 sm:grid-cols-2'>
        <LinesField
          id={`${id}-pros`}
          label='Plus'
          value={value.pros}
          onChange={(pros) => onChange({ pros })}
        />
        <LinesField
          id={`${id}-cons`}
          label='Minus'
          value={value.cons}
          onChange={(cons) => onChange({ cons })}
        />
      </div>
    </div>
  );
}

function LinesField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value?: string[];
  onChange: (lines?: string[]) => void;
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label htmlFor={id} className='text-xs font-semibold'>
        {label} <span className='font-normal text-zinc-500'>– en per rad</span>
      </label>
      <textarea
        id={id}
        rows={4}
        value={toText(value)}
        onChange={(event) => onChange(toLines(event.target.value))}
        className={`${inputClass} resize-y`}
      />
    </div>
  );
}
