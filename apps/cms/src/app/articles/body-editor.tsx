'use client';

import {
  type ClipboardEvent,
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import {
  type Body,
  type BodyBlock,
  type ParagraphBlock,
  type QuoteBlock,
  newBlockId,
  paragraph,
  withParagraphSlots,
} from '@/lib/body';

type Caret = { id: string; offset: number };

type QuoteFields = Pick<QuoteBlock, 'text' | 'author'>;

// id is undefined while inserting a new quote.
type QuoteEdit = QuoteFields & { id?: string };

const autosize = (input: HTMLTextAreaElement) => {
  input.style.height = 'auto';
  input.style.height = `${input.scrollHeight}px`;
};

export function BodyEditor({
  id,
  value,
  onChange,
}: {
  id: string;
  value: Body;
  onChange: (value: Body) => void;
}) {
  const inputs = useRef(new Map<string, HTMLTextAreaElement>());
  const pendingCaret = useRef<Caret | undefined>(undefined);
  const lastCaret = useRef<Caret | undefined>(undefined);
  const [editingQuote, setEditingQuote] = useState<QuoteEdit | undefined>(
    undefined,
  );

  useLayoutEffect(() => {
    inputs.current.forEach(autosize);

    const caret = pendingCaret.current;
    if (!caret) {
      return;
    }
    pendingCaret.current = undefined;
    const input = inputs.current.get(caret.id);
    if (input) {
      input.focus();
      input.setSelectionRange(caret.offset, caret.offset);
    }
  }, [value]);

  useEffect(() => {
    const resizeAll = () => inputs.current.forEach(autosize);
    window.addEventListener('resize', resizeAll);
    return () => window.removeEventListener('resize', resizeAll);
  }, []);

  const commit = (blocks: Body, caret?: Caret) => {
    pendingCaret.current = caret;
    onChange(withParagraphSlots(blocks));
  };

  const splice = (start: number, deleteCount: number, ...items: Body) => {
    const blocks = [...value];
    blocks.splice(start, deleteCount, ...items);
    return blocks;
  };

  const findParagraph = (from: number, step: 1 | -1) => {
    for (let i = from + step; i >= 0 && i < value.length; i += step) {
      const block = value[i];
      if (block.type === 'paragraph') {
        return block;
      }
    }
    return undefined;
  };

  const setText = (index: number, text: string) => {
    onChange(splice(index, 1, { ...value[index], text } as ParagraphBlock));
  };

  const onKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
    index: number,
    block: ParagraphBlock,
  ) => {
    const { selectionStart: start, selectionEnd: end } = event.currentTarget;
    const isCollapsed = start === end;

    // Shift+Enter falls through and the textarea inserts a line break.
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      const next = paragraph(block.text.slice(end));
      commit(
        splice(index, 1, { ...block, text: block.text.slice(0, start) }, next),
        { id: next.id, offset: 0 },
      );
      return;
    }

    if (event.key === 'Backspace' && isCollapsed && start === 0) {
      const previous = value[index - 1];
      if (previous?.type === 'paragraph') {
        event.preventDefault();
        commit(
          splice(index - 1, 2, {
            ...previous,
            text: previous.text + block.text,
          }),
          { id: previous.id, offset: previous.text.length },
        );
      }
      return;
    }

    if (
      event.key === 'Delete' &&
      isCollapsed &&
      start === block.text.length
    ) {
      const next = value[index + 1];
      if (next?.type === 'paragraph') {
        event.preventDefault();
        commit(splice(index, 2, { ...block, text: block.text + next.text }), {
          id: block.id,
          offset: block.text.length,
        });
      }
      return;
    }

    if (event.key === 'ArrowUp' && isCollapsed && start === 0) {
      const previous = findParagraph(index, -1);
      if (previous) {
        event.preventDefault();
        commit(value, { id: previous.id, offset: previous.text.length });
      }
      return;
    }

    if (
      event.key === 'ArrowDown' &&
      isCollapsed &&
      start === block.text.length
    ) {
      const next = findParagraph(index, 1);
      if (next) {
        event.preventDefault();
        commit(value, { id: next.id, offset: 0 });
      }
    }
  };

  // Blank lines in pasted text become separate paragraphs.
  const onPaste = (
    event: ClipboardEvent<HTMLTextAreaElement>,
    index: number,
    block: ParagraphBlock,
  ) => {
    const pasted = event.clipboardData.getData('text/plain');
    const parts = pasted.replace(/\r\n?/g, '\n').split(/\n[ \t]*\n+/);
    if (parts.length < 2) {
      return;
    }
    event.preventDefault();

    const { selectionStart: start, selectionEnd: end } = event.currentTarget;
    const before = block.text.slice(0, start);
    const after = block.text.slice(end);
    const middle = parts.slice(1, -1).map((part) => paragraph(part));
    const last = paragraph(parts.at(-1) + after);

    commit(
      splice(
        index,
        1,
        { ...block, text: before + parts[0] },
        ...middle,
        last,
      ),
      { id: last.id, offset: last.text.length - after.length },
    );
  };

  // Inserts at the last known caret position, splitting that paragraph.
  const insertWidget = (widget: BodyBlock) => {
    let index = value.findIndex((block) => block.id === lastCaret.current?.id);
    let offset = lastCaret.current?.offset ?? 0;
    if (index === -1) {
      index = value.length - 1;
      offset = Infinity;
    }

    const block = value[index] as ParagraphBlock;
    const before = block.text.slice(0, offset).trimEnd();
    const after = block.text.slice(offset).trimStart();
    const next = paragraph(after);

    commit(splice(index, 1, { ...block, text: before }, widget, next), {
      id: next.id,
      offset: 0,
    });
  };

  const saveQuote = ({ id: quoteId, ...fields }: QuoteEdit) => {
    setEditingQuote(undefined);
    if (quoteId) {
      onChange(
        value.map((block) =>
          block.id === quoteId ? { ...block, ...fields } : block,
        ),
      );
      return;
    }
    insertWidget({ id: newBlockId(), type: 'quote', ...fields });
  };

  const removeBlock = (index: number) => {
    commit(splice(index, 1));
  };

  return (
    <div className='rounded-md border border-zinc-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900'>
      <div className='flex items-center gap-1 border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-800'>
        <span className='px-1 text-xs text-zinc-500'>Infoga:</span>
        <button
          type='button'
          onClick={() => setEditingQuote({ text: '', author: '' })}
          className={toolbarButtonClass}
        >
          ❝ Citat
        </button>
      </div>

      <div className='flex flex-col gap-3 px-3 py-3'>
        {value.map((block, index) => {
          if (block.type === 'paragraph') {
            return (
              <textarea
                key={block.id}
                id={index === 0 ? id : undefined}
                ref={(input) => {
                  if (!input) {
                    return;
                  }
                  inputs.current.set(block.id, input);
                  autosize(input);
                  return () => {
                    inputs.current.delete(block.id);
                  };
                }}
                rows={1}
                value={block.text}
                placeholder={value.length === 1 ? 'Skriv brödtext…' : undefined}
                onChange={(event) => setText(index, event.target.value)}
                onKeyDown={(event) => onKeyDown(event, index, block)}
                onPaste={(event) => onPaste(event, index, block)}
                onBlur={(event) => {
                  lastCaret.current = {
                    id: block.id,
                    offset: event.currentTarget.selectionStart,
                  };
                }}
                className='block w-full resize-none overflow-hidden bg-transparent text-sm leading-relaxed outline-none placeholder:text-zinc-400'
              />
            );
          }

          return (
            <QuoteWidget
              key={block.id}
              block={block}
              onEdit={() => setEditingQuote(block)}
              onRemove={() => removeBlock(index)}
            />
          );
        })}
      </div>

      {editingQuote && (
        <QuoteDialog
          initial={editingQuote}
          onSave={(fields) => saveQuote({ ...editingQuote, ...fields })}
          onClose={() => setEditingQuote(undefined)}
        />
      )}
    </div>
  );
}

const toolbarButtonClass =
  'rounded px-2 py-1 text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800';

function QuoteWidget({
  block,
  onEdit,
  onRemove,
}: {
  block: QuoteBlock;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <figure
      onDoubleClick={onEdit}
      className='group relative rounded-r-md border-l-4 border-zinc-400 bg-zinc-50 py-3 pr-32 pl-4 dark:border-zinc-600 dark:bg-zinc-950'
    >
      <blockquote className='text-sm whitespace-pre-wrap italic'>
        {block.text}
      </blockquote>
      {block.author && (
        <figcaption className='mt-2 text-xs text-zinc-500'>
          — {block.author}
        </figcaption>
      )}
      <div className='absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100'>
        <button type='button' onClick={onEdit} className={toolbarButtonClass}>
          Redigera
        </button>
        <button
          type='button'
          onClick={onRemove}
          className={`${toolbarButtonClass} text-red-600 dark:text-red-400`}
        >
          Ta bort
        </button>
      </div>
    </figure>
  );
}

function QuoteDialog({
  initial,
  onSave,
  onClose,
}: {
  initial: QuoteFields;
  onSave: (fields: QuoteFields) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState(initial.text);
  const [author, setAuthor] = useState(initial.author);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  // Portaled out of the article <form>, since forms can't be nested.
  return createPortal(
    <dialog
      ref={dialog}
      onClose={onClose}
      className='m-auto w-full max-w-lg rounded-lg bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/40 dark:bg-zinc-900 dark:text-zinc-100'
    >
      <form
        className='flex flex-col gap-5 p-6'
        onSubmit={(event) => {
          // React events bubble through portals, so keep this submit from
          // reaching the article form.
          event.preventDefault();
          event.stopPropagation();
          onSave({ text: text.trim(), author: author.trim() });
        }}
      >
        <h2 className='text-base font-semibold'>Citat</h2>

        <label className='flex flex-col gap-2'>
          <span className='text-sm font-semibold'>Text</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={4}
            autoFocus
            required
            className={dialogInputClass}
          />
        </label>

        <label className='flex flex-col gap-2'>
          <span className='text-sm font-semibold'>Upphovsman</span>
          <input
            type='text'
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            autoComplete='off'
            className={dialogInputClass}
          />
        </label>

        <div className='flex justify-end gap-3'>
          <button
            type='button'
            onClick={() => dialog.current?.close()}
            className='rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800'
          >
            Avbryt
          </button>
          <button
            type='submit'
            disabled={!text.trim()}
            className='rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40'
          >
            {initial.text ? 'Uppdatera' : 'Infoga'}
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}

const dialogInputClass =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950';
