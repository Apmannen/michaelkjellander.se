import { ArticleBodyPartPayload } from '@/lib/db/payload.types';
import { RichText } from './shared/RichText';

export const List = ({
  part,
}: {
  part: Pick<ArticleBodyPartPayload, 'items'>;
}) => {
  if (!part.items) {
    return;
  }
  return (
    <ul>
      {part.items.map((item, i) => (
        <li key={i}>
          <RichText text={item.text} marks={item.marks} />
        </li>
      ))}
    </ul>
  );
};
