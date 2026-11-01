import { ArticlePayload } from '@/lib/db/payload.types';

export const Article = ({
  article,
  isMain,
}: {
  article: Pick<ArticlePayload, 'title'>;
  isMain: boolean;
}) => {
  const ngClass = {
    title: 'font-bold',
  };

  return (
    <article className='px-12 py-12 bg-white mb-12 shadow-sm'>
      {isMain ? (
        <h1 className={ngClass.title}>{article.title}</h1>
      ) : (
        <h2 className={ngClass.title}>{article.title}</h2>
      )}
    </article>
  );
};
