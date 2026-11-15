import { ArticleBodyPartPayload } from '@/lib/db/payload.types';

export const Heading = ({
  part,
}: {
  part: Pick<ArticleBodyPartPayload, 'text' | 'level'>;
}) => {
  const { text, level } = part;
  const H = level === 1 ? 'h3' : level === 2 ? 'h4' : 'h5';
  return (
    <H
      className={`${level === 1 ? 'text-[28px]' : level === 2 ? 'text-[20px] sm:text-[22px] -mb-3 leading-6' : ''} font-bold tracking-tight`}
    >
      {text}
    </H>
  );
};
