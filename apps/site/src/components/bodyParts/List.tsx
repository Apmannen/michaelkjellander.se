import { ArticleBodyPartPayload } from '@/lib/db/payload.types';
import { RichText } from './shared/RichText';
import { NamedIcon } from '../standard/NamedIcon';

export const List = ({
  part,
}: {
  part: Pick<ArticleBodyPartPayload, 'items'>;
}) => {
  if (!part.items) {
    return;
  }
  return (
    <ul className='space-y-1'>
      {part.items.map((item, i) => (
        <li key={i} className='flex items-center'>
          <span className='mr-2'>
            {item.icon ? (
              <NamedIcon className='text-accent-800' iconName={item.icon} />
            ) : null}
          </span>
          <RichText text={item.text} marks={item.marks} />
        </li>
      ))}
    </ul>
  );
};
