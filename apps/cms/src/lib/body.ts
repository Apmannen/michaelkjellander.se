import { type Image, parseImage } from '@/lib/images';

export type MarkStyle =
  { type: 'bold' } | { type: 'underline' } | { type: 'link'; href: string };

export type MarkType = MarkStyle['type'];

// A styled range of a paragraph's text, end exclusive.
export type Mark = MarkStyle & {
  start: number;
  end: number;
};

export type ParagraphBlock = {
  id: string;
  type: 'paragraph';
  // Line breaks within the paragraph are stored as '\n'.
  text: string;
  // Sorted by start. Marks of the same type never overlap, but marks of
  // different types may, e.g. a bold link. Left out when there are no marks.
  marks?: Mark[];
};

export type QuoteBlock = {
  id: string;
  type: 'quote';
  text: string;
  author: string;
  // Where the quote comes from. Left out when there is no link.
  href?: string;
};

export type ImageBlock = Image & {
  id: string;
  type: 'image';
  // Left out when there is no caption.
  caption?: string;
};

export type WidgetBlock = QuoteBlock | ImageBlock;

export type BodyBlock = ParagraphBlock | WidgetBlock;

export type Body = BodyBlock[];

export const newBlockId = () => crypto.randomUUID();

const isSameStyle = (a: Mark, b: Mark) =>
  a.type === b.type &&
  (a.type !== 'link' || (b.type === 'link' && a.href === b.href));

// Sorts marks, drops empty ones and joins touching or overlapping marks with
// the same style. A link overlapping a link to somewhere else is dropped.
const normalizeMarks = (marks: Mark[]): Mark[] => {
  const sorted = marks
    .filter((mark) => mark.start < mark.end)
    .sort((a, b) => a.start - b.start || a.type.localeCompare(b.type));

  const result: Mark[] = [];
  for (const mark of sorted) {
    const previous = result.findLast((other) => other.type === mark.type);
    if (previous && isSameStyle(previous, mark) && mark.start <= previous.end) {
      previous.end = Math.max(previous.end, mark.end);
    } else if (!previous || mark.start >= previous.end) {
      result.push({ ...mark });
    }
  }
  return result;
};

export const paragraph = (
  text = '',
  marks: Mark[] = [],
  id = newBlockId(),
): ParagraphBlock => {
  const normalized = normalizeMarks(marks);
  return normalized.length
    ? { id, type: 'paragraph', text, marks: normalized }
    : { id, type: 'paragraph', text };
};

// Clips marks to [from, to) and makes them relative to from.
export const sliceMarks = (
  marks: Mark[] = [],
  from: number,
  to = Infinity,
): Mark[] =>
  marks.flatMap((mark) => {
    const start = Math.max(mark.start, from) - from;
    const end = Math.min(mark.end, to) - from;
    return start < end ? [{ ...mark, start, end }] : [];
  });

export const shiftMarks = (marks: Mark[] = [], by: number): Mark[] =>
  marks.map((mark) => ({
    ...mark,
    start: mark.start + by,
    end: mark.end + by,
  }));

// Removes marks of the given type from [start, end), splitting marks that
// span it.
export const removeMarks = (
  marks: Mark[] = [],
  type: MarkType,
  start: number,
  end: number,
): Mark[] => {
  const same = marks.filter((mark) => mark.type === type);
  return normalizeMarks([
    ...marks.filter((mark) => mark.type !== type),
    ...sliceMarks(same, 0, start),
    ...shiftMarks(sliceMarks(same, end), end),
  ]);
};

// Replaces whatever marks of the same type were in the new mark's range.
export const addMark = (marks: Mark[] = [], mark: Mark): Mark[] =>
  normalizeMarks([
    ...removeMarks(marks, mark.type, mark.start, mark.end),
    mark,
  ]);

// Whether all of [start, end) has a mark of the given type.
export const hasMark = (
  marks: Mark[] = [],
  type: MarkType,
  start: number,
  end: number,
) =>
  marks.some(
    (mark) => mark.type === type && mark.start <= start && end <= mark.end,
  );

// Moves marks along with an edit that replaced [from, oldEnd) with text
// ending at newEnd. Typing right before or after a mark doesn't extend it.
export const adjustMarks = (
  marks: Mark[] = [],
  from: number,
  oldEnd: number,
  newEnd: number,
): Mark[] =>
  marks.flatMap((mark) => {
    if (mark.end <= from) {
      return [mark];
    }
    if (mark.start >= oldEnd) {
      return shiftMarks([mark], newEnd - oldEnd);
    }
    const start = mark.start <= from ? mark.start : newEnd;
    const end = mark.end >= oldEnd ? mark.end + newEnd - oldEnd : from;
    return start < end ? [{ ...mark, start, end }] : [];
  });

export const isValidHref = (href: string) =>
  /^(https?:\/\/\S|mailto:\S|tel:\S|\/|#)/i.test(href);

// Bare domains like example.com get https:// so they don't become relative
// links.
export const normalizeHref = (value: string) => {
  const href = value.trim();
  if (!href || /^([a-z][a-z\d+.-]*:|\/|#)/i.test(href)) {
    return href;
  }
  return `https://${href}`;
};

// The editor needs a paragraph to type in before, between and after widgets.
// Empty paragraphs are stripped again when saving.
export const withParagraphSlots = (blocks: Body): Body => {
  const result: Body = [];
  for (const block of blocks) {
    if (block.type !== 'paragraph' && result.at(-1)?.type !== 'paragraph') {
      result.push(paragraph());
    }
    result.push(block);
  }
  if (result.at(-1)?.type !== 'paragraph') {
    result.push(paragraph());
  }
  return result;
};

const toText = (value: unknown) =>
  typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : '';

const toId = (value: unknown) =>
  typeof value === 'string' && value ? value : newBlockId();

const toMarkStyle = (item: Record<string, unknown>): MarkStyle | undefined => {
  if (item.type === 'bold' || item.type === 'underline') {
    return { type: item.type };
  }
  if (
    item.type === 'link' &&
    typeof item.href === 'string' &&
    isValidHref(item.href.trim())
  ) {
    return { type: 'link', href: item.href.trim() };
  }
  return undefined;
};

// offset and length describe the trimmed paragraph text within the raw text.
const toMarks = (value: unknown, offset: number, length: number): Mark[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const marks = value.flatMap((item): Mark[] => {
    if (typeof item !== 'object' || !item) {
      return [];
    }
    const { start, end } = item as Record<string, unknown>;
    const style = toMarkStyle(item as Record<string, unknown>);
    if (
      !style ||
      typeof start !== 'number' ||
      typeof end !== 'number' ||
      !Number.isInteger(start) ||
      !Number.isInteger(end)
    ) {
      return [];
    }
    return [{ ...style, start, end }];
  });

  return sliceMarks(marks, offset, offset + length);
};

// Sanitizes untrusted input: drops unknown block types, empty paragraphs,
// quotes without text, images that aren't uploads and invalid marks.
export const parseBody = (raw: unknown): Body => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((value): BodyBlock[] => {
    if (typeof value !== 'object' || !value) {
      return [];
    }

    const item = value as Record<string, unknown>;
    const id = toId(item.id);

    if (item.type === 'image') {
      const image = parseImage(item);
      if (!image) {
        return [];
      }
      const caption = toText(item.caption);
      return [
        caption
          ? { id, type: 'image', ...image, caption }
          : { id, type: 'image', ...image },
      ];
    }

    const text = toText(item.text);
    if (!text) {
      return [];
    }

    if (item.type === 'paragraph') {
      const raw = String(item.text);
      const offset = raw.length - raw.trimStart().length;
      return [paragraph(text, toMarks(item.marks, offset, text.length), id)];
    }
    if (item.type === 'quote') {
      const author = toText(item.author);
      const href = typeof item.href === 'string' ? item.href.trim() : '';
      return [
        isValidHref(href)
          ? { id, type: 'quote', text, author, href }
          : { id, type: 'quote', text, author },
      ];
    }
    return [];
  });
};
