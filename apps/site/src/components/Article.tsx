import { ArticlePayload } from '@/lib/db/payload.types';

export const Article = ({
  article,
  isMain,
}: {
  article: Pick<ArticlePayload, 'title' | 'body'>;
  isMain: boolean;
}) => {
  const ngClass = {
    title: 'font-bold',
  };
  console.log('***BODY', article.body);

  return (
    <article className='px-12 py-12 bg-white mb-12 shadow-sm'>
      {isMain ? (
        <h1 className={ngClass.title}>{article.title}</h1>
      ) : (
        <h2 className={ngClass.title}>{article.title}</h2>
      )}
      {article.body.map((part, i) => (
        <div>
          {i}: {part.text}
        </div>
      ))}
    </article>
  );
};
