import { ArticleBodyPartPayload, ArticlePayload } from '@/lib/db/payload.types';

const logPrefix = '[Article]';

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
  return (
    <article className='px-12 py-12 bg-white mb-12 shadow-sm'>
      {isMain ? (
        <h1 className={ngClass.title}>{article.title}</h1>
      ) : (
        <h2 className={ngClass.title}>{article.title}</h2>
      )}
      {article.body.map((part, i) => {
        switch (part.type) {
          case 'paragraph':
            return <Paragraph key={i} part={part} />;
          case 'quote':
            return <Quote key={i} part={part} />;
        }
        console.warn(logPrefix, 'Unknown type:', part.type);
        return null;
      })}
    </article>
  );
};

const Paragraph = ({
  part,
}: {
  part: Pick<ArticleBodyPartPayload, 'text'>;
}) => {
  const { text } = part;
  return <p>{text}</p>;
};

const Quote = ({
  part,
}: {
  part: Pick<ArticleBodyPartPayload, 'text' | 'author'>;
}) => {
  const { text, author } = part;
  return (
    <div>
      <p>{text}</p>
      <cite>{author}</cite>
    </div>
  );
};
