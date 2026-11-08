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
  type ListBlock,
  type ListItem,
  type Mark,
  type MarkType,
  type ParagraphBlock,
  type ParagraphVariant,
  type QuoteBlock,
  ICON_PLACEHOLDER,
  addMark,
  adjustMarks,
  hasMark,
  isValidHref,
  listItem,
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
type LinkRange = { start: number; end: number; href: string; text: string };

type LinkEdit = LinkRange & { id: string };

type QuoteFields = Pick<QuoteBlock, 'text' | 'author' | 'href'>;

// id is undefined while inserting a new quote.
type QuoteEdit = QuoteFields & { id?: string };

type ImageFields = Omit<ImageBlock, 'id' | 'type'>;

// Empty while inserting a new image.
type ImageEdit = Partial<ImageFields> & { id?: string };

// id is undefined while inserting a new list.
type ListEdit = { id?: string; items: ListItem[] };

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

// Double-clicking a word often selects the space after it too, so
// surrounding whitespace is left out. Undefined if nothing remains.
const trimRange = (text: string, start: number, end: number) => {
  const selected = text.slice(start, end);
  const trimmedStart = start + selected.length - selected.trimStart().length;
  const trimmedEnd = end - (selected.length - selected.trimEnd().length);
  return trimmedStart < trimmedEnd
    ? { start: trimmedStart, end: trimmedEnd }
    : undefined;
};

// A selection within a link gives that link, any other non-empty selection a
// new one.
const findLinkRange = (
  text: string,
  marks: Mark[] = [],
  start: number,
  end: number,
): LinkRange | undefined => {
  const link = marks.find(
    (mark) => mark.type === 'link' && mark.start <= start && end <= mark.end,
  );
  if (link?.type === 'link') {
    return {
      start: link.start,
      end: link.end,
      href: link.href,
      text: text.slice(link.start, link.end),
    };
  }

  const trimmed = trimRange(text, start, end);
  if (!trimmed) {
    return undefined;
  }
  return { ...trimmed, href: '', text: text.slice(trimmed.start, trimmed.end) };
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
  const [editingList, setEditingList] = useState<ListEdit | undefined>(
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
    onChange(
      splice(index, 1, paragraph(text, marks, block.id, block.variant)),
    );
  };

  const findParagraphById = (blockId?: string) => {
    const index = value.findIndex((block) => block.id === blockId);
    const block = value[index];
    return block?.type === 'paragraph' ? { index, block } : undefined;
  };

  const trimSelection = (target?: TextSelection) => {
    const block = findParagraphById(target?.id)?.block;
    if (!target || !block) {
      return undefined;
    }
    const trimmed = trimRange(block.text, target.start, target.end);
    return trimmed && { id: block.id, ...trimmed };
  };

  // A selection within a link edits that link, any other non-empty selection
  // adds a new one.
  const findLinkTarget = (target?: TextSelection): LinkEdit | undefined => {
    const block = findParagraphById(target?.id)?.block;
    if (!target || !block) {
      return undefined;
    }
    const range = findLinkRange(
      block.text,
      block.marks,
      target.start,
      target.end,
    );
    return range && { id: block.id, ...range };
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
    commit(
      splice(index, 1, paragraph(block.text, marks, block.id, block.variant)),
      { id: block.id, offset: start, end },
    );
  };

  const isHeading = (blockId?: string) =>
    findParagraphById(blockId)?.block.variant === 'heading';

  // Turns the paragraph with the selection into a heading or back into body
  // text. The selection is kept.
  const toggleHeading = (target?: TextSelection) => {
    const found = findParagraphById(target?.id);
    if (!target || !found) {
      return;
    }
    const { index, block } = found;
    const variant = block.variant === 'heading' ? undefined : 'heading';
    commit(
      splice(index, 1, paragraph(block.text, block.marks, block.id, variant)),
      { id: block.id, offset: target.start, end: target.end },
    );
  };

  const onKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
    index: number,
    block: ParagraphBlock,
  ) => {
    const { selectionStart: start, selectionEnd: end } = event.currentTarget;
    const isCollapsed = start === end;

    // Shift+Enter falls through and the textarea inserts a line break,
    // except in a heading, which has no line breaks.
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      // Text after a heading is almost always body text, so a new paragraph
      // at the end of a heading isn't one. Splitting a heading gives two.
      const next = paragraph(
        block.text.slice(end),
        sliceMarks(block.marks, end),
        undefined,
        end < block.text.length ? block.variant : undefined,
      );
      const current = paragraph(
        block.text.slice(0, start),
        sliceMarks(block.marks, 0, start),
        block.id,
        block.variant,
      );
      commit(splice(index, 1, current, next), { id: next.id, offset: 0 });
      return;
    }

    if (
      event.key === 'Enter' &&
      block.variant === 'heading' &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      return;
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      !event.altKey &&
      event.key.toLowerCase() === 'h'
    ) {
      event.preventDefault();
      toggleHeading({ id: block.id, start, end });
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
      // A heading is bold as a whole, so bold isn't toggled within it.
      if (key === 'b' || key === 'u') {
        event.preventDefault();
        if (key === 'u' || block.variant !== 'heading') {
          toggleMark(key === 'b' ? 'bold' : 'underline', target);
        }
        return;
      }
    }

    // Backspace at the start of a heading first turns it into body text.
    if (
      event.key === 'Backspace' &&
      isCollapsed &&
      start === 0 &&
      block.variant === 'heading'
    ) {
      event.preventDefault();
      toggleHeading({ id: block.id, start, end });
      return;
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
            paragraph(
              previous.text + block.text,
              marks,
              previous.id,
              previous.variant,
            ),
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
          splice(
            index,
            2,
            paragraph(block.text + next.text, marks, block.id, block.variant),
          ),
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
    // Like Enter, only the part holding the rest of a heading stays one.
    const last = paragraph(
      lastPart + after,
      shiftMarks(sliceMarks(block.marks, end), lastPart.length),
      undefined,
      after ? block.variant : undefined,
    );
    const first = paragraph(
      before + parts[0],
      sliceMarks(block.marks, 0, start),
      block.id,
      block.variant,
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
      block.variant,
    );
    const next = paragraph(
      after,
      sliceMarks(block.marks, afterStart),
      undefined,
      after ? block.variant : undefined,
    );

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
    commit(
      splice(index, 1, paragraph(text, marks, block.id, block.variant)),
      { id: block.id, offset: start + 1 },
    );
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
    commit(
      splice(index, 1, paragraph(block.text, marks, block.id, block.variant)),
      { id: blockId, offset: end },
    );
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

  const saveList = ({ id: listId, items }: ListEdit) => {
    setEditingList(undefined);
    if (listId) {
      onChange(
        value.map((block) =>
          block.id === listId ? { id: block.id, type: 'list', items } : block,
        ),
      );
      return;
    }
    insertWidget({ id: newBlockId(), type: 'list', items });
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
          onClick={() => toggleHeading(selection)}
          disabled={!findParagraphById(selection?.id)}
          aria-pressed={isHeading(selection?.id)}
          title='Gör stycket där markören står till en rubrik (Ctrl+Shift+H)'
          className={`${toolbarButtonClass} font-semibold`}
        >
          Rubrik
        </button>

        <span className='mx-1 h-4 w-px shrink-0 bg-zinc-200 dark:bg-zinc-800' />

        <button
          type='button'
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => toggleMark('bold', selection)}
          disabled={!formatTarget || isHeading(formatTarget.id)}
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
          onClick={() => setEditingList({ items: [] })}
          title='Infoga en punktlista där markören står'
          className={toolbarButtonClass}
        >
          ☰ Lista
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
          onClick={() => insertWidget({ id: newBlockId(), type: 'divider' })}
          title='Infoga en avskiljare där markören står'
          className={toolbarButtonClass}
        >
          ― Avskiljare
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
            const textClass = textClasses[block.variant ?? 'body'];
            return (
              <div
                key={block.id}
                className={
                  block.variant === 'heading' ? 'relative mt-2' : 'relative'
                }
              >
                <MarkedText
                  text={block.text}
                  marks={block.marks}
                  className={textClass}
                />
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
                    value.length === 1
                      ? 'Skriv brödtext…'
                      : block.variant === 'heading'
                        ? 'Rubrik'
                        : undefined
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
                  className={`${paragraphTextClass} ${textClass} relative block w-full resize-none overflow-hidden bg-transparent text-transparent caret-foreground outline-none selection:bg-[color:Highlight] selection:text-[color:HighlightText] placeholder:text-zinc-400`}
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

          if (block.type === 'list') {
            return (
              <ListWidget
                key={block.id}
                block={block}
                onEdit={() => setEditingList(block)}
                onRemove={() => removeBlock(index)}
              />
            );
          }

          if (block.type === 'divider') {
            return (
              <DividerWidget
                key={block.id}
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

      {editingList && (
        <ListDialog
          initial={editingList.items}
          onSave={(items) => saveList({ id: editingList.id, items })}
          onClose={() => setEditingList(undefined)}
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
const paragraphTextClass = 'whitespace-pre-wrap break-words';

// The textarea and the styled text behind it must get the same classes, or
// the caret ends up off.
const textClasses: Record<ParagraphVariant | 'body', string> = {
  body: 'text-sm leading-relaxed',
  heading: 'text-lg leading-snug font-semibold',
};

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
function MarkedText({
  text,
  marks = [],
  className,
}: {
  text: string;
  marks?: Mark[];
  className: string;
}) {
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
      className={`${paragraphTextClass} ${className} pointer-events-none absolute inset-0`}
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

function DividerWidget({ onRemove }: { onRemove: () => void }) {
  return (
    <div className='group relative flex h-8 items-center'>
      <hr className='w-full border-zinc-300 dark:border-zinc-700' />
      <div className='absolute right-0 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100'>
        <button
          type='button'
          onClick={onRemove}
          className={`${toolbarButtonClass} bg-white text-red-600 dark:bg-zinc-900 dark:text-red-400`}
        >
          Ta bort
        </button>
      </div>
    </div>
  );
}

// Only shows links, which are the only marks list items have.
function LinkedText({ text, marks = [] }: { text: string; marks?: Mark[] }) {
  const parts = [];
  let position = 0;
  for (const mark of marks) {
    if (mark.type !== 'link') {
      continue;
    }
    parts.push(text.slice(position, mark.start));
    parts.push(
      <span key={mark.start} title={mark.href} className={markClasses.link}>
        {text.slice(mark.start, mark.end)}
      </span>,
    );
    position = mark.end;
  }
  parts.push(text.slice(position));
  return <>{parts}</>;
}

function ListWidget({
  block,
  onEdit,
  onRemove,
}: {
  block: ListBlock;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      onDoubleClick={onEdit}
      className='group relative rounded-md bg-zinc-50 py-3 pr-32 pl-4 dark:bg-zinc-950'
    >
      <ul className='flex flex-col gap-1.5'>
        {block.items.map((item, i) => (
          <li key={i} className='flex items-baseline gap-2 text-sm'>
            <span className='flex w-4 shrink-0 justify-center text-zinc-600 dark:text-zinc-400'>
              {item.icon ? (
                <Icon name={item.icon} className='translate-y-0.5' />
              ) : (
                '•'
              )}
            </span>
            <span>
              <LinkedText text={item.text} marks={item.marks} />
            </span>
          </li>
        ))}
      </ul>
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
    </div>
  );
}

// key only identifies the item while editing. Marks other than links can't
// be added, and listItem drops any when saving.
type ListItemDraft = {
  key: string;
  icon?: string;
  text: string;
  marks?: Mark[];
};

type ItemSelection = { key: string; start: number; end: number };

type ItemLinkEdit = LinkRange & { key: string };

const listItemDraft = (
  item?: Omit<ListItemDraft, 'key'>,
): ListItemDraft => ({
  key: newBlockId(),
  text: '',
  ...item,
});

function ListDialog({
  initial,
  onSave,
  onClose,
}: {
  initial: ListItem[];
  onSave: (items: ListItem[]) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const inputs = useRef(new Map<string, HTMLTextAreaElement>());
  const pendingCaret = useRef<Caret | undefined>(undefined);
  const [items, setItems] = useState(() =>
    initial.length ? initial.map(listItemDraft) : [listItemDraft()],
  );
  // Kept after blur, so the link buttons know what to link.
  const [selection, setSelection] = useState<ItemSelection | undefined>(
    undefined,
  );
  const [editingLink, setEditingLink] = useState<ItemLinkEdit | undefined>(
    undefined,
  );
  const [pickingIconFor, setPickingIconFor] = useState<string | undefined>(
    undefined,
  );

  // Empty items are left out.
  const result = items.flatMap((item) => {
    const saved = listItem(item.text, item.marks, item.icon);
    return saved ? [saved] : [];
  });

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

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
  }, [items]);

  const commit = (next: ListItemDraft[], caret?: Caret) => {
    pendingCaret.current = caret;
    setItems(next);
  };

  const update = (key: string, change: Partial<ListItemDraft>) => {
    setItems(
      items.map((item) => (item.key === key ? { ...item, ...change } : item)),
    );
  };

  const findLinkTarget = (
    target?: ItemSelection,
  ): ItemLinkEdit | undefined => {
    const item = items.find((other) => other.key === target?.key);
    if (!target || !item) {
      return undefined;
    }
    const range = findLinkRange(
      item.text,
      item.marks,
      target.start,
      target.end,
    );
    return range && { key: item.key, ...range };
  };

  // List items have no line breaks, so pasted ones become spaces.
  const setText = (item: ListItemDraft, rawText: string, caret: number) => {
    const text = rawText.replace(/\n/g, ' ');
    const { from, oldEnd, newEnd } = findEdit(item.text, text, caret);
    update(item.key, {
      text,
      marks: adjustMarks(item.marks, from, oldEnd, newEnd),
    });
  };

  // Without href the link is removed.
  const saveLink = ({ key, start, end }: ItemLinkEdit, href?: string) => {
    setEditingLink(undefined);
    const item = items.find((other) => other.key === key);
    if (!item) {
      return;
    }
    const marks = href
      ? addMark(item.marks, { type: 'link', href, start, end })
      : removeMarks(item.marks, 'link', start, end);
    commit(
      items.map((other) => (other.key === key ? { ...item, marks } : other)),
      { id: key, offset: end },
    );
  };

  const move = (index: number, by: 1 | -1) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    setItems(next);
  };

  // There's always an item to type in.
  const remove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    setItems(next.length ? next : [listItemDraft()]);
  };

  const onKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
    index: number,
    item: ListItemDraft,
  ) => {
    const { selectionStart: start, selectionEnd: end } = event.currentTarget;

    // Enter splits the item, and the text after the caret becomes a new item.
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      const current = {
        ...item,
        text: item.text.slice(0, start),
        marks: sliceMarks(item.marks, 0, start),
      };
      const next = listItemDraft({
        text: item.text.slice(end),
        marks: sliceMarks(item.marks, end),
      });
      const nextItems = [...items];
      nextItems.splice(index, 1, current, next);
      commit(nextItems, { id: next.key, offset: 0 });
      return;
    }

    // Backspace in an empty item removes it.
    if (event.key === 'Backspace' && !item.text && index > 0) {
      event.preventDefault();
      const previous = items[index - 1];
      commit(
        items.filter((_, i) => i !== index),
        { id: previous.key, offset: previous.text.length },
      );
      return;
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      !event.shiftKey &&
      event.key.toLowerCase() === 'k'
    ) {
      event.preventDefault();
      const target = findLinkTarget({ key: item.key, start, end });
      if (target) {
        setEditingLink(target);
      }
    }
  };

  // Portaled out of the article <form>, since forms can't be nested. The link
  // dialog is kept outside the list dialog, so its close event doesn't bubble
  // to the list dialog's onClose.
  const listDialog = createPortal(
    <dialog
      ref={dialog}
      onClose={onClose}
      className='m-auto w-full max-w-2xl rounded-lg bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/40 dark:bg-zinc-900 dark:text-zinc-100'
    >
      <form
        className='flex flex-col gap-5 p-6'
        onSubmit={(event) => {
          // React events bubble through portals, so keep this submit from
          // reaching the article form.
          event.preventDefault();
          event.stopPropagation();
          onSave(result);
        }}
      >
        <h2 className='text-base font-semibold'>Lista</h2>

        <ul className='flex flex-col gap-3'>
          {items.map((item, index) => {
            const linkTarget =
              selection?.key === item.key
                ? findLinkTarget(selection)
                : undefined;
            const isPickingIcon = pickingIconFor === item.key;
            return (
              <li key={item.key} className='flex flex-col gap-2'>
                <div className='flex items-start gap-2'>
                  <button
                    type='button'
                    onClick={() =>
                      setPickingIconFor(isPickingIcon ? undefined : item.key)
                    }
                    aria-pressed={isPickingIcon}
                    aria-label={
                      item.icon ? `Byt ikon (${item.icon})` : 'Välj ikon'
                    }
                    title={item.icon ?? 'Välj ikon'}
                    className='flex size-[2.375rem] shrink-0 items-center justify-center rounded-md border border-zinc-300 text-zinc-400 transition-colors hover:bg-zinc-100 aria-pressed:border-blue-500 aria-pressed:ring-1 aria-pressed:ring-blue-500 dark:border-zinc-700 dark:hover:bg-zinc-800'
                  >
                    {item.icon ? (
                      <Icon
                        name={item.icon}
                        className='size-4 text-zinc-900 dark:text-zinc-100'
                      />
                    ) : (
                      '★'
                    )}
                  </button>

                  <div className='min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950'>
                    <div className='relative'>
                      <MarkedText
                        text={item.text}
                        marks={item.marks}
                        className={textClasses.body}
                      />
                      <textarea
                        ref={(input) => {
                          if (!input) {
                            return;
                          }
                          inputs.current.set(item.key, input);
                          autosize(input);
                          return () => {
                            inputs.current.delete(item.key);
                          };
                        }}
                        rows={1}
                        value={item.text}
                        placeholder='Text'
                        autoFocus={index === 0}
                        aria-label={`Punkt ${index + 1}`}
                        onChange={(event) =>
                          setText(
                            item,
                            event.target.value,
                            event.target.selectionEnd,
                          )
                        }
                        onKeyDown={(event) => onKeyDown(event, index, item)}
                        onSelect={(event) => {
                          const { selectionStart, selectionEnd } =
                            event.currentTarget;
                          setSelection({
                            key: item.key,
                            start: selectionStart,
                            end: selectionEnd,
                          });
                        }}
                        // See the body paragraphs for why the text is
                        // transparent.
                        className={`${paragraphTextClass} ${textClasses.body} relative block w-full resize-none overflow-hidden bg-transparent text-transparent caret-foreground outline-none selection:bg-[color:Highlight] selection:text-[color:HighlightText] placeholder:text-zinc-400`}
                      />
                    </div>
                  </div>

                  <div className='flex shrink-0 items-center gap-0.5 py-0.5'>
                    {/* preventDefault on mousedown keeps the text selection. */}
                    <button
                      type='button'
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setEditingLink(linkTarget)}
                      disabled={!linkTarget}
                      aria-label={linkTarget?.href ? 'Redigera länk' : 'Länk'}
                      title={
                        linkTarget?.href
                          ? `Redigera länk (${linkTarget.href})`
                          : 'Markera text för att lägga till en länk (Ctrl+K)'
                      }
                      className={toolbarButtonClass}
                    >
                      🔗
                    </button>
                    <button
                      type='button'
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label='Flytta upp'
                      title='Flytta upp'
                      className={toolbarButtonClass}
                    >
                      ↑
                    </button>
                    <button
                      type='button'
                      onClick={() => move(index, 1)}
                      disabled={index === items.length - 1}
                      aria-label='Flytta ner'
                      title='Flytta ner'
                      className={toolbarButtonClass}
                    >
                      ↓
                    </button>
                    <button
                      type='button'
                      onClick={() => remove(index)}
                      aria-label='Ta bort punkt'
                      title='Ta bort punkt'
                      className={`${toolbarButtonClass} text-red-600 dark:text-red-400`}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {isPickingIcon && (
                  <div className='flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800'>
                    <IconPicker
                      value={item.icon}
                      onSelect={(name) => {
                        setPickingIconFor(undefined);
                        update(item.key, { icon: name });
                      }}
                    />
                    {item.icon && (
                      <button
                        type='button'
                        onClick={() => {
                          setPickingIconFor(undefined);
                          update(item.key, { icon: undefined });
                        }}
                        className='self-start rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950'
                      >
                        Ta bort ikon
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <button
          type='button'
          onClick={() => {
            const item = listItemDraft();
            commit([...items, item], { id: item.key, offset: 0 });
          }}
          className='self-start rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800'
        >
          + Lägg till punkt
        </button>

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
            disabled={!result.length}
            className='rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40'
          >
            {initial.length ? 'Uppdatera' : 'Infoga'}
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  );

  return (
    <>
      {listDialog}
      {editingLink && (
        <LinkDialog
          initial={editingLink}
          onSave={(href) => saveLink(editingLink, href)}
          onRemove={editingLink.href ? () => saveLink(editingLink) : undefined}
          onClose={() => setEditingLink(undefined)}
        />
      )}
    </>
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
