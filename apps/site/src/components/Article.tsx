import { ArticlePayload } from '@/lib/db/payload.types';

export const Article = ({
  article,
  isMain,
}: {
  article: Pick<ArticlePayload, 'title'>;
  isMain: boolean;
}) => {
  return (
    <article>
      {isMain ? <h1>{article.title}</h1> : <h2>{article.title}</h2>}
    </article>
  );
};
