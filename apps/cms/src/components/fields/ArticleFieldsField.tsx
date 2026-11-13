'use client';

import type { ArticleSummary } from '@/lib/articles';
import type { FieldDefinition, FieldValue } from '@/lib/fields';
import { isValidHref, normalizeHref } from '@/lib/body';

import { inputClass, secondaryButtonClass } from '../editor/Field';

type LinkMode = 'none' | 'href' | 'article';

const LINK_MODES: { mode: LinkMode; label: string }[] = [
  { mode: 'none', label: 'Ingen länk' },
  { mode: 'href', label: 'Adress' },
  { mode: 'article', label: 'Artikel' },
];

// While editing, an empty href means the address mode is picked but nothing
// is typed yet. parseFieldValues drops it when saving.
const linkMode = (value: FieldValue): LinkMode =>
  value.target_article_id !== undefined
    ? 'article'
    : value.href !== undefined
      ? 'href'
      : 'none';

const withLinkMode = (value: FieldValue, mode: LinkMode): FieldValue => {
  const base = { field_id: value.field_id, text: value.text };
  if (mode === 'href') {
    return { ...base, href: value.href ?? '' };
  }
  if (mode === 'article') {
    return { ...base, target_article_id: value.target_article_id ?? '' };
  }
  return base;
};

const toolbarButtonClass =
  'rounded px-2 py-1 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-zinc-800';

// The article's values of the site's dynamic fields, grouped by field. Fields
// are added one by one, and a field with multiple values can get more than
// one. articleId is the article being edited, which its link fields can't
// link to.
export function ArticleFieldsField({
  id,
  definitions,
  articles,
  articleId,
  value,
  onChange,
}: {
  id: string;
  definitions: FieldDefinition[];
  articles: ArticleSummary[];
  articleId?: string;
  value: FieldValue[];
  onChange: (value: FieldValue[]) => void;
}) {
  const byId = new Map(definitions.map((field) => [field.id, field]));
  // Values of fields deleted meanwhile aren't shown, and are dropped when
  // saving.
  const added = [...new Set(value.map((entry) => entry.field_id))].flatMap(
    (fieldId) => byId.get(fieldId) ?? [],
  );
  const addable = definitions.filter((field) => !added.includes(field));
  const linkable = articles.filter((article) => article.id !== articleId);

  const replace = (index: number, entry: FieldValue) => {
    onChange(value.map((other, i) => (i === index ? entry : other)));
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  // Only within the field's own values.
  const move = (index: number, by: 1 | -1) => {
    const next = [...value];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    onChange(next);
  };

  const addValue = (field: FieldDefinition) => {
    const last = value.findLastIndex((entry) => entry.field_id === field.id);
    const next = [...value];
    next.splice(last === -1 ? next.length : last + 1, 0, {
      field_id: field.id,
      text: '',
    });
    onChange(next);
  };

  const removeField = (field: FieldDefinition) => {
    onChange(value.filter((entry) => entry.field_id !== field.id));
  };

  return (
    <div className='flex flex-col gap-4'>
      {added.map((field) => {
        const indexes = value.flatMap((entry, index) =>
          entry.field_id === field.id ? [index] : [],
        );
        return (
          <fieldset
            key={field.id}
            className='flex flex-col gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800'
          >
            <div className='flex items-start justify-between gap-3'>
              <legend className='contents'>
                <span className='flex flex-col'>
                  <span className='text-sm font-semibold'>{field.label}</span>
                  {field.description && (
                    <span className='text-xs text-zinc-500'>
                      {field.description}
                    </span>
                  )}
                </span>
              </legend>
              <button
                type='button'
                onClick={() => removeField(field)}
                className={`${toolbarButtonClass} shrink-0 text-red-600 dark:text-red-400`}
              >
                Ta bort fält
              </button>
            </div>

            <ul className='flex flex-col gap-3'>
              {indexes.map((index, nth) => (
                <li key={index} className='flex items-start gap-2'>
                  <ValueInput
                    field={field}
                    value={value[index]}
                    articles={linkable}
                    label={
                      field.multiple
                        ? `${field.label} ${nth + 1}`
                        : field.label
                    }
                    onChange={(entry) => replace(index, entry)}
                  />
                  <div className='flex shrink-0 items-center gap-0.5 py-0.5'>
                    {field.multiple && (
                      <>
                        <button
                          type='button'
                          onClick={() => move(index, -1)}
                          disabled={nth === 0}
                          aria-label='Flytta upp'
                          title='Flytta upp'
                          className={toolbarButtonClass}
                        >
                          ↑
                        </button>
                        <button
                          type='button'
                          onClick={() => move(index, 1)}
                          disabled={nth === indexes.length - 1}
                          aria-label='Flytta ner'
                          title='Flytta ner'
                          className={toolbarButtonClass}
                        >
                          ↓
                        </button>
                      </>
                    )}
                    <button
                      type='button'
                      onClick={() => remove(index)}
                      aria-label='Ta bort värde'
                      title='Ta bort värde'
                      className={`${toolbarButtonClass} text-red-600 dark:text-red-400`}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {field.multiple && (
              <button
                type='button'
                onClick={() => addValue(field)}
                className='self-start rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800'
              >
                + Lägg till värde
              </button>
            )}
          </fieldset>
        );
      })}

      {definitions.length === 0 ? (
        <p id={id} className='text-sm text-zinc-500'>
          Sajten har inga fält än. De skapas under Fält i menyn.
        </p>
      ) : (
        addable.length > 0 && (
          <select
            id={id}
            value=''
            onChange={(event) => {
              const field = byId.get(event.target.value);
              if (field) {
                addValue(field);
              }
            }}
            className={`${secondaryButtonClass} self-start bg-white dark:bg-zinc-900`}
          >
            <option value='' disabled>
              + Lägg till fält…
            </option>
            {addable.map((field) => (
              <option key={field.id} value={field.id}>
                {field.label}
              </option>
            ))}
          </select>
        )
      )}
    </div>
  );
}

function ValueInput({
  field,
  value,
  articles,
  label,
  onChange,
}: {
  field: FieldDefinition;
  value: FieldValue;
  articles: ArticleSummary[];
  label: string;
  onChange: (value: FieldValue) => void;
}) {
  const mode = linkMode(value);
  const isInvalidHref =
    !!value.href?.trim() && !isValidHref(normalizeHref(value.href));
  const target = articles.find(
    (article) => article.id === value.target_article_id,
  );

  return (
    <div className='flex min-w-0 flex-1 flex-col gap-2'>
      <input
        type='text'
        value={value.text}
        onChange={(event) => onChange({ ...value, text: event.target.value })}
        placeholder={field.type === 'link' ? 'Text, t.ex. The Mummy Demastered' : 'Text'}
        aria-label={label}
        autoComplete='off'
        className={inputClass}
      />

      {field.type === 'link' && (
        <>
          <div
            role='radiogroup'
            aria-label={`Länk för ${label}`}
            className='flex gap-1'
          >
            {LINK_MODES.map((option) => (
              <button
                key={option.mode}
                type='button'
                role='radio'
                aria-checked={mode === option.mode}
                onClick={() => onChange(withLinkMode(value, option.mode))}
                className={`${toolbarButtonClass} text-xs aria-checked:bg-zinc-200 dark:aria-checked:bg-zinc-700`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {mode === 'href' && (
            <div className='flex flex-col gap-1'>
              <input
                type='text'
                inputMode='url'
                value={value.href ?? ''}
                onChange={(event) =>
                  onChange({ ...value, href: event.target.value })
                }
                placeholder='https://'
                aria-label={`Adress för ${label}`}
                aria-invalid={isInvalidHref}
                autoComplete='off'
                className={inputClass}
              />
              {isInvalidHref && (
                <span className='text-xs text-red-600 dark:text-red-400'>
                  Ogiltig adress.
                </span>
              )}
            </div>
          )}

          {mode === 'article' && (
            <div className='flex flex-col gap-1'>
              <select
                value={value.target_article_id ?? ''}
                onChange={(event) =>
                  onChange({ ...value, target_article_id: event.target.value })
                }
                aria-label={`Artikel för ${label}`}
                className={inputClass}
              >
                <option value='' disabled>
                  Välj artikel…
                </option>
                {articles.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.title}
                    {article.published ? '' : ' (utkast)'}
                  </option>
                ))}
              </select>
              {target && !target.published && (
                <span className='text-xs text-amber-700 dark:text-amber-400'>
                  Artikeln är inte publicerad, så sajten visar texten utan
                  länk tills den är det.
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
