import { ArticleBodyPartPayload } from '@/lib/db/payload.types';
import { RichText } from './shared/RichText';

export const Paragraph = ({
  part,
}: {
  part: Pick<ArticleBodyPartPayload, 'text' | 'marks'>;
}) => {
  const { text = '', marks = [] } = part;
  return <RichText text={text} marks={marks} />;
};
