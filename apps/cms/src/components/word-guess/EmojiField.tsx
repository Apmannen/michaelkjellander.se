'use client';

import { EmojiPicker } from 'frimousse';
import { useEffect, useRef, useState } from 'react';

import { inputClass } from '../editor/Field';

// A text field for an emoji, with a button that opens a picker. The picker's
// data is fetched from a CDN the first time it's opened, in Swedish so the
// search works with Swedish words.
export function EmojiField({
  id,
  value,
  onChange,
  autoFocus,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Closes on a click outside or on Escape.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className='relative flex gap-2'>
      <input
        id={id}
        type='text'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
        autoFocus={autoFocus}
        autoComplete='off'
      />
      <button
        type='button'
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label='Välj emoji'
        title='Välj emoji'
        className='flex w-11 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-lg transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800'
      >
        {value || '🙂'}
      </button>

      {isOpen && (
        <EmojiPicker.Root
          locale='sv'
          columns={10}
          onEmojiSelect={({ emoji }) => {
            onChange(emoji);
            setIsOpen(false);
          }}
          className='absolute top-full right-0 z-10 mt-1 flex h-80 w-[22rem] flex-col rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900'
        >
          <div className='p-2'>
            <EmojiPicker.Search
              placeholder='Sök emoji, t.ex. sol'
              autoFocus
              // Enter would otherwise submit the editor's form.
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                }
              }}
              className={inputClass}
            />
          </div>
          <EmojiPicker.Viewport className='relative flex-1 outline-none'>
            <EmojiPicker.Loading className='absolute inset-0 flex items-center justify-center text-sm text-zinc-500'>
              Laddar…
            </EmojiPicker.Loading>
            <EmojiPicker.Empty className='absolute inset-0 flex items-center justify-center text-sm text-zinc-500'>
              Inga emojis hittades.
            </EmojiPicker.Empty>
            <EmojiPicker.List
              className='select-none pb-1'
              components={{
                CategoryHeader: ({ category, ...props }) => (
                  <div
                    {...props}
                    className='bg-white px-3 pt-2 pb-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900'
                  >
                    {category.label}
                  </div>
                ),
                Row: ({ children, ...props }) => (
                  <div {...props} className='scroll-my-1 px-1'>
                    {children}
                  </div>
                ),
                Emoji: ({ emoji, ...props }) => (
                  <button
                    {...props}
                    className='flex size-8 items-center justify-center rounded text-lg data-active:bg-zinc-100 dark:data-active:bg-zinc-800'
                  >
                    {emoji.emoji}
                  </button>
                ),
              }}
            />
          </EmojiPicker.Viewport>
        </EmojiPicker.Root>
      )}
    </div>
  );
}
