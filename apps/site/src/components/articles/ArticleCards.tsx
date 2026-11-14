import { ArticlePayload } from '@/lib/db/payload.types';
import { Article } from './Article';

export const ArticleCard = ({
  article,
}: {
  article: Pick<ArticlePayload, 'title'>;
}) => {
  const { title } = article;
  return (
    <div>
      <div>{title}</div>
    </div>
  );
};
