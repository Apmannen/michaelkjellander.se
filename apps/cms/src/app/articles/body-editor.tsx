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
  type ImageBlock,
  type Mark,
  type MarkType,
  type ParagraphBlock,
  type QuoteBlock,
  ICON_PLACEHOLDER,
  addMark,
  adjustMarks,
  hasMark,
  isValidHref,
  newBlockId,
  normalizeHref,
  paragraph,
  removeMarks,
  shiftMarks,
  sliceMarks,
  withParagraphSlots,
} from '@/lib/body';
import type { UploadedImage } from '@/lib/images';

import { Icon, IconPicker } from '../icons/icon-picker';
import { ImagePicker, ImagePreview } from '../images/image-picker';

// end selects from offset up to there.
type Caret = { id: string; offset: number; end?: number };

type TextSelection = { id: string; start: number; end: number };

// href is empty while adding a new link.
type LinkEdit = TextSelection & { href: string; text: string };

type QuoteFields = Pick<QuoteBlock, 'text' | 'author' | 'href'>;

// id is undefined while inserting a new quote.
type QuoteEdit = QuoteFields & { id?: string };

type ImageFields = Omit<ImageBlock, 'id' | 'type'>;

// Empty while inserting a new image.
type ImageEdit = Partial<ImageFields> & { id?: string };

const autosize = (input: HTMLTextAreaElement) => {
  input.style.height = 'auto';
  input.style.height = `${input.scrollHeight}px`;
};

// Locates the edit that turned before into after. caret is where the edit
// ended, which tells repeated characters apart.
const findEdit = (before: string, after: string, caret: number) => {
  let suffix = after.length - caret;
  if (
    suffix > before.length ||
    before.slice(before.length - suffix) !== after.slice(caret)
  ) {
    suffix = 0;
    while (
      suffix < before.length &&
      suffix < after.length &&
      before.at(-1 - suffix) === after.at(-1 - suffix)
    ) {
      suffix++;
    }
  }

  const max = Math.min(before.length, after.length) - suffix;
  let from = 0;
  while (from < max && before[from] === after[from]) {
    from++;
  }
  return {
    from,
    oldEnd: before.length - suffix,
    newEnd: after.length - suffix,
  };
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
  // Kept after blur, so the toolbar knows where to insert or link.
  const [selection, setSelection] = useState<TextSelection | undefined>(
    undefined,
  );
  const [editingQuote, setEditingQuote] = useState<QuoteEdit | undefined>(
    undefined,
  );
  const [editingLink, setEditingLink] = useState<LinkEdit | undefined>(
    undefined,
  );
  const [editingImage, setEditingImage] = useState<ImageEdit | undefined>(
    undefined,
  );
  const [isPickingIcon, setIsPickingIcon] = useState(false);

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
      input.setSelectionRange(caret.offset, caret.end ?? caret.offset);
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

  const setText = (
    index: number,
    block: ParagraphBlock,
    text: string,
    caret: number,
  ) => {
    const { from, oldEnd, newEnd } = findEdit(block.text, text, caret);
    const marks = adjustMarks(block.marks, from, oldEnd, newEnd);
    onChange(splice(index, 1, paragraph(text, marks, block.id)));
  };

  const findParagraphById = (blockId?: string) => {
    const index = value.findIndex((block) => block.id === blockId);
    const block = value[index];
    return block?.type === 'paragraph' ? { index, block } : undefined;
  };

  // Double-clicking a word often selects the space after it too, so
  // surrounding whitespace is left out. Undefined if nothing remains.
  const trimSelection = (target?: TextSelection) => {
    const block = findParagraphById(target?.id)?.block;
    if (!target || !block) {
      return undefined;
    }
    const selected = block.text.slice(target.start, target.end);
    const start = target.start + selected.length - selected.trimStart().length;
    const end = target.end - (selected.length - selected.trimEnd().length);
    return start < end ? { id: block.id, start, end } : undefined;
  };

  // A selection within a link edits that link, any other non-empty selection
  // adds a new one.
  const findLinkTarget = (target?: TextSelection): LinkEdit | undefined => {
    const block = findParagraphById(target?.id)?.block;
    if (!target || !block) {
      return undefined;
    }

    const link = block.marks?.find(
      (mark) =>
        mark.type === 'link' &&
        mark.start <= target.start &&
        target.end <= mark.end,
    );
    if (link?.type === 'link') {
      const { start, end, href } = link;
      return {
        id: block.id,
        start,
        end,
        href,
        text: block.text.slice(start, end),
      };
    }

    const trimmed = trimSelection(target);
    if (!trimmed) {
      return undefined;
    }
    const text = block.text.slice(trimmed.start, trimmed.end);
    return { ...trimmed, href: '', text };
  };

  const isEmpty =
    value.length === 1 && value[0].type === 'paragraph' && !value[0].text;

  const linkTarget = findLinkTarget(selection);
  const formatTarget = trimSelection(selection);

  // The icon the selection covers exactly, which picking another replaces.
  const selectedIcon = findParagraphById(selection?.id)?.block.marks?.find(
    (mark) =>
      mark.type === 'icon' &&
      mark.start === selection?.start &&
      mark.end === selection?.end,
  );

  const isFormatted = (type: MarkType) => {
    const block = findParagraphById(formatTarget?.id)?.block;
    return (
      !!formatTarget &&
      hasMark(block?.marks, type, formatTarget.start, formatTarget.end)
    );
  };

  // Removes the style if all of the selection has it, otherwise applies it to
  // all of the selection.
  const toggleMark = (type: 'bold' | 'underline', target?: TextSelection) => {
    const trimmed = trimSelection(target);
    const found = findParagraphById(trimmed?.id);
    if (!trimmed || !found) {
      return;
    }
    const { index, block } = found;
    const { start, end } = trimmed;
    const marks = hasMark(block.marks, type, start, end)
      ? removeMarks(block.marks, type, start, end)
      : addMark(block.marks, { type, start, end });
    commit(splice(index, 1, paragraph(block.text, marks, block.id)), {
      id: block.id,
      offset: start,
      end,
    });
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
      const next = paragraph(
        block.text.slice(end),
        sliceMarks(block.marks, end),
      );
      const current = paragraph(
        block.text.slice(0, start),
        sliceMarks(block.marks, 0, start),
        block.id,
      );
      commit(splice(index, 1, current, next), { id: next.id, offset: 0 });
      return;
    }

    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey) {
      const key = event.key.toLowerCase();
      const target = { id: block.id, start, end };
      if (key === 'k') {
        event.preventDefault();
        const linkTarget = findLinkTarget(target);
        if (linkTarget) {
          setEditingLink(linkTarget);
        }
        return;
      }
      if (key === 'b' || key === 'u') {
        event.preventDefault();
        toggleMark(key === 'b' ? 'bold' : 'underline', target);
        return;
      }
    }

    if (event.key === 'Backspace' && isCollapsed && start === 0) {
      const previous = value[index - 1];
      if (previous?.type === 'paragraph') {
        event.preventDefault();
        const marks = [
          ...(previous.marks ?? []),
          ...shiftMarks(block.marks, previous.text.length),
        ];
        commit(
          splice(
            index - 1,
            2,
            paragraph(previous.text + block.text, marks, previous.id),
          ),
          { id: previous.id, offset: previous.text.length },
        );
      }
      return;
    }

    if (event.key === 'Delete' && isCollapsed && start === block.text.length) {
      const next = value[index + 1];
      if (next?.type === 'paragraph') {
        event.preventDefault();
        const marks = [
          ...(block.marks ?? []),
          ...shiftMarks(next.marks, block.text.length),
        ];
        commit(
          splice(index, 2, paragraph(block.text + next.text, marks, block.id)),
          { id: block.id, offset: block.text.length },
        );
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
    const lastPart = parts.at(-1) ?? '';
    const last = paragraph(
      lastPart + after,
      shiftMarks(sliceMarks(block.marks, end), lastPart.length),
    );
    const first = paragraph(
      before + parts[0],
      sliceMarks(block.marks, 0, start),
      block.id,
    );

    commit(splice(index, 1, first, ...middle, last), {
      id: last.id,
      offset: last.text.length - after.length,
    });
  };

  // Inserts at the last known caret position, splitting that paragraph.
  const insertWidget = (widget: BodyBlock) => {
    let index = value.findIndex((block) => block.id === selection?.id);
    let offset = selection?.start ?? 0;
    if (index === -1) {
      index = value.length - 1;
      offset = Infinity;
    }

    const block = value[index] as ParagraphBlock;
    const before = block.text.slice(0, offset).trimEnd();
    const after = block.text.slice(offset).trimStart();
    const afterStart = block.text.length - after.length;
    const current = paragraph(
      before,
      sliceMarks(block.marks, 0, before.length),
      block.id,
    );
    const next = paragraph(after, sliceMarks(block.marks, afterStart));

    commit(splice(index, 1, current, widget, next), {
      id: next.id,
      offset: 0,
    });
  };

  // Replaces the selection, like typing would. Without a selection, the icon
  // goes at the end of the last paragraph.
  const insertIcon = (name: string) => {
    setIsPickingIcon(false);
    const found = findParagraphById(selection?.id) ?? {
      index: value.length - 1,
      block: value.at(-1) as ParagraphBlock,
    };
    const { index, block } = found;
    const start =
      selection?.id === block.id ? selection.start : block.text.length;
    const end = selection?.id === block.id ? selection.end : start;
    const text =
      block.text.slice(0, start) + ICON_PLACEHOLDER + block.text.slice(end);
    const marks = addMark(adjustMarks(block.marks, start, end, start + 1), {
      type: 'icon',
      name,
      start,
      end: start + 1,
    });
    commit(splice(index, 1, paragraph(text, marks, block.id)), {
      id: block.id,
      offset: start + 1,
    });
  };

  // Without href the link is removed.
  const saveLink = ({ id: blockId, start, end }: LinkEdit, href?: string) => {
    setEditingLink(undefined);
    const found = findParagraphById(blockId);
    if (!found) {
      return;
    }
    const { index, block } = found;
    const marks = href
      ? addMark(block.marks, { type: 'link', href, start, end })
      : removeMarks(block.marks, 'link', start, end);
    commit(splice(index, 1, paragraph(block.text, marks, block.id)), {
      id: blockId,
      offset: end,
    });
  };

  const saveQuote = ({ id: quoteId, ...fields }: QuoteEdit) => {
    setEditingQuote(undefined);
    if (quoteId) {
      onChange(
        value.map((block) =>
          block.id === quoteId
            ? { id: block.id, type: 'quote', ...fields }
            : block,
        ),
      );
      return;
    }
    insertWidget({ id: newBlockId(), type: 'quote', ...fields });
  };

  const saveImage = (imageId: string | undefined, fields: ImageFields) => {
    setEditingImage(undefined);
    if (imageId) {
      onChange(
        value.map((block) =>
          block.id === imageId
            ? { id: block.id, type: 'image', ...fields }
            : block,
        ),
      );
      return;
    }
    insertWidget({ id: newBlockId(), type: 'image', ...fields });
  };

  const removeBlock = (index: number) => {
    commit(splice(index, 1));
  };

  return (
    <div className='rounded-md border border-zinc-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900'>
      <div className='flex items-center gap-1 border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-800'>
        {/* preventDefault on mousedown keeps the text selection visible. */}
        <button
          type='button'
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => toggleMark('bold', selection)}
          disabled={!formatTarget}
          aria-pressed={isFormatted('bold')}
          aria-label='Fet'
          title='Fet (Ctrl+B)'
          className={`${toolbarButtonClass} w-8 font-bold`}
        >
          F
        </button>
        <button
          type='button'
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => toggleMark('underline', selection)}
          disabled={!formatTarget}
          aria-pressed={isFormatted('underline')}
          aria-label='Understruken'
          title='Understruken (Ctrl+U)'
          className={`${toolbarButtonClass} w-8 underline`}
        >
          U
        </button>
        <button
          type='button'
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setEditingLink(linkTarget)}
          disabled={!linkTarget}
          title='Markera text för att lägga till en länk (Ctrl+K)'
          className={toolbarButtonClass}
        >
          🔗 {linkTarget?.href ? 'Redigera länk' : 'Länk'}
        </button>
        {linkTarget?.href && (
          <span className='truncate px-1 text-xs text-zinc-500'>
            {linkTarget.href}
          </span>
        )}

        <span className='mx-1 h-4 w-px shrink-0 bg-zinc-200 dark:bg-zinc-800' />

        <span className='px-1 text-xs text-zinc-500'>Infoga:</span>
        <button
          type='button'
          onClick={() => setEditingQuote({ text: '', author: '' })}
          className={toolbarButtonClass}
        >
          ❝ Citat
        </button>
        <button
          type='button'
          onClick={() => setEditingImage({})}
          className={toolbarButtonClass}
        >
          🖼 Bild
        </button>
        <button
          type='button'
          onClick={() => setIsPickingIcon(true)}
          title={
            selectedIcon
              ? 'Byt den markerade ikonen'
              : 'Infoga en ikon där markören står'
          }
          className={toolbarButtonClass}
        >
          ★ {selectedIcon ? 'Byt ikon' : 'Ikon'}
        </button>

        <button
          type='button'
          onClick={() => {
            const empty = paragraph();
            setSelection(undefined);
            commit([empty], { id: empty.id, offset: 0 });
          }}
          disabled={isEmpty}
          title='Ta bort all brödtext'
          className={`${toolbarButtonClass} ml-auto text-red-600 dark:text-red-400`}
        >
          Rensa
        </button>
      </div>

      <div className='flex flex-col gap-3 px-3 py-3'>
        {value.map((block, index) => {
          if (block.type === 'paragraph') {
            return (
              <div key={block.id} className='relative'>
                <MarkedText text={block.text} marks={block.marks} />
                <textarea
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
                  placeholder={
                    value.length === 1 ? 'Skriv brödtext…' : undefined
                  }
                  onChange={(event) =>
                    setText(
                      index,
                      block,
                      event.target.value,
                      event.target.selectionEnd,
                    )
                  }
                  onKeyDown={(event) => onKeyDown(event, index, block)}
                  onPaste={(event) => onPaste(event, index, block)}
                  onSelect={(event) => {
                    const { selectionStart, selectionEnd } =
                      event.currentTarget;
                    setSelection({
                      id: block.id,
                      start: selectionStart,
                      end: selectionEnd,
                    });
                  }}
                  // The text is transparent, so selected text needs its own
                  // color. Firefox then drops the default selection
                  // background, so both are set to the system colors.
                  className={`${paragraphTextClass} relative block w-full resize-none overflow-hidden bg-transparent text-transparent caret-foreground outline-none selection:bg-[color:Highlight] selection:text-[color:HighlightText] placeholder:text-zinc-400`}
                />
              </div>
            );
          }

          if (block.type === 'image') {
            return (
              <ImageWidget
                key={block.id}
                block={block}
                onEdit={() => setEditingImage(block)}
                onRemove={() => removeBlock(index)}
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

      {editingLink && (
        <LinkDialog
          initial={editingLink}
          onSave={(href) => saveLink(editingLink, href)}
          onRemove={editingLink.href ? () => saveLink(editingLink) : undefined}
          onClose={() => setEditingLink(undefined)}
        />
      )}

      {editingQuote && (
        <QuoteDialog
          initial={editingQuote}
          onSave={(fields) => saveQuote({ ...editingQuote, ...fields })}
          onClose={() => setEditingQuote(undefined)}
        />
      )}

      {isPickingIcon && (
        <IconDialog
          value={selectedIcon?.type === 'icon' ? selectedIcon.name : undefined}
          onSelect={insertIcon}
          onClose={() => setIsPickingIcon(false)}
        />
      )}

      {editingImage && (
        <ImageDialog
          initial={editingImage}
          onSave={(fields) => saveImage(editingImage.id, fields)}
          onClose={() => setEditingImage(undefined)}
        />
      )}
    </div>
  );
}

const toolbarButtonClass =
  'rounded px-2 py-1 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent aria-pressed:bg-zinc-200 dark:hover:bg-zinc-800 dark:aria-pressed:bg-zinc-700';

// Shared by the textarea and the styled text, so their text wraps identically.
const paragraphTextClass =
  'text-sm leading-relaxed whitespace-pre-wrap break-words';

// font-bold would make the text wider than in the textarea and throw the
// caret off, so bold is drawn with a stroke that keeps the glyph widths.
const markClasses: Record<MarkType, string> = {
  bold: '[-webkit-text-stroke:0.035em_currentColor]',
  underline: 'underline underline-offset-2',
  link: 'text-blue-700 underline underline-offset-2 dark:text-blue-400',
  icon: 'relative',
};

// A textarea can't style parts of its text, so its own text is transparent
// and the visible, styled text is laid out identically right behind it.
function MarkedText({ text, marks = [] }: { text: string; marks?: Mark[] }) {
  const boundaries = [
    ...new Set([0, text.length, ...marks.flatMap((m) => [m.start, m.end])]),
  ].sort((a, b) => a - b);

  const parts = boundaries.slice(1).map((end, i) => {
    const start = boundaries[i];
    const active = marks.filter(
      (mark) => mark.start <= start && end <= mark.end,
    );
    const className = active.map((mark) => markClasses[mark.type]).join(' ');
    const icon = active.find((mark) => mark.type === 'icon');
    return (
      <span key={start} className={className || undefined}>
        {icon?.type === 'icon' ? (
          // The placeholder keeps the width it has in the textarea, and the
          // icon is drawn on top of it, scaled down if the glyph is narrower.
          <>
            <span className='text-transparent'>{ICON_PLACEHOLDER}</span>
            <Icon
              name={icon.name}
              className='absolute inset-x-0 top-1/2 h-[1em] w-full -translate-y-1/2'
            />
          </>
        ) : (
          text.slice(start, end)
        )}
      </span>
    );
  });

  return (
    <div
      aria-hidden
      className={`${paragraphTextClass} pointer-events-none absolute inset-0`}
    >
      {parts}
    </div>
  );
}

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
      {block.href && (
        <p className='mt-1 truncate text-xs text-blue-700 dark:text-blue-400'>
          🔗 {block.href}
        </p>
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
  const [href, setHref] = useState(initial.href ?? '');
  const normalizedHref = normalizeHref(href);
  const isValidLink = !normalizedHref || isValidHref(normalizedHref);

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
          onSave({
            text: text.trim(),
            author: author.trim(),
            ...(normalizedHref && { href: normalizedHref }),
          });
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

        <label className='flex flex-col gap-2'>
          <span className='text-sm font-semibold'>Länk (valfri)</span>
          <input
            type='text'
            inputMode='url'
            value={href}
            onChange={(event) => setHref(event.target.value)}
            placeholder='https://'
            autoComplete='off'
            className={dialogInputClass}
          />
          {!isValidLink && (
            <span className='text-xs text-red-600 dark:text-red-400'>
              Ogiltig adress.
            </span>
          )}
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
            disabled={!text.trim() || !isValidLink}
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

function ImageWidget({
  block,
  onEdit,
  onRemove,
}: {
  block: ImageBlock;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <figure
      onDoubleClick={onEdit}
      className='group relative flex flex-col gap-2 rounded-md bg-zinc-50 p-3 dark:bg-zinc-950'
    >
      <ImagePreview
        image={block}
        alt={block.alt}
        className='h-auto max-h-80 w-auto max-w-full self-center rounded'
      />
      {block.caption && (
        <figcaption className='text-xs whitespace-pre-wrap text-zinc-600 dark:text-zinc-400'>
          {block.caption}
        </figcaption>
      )}
      {!block.alt && (
        <p className='text-xs text-amber-700 dark:text-amber-400'>
          Alternativtext saknas.
        </p>
      )}
      <div className='absolute top-2 right-2 flex gap-1 rounded bg-white/90 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 dark:bg-zinc-900/90'>
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

function ImageDialog({
  initial,
  onSave,
  onClose,
}: {
  initial: Partial<ImageFields>;
  onSave: (fields: ImageFields) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [image, setImage] = useState<UploadedImage | undefined>(
    initial.path && initial.width && initial.height
      ? { path: initial.path, width: initial.width, height: initial.height }
      : undefined,
  );
  const [alt, setAlt] = useState(initial.alt ?? '');
  const [caption, setCaption] = useState(initial.caption ?? '');

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
          if (!image) {
            return;
          }
          onSave({
            ...image,
            alt: alt.trim(),
            ...(caption.trim() && { caption: caption.trim() }),
          });
        }}
      >
        <h2 className='text-base font-semibold'>Bild</h2>

        <ImagePicker value={image} onChange={setImage} />

        <label className='flex flex-col gap-2'>
          <span className='text-sm font-semibold'>Alternativtext</span>
          <input
            type='text'
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            placeholder='Beskriv bilden för den som inte ser den'
            autoComplete='off'
            className={dialogInputClass}
          />
        </label>

        <label className='flex flex-col gap-2'>
          <span className='text-sm font-semibold'>Bildtext (valfri)</span>
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            rows={2}
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
            disabled={!image}
            className='rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40'
          >
            {initial.path ? 'Uppdatera' : 'Infoga'}
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}

function IconDialog({
  value,
  onSelect,
  onClose,
}: {
  value?: string;
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

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
      <div className='flex flex-col gap-5 p-6'>
        <h2 className='text-base font-semibold'>
          {value ? 'Byt ikon' : 'Ikon'}
        </h2>

        <IconPicker value={value} onSelect={onSelect} />

        <div className='flex justify-end gap-3'>
          <button
            type='button'
            onClick={() => dialog.current?.close()}
            className='rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800'
          >
            Avbryt
          </button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}

function LinkDialog({
  initial,
  onSave,
  onRemove,
  onClose,
}: {
  initial: Pick<LinkEdit, 'href' | 'text'>;
  onSave: (href: string) => void;
  onRemove?: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [href, setHref] = useState(initial.href);
  const normalized = normalizeHref(href);
  const isValid = isValidHref(normalized);

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
          onSave(normalized);
        }}
      >
        <h2 className='text-base font-semibold'>Länk</h2>

        <p className='line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400'>
          {initial.text}
        </p>

        <label className='flex flex-col gap-2'>
          <span className='text-sm font-semibold'>Adress</span>
          <input
            type='text'
            inputMode='url'
            value={href}
            onChange={(event) => setHref(event.target.value)}
            placeholder='https://'
            autoComplete='off'
            autoFocus
            required
            className={dialogInputClass}
          />
          {href.trim() && !isValid && (
            <span className='text-xs text-red-600 dark:text-red-400'>
              Ogiltig adress.
            </span>
          )}
        </label>

        <div className='flex justify-end gap-3'>
          {onRemove && (
            <button
              type='button'
              onClick={onRemove}
              className='mr-auto rounded-md px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950'
            >
              Ta bort länk
            </button>
          )}
          <button
            type='button'
            onClick={() => dialog.current?.close()}
            className='rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800'
          >
            Avbryt
          </button>
          <button
            type='submit'
            disabled={!isValid}
            className='rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40'
          >
            {initial.href ? 'Uppdatera' : 'Infoga'}
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}

const dialogInputClass =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950';
