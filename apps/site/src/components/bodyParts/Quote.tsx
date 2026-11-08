import { ArticleBodyPartPayload } from '@/lib/db/payload.types';
import { FaQuoteRight } from 'react-icons/fa';
import { MkLink } from '../standard/MkLink';

export const Quote = ({
  part,
}: {
  part: Pick<ArticleBodyPartPayload, 'text' | 'author' | 'href'>;
}) => {
  const { text, author, href } = part;
  return (
    <div className='bg-accent-100 rounded-md px-4 py-4 border border-accent-200'>
      <div className=' flex gap-8'>
        <FaQuoteRight className=' text-[40px] w-8 text-accent-800' />
        <p className='italic text-neutral-700 text-[20px] leading-9 flex-1'>
          {text}
        </p>
      </div>
      <cite className='not-italic pt-3 pb-1 flex justify-center'>
        <MkLink
          enabled={!!href}
          href={href}
          className={{
            link: 'hover:text-gray-600 text-center  text-accent-800 font-semibold',
          }}
          target='_blank'
        >
          {author}
        </MkLink>
      </cite>
    </div>
  );
};
