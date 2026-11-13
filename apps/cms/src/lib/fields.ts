import { isValidHref, normalizeHref } from '@/lib/body';
import { slugify } from '@/lib/slug';

// See db/007_fields.sql.
export const FIELD_TYPES = {
  text: {
    label: 'Text',
    description: 'En rad text.',
  },
  link: {
    label: 'Länk',
    description:
      'En text som kan länka till en adress eller till en annan artikel.',
  },
} as const;

export type FieldType = keyof typeof FIELD_TYPES;

export type FieldDefinition = {
  id: string;
  // What the site looks the field up by, e.g. play_also.
  key: string;
  // E.g. Spela även.
  label: string;
  // Can't be changed once the field is created.
  type: FieldType;
  // Whether an article may have more than one value of the field.
  multiple: boolean;
  // Help text shown where the field is filled in. Empty means none.
  description: string;
  created_at: string;
  updated_at: string;
};

export type FieldDefinitionInput = Pick<
  FieldDefinition,
  'key' | 'label' | 'type' | 'multiple' | 'description'
>;

// One value of a field on an article. href and target_article_id are only
// for link fields, and at most one of them is set. Neither means the text
// isn't linked.
export type FieldValue = {
  field_id: string;
  text: string;
  href?: string;
  target_article_id?: string;
};

export const FIELD_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

// E.g. Spela även -> spela_aven.
export const toFieldKey = (label: string) => slugify(label).replace(/-/g, '_');

export const isFieldType = (value: unknown): value is FieldType =>
  typeof value === 'string' && Object.hasOwn(FIELD_TYPES, value);

export const validateFieldDefinition = (
  input: FieldDefinitionInput,
): string | undefined => {
  if (!input.label.trim()) {
    return 'Etikett måste anges.';
  }
  if (!input.key) {
    return 'Nyckel måste anges.';
  }
  if (!FIELD_KEY_PATTERN.test(input.key)) {
    return 'Nyckeln får bara innehålla a–z, 0–9 och understreck, och måste börja med en bokstav.';
  }
  return undefined;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toLine = (value: unknown) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

// Sanitizes untrusted input. Drops values of fields that aren't among the
// definitions, values that are entirely empty, and all but the first value of
// a field without multiple values. Text fields lose their links, and a link
// to an article wins over an address. Values with a link but no text are kept,
// so validateFieldValues can point them out. The result is grouped by field.
export const parseFieldValues = (
  raw: unknown,
  definitions: FieldDefinition[],
): FieldValue[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  const byId = new Map(definitions.map((field) => [field.id, field]));
  const seen = new Set<string>();

  const values = raw.flatMap((entry): FieldValue[] => {
    if (typeof entry !== 'object' || !entry) {
      return [];
    }
    const item = entry as Record<string, unknown>;
    const field =
      typeof item.field_id === 'string' ? byId.get(item.field_id) : undefined;
    if (!field || (!field.multiple && seen.has(field.id))) {
      return [];
    }

    const text = toLine(item.text);
    const target =
      field.type === 'link' &&
      typeof item.target_article_id === 'string' &&
      UUID_PATTERN.test(item.target_article_id)
        ? item.target_article_id
        : undefined;
    const href =
      field.type === 'link' && !target && typeof item.href === 'string'
        ? normalizeHref(item.href)
        : '';

    if (!text && !target && !href) {
      return [];
    }
    seen.add(field.id);
    return [
      {
        field_id: field.id,
        text,
        ...(href ? { href } : {}),
        ...(target ? { target_article_id: target } : {}),
      },
    ];
  });

  return groupFieldValues(values);
};

// Puts the values of each field next to each other, with the fields in the
// order of their first value. The values of a field keep their order.
export const groupFieldValues = (values: FieldValue[]): FieldValue[] => {
  const order = [...new Set(values.map((value) => value.field_id))];
  return order.flatMap((fieldId) =>
    values.filter((value) => value.field_id === fieldId),
  );
};

export const validateFieldValues = (
  values: FieldValue[],
  definitions: FieldDefinition[],
): string | undefined => {
  const labels = new Map(definitions.map((field) => [field.id, field.label]));
  for (const value of values) {
    const label = labels.get(value.field_id) ?? '';
    if (!value.text) {
      return `Fältet ”${label}” behöver en text.`;
    }
    if (value.href && !isValidHref(value.href)) {
      return `Fältet ”${label}” har en ogiltig adress.`;
    }
  }
  return undefined;
};
