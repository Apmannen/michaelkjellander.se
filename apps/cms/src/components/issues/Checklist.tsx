'use client';

import { useState, type DragEvent } from 'react';
import { PiDotsSixVertical, PiPlus, PiTrash } from 'react-icons/pi';

import { type ChecklistItem } from '@/lib/issues';

import { inputClass } from '../editor/Field';

// The number of items, other than the dragged one, that come before the
// pointer.
const findPosition = (list: HTMLElement, draggedId: string, pointer: number) => {
  let position = 0;
  for (const element of list.querySelectorAll<HTMLElement>('[data-item]')) {
    if (element.dataset.id === draggedId) {
      continue;
    }
    const rect = element.getBoundingClientRect();
    if (pointer < rect.top + rect.height / 2) {
      break;
    }
    position++;
  }
  return position;
};

const iconButtonClass =
  'shrink-0 rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800';

const dropLine = 'rounded-full bg-blue-500';

// The checkboxes of an issue. Changes are part of the issue's draft and saved
// along with the rest of it.
export function Checklist({
  items,
  onChange,
}: {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}) {
  const [newText, setNewText] = useState('');
  const [draggedId, setDraggedId] = useState<string | undefined>(undefined);
  // Counted among the items other than the dragged one.
  const [dropPosition, setDropPosition] = useState<number | undefined>(
    undefined,
  );

  const checkedCount = items.filter(({ checked }) => checked).length;

  const updateItem = (id: string, patch: Partial<ChecklistItem>) => {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const addItem = () => {
    const text = newText.trim();
    if (!text) {
      return;
    }
    onChange([...items, { id: crypto.randomUUID(), text, checked: false }]);
    setNewText('');
  };

  const endDrag = () => {
    setDraggedId(undefined);
    setDropPosition(undefined);
  };

  const onDragOver = (event: DragEvent<HTMLOListElement>) => {
    if (!draggedId) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const position = findPosition(event.currentTarget, draggedId, event.clientY);
    if (position !== dropPosition) {
      setDropPosition(position);
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    const dragged = items.find(({ id }) => id === draggedId);
    if (dragged && dropPosition !== undefined) {
      const others = items.filter(({ id }) => id !== draggedId);
      const next = [
        ...others.slice(0, dropPosition),
        dragged,
        ...others.slice(dropPosition),
      ];
      if (next.some((item, index) => item !== items[index])) {
        onChange(next);
      }
    }
    endDrag();
  };

  const others = items.filter(({ id }) => id !== draggedId);
  const lineBeforeId =
    dropPosition !== undefined ? others[dropPosition]?.id : undefined;
  const showLineLast =
    dropPosition !== undefined && dropPosition >= others.length;

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-baseline justify-between gap-2'>
        <span className='text-sm font-semibold'>Checkboxar</span>
        {items.length > 0 && (
          <span className='text-xs text-zinc-500'>
            {checkedCount} av {items.length} klara
          </span>
        )}
      </div>

      {items.length > 0 && (
        <ol
          onDragOver={onDragOver}
          onDrop={onDrop}
          className='flex flex-col gap-1'
        >
          {items.map((item, index) => (
            <li
              key={item.id}
              data-item
              data-id={item.id}
              className={`relative flex items-center gap-2 ${
                draggedId === item.id ? 'opacity-40' : ''
              }`}
            >
              {lineBeforeId === item.id && (
                <div className={`${dropLine} absolute inset-x-0 -top-1 h-0.5`} />
              )}
              <span
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', item.id);
                  // Drags the whole row, not just the handle.
                  const row = event.currentTarget.closest('li');
                  if (row) {
                    event.dataTransfer.setDragImage(row, 0, 0);
                  }
                  setDraggedId(item.id);
                }}
                onDragEnd={endDrag}
                title='Dra för att flytta'
                aria-hidden
                className='shrink-0 cursor-grab p-1 text-zinc-400 active:cursor-grabbing'
              >
                <PiDotsSixVertical />
              </span>
              <input
                type='checkbox'
                checked={item.checked}
                onChange={(event) =>
                  updateItem(item.id, { checked: event.target.checked })
                }
                aria-label={`Klar: ${item.text || `checkbox ${index + 1}`}`}
                className='size-4 shrink-0 accent-blue-600'
              />
              <input
                type='text'
                value={item.text}
                onChange={(event) =>
                  updateItem(item.id, { text: event.target.value })
                }
                aria-label={`Text för checkbox ${index + 1}`}
                autoComplete='off'
                className={`${inputClass} py-1 ${
                  item.checked ? 'text-zinc-500 line-through' : ''
                }`}
              />
              <button
                type='button'
                onClick={() => removeItem(item.id)}
                title='Ta bort'
                aria-label={`Ta bort ${item.text || `checkbox ${index + 1}`}`}
                className={iconButtonClass}
              >
                <PiTrash />
              </button>
            </li>
          ))}
          {showLineLast && <li aria-hidden className={`${dropLine} h-0.5`} />}
        </ol>
      )}

      <div className='flex items-center gap-2'>
        <input
          type='text'
          value={newText}
          onChange={(event) => setNewText(event.target.value)}
          onKeyDown={(event) => {
            // Enter adds the checkbox instead of saving the issue.
            if (event.key === 'Enter') {
              event.preventDefault();
              addItem();
            }
          }}
          aria-label='Ny checkbox'
          placeholder='Ny checkbox…'
          autoComplete='off'
          className={`${inputClass} py-1`}
        />
        <button
          type='button'
          onClick={addItem}
          disabled={!newText.trim()}
          title='Lägg till'
          aria-label='Lägg till checkbox'
          className={`${iconButtonClass} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent`}
        >
          <PiPlus />
        </button>
      </div>
    </div>
  );
}
