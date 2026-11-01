// A linked range of a paragraph's text, end exclusive.
export type Link = {
  start: number;
  end: number;
  href: string;
};

export type ParagraphBlock = {
  id: string;
  type: 'paragraph';
  // Line breaks within the paragraph are stored as '\n'.
  text: string;
  // Sorted and non-overlapping. Left out when the paragraph has no links.
  links?: Link[];
};

export type QuoteBlock = {
  id: string;
  type: 'quote';
  text: string;
  author: string;
};

export type WidgetBlock = QuoteBlock;

export type BodyBlock = ParagraphBlock | WidgetBlock;

export type Body = BodyBlock[];

export const newBlockId = () => crypto.randomUUID();

export const paragraph = (
  text = '',
  links: Link[] = [],
  id = newBlockId(),
): ParagraphBlock =>
  links.length
    ? { id, type: 'paragraph', text, links }
    : { id, type: 'paragraph', text };

// Clips links to [from, to) and makes them relative to from.
export const sliceLinks = (
  links: Link[] = [],
  from: number,
  to = Infinity,
): Link[] =>
  links.flatMap((link) => {
    const start = Math.max(link.start, from) - from;
    const end = Math.min(link.end, to) - from;
    return start < end ? [{ ...link, start, end }] : [];
  });

export const shiftLinks = (links: Link[] = [], by: number): Link[] =>
  links.map((link) => ({
    ...link,
    start: link.start + by,
    end: link.end + by,
  }));

// Links [start, end) to href, replacing whatever was linked there before.
// Without href the range is unlinked.
export const setLinkRange = (
  links: Link[] = [],
  start: number,
  end: number,
  href?: string,
): Link[] => [
  ...sliceLinks(links, 0, start),
  ...(href ? [{ start, end, href }] : []),
  ...shiftLinks(sliceLinks(links, end), end),
];

// Moves links along with an edit that replaced [from, oldEnd) with text
// ending at newEnd. Typing right before or after a link doesn't extend it.
export const adjustLinks = (
  links: Link[] = [],
  from: number,
  oldEnd: number,
  newEnd: number,
): Link[] =>
  links.flatMap((link) => {
    if (link.end <= from) {
      return [link];
    }
    if (link.start >= oldEnd) {
      return shiftLinks([link], newEnd - oldEnd);
    }
    const start = link.start <= from ? link.start : newEnd;
    const end = link.end >= oldEnd ? link.end + newEnd - oldEnd : from;
    return start < end ? [{ ...link, start, end }] : [];
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

// offset and length describe the trimmed paragraph text within the raw text.
const toLinks = (value: unknown, offset: number, length: number): Link[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const links = value.flatMap((item): Link[] => {
    if (typeof item !== 'object' || !item) {
      return [];
    }
    const { start, end, href } = item as Record<string, unknown>;
    if (
      typeof start !== 'number' ||
      typeof end !== 'number' ||
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      typeof href !== 'string' ||
      !isValidHref(href.trim())
    ) {
      return [];
    }
    return [{ start, end, href: href.trim() }];
  });

  const result: Link[] = [];
  const sorted = links.sort((a, b) => a.start - b.start);
  for (const link of sliceLinks(sorted, offset, offset + length)) {
    if (link.start >= (result.at(-1)?.end ?? 0)) {
      result.push(link);
    }
  }
  return result;
};

// Sanitizes untrusted input: drops unknown block types, empty paragraphs,
// quotes without text and invalid links.
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
    const text = toText(item.text);
    if (!text) {
      return [];
    }

    if (item.type === 'paragraph') {
      const raw = String(item.text);
      const offset = raw.length - raw.trimStart().length;
      return [paragraph(text, toLinks(item.links, offset, text.length), id)];
    }
    if (item.type === 'quote') {
      return [{ id, type: 'quote', text, author: toText(item.author) }];
    }
    return [];
  });
};
