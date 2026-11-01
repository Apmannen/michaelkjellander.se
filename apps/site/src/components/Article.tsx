import { ArticleBodyPartPayload, ArticlePayload } from '@/lib/db/payload.types';

const logPrefix = '[Article]';

export const Article = ({
  article,
  isMain,
}: {
  article: Pick<ArticlePayload, 'title' | 'body'>;
  isMain: boolean;
}) => {
  console.log('***ART', article.body);
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
  const textParts = text?.split('\n');
  return (
    <p className='pt-3'>
      {textParts?.map((textPart, i) => (
        <span key={i}>
          {i > 0 ? <br /> : null}
          {textPart}
        </span>
      ))}
    </p>
  );
};

const Quote = ({
  part,
}: {
  part: Pick<ArticleBodyPartPayload, 'text' | 'author'>;
}) => {
  const { text, author } = part;
  return (
    <div className='pt-3'>
      <div className='border-l-4 border-gray-600 pl-4'>
        <p className='italic text-gray-600'>{text}</p>
        <cite className='not-italic pt-3 pb-1 block'>{author}</cite>
      </div>
    </div>
  );
};
