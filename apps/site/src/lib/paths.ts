import { ArticlePayload, TagPayload } from './db/payload.types';

export const paths = {
  article: (
    article: Pick<ArticlePayload, 'slug'> & {
      tags: Pick<TagPayload, 'slug'>[];
    },
  ) => {
    return `/inlagg/${article.tags?.at(0)?.slug}/${article.slug}`;
  },
  tag: (tag: Pick<TagPayload, 'slug'>) => {
    return `/kategori/${tag.slug}`;
  },
};
