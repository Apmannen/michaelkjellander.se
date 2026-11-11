import { ArticleBodyPartPayload } from '@/lib/db/payload.types';

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
        <li key={i}>{item.text}</li>
      ))}
    </ul>
  );
};
