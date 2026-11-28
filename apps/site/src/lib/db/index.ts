import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { ArticlePayload, SentenceGuesserLevelPayload } from './payload.types';
import { supabase } from './supabase';

const articles = async ({
  slug,
}: {
  slug?: string;
}): Promise<ArticlePayload[]> => {
  'use cache';
  cacheTag('articles');
  cacheLife('hours');

  const query = supabase
    .from('articles')
    .select(
      `id, title, body, cover_image, intro, cta, slug, published_at, rating, note, pros, cons,
      tags:article_tags!article_id(
        ...tags(
          slug, 
          singular_name, 
          name, 
          type,
          id,
          tag_parents!tag_id(
            ...tags!parent_id(
              slug, 
              singular_name, 
              name, 
              type,
              id
            )
          )
        )
      ),
      fields:article_field_values!article_id(
        text,
        href,
        target_article:articles!target_article_id(
          slug,
          tags(
            slug
          )
        ),
        field:field_definitions(key)
      )
    `,
    )
    // The latest of revised_at and published_at, see db/018_article_revised_at.sql.
    .order('sort_date', { ascending: false })
    .order('position', { referencedTable: 'tags' });

  if (slug) {
    query.eq('slug', slug);
  }

  const res = await query;

  //console.log('**D', JSON.stringify(res.data, null, 2));

  return (res.data as ArticlePayload[]) || [];
};

const sentenceGuesserLevels = async ({ level }: { level: number }) => {
  'use cache';
  cacheTag('games');
  cacheLife('hours');

  const query = supabase
    .from('game_word_guess_levels')
    .select(
      `
      number,sentence,
      questions:game_word_guess_level_questions!level_id(
        position,
        ...game_word_guess_questions!question_id(
          clue,
          emoji,
          answer
        )
      )
    `,
    )
    .eq('number', level)
    .order('number', { ascending: true })
    .order('position', { referencedTable: 'game_word_guess_level_questions' });
  const res = await query;

  return res.data?.at(0) as SentenceGuesserLevelPayload | undefined;
};

export const db = {
  articles,
  sentenceGuesserLevels,
};
