import { ArticlePayload } from '@/lib/db/payload.types';
import { Article } from './Article';

export const ArticleCard = ({
  article,
}: {
  article: Pick<ArticlePayload, 'title'>;
}) => {
  const { title } = article;
  return (
    <div className='bg-default-box mb-12 shadow-sm max-w-content'>
      <div>{title}</div>
    </div>
  );
};
