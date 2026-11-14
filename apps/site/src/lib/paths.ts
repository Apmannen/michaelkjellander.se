import { ArticlePayload } from './db/payload.types';

export const paths = {
  article: (article: Pick<ArticlePayload, 'slug' | 'tags'>) => {
    return `/inlagg/${article.tags?.at(0)?.slug}/${article.slug}`;
  },
};
