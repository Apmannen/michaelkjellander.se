export type ParagraphBlock = {
  id: string;
  type: 'paragraph';
  // Line breaks within the paragraph are stored as '\n'.
  text: string;
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

export const paragraph = (text = ''): ParagraphBlock => ({
  id: newBlockId(),
  type: 'paragraph',
  text,
});

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

// Sanitizes untrusted input: drops unknown block types, empty paragraphs and
// quotes without text.
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
      return [{ id, type: 'paragraph', text }];
    }
    if (item.type === 'quote') {
      return [{ id, type: 'quote', text, author: toText(item.author) }];
    }
    return [];
  });
};
