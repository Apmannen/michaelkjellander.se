import { ArticlePayload } from '@/lib/db/payload.types';

export const Article = ({
  article,
  isMain,
}: {
  article: Pick<ArticlePayload, 'title'>;
  isMain: boolean;
}) => {
  return (
    <article className='px-12 py-12 bg-white mb-12 shadow-sm'>
      {isMain ? <h1>{article.title}</h1> : <h2>{article.title}</h2>}
    </article>
  );
};
