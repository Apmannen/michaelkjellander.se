import {
  ArticlePayload,
  DynamicFieldPayload,
  TagPayload,
} from './db/payload.types';

const article = (
  article: Pick<ArticlePayload, 'slug'> & {
    tags: Pick<TagPayload, 'slug'>[];
  },
) => {
  return `/inlagg/${article.tags?.at(0)?.slug}/${article.slug}`;
};

const field = (dynamicFieldData: DynamicFieldPayload) => {
  if (dynamicFieldData.target_article) {
    return article(dynamicFieldData.target_article);
  }
  return dynamicFieldData.href || undefined;
};

const tag = (tag: Pick<TagPayload, 'slug'>) => {
  return `/kategori/${tag.slug}`;
};

export const paths = {
  article,
  field,
  tag,
};
