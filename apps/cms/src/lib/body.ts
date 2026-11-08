import { type Image, parseImage } from '@/lib/images';

export type MarkStyle =
  | { type: 'bold' }
  | { type: 'underline' }
  | { type: 'link'; href: string }
  // Covers a single ICON_PLACEHOLDER. name is the name of a react-icons icon,
  // e.g. FaGithub.
  | { type: 'icon'; name: string };

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

// An inner heading of the body. Plain text without marks or line breaks.
export type HeadingBlock = {
  id: string;
  type: 'heading';
  text: string;
};

// The blocks that are written in the body itself, as opposed to widgets.
export type TextBlock = ParagraphBlock | HeadingBlock;

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

// A line that separates the parts of the body.
export type DividerBlock = {
  id: string;
  type: 'divider';
};

export type LinkMark = Extract<Mark, { type: 'link' }>;

export type ListItem = {
  // A react-icons icon shown instead of the bullet, e.g. FaSteam. Left out
  // for an ordinary bullet.
  icon?: string;
  // Has no line breaks.
  text: string;
  // Only links are allowed. Sorted by start and never overlapping. Left out
  // when there are no links.
  marks?: LinkMark[];
};

export type ListBlock = {
  id: string;
  type: 'list';
  items: ListItem[];
};

export type WidgetBlock = QuoteBlock | ImageBlock | DividerBlock | ListBlock;

export type BodyBlock = TextBlock | WidgetBlock;

export type Body = BodyBlock[];

// Stands in for an icon in a paragraph's text, so the icon takes up a
// position that marks such as links can cover.
export const ICON_PLACEHOLDER = '\uFFFC';

export const newBlockId = () => crypto.randomUUID();

// Icons are never joined, since each covers its own placeholder.
const isSameStyle = (a: Mark, b: Mark) =>
  a.type === b.type &&
  a.type !== 'icon' &&
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

// Icon marks that don't cover exactly one placeholder are dropped.
export const paragraph = (
  text = '',
  marks: Mark[] = [],
  id = newBlockId(),
): ParagraphBlock => {
  const normalized = normalizeMarks(
    marks.filter(
      (mark) =>
        mark.type !== 'icon' ||
        (mark.end === mark.start + 1 && text[mark.start] === ICON_PLACEHOLDER),
    ),
  );
  return normalized.length
    ? { id, type: 'paragraph', text, marks: normalized }
    : { id, type: 'paragraph', text };
};

// Line breaks become spaces and icon placeholders are removed, since a
// heading has neither.
export const heading = (text = '', id = newBlockId()): HeadingBlock => ({
  id,
  type: 'heading',
  text: text.replace(/\r\n?|\n/g, ' ').replaceAll(ICON_PLACEHOLDER, ''),
});

export const isTextBlock = (block?: BodyBlock): block is TextBlock =>
  block?.type === 'paragraph' || block?.type === 'heading';

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

// Only Font Awesome and Phosphor icons are supported so far.
export const isValidIconName = (name: string) => /^(Fa|Pi)[A-Z]\w*$/.test(name);

// Bare domains like example.com get https:// so they don't become relative
// links.
export const normalizeHref = (value: string) => {
  const href = value.trim();
  if (!href || /^([a-z][a-z\d+.-]*:|\/|#)/i.test(href)) {
    return href;
  }
  return `https://${href}`;
};

// The editor needs a text block to type in before and between widgets, and a
// paragraph at the end. Empty paragraphs are stripped again when saving.
export const withParagraphSlots = (blocks: Body): Body => {
  const result: Body = [];
  for (const block of blocks) {
    if (!isTextBlock(block) && !isTextBlock(result.at(-1))) {
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
  if (
    item.type === 'icon' &&
    typeof item.name === 'string' &&
    isValidIconName(item.name)
  ) {
    return { type: 'icon', name: item.name };
  }
  return undefined;
};

const toMarks = (value: unknown): Mark[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): Mark[] => {
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
};

// Placeholders without an icon, e.g. from pasted text, are removed.
const removeOrphanPlaceholders = ({
  text,
  marks = [],
}: {
  text: string;
  marks?: Mark[];
}) => {
  let result = { text, marks };
  for (let i = text.length - 1; i >= 0; i--) {
    if (
      text[i] === ICON_PLACEHOLDER &&
      !marks.some((mark) => mark.type === 'icon' && mark.start === i)
    ) {
      result = {
        text: result.text.slice(0, i) + result.text.slice(i + 1),
        marks: adjustMarks(result.marks, i, i + 1, i),
      };
    }
  }
  return result;
};

const parseParagraph = (item: Record<string, unknown>, id: string) => {
  const raw = typeof item.text === 'string' ? item.text : '';
  const cleaned = removeOrphanPlaceholders(
    paragraph(raw.replace(/\r\n?/g, '\n'), toMarks(item.marks), id),
  );
  const text = cleaned.text.trim();
  const offset = cleaned.text.length - cleaned.text.trimStart().length;
  return text
    ? [
        paragraph(
          text,
          sliceMarks(cleaned.marks, offset, offset + text.length),
          id,
        ),
      ]
    : [];
};

// Line breaks become spaces and surrounding whitespace is trimmed. Marks other
// than links are dropped, and so are icon placeholders, since a list item's
// icon is never part of its text. Undefined if no text remains.
export const listItem = (
  rawText: string,
  marks: Mark[] = [],
  icon?: string,
): ListItem | undefined => {
  const cleaned = removeOrphanPlaceholders({
    text: rawText.replace(/\r\n?|\n/g, ' '),
    marks: marks.filter((mark) => mark.type === 'link'),
  });
  const text = cleaned.text.trim();
  if (!text) {
    return undefined;
  }
  const offset = cleaned.text.length - cleaned.text.trimStart().length;
  const links = normalizeMarks(
    sliceMarks(cleaned.marks, offset, offset + text.length),
  ).filter((mark): mark is LinkMark => mark.type === 'link');
  return {
    ...(icon && isValidIconName(icon) ? { icon } : {}),
    text,
    ...(links.length ? { marks: links } : {}),
  };
};

const parseListItems = (value: unknown): ListItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry): ListItem[] => {
    if (typeof entry !== 'object' || !entry) {
      return [];
    }
    const { text, marks, icon } = entry as Record<string, unknown>;
    const item = listItem(
      typeof text === 'string' ? text : '',
      toMarks(marks),
      typeof icon === 'string' ? icon : undefined,
    );
    return item ? [item] : [];
  });
};

// Sanitizes untrusted input: drops unknown block types, empty paragraphs and
// headings, lists without items, quotes without text, images that aren't
// uploads, invalid marks and icon placeholders without an icon.
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

    if (item.type === 'divider') {
      return [{ id, type: 'divider' }];
    }

    if (item.type === 'paragraph') {
      return parseParagraph(item, id);
    }

    if (item.type === 'heading') {
      const raw = typeof item.text === 'string' ? item.text : '';
      const text = heading(raw).text.trim();
      return text ? [heading(text, id)] : [];
    }

    if (item.type === 'list') {
      const items = parseListItems(item.items);
      return items.length ? [{ id, type: 'list', items }] : [];
    }

    const text = toText(item.text);
    if (!text) {
      return [];
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
