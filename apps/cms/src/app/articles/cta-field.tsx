'use client';

import { useState } from 'react';

import type { CallToAction } from '@/lib/articles';
import { isValidHref, normalizeHref } from '@/lib/body';

import { Icon, IconPicker } from '../icons/icon-picker';

// Undefined once every field is empty, so clearing the fields removes the
// button.
const withoutEmpty = (cta: CallToAction): CallToAction | undefined =>
  cta.icon || cta.text || cta.href ? cta : undefined;

// id goes on the text input.
export function CallToActionField({
  id,
  value,
  onChange,
}: {
  id: string;
  value?: CallToAction;
  onChange: (value?: CallToAction) => void;
}) {
  const [isPickingIcon, setIsPickingIcon] = useState(false);
  const cta: CallToAction = value ?? { text: '', href: '' };
  const isInvalidHref =
    !!cta.href.trim() && !isValidHref(normalizeHref(cta.href));

  const update = (patch: Partial<CallToAction>) => {
    const { icon, ...rest } = { ...cta, ...patch };
    onChange(withoutEmpty({ ...(icon ? { icon } : {}), ...rest }));
  };

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-start gap-2'>
        <button
          type='button'
          onClick={() => setIsPickingIcon(!isPickingIcon)}
          aria-pressed={isPickingIcon}
          aria-label={cta.icon ? `Byt ikon (${cta.icon})` : 'Välj ikon'}
          title={cta.icon ?? 'Välj ikon'}
          className='flex size-[2.375rem] shrink-0 items-center justify-center rounded-md border border-zinc-300 text-zinc-400 transition-colors hover:bg-zinc-100 aria-pressed:border-blue-500 aria-pressed:ring-1 aria-pressed:ring-blue-500 dark:border-zinc-700 dark:hover:bg-zinc-800'
        >
          {cta.icon ? (
            <Icon
              name={cta.icon}
              className='size-4 text-zinc-900 dark:text-zinc-100'
            />
          ) : (
            '★'
          )}
        </button>
        <input
          id={id}
          type='text'
          value={cta.text}
          onChange={(event) => update({ text: event.target.value })}
          placeholder='Text, t.ex. Spela nu'
          autoComplete='off'
          className={`${inputClass} sm:w-56 sm:flex-none`}
        />
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <input
            type='text'
            inputMode='url'
            value={cta.href}
            onChange={(event) => update({ href: event.target.value })}
            placeholder='https://'
            aria-label='Knappens adress'
            aria-invalid={isInvalidHref}
            autoComplete='off'
            className={inputClass}
          />
          {isInvalidHref && (
            <span className='text-xs text-red-600 dark:text-red-400'>
              Ogiltig adress.
            </span>
          )}
        </div>
      </div>

      {isPickingIcon && (
        <div className='flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800'>
          <IconPicker
            value={cta.icon}
            onSelect={(name) => {
              setIsPickingIcon(false);
              update({ icon: name });
            }}
          />
          {cta.icon && (
            <button
              type='button'
              onClick={() => {
                setIsPickingIcon(false);
                update({ icon: undefined });
              }}
              className='self-start rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950'
            >
              Ta bort ikon
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const inputClass =
  'w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900';
